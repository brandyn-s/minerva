// Real browser, HTTP routes and separate worker processes over an isolated corpus.
// Only unrelated model routes are blocked; generation/assessment use fixture data.
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { mkdirSync, mkdtempSync, openSync, closeSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { createServer } from 'node:net';
import { chromium } from 'playwright';
import { loader } from '../tests/helpers/load-ts.mjs';
import { seedGroupWeave } from '../tests/helpers/group-weave-fixture.mjs';
const load = loader(), { ExperimentStore } = load('features/experiments/store.ts');
const keep = process.argv.includes('--keep-fixture'); if (keep) mkdirSync('.local', { recursive: true });
const dir = mkdtempSync(keep ? resolve('.local/group-weave-demo-') : tmpdir() + '/minerva-group-weave-api-'), db = dir + '/runs.sqlite';
const store = new ExperimentStore(db), f = await seedGroupWeave(store), before = store.get(f.id);
const reservation = createServer(); await new Promise(r => reservation.listen(0, '127.0.0.1', r)); const port = reservation.address().port; await new Promise(r => reservation.close(r));
const base = `http://127.0.0.1:${port}`, endpoint = '/api/expedition/group-weave';
const env = { ...process.env, MINERVA_EXPERIMENT_DB: db, MINERVA_EXPERIMENT_PROVIDER: 'fixture', MINERVA_EXPERIMENT_LIVE: '0', EXPEDITION_DATABASE_URL: '', VERCEL: '', VERCEL_OIDC_TOKEN: '', AI_GATEWAY_API_KEY: '' };
const log = openSync(dir + '/server.log', 'w'); let server, browser, passed = false;
async function post(path, body, headers = {}) { return fetch(base + path, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) }); }
function worker() { const result = spawnSync(process.execPath, ['scripts/expedition-worker.mjs', '--once'], { env, encoding: 'utf8', timeout: 30000 }); assert.equal(result.status, 0, result.stderr); }
try {
  server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '--hostname', '127.0.0.1', '--port', String(port)], { env, stdio: ['ignore', log, log] });
  for (let tries = 0; ; tries++) {
    if (server.exitCode !== null || tries > 100) throw new Error('Server failed to start');
    try { if ((await fetch(base)).ok) break; } catch { /* Server startup. */ }
    await new Promise(r => setTimeout(r, 200));
  }
  const command = { action: 'prepare', runId: f.id, lensId: f.lens.id, lensRevision: 2, choices: f.choices };
  const stale = (await (await post(endpoint, command)).json()).preview;
  store.control(f.id, 'pause');
  assert.equal((await post(endpoint, { action: 'submit', runId: f.id, previewId: stale.id, weave: stale.draft.weave })).status, 409);
  assert.equal((await post(endpoint, command, { Origin: 'https://example.invalid' })).status, 409);
  const foreign = randomUUID(); store.create({ ...before, id: foreign, owner: randomUUID() });
  assert.equal((await fetch(`${base}${endpoint}?runId=${foreign}&lensId=${f.lens.id}`)).status, 404);
  assert.equal((await post(endpoint, { ...command, runId: foreign })).status, 404);
  const alternative = (await (await post(endpoint, command)).json()).preview;
  browser = await chromium.launch(); const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const pageErrors = []; page.on('pageerror', error => pageErrors.push(error.message));
  await page.route('**/api/**', route => ['/api/expedition/runs', '/api/expedition/lenses', '/api/expedition/selection', endpoint].includes(new URL(route.request().url()).pathname) ? route.continue() : route.abort());
  await page.goto(base);
  await page.getByRole('button', { name: 'Expedition panel', exact: true }).click();
  await page.getByRole('button', { name: 'Cross-group Weave fixture', exact: true }).click();
  await page.getByRole('button', { name: 'Edit expedition lenses', exact: true }).click();
  await page.getByRole('button', { name: 'Explore across groups', exact: true }).click();
  const controls = page.getByRole('region', { name: 'Explore across groups', exact: true });
  for (let i = 0; i < 2; i++) {
    await controls.getByLabel(`Approach ${i + 1}`, { exact: true }).selectOption(f.choices[i].groupId);
    await controls.getByLabel(`Source from Group ${i}`, { exact: true }).selectOption(f.choices[i].candidateId);
  }
  const previewResponse = page.waitForResponse(r => r.url().endsWith(endpoint) && r.request().method() === 'POST');
  await controls.getByRole('button', { name: 'Prepare contributions', exact: true }).click();
  const preview = (await (await previewResponse).json()).preview;
  await controls.getByLabel('Carry forward · Approach 0', { exact: true }).fill('Distributed coordination');
  await controls.getByLabel('Carry forward · Approach 1', { exact: true }).fill('Reversible sharing');
  await controls.getByRole('button', { name: 'Weave contributions · 2 calls', exact: true }).click();
  await controls.getByText('A bounded group Weave is in progress. The expedition remains paused.', { exact: true }).waitFor();
  assert.equal(store.get(f.id).calls, 0); assert.equal(store.get(f.id).status, 'paused');
  const saved = store.record(`group-weave:${preview.id}`);
  const duplicate = { action: 'submit', runId: f.id, previewId: preview.id, weave: saved.operation.weave };
  assert.equal((await post(endpoint, duplicate)).status, 200);
  assert.equal((await post(endpoint, { action: 'submit', runId: f.id, previewId: alternative.id, weave: alternative.draft.weave })).status, 409);
  assert.equal((await post('/api/expedition/runs', { action: 'resume', id: f.id })).status, 409);
  assert.equal((await post('/api/expedition/runs', { action: 'reassess', id: f.id, candidateId: f.ids[0], reason: 'Synthetic concurrency check', additionalCalls: 1 })).status, 409);
  worker(); assert.equal(store.get(f.id).calls, 1);
  worker(); assert.equal(store.get(f.id).calls, 2);
  worker(); assert.equal(store.get(f.id).calls, 2);
  const result = controls.getByRole('region', { name: 'Group Weave result', exact: true });
  await result.getByText('completed · 2 of 2 calls used.', { exact: true }).waitFor();
  const candidate = store.candidateForOperation(f.id, saved.operation.id);
  assert.deepEqual(candidate.parents, f.choices.map(c => c.candidateId)); assert.equal(candidate.weaveMappings.length, 2);
  const detail = await fetch(`${base}/api/expedition/runs?id=${f.id}&candidateId=${candidate.id}`).then(r => r.json());
  assert.deepEqual(detail.operation.sources.map(s => s.candidateId), candidate.parents);
  assert.deepEqual(detail.operation.weave.selections.map(s => s.text), ['Distributed coordination', 'Reversible sharing']);
  await result.getByRole('combobox').selectOption(f.choices[0].groupId);
  await result.getByRole('button', { name: 'Place result in lens', exact: true }).click();
  await controls.getByText('Result placed in this lens. Exploration still uses its separately applied configuration.', { exact: true }).waitFor();
  const lenses = await fetch(`${base}/api/expedition/lenses?runId=${f.id}`).then(r => r.json());
  assert.ok(lenses.lenses[0].revisions.at(-1).groups.find(g => g.id === f.choices[0].groupId).members.includes(`candidate:${candidate.id}`));
  await page.reload();
  const persisted = await fetch(`${base}${endpoint}?runId=${f.id}&lensId=${f.lens.id}`).then(r => r.json());
  assert.equal(persisted.history[0].status, 'completed'); assert.equal(persisted.total, 66);
  assert.equal(store.get(f.id).status, 'paused'); assert.equal(store.get(f.id).maxCalls, before.maxCalls); assert.deepEqual(store.get(f.id).selection, before.selection); assert.deepEqual(pageErrors, []);
  console.log(JSON.stringify({ browserAndHTTP: 'passed', separateWorkerProcesses: 3, corpus: 65, result: 'explicitly placed in lens', exactParentsAndContributions: true, duplicateSubmission: 'idempotent', calls: 2, liveModelCalls: 0, status: 'paused' }));
  if (keep) { const run = store.get(f.id); run.title = 'Cross-group Weave demo — synthetic'; store.save(run); console.log(JSON.stringify({ fixtureDatabase: db, runId: f.id })); }
  passed = true;
} finally {
  await browser?.close(); if (server && server.exitCode === null) { server.kill('SIGTERM'); await new Promise(r => server.once('exit', r)); }
  store.close(); closeSync(log); if (passed && !keep) rmSync(dir, { recursive: true, force: true }); else if (!passed) console.error(`Synthetic failure evidence retained at ${dir}`);
}
