import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { loader } from './helpers/load-ts.mjs';

const load = loader();
const { ExperimentStore } = load('features/experiments/store.ts');
const { tick, proposeIntervention } = load('features/experiments/runner.ts');
const { fixtureProvider } = load('features/experiments/fixture-provider.ts');
const { stagnantDrafts } = load('features/experiments/stagnation.ts');

function repeatedProvider() {
  let generations = 0;
  const assessor = fixtureProvider();
  return { name: 'repeated-drafts', async call(plan) {
    if (JSON.parse(plan.prompt).artifact) return assessor.call(plan);
    return { cards: [{ title: `Renamed idea ${++generations}`, summary: 'Central coordinator allocates resources.',
      body: `Central coordinator allocates resources${generations % 2 ? '.' : '!'} Test a small reversible trial and record allocations.` }],
      contributions: JSON.parse(plan.prompt).sources.map(() => 'Use the supplied idea'), note: 'The goal is reached! This unsupported model claim must not stop the run.' };
  } };
}

test('repeated successful drafts stop after assessment across restart, preserving the frozen goal and explicit interventions', async () => {
  const dir = mkdtempSync(tmpdir() + '/minerva-stagnation-'), path = dir + '/runs.sqlite';
  let store = new ExperimentStore(path);
  const provider = repeatedProvider();
  try {
    const run = store.create({ id: randomUUID(), goal: 'Allocate without exceeding capacity', constraints: ['Retain capacity'], maxCalls: 20, maxCostMicros: 0, callReservationMicros: 0 });
    for (let i = 0; i < 5; i++) assert.equal(await tick(store, run.id, provider), true);
    assert.equal(store.get(run.id).status, 'running', 'A model success claim does not establish completion');
    store.close(); store = new ExperimentStore(path);
    assert.equal(await tick(store, run.id, provider), true, 'The third retained draft is assessed after restart');
    assert.equal(await tick(store, run.id, provider), false);
    const stopped = store.get(run.id);
    assert.equal(stopped.calls, 6);
    assert.equal(stopped.status, 'completed');
    assert.match(stopped.reason, /^Stagnation:/);
    assert.equal(store.count(run.id, 'candidate'), 3);
    assert.equal(store.count(run.id, 'assessment'), 3);
    assert.ok(store.all(run.id, 'operation').every(op => op.goal === run.goal && op.constraints[0] === 'Retain capacity'));
    assert.equal(await tick(store, run.id, provider), false, 'Completed runs do not dispatch on reconnect');

    const reading = store.last(run.id, 'reading'), candidate = store.last(run.id, 'candidate');
    await proposeIntervention(store, { runId: run.id, readingId: reading.id, candidateId: candidate.id,
      challenge: 'Try a different mechanism', intent: 'Negotiate peer to peer', operationKind: 'develop' });
    store.transaction(() => { const current = store.get(run.id); current.status = 'running'; current.maxCalls += 2; store.save(current); });
    assert.equal(await tick(store, run.id, fixtureProvider(7)), true, 'An explicit intervention may leave a stagnant region');
    assert.equal(await tick(store, run.id, fixtureProvider(8)), true);
    assert.equal(store.interventions(run.id)[0].status, 'completed');
    assert.equal(store.count(run.id, 'candidate'), 4);
    assert.equal(store.get(run.id).goal, run.goal);
  } finally { store.close(); rmSync(dir, { recursive: true, force: true }); }
});

test('stagnation ignores titles but requires three consecutive similar summaries AND bodies', () => {
  const draft = body => ({ snapshot: { title: 'Same title', summary: 'A shared allocation system', body } });
  const a = draft('A coordinator approves every reservation against remaining capacity.');
  const b = draft('Peers exchange time slots directly and settle conflicts by negotiation.');
  const c = draft('A lottery randomly allocates available slots at the end of each day.');
  assert.equal(stagnantDrafts([a, a]), false);
  assert.equal(stagnantDrafts([a, b, c]), false, 'Same labels do not imply stagnation');
  assert.equal(stagnantDrafts([a, a, b, a]), false, 'A substantive change breaks the sequence');
  assert.equal(stagnantDrafts([b, a, a, { snapshot: { ...a.snapshot, title: 'A new name' } }]), true);
  assert.equal(stagnantDrafts([a, a, a].map(c => ({ snapshot: { ...c.snapshot, summary: '' } }))), true, 'Empty summaries do not hide repeated bodies');
  assert.equal(stagnantDrafts([draft(''), draft(''), draft('')]), false);
});

test('a concurrent Stop retains its status when the worker observes stagnation', async () => {
  const dir = mkdtempSync(tmpdir() + '/minerva-stagnation-control-');
  const store = new ExperimentStore(dir + '/runs.sqlite');
  try {
    const run = store.create({ id: randomUUID(), goal: 'Retain controls', maxCalls: 20, maxCostMicros: 0, callReservationMicros: 0 });
    const provider = repeatedProvider();
    for (let i = 0; i < 6; i++) await tick(store, run.id, provider);
    const interventions = store.interventions.bind(store);
    store.interventions = id => { store.control(id, 'stop'); return interventions(id); };
    assert.equal(await tick(store, run.id, provider), false);
    assert.equal(store.get(run.id).status, 'stopped');
    assert.match(store.get(run.id).reason, /Stopped by user/);
    assert.equal(store.get(run.id).calls, 6);
  } finally { store.close(); rmSync(dir, { recursive: true, force: true }); }
});
