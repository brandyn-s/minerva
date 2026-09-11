import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { mockDirections } from './expedition-browser-context.mjs';

export async function runView(page, base, id, query = '') {
  const response = await page.request.get(`${base}/api/expedition/runs?id=${id}${query}`);
  assert.equal(response.status(), 200);
  return response.json();
}
export async function waitForRun(page, base, id, predicate) {
  const deadline = Date.now() + 60000;
  let view;
  while (Date.now() < deadline) {
    view = await runView(page, base, id);
    if (predicate(view)) return view;
    await page.waitForTimeout(100);
  }
  throw new Error(`Expedition did not reach expected state: ${JSON.stringify(view?.run)}`);
}
export async function startExpedition(page, base, direction) {
  const response = await page.request.get(`${base}/api/expedition/runs`);
  assert.equal(response.status(), 200);
  assert.equal((await response.json()).limitMicros, 0, 'Requires a synthetic server; never start a paid run');
  await mockDirections(page);
  await page.getByRole('button', { name: 'Expedition panel', exact: true }).click();
  const panel = page.getByRole('dialog', { name: 'Expedition', exact: true });
  if (await panel.getByRole('button', { name: 'All expeditions', exact: true }).count()) await panel.getByRole('button', { name: 'All expeditions', exact: true }).click();
  await panel.getByLabel('Direction (optional)', { exact: true }).fill(direction);
  const result = page.waitForResponse(r => r.url().endsWith('/api/expedition/runs') && r.request().method() === 'POST');
  await panel.getByRole('button', { name: 'Start expedition', exact: true }).click();
  const created = await result;
  assert.equal(created.status(), 200);
  const run = await created.json();
  assert.equal(run.provider, 'fixture');
  return run;
}

