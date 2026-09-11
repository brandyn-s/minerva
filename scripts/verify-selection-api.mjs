// Full browser -> production-built HTTP routes -> isolated SQLite verification.
// Run/lens/selection routes are real; unrelated model requests are blocked.
// No workers or provider calls. Requires npm run build first.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import { mkdtempSync, mkdirSync, openSync, closeSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { createServer } from 'node:net';
import { chromium } from 'playwright';
import { loader } from '../tests/helpers/load-ts.mjs';
const load = loader(), { ExperimentStore } = load('features/experiments/store.ts');
const keepFixture = process.argv.includes('--keep-fixture');
if (keepFixture) mkdirSync('.local', { recursive: true });
const dir = mkdtempSync(keepFixture ? resolve('.local/selection-demo-') : tmpdir() + '/minerva-selection-api-'), db = dir + '/runs.sqlite';
const store = new ExperimentStore(db), runId = randomUUID(), lensId = randomUUID(), at = new Date().toISOString();
const reservation = createServer(); await new Promise(resolve => reservation.listen(0, '127.0.0.1', resolve));
const port = reservation.address().port; await new Promise(resolve => reservation.close(resolve));
const base = `http://127.0.0.1:${port}`, env = { ...process.env, MINERVA_EXPERIMENT_DB: db, MINERVA_EXPERIMENT_PROVIDER: 'fixture', MINERVA_EXPERIMENT_LIVE: '0', EXPEDITION_DATABASE_URL: '', VERCEL: '', VERCEL_OIDC_TOKEN: '', AI_GATEWAY_API_KEY: '' };
const log = openSync(dir + '/server.log', 'w');
let server, browser, passed = false;
try {
  store.create({ id: runId, title: 'Selection API verification', goal: 'Synthetic coordination exploration', capacity: 3, maxCalls: 12, maxCostMicros: 0, callReservationMicros: 0, provider: 'fixture', execution: 'manual' });
  store.control(runId, 'pause');
  for (let n = 0; n < 65; n++) {
    const id = randomUUID(), operationId = randomUUID();
    store.put('operation', operationId, runId, { id: operationId, version: 1, kind: 'root', goal: 'Synthetic coordination exploration', constraints: [], sources: [], exposure: [], intent: '', count: 1, step: 1 });
    store.put('candidate', id, runId, { id, operationId, snapshot: { id, revision: 1, title: `Fixture ${n}`, summary: 'A shared queue', body: 'A shared queue coordinates resources.' }, parents: [], exposure: [], rootIds: [id], admission: 'eligible', at });
    store.put('assessment', `assessment-${id}`, runId, { id: `assessment-${id}`, candidateId: id, mechanism: `Mechanism ${n % 5}`, constraints: 'preserved', actionability: 'supported', changed: 'yes', evidence: 'shared queue', explanation: 'Synthetic', version: 1, level: 'textual', at, sourceOperation: operationId, assessor: 'fixture' });
  }
  server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '--hostname', '127.0.0.1', '--port', String(port)], { env, stdio: ['ignore', log, log] });
  for (let tries = 0; ; tries++) {
    if (server.exitCode !== null || tries > 100) throw new Error(`Server failed; inspect ${dir}/server.log`);
    try { if ((await fetch(base)).ok) break; } catch { /* Wait for startup. */ }
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  async function post(path, value, headers = {}) { return fetch(base + path, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(value) }); }
  const lenses = '/api/expedition/lenses', selection = '/api/expedition/selection';
  assert.equal((await post(lenses, { runId, id: lensId, expectedRevision: 0, name: 'Coordination', seed: 'mechanisms' })).status, 200);
  assert.equal((await post(lenses, { runId, id: lensId, expectedRevision: 1, edit: { kind: 'review' } })).status, 200);
  const command = { action: 'preview', runId, lensId, lensRevision: 2, protectedIds: [] };
  const preview = (await (await post(selection, command)).json()).preview;
  assert.equal(preview.candidates.length, 65);
  // Separate HTTP requests exercise real stale-write checks and SQLite connections.
  const q = (await (await post(selection, command)).json()).preview;
  const raced = await Promise.all([preview, q].map(p => post(selection, { action: 'apply', runId, previewId: p.id })));
  assert.deepEqual(raced.map(r => r.status).sort(), [200, 409]);
  assert.equal(store.get(runId).status, 'paused');
  const fresh = (await (await post(selection, command)).json()).preview;
  await post(lenses, { runId, id: lensId, expectedRevision: 2, edit: { kind: 'describe', name: 'Coordination reviewed', description: '' } });
  assert.equal((await post(selection, { action: 'apply', runId, previewId: fresh.id })).status, 409);
  await post(lenses, { runId, id: lensId, expectedRevision: 3, edit: { kind: 'review' } });
  assert.equal((await post(selection, { ...command, lensRevision: 4 }, { Origin: 'https://example.invalid' })).status, 409);
  assert.equal((await fetch(`${base}${selection}?runId=${randomUUID()}`)).status, 404);
  const foreignId = randomUUID(); store.create({ id: foreignId, owner: randomUUID(), goal: 'Foreign fixture', maxCalls: 2, maxCostMicros: 0, callReservationMicros: 0, provider: 'fixture', execution: 'manual' });
  assert.equal((await fetch(`${base}${selection}?runId=${foreignId}`)).status, 404);
  assert.equal((await post(selection, { ...command, runId: foreignId })).status, 404);
  browser = await chromium.launch(); const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.route('**/api/**', route => ['/api/expedition/runs', lenses, selection].includes(new URL(route.request().url()).pathname) ? route.continue() : route.abort());
  const pageErrors = []; page.on('pageerror', e => pageErrors.push(e.message));
  await page.goto(base);
  await page.getByRole('button', { name: 'Expedition panel', exact: true }).click();
  await page.getByRole('button', { name: 'Selection API verification', exact: true }).click();
  await page.getByRole('button', { name: 'Edit expedition lenses', exact: true }).click();
  await page.getByRole('button', { name: 'Use for exploration', exact: true }).click();
  const controls = page.getByRole('region', { name: 'Use lens for exploration', exact: true });
  const previewResponse = page.waitForResponse(r => r.url().endsWith(selection) && r.request().method() === 'POST');
  await controls.getByRole('button', { name: 'Preview population', exact: true }).click();
  const browserPreview = (await (await previewResponse).json()).preview;
  assert.equal(browserPreview.candidates.length, 65);
  await controls.getByRole('button', { name: 'Apply preview · stay paused', exact: true }).click();
  await controls.getByRole('region', { name: 'Applied selection', exact: true }).waitFor();
  assert.deepEqual(store.get(runId).active, browserPreview.decision.active);
  assert.equal(store.get(runId).status, 'paused');
  assert.equal(store.last(runId, 'reading').selection.configurationId, browserPreview.configuration.id);
  await page.reload();
  await page.getByRole('button', { name: 'Expedition panel', exact: true }).click();
  await page.getByRole('button', { name: 'Selection API verification', exact: true }).click();
  await page.getByRole('button', { name: 'Edit expedition lenses', exact: true }).click();
  await page.getByRole('button', { name: 'Use for exploration', exact: true }).click();
  await page.getByText(/Applied: Coordination reviewed, lens revision 4/).waitFor();
  assert.equal(store.get(runId).calls, 0); assert.equal(store.attempts(runId).length, 0); assert.deepEqual(pageErrors, []);
  console.log(JSON.stringify({ completeCorpus: 65, actualBrowserAndAPI: 'passed', concurrentApply: 'one accepted, one stale', ownershipAndOrigin: 'enforced', population: 'exact preview after reload', reading: 'applied lens', calls: 0 }));
  if (keepFixture) {
    const run = store.get(runId); run.title = 'Lens selection demo — synthetic'; run.execution = 'worker'; store.save(run);
    console.log(JSON.stringify({ fixtureDatabase: db, runId, status: run.status, provider: run.provider }));
  }
  passed = true;
} finally {
  await browser?.close();
  if (server && server.exitCode === null) { server.kill('SIGTERM'); await new Promise(resolve => server.once('exit', resolve)); }
  store.close(); closeSync(log); if (passed && !keepFixture) rmSync(dir, { recursive: true, force: true }); else if (!passed) console.error(`Synthetic failure evidence retained at ${dir}`);
}
