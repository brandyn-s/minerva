import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { loader } from './helpers/load-ts.mjs';
const load = loader();
const { ExperimentStore } = load('features/experiments/store.ts');
const { saveRunLens } = load('features/experiments/lenses.ts');
const { previewSelection, applySelection } = load('features/experiments/selection-service.ts');
const { configurationFromLens, selectWithLens, appliedSelection } = load('features/experiments/selection.ts');
const { corpus, analyze } = load('features/experiments/analysis.ts');
const { currentLens } = load('features/lenses/domain.ts');
const { tick, chooseOperation } = load('features/experiments/runner.ts');
const { fixtureProvider } = load('features/experiments/fixture-provider.ts');
async function example(count = 8, capacity = 3) {
  const dir = mkdtempSync(tmpdir() + '/minerva-selection-'), store = new ExperimentStore(dir + '/runs.sqlite');
  const id = randomUUID(), lensId = randomUUID(), at = new Date().toISOString();
  store.create({ id, goal: 'Explore coordination', constraints: [], initial: [], policy: 'diversity', maxCalls: 20, maxCostMicros: 0, callReservationMicros: 0, capacity, seed: 1, provider: 'fixture', execution: 'manual', mode: 'explore' });
  const ids = [];
  for (let n = 0; n < count; n++) {
    const cid = randomUUID(), operationId = randomUUID(); ids.push(cid);
    store.put('operation', operationId, id, { id: operationId, version: 1, kind: 'root', goal: 'Explore coordination', constraints: [], sources: [], exposure: [], intent: '', count: 1, step: 1 });
    store.put('candidate', cid, id, { id: cid, snapshot: { id: cid, revision: 1, title: `Idea ${n}`, summary: 'Share resources through a queue', body: 'A shared queue coordinates resources.' }, operationId, parents: [], exposure: [], rootIds: [cid], admission: 'eligible', at });
    store.put('assessment', `assessment-${cid}`, id, { id: `assessment-${cid}`, candidateId: cid, mechanism: `Mechanism ${n % 4}`, constraints: 'preserved', actionability: 'supported', evidence: 'shared queue', changed: 'yes', explanation: 'fixture', level: 'textual', version: 1, at, assessor: 'fixture', sourceOperation: operationId });
  }
  store.control(id, 'pause');
  let lens = await saveRunLens(store, id, { id: lensId, name: 'Ways of coordinating', expectedRevision: 0, seed: 'mechanisms' });
  lens = await saveRunLens(store, id, { id: lensId, expectedRevision: 1, edit: { kind: 'review' } });
  return { store, id, lens, ids, close() { store.close(); rmSync(dir, { recursive: true, force: true }); } };
}
test('selection is deterministic, bounded, rotates groups and keeps protected eligible members', async () => {
  const f = await example(); try {
    const candidates = await corpus(f.store, f.id), run = f.store.get(f.id), config = configurationFromLens(f.lens, run, [f.ids[0]], 1);
    const a = selectWithLens(candidates, config, 0), b = selectWithLens([...candidates].reverse(), config, 0);
    assert.deepEqual(a.active, b.active); assert.equal(a.active.length, 3); assert.ok(a.active.includes(f.ids[0]));
    assert.equal(a.omittedGroups.length, 1);
    const negativeSeed = { ...run, seed: -9, calls: 2 };
    const operation = chooseOperation(negativeSeed, candidates, { config, decision: a });
    assert.equal(operation.kind, 'wander');
    assert.equal(operation.selection.parentIds.length, 1);
    assert.ok(a.active.includes(operation.selection.parentIds[0]));
    const selected = new Set(Array.from({ length: 4 }, (_, step) => selectWithLens(candidates, config, step).groups.filter(g => g.retained.length).map(g => g.id)).flat());
    assert.equal(selected.size, 4);
    assert.throws(() => configurationFromLens(f.lens, run, f.ids.slice(0, 3), 1), /Protect at most/);
    const invalid = candidates.map(c => c.id === f.ids[0] ? { ...c, assessment: { ...c.assessment, constraints: 'violated' } } : c);
    const d = selectWithLens(invalid, config, 0);
    assert.ok(!d.active.includes(f.ids[0])); assert.ok(d.excluded.find(e => e.candidateId === f.ids[0]).protected);
    const newer = { ...candidates[0], id: randomUUID() };
    const later = selectWithLens([...candidates, newer], config, 0);
    assert.ok(later.groups.find(g => g.members.includes(newer.id)).provisional);
    assert.ok(!later.groups.find(g => g.id === config.groups[0].id).members.includes(newer.id));
  } finally { f.close(); }
});
test('preview/apply remains paused, exactly matches the preview and is idempotent', async () => {
  const f = await example(65, 3); try {
    const reassessmentId = randomUUID();
    f.store.put('assessment', reassessmentId, f.id, { ...(await corpus(f.store, f.id))[0].assessment, id: reassessmentId });
    const before = f.store.get(f.id), preview = await previewSelection(f.store, f.id, f.lens.id, currentLens(f.lens).number, [f.ids[0]]);
    assert.deepEqual(f.store.get(f.id), before); assert.equal(preview.candidates.length, 65);
    assert.equal(preview.configuration.assessments.find(a => a.candidateId === f.ids[0]).assessmentId, reassessmentId);
    const applied = await applySelection(f.store, f.id, preview.id);
    assert.deepEqual(applied.active, preview.decision.active);
    assert.equal(f.store.get(f.id).status, 'paused'); assert.equal(f.store.get(f.id).calls, 0);
    assert.deepEqual(await applySelection(f.store, f.id, preview.id), applied);
    const changed = await saveRunLens(f.store, f.id, { id: f.lens.id, expectedRevision: 2, edit: { kind: 'rename', groupId: currentLens(f.lens).groups[0].id, label: 'A new interpretation' } });
    assert.notEqual(currentLens(changed).groups[0].label, (await appliedSelection(f.store, f.store.get(f.id))).groups[0].label);
    const reading = await analyze(f.store, f.id);
    assert.equal(reading.selection.configurationId, applied.configurationId);
    assert.ok(reading.groups.some(g => g.status === 'reviewed group'));
    assert.ok(!reading.groups.some(g => g.mechanism === 'A new interpretation'));
  } finally { f.close(); }
});
test('lens, assessment and run-state changes invalidate previews; in-flight calls prevent application', async () => {
  for (const change of ['lens', 'assessment', 'run', 'inflight']) {
    const f = await example(); try {
      const p = await previewSelection(f.store, f.id, f.lens.id, 2, []);
      if (change === 'lens') await saveRunLens(f.store, f.id, { id: f.lens.id, expectedRevision: 2, edit: { kind: 'describe', name: 'Changed', description: '' } });
      if (change === 'assessment') f.store.put('assessment', randomUUID(), f.id, { ...(await corpus(f.store, f.id))[0].assessment, id: randomUUID(), constraints: 'violated' });
      if (change === 'run') { f.store.control(f.id, 'resume'); f.store.control(f.id, 'pause'); }
      if (change === 'inflight') f.store.saveAttempt({ id: randomUUID(), runId: f.id, status: 'reserved', leaseUntil: Date.now() + 10000 });
      await assert.rejects(applySelection(f.store, f.id, p.id), /stale|in-flight/);
      assert.equal(f.store.get(f.id).selection, undefined);
    } finally { f.close(); }
  }
});
test('workers reject stale selection and corpus plans, then record exact selected parents after resume', async () => {
  const f = await example(); try {
    const old = f.store.get(f.id), p = await previewSelection(f.store, f.id, f.lens.id, 2, []);
    await applySelection(f.store, f.id, p.id); f.store.control(f.id, 'resume');
    const operation = chooseOperation(old, await corpus(f.store, f.id));
    const stale = { id: randomUUID(), runId: f.id, sequence: 1, stage: 'generation', operation, status: 'reserved', owner: 'stale', leaseUntil: Date.now() + 10000, reservedMicros: 0, cost: 'reserved-upper-bound', at: new Date().toISOString() };
    assert.equal(f.store.reserve(stale), false);
    await tick(f.store, f.id, fixtureProvider(1));
    const attempt = f.store.attempts(f.id)[0];
    assert.equal(attempt.operation.selection.configurationId, p.configuration.id);
    const generated = (await corpus(f.store, f.id)).at(-1);
    assert.deepEqual(generated.parents, attempt.operation.selection.parentIds);
    assert.ok(generated.parents.every(id => p.decision.active.includes(id)));
    assert.equal(f.store.reserve({ ...stale, id: randomUUID(), sequence: 2, selectionAtPlanning: p.configuration.id, controlVersionAtPlanning: f.store.get(f.id).controlVersion, corpusVersionAtPlanning: 0, operation: attempt.operation }), false);
    await tick(f.store, f.id, fixtureProvider(2));
    const reading = await analyze(f.store, f.id);
    assert.equal(reading.selection.configurationId, p.configuration.id);
    assert.ok(reading.groups.find(g => g.candidates.includes(generated.id)).status === 'provisional group');
  } finally { f.close(); }
});
test('only reviewed run lenses apply, and expired reservations retain their spend', async () => {
  const f = await example(); try {
    const unreviewed = { ...f.lens, revisions: f.lens.revisions.slice(0, 1) };
    assert.throws(() => configurationFromLens(unreviewed, f.store.get(f.id), [], 1), /Review this/);
    assert.throws(() => configurationFromLens({ ...f.lens, scope: { kind: 'atlas' } }, f.store.get(f.id), [], 1), /from this expedition/);
    const a = { id: randomUUID(), runId: f.id, status: 'reserved', leaseUntil: 1, reservedMicros: 50 }; f.store.saveAttempt(a);
    const before = f.store.get(f.id).reservedMicros;
    await previewSelection(f.store, f.id, f.lens.id, 2, []);
    assert.equal(f.store.attempt(a.id).status, 'uncertain'); assert.equal(f.store.get(f.id).reservedMicros, before);
  } finally { f.close(); }
});