export async function verifyExpedition(page, base, artifacts) {
  await mkdir(artifacts, { recursive: true });
  await mockDirections(page);
  await page.goto(base);
  const panel = page.getByRole('dialog', { name: 'Expedition', exact: true });
  await page.getByRole('button', { name: 'Expedition panel', exact: true }).click();
  assert.equal(await panel.getByRole('button', { name: 'Start expedition', exact: true }).isDisabled(), true);
  await panel.getByRole('button', { name: 'Close panel', exact: true }).click();
  await page.getByRole('button', { name: /^Thoughts / }).click();
  await page.locator('.catalogue-entry').filter({ has: page.getByText('A food hall', { exact: true }) }).getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Close panel', exact: true }).click();
  const camera = await page.locator('.react-flow__viewport').getAttribute('style');
  const run = await startExpedition(page, base, `Regression ${randomUUID().slice(0, 8)}`);
  assert.equal(run.initial.length, 1);
  assert.equal(run.initial[0].id, 'food');
  await panel.getByRole('button', { name: 'Pause', exact: true }).click();
  await panel.getByRole('button', { name: 'Resume', exact: true }).waitFor();
  const paused = await runView(page, base, run.id);
  await page.waitForTimeout(700);
  assert.equal((await runView(page, base, run.id)).run.calls, paused.run.calls, 'Pause admits no new calls');
  await panel.getByRole('button', { name: 'Resume', exact: true }).click();
  await panel.getByRole('button', { name: 'Close panel', exact: true }).click();
  const complete = await waitForRun(page, base, run.id, v => v.run.status === 'completed');
  assert.equal(complete.run.calls, run.maxCalls);
  assert.equal(complete.run.goal, run.goal);
  assert.deepEqual(complete.run.constraints, run.constraints);
  assert.equal(complete.coverage.candidateCount, 6);
  assert.equal(await page.locator('.thought').count(), 6, 'Population results do not require a keep decision or flood the atlas');
  assert.equal(await page.locator('.react-flow__viewport').getAttribute('style'), camera, 'Completion retains the camera');
  assert.equal(await page.locator('.thought.chosen').count(), 1, 'Completion retains selection');
  const operations = await runView(page, base, run.id, '&kind=operation');
  assert.ok(operations.items.some(op => op.kind === 'weave'));
  assert.ok(operations.items.some(op => op.kind === 'develop'));
  assert.ok(operations.items.some(op => op.kind === 'root'));
  assert.ok(operations.items.some(op => op.kind === 'wander'));
  for (const candidate of complete.items) {
    const detail = await runView(page, base, run.id, `&candidateId=${candidate.id}`);
    assert.equal(detail.operation.goal, run.goal);
    assert.equal(detail.candidate.operationId, detail.operation.id);
    assert.ok(detail.candidate.snapshot.body.includes(detail.assessments[0].evidence), 'Assessment cites the exact retained revision');
  }
  await page.reload();
  await page.getByRole('button', { name: 'Expedition panel', exact: true }).click();
  await panel.getByRole('button', { name: run.title, exact: true }).click();
  await panel.getByRole('button', { name: complete.items[0].snapshot.title, exact: true }).click();
  const originalReading = complete.readings[0];
  const before = (await runView(page, base, run.id)).run.calls;
  await panel.getByLabel('Challenge this reading', { exact: true }).fill('This grouping may hide different mechanisms.');
  await panel.getByLabel('Intervention to test on selected candidate', { exact: true }).fill('Try direct peer negotiation.');
  assert.equal((await runView(page, base, run.id)).run.calls, before, 'Writing a challenge does not execute it');
  await panel.getByRole('button', { name: 'Try this direction', exact: true }).click();
  const intervened = await waitForRun(page, base, run.id, v => v.run.status === 'completed' && v.interventions[0]?.status === 'completed');
  assert.equal(intervened.run.calls, before + 2);
  assert.equal(intervened.run.goal, run.goal);
  assert.deepEqual(intervened.run.constraints, run.constraints, 'Challenge is not silently made a constraint');
  assert.equal(intervened.interventions[0].readingId, originalReading.id);
  const readings = await runView(page, base, run.id, '&kind=reading');
  assert.ok(readings.items.some(r => r.id === originalReading.id), 'Prior readings are retained');
  await panel.getByRole('button', { name: 'Run allocation probe — no model calls', exact: true }).click();
  await panel.getByText(/Observed 5 allocated/).waitFor();
  assert.equal((await runView(page, base, run.id)).run.calls, before + 2);
  await panel.getByRole('button', { name: 'Assess again', exact: true }).click();
  const reassessed = await waitForRun(page, base, run.id, v => v.run.status === 'completed' && v.run.calls === before + 3);
  const detail = await runView(page, base, run.id, `&candidateId=${complete.items[0].id}`);
  assert.equal(detail.assessments.length, 2);

  // Replaying an actual earlier reading models a delayed response during generation.
  const staleRoute = async route => {
    const response = await route.fetch();
    const value = await response.json();
    if (value.run && value.items && !route.request().url().includes('candidateId')) value.readings = [originalReading];
    await route.fulfill({ response, json: value });
  };
  await page.route('**/api/expedition/runs?*', staleRoute);
  await panel.getByText('Reading may exclude recent or unassessed revisions.', { exact: true }).waitFor();
  await page.unroute('**/api/expedition/runs?*', staleRoute);
  await panel.getByText('Reading may exclude recent or unassessed revisions.', { exact: true }).waitFor({ state: 'hidden' });
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(await panel.evaluate(el => el.scrollWidth <= el.clientWidth), true);
  await panel.screenshot({ path: `${artifacts}/expedition-mobile.png` });
  await page.setViewportSize({ width: 1440, height: 900 });
  const inspectCamera = await page.locator('.react-flow__viewport').getAttribute('style');
  await panel.getByRole('button', { name: 'Inspect on atlas', exact: true }).click();
  await page.getByRole('dialog', { name: detail.candidate.snapshot.title, exact: true }).waitFor();
  assert.equal(await page.locator('.react-flow__viewport').getAttribute('style'), inspectCamera);
  assert.equal(await page.locator('.thought').count(), 7);
  await page.getByRole('button', { name: 'Close panel', exact: true }).click();
  await page.getByRole('button', { name: 'Expedition panel', exact: true }).click();
  await panel.getByRole('button', { name: 'Inspect on atlas', exact: true }).click();
  await page.getByRole('dialog', { name: detail.candidate.snapshot.title, exact: true }).waitFor();
  assert.equal(await page.locator('.thought').count(), 7, 'Repeated inspection is idempotent');
  await page.getByRole('button', { name: 'Close panel', exact: true }).click();
  const stopRun = await startExpedition(page, base, `Stop ${randomUUID().slice(0, 8)}`);
  await panel.getByRole('button', { name: 'Stop', exact: true }).click();
  const stopped = await waitForRun(page, base, stopRun.id, v => v.run.status === 'stopped');
  await page.waitForTimeout(700);
  const afterStop = await runView(page, base, stopRun.id);
  assert.equal(afterStop.run.calls, stopped.run.calls);
  assert.equal(afterStop.coverage.candidateCount, stopped.coverage.candidateCount);
  await panel.screenshot({ path: `${artifacts}/expedition-stopped.png` });
  await verifyHistoricalImport(page);
  await writeFile(`${artifacts}/expedition-replay.json`, JSON.stringify({ run: reassessed.run, stopped: afterStop.run, mode: 'synthetic worker; stale-response injection' }, null, 2));
  console.log('Expedition: real synthetic worker, pause/resume/stop, frozen inputs, shared operations, challenge/intervention, reading freshness, reassessment, reload, camera and materialization passed.');
}

async function verifyHistoricalImport(page) {
  await page.getByRole('button', { name: 'Close panel', exact: true }).click();
  const openMenu = async () => {
    if (await page.locator('.atlas-menu').getAttribute('open') === null) await page.locator('.atlas-menu > summary').click();
  };
  const exportAtlas = async () => {
    await openMenu();
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export atlas', exact: true }).click();
    return JSON.parse(await readFile(await (await download).path(), 'utf8'));
  };
  const save = await exportAtlas(), card = save.thoughts.find(c => c.id === 'food');
  const historical = { run: { goal: 'Historical browser expedition', budget: 2,
    steps: [{ id: card.id, step: 1, card: { title: card.title, summary: card.summary, body: card.body }, rationale: 'A preserved step', reached: false, reason: 'Further work needed' }], stop: 'Stopped by you' },
    notes: ['User note: keep the uncertainty'], reading: { cards: [card], result: {
      groups: [{ mechanism: 'Shared meals', steps: [1] }], changes: [],
      observations: [{ kind: 'observation', text: 'Food hall proposal', steps: [1] }],
      hypotheses: [{ kind: 'hypothesis', text: 'Meals may bring people together', steps: [1] }],
      experiments: [{ text: 'Try an evening', steps: [1] }, { text: 'Record attendance', steps: [1] }],
      coverage: { text: 'One retained draft', steps: [1] },
    } } };
  save.expeditions = [historical]; save.activeExpedition = 0;
  await openMenu();
  await page.getByLabel('Import atlas file', { exact: true }).setInputFiles({ name: 'historical.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(save)) });
  await page.waitForFunction(() => document.querySelector('.atlas-menu-options')?.textContent.includes('cards ready') || document.querySelector('.atlas-menu-options [role="alert"]'));
  assert.equal(await page.locator('.atlas-menu-options [role="alert"]').count(), 0, await page.locator('.atlas-menu-options').innerText());
  await page.getByRole('button', { name: 'Replace', exact: true }).click();
  await page.getByRole('button', { name: 'Confirm Replace', exact: true }).click();
  await page.getByText('Atlas replaced.', { exact: true }).waitFor();
  await page.reload();
  await page.getByRole('button', { name: 'Expedition panel', exact: true }).click();
  const panel = page.getByRole('dialog', { name: 'Expedition', exact: true });
  await panel.getByRole('heading', { name: 'Earlier browser expeditions', exact: true }).waitFor();
  await panel.getByText(/Historical browser expedition · 1 steps/).waitFor();
  assert.deepEqual((await exportAtlas()).expeditions, [historical], 'Legacy steps, frozen reading revisions and user notes survive import, reload and export');
}
