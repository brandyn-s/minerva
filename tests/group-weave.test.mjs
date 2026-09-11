import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { loader } from './helpers/load-ts.mjs';
import { seedGroupWeave } from './helpers/group-weave-fixture.mjs';
const load = loader(), { ExperimentStore } = load('features/experiments/store.ts');
const { prepareGroupWeave, submitGroupWeave, groupWeaveProgress, groupWeaveOptions } = load('features/experiments/group-weave.ts');
const { tick } = load('features/experiments/runner.ts'), { fixtureProvider } = load('features/experiments/fixture-provider.ts');
const { saveRunLens } = load('features/experiments/lenses.ts'), { previewSelection } = load('features/experiments/selection-service.ts');
async function fixture() {
  const dir = mkdtempSync(tmpdir() + '/minerva-group-weave-'), store = new ExperimentStore(dir + '/runs.sqlite');
  const seed = await seedGroupWeave(store);
  return { ...seed, store, preview: () => prepareGroupWeave(store, seed.id, seed.lens.id, 2, seed.choices), close() { store.close(); rmSync(dir, { recursive: true, force: true }); } };
}
test('group preparation covers all members and preserves distinct candidates sharing an artifact identity', async () => {
  const f = await fixture(); try {
    const options = await groupWeaveOptions(f.store, f.id, f.lens.id);
    assert.equal(options.total, 65); assert.equal(options.groups.reduce((n, g) => n + g.members.length, 0), 65);
    const p = await f.preview(); assert.equal(p.draft.sources[0].id, p.draft.sources[1].id);
    assert.notEqual(p.draft.sources[0].candidateId, p.draft.sources[1].candidateId);
    const source = p.draft.sources[1], text = 'Exact contribution 1.', start = source.body.indexOf(text);
    p.draft.weave.selections[1].excerpt = { field: 'body', start, end: start + text.length, text };
    const before = f.store.get(f.id), request = await submitGroupWeave(f.store, f.id, p.id, p.draft.weave);
    assert.equal(f.store.get(f.id).calls, 0); assert.equal(f.store.get(f.id).status, 'paused');
    assert.deepEqual(await submitGroupWeave(f.store, f.id, p.id, p.draft.weave), request);
    await tick(f.store, f.id, fixtureProvider(1)); await tick(f.store, f.id, fixtureProvider(2));
    assert.equal(await tick(f.store, f.id, fixtureProvider(3)), false);
    const progress = await groupWeaveProgress(f.store, f.id, request.id);
    assert.equal(progress.status, 'completed'); assert.equal(progress.calls, 2);
    assert.deepEqual(progress.candidate.parents, f.choices.map(c => c.candidateId));
    assert.equal(progress.candidate.weaveMappings.length, 2);
    assert.equal(f.store.get(f.id).status, 'paused'); assert.equal(f.store.get(f.id).groupWeave, undefined);
    assert.equal(f.store.get(f.id).maxCalls, before.maxCalls); assert.equal(f.store.get(f.id).maxCostMicros, before.maxCostMicros);
    assert.equal(f.store.get(f.id).calls, 2);
    const attempt = f.store.attempts(f.id)[0]; assert.match(attempt.manifest.prompt, /Exact contribution 1/);
    assert.deepEqual(attempt.operation.sources, p.draft.sources);
    assert.equal(f.store.last(f.id, 'reading').selection.configurationId, before.selection.id);
    await submitGroupWeave(f.store, f.id, p.id, p.draft.weave); assert.equal(f.store.get(f.id).groupWeave, undefined);
  } finally { f.close(); }
});
test('stale lens, corpus, assessment and control state reject group submissions without spending', async () => {
  for (const change of ['lens', 'candidate', 'assessment', 'control']) {
    const f = await fixture(); try {
      const p = await f.preview();
      if (change === 'lens') await saveRunLens(f.store, f.id, { id: f.lens.id, expectedRevision: 2, edit: { kind: 'describe', name: 'Changed', description: '' } });
      if (change === 'candidate') { const c = f.store.record(f.ids[0]), id = randomUUID(); f.store.put('candidate', id, f.id, { ...c, id }); }
      if (change === 'assessment') { const a = f.store.assessments(f.id, f.ids[0])[0], id = randomUUID(); f.store.put('assessment', id, f.id, { ...a, id }); }
      if (change === 'control') { f.store.control(f.id, 'resume'); f.store.control(f.id, 'pause'); }
      await assert.rejects(submitGroupWeave(f.store, f.id, p.id, p.draft.weave), /stale/);
      assert.equal(f.store.get(f.id).calls, 0); assert.equal(f.store.get(f.id).groupWeave, undefined);
    } finally { f.close(); }
  }
});
test('group Weave requires reviewed, settled, eligible sources and two calls in the existing allowance', async () => {
  const f = await fixture(); try {
    await assert.rejects(prepareGroupWeave(f.store, f.id, f.lens.id, 2, [f.choices[0], f.choices[0]]), /distinct/);
    await assert.rejects(prepareGroupWeave(f.store, f.id, f.lens.id, 2, [{ ...f.choices[0], candidateId: f.ids[1] }, f.choices[1]]), /distinct|outside/);
    const a = f.store.assessments(f.id, f.ids[0])[0], id = randomUUID(); f.store.put('assessment', id, f.id, { ...a, id, constraints: 'violated' });
    await assert.rejects(f.preview(), /without reported constraint/);
    const run = f.store.get(f.id); run.calls = 11; f.store.save(run); await assert.rejects(f.preview(), /two calls/);
    run.calls = 0; run.status = 'running'; f.store.save(run); await assert.rejects(f.preview(), /Pause/);
  } finally { f.close(); }
});
test('an in-flight bounded Weave blocks other work, lens application and resume; Stop rejects late output', async () => {
  const f = await fixture(); try {
    const p = await f.preview(); await submitGroupWeave(f.store, f.id, p.id, p.draft.weave);
    let entered, release; const started = new Promise(r => entered = r), barrier = new Promise(r => release = r);
    const task = tick(f.store, f.id, { name: 'delayed fixture', call: async (...args) => { entered(); await barrier; return fixtureProvider(1).call(...args); } }); await started;
    assert.equal(await tick(f.store, f.id, fixtureProvider(2)), false);
    assert.throws(() => f.store.control(f.id, 'resume'), /bounded group Weave/);
    await assert.rejects(previewSelection(f.store, f.id, f.lens.id, 2, []), /in-flight group Weave/);
    f.store.control(f.id, 'stop'); release(); await task;
    assert.equal((await groupWeaveProgress(f.store, f.id, p.id)).status, 'cancelled');
    assert.equal(f.store.count(f.id, 'candidate'), 65); assert.equal(f.store.get(f.id).calls, 1);
  } finally { f.close(); }
});
test('failed and expired attempts are not replayed; failed submission rolls back its request', async () => {
  const f = await fixture(); try {
    const p = await f.preview(), save = f.store.save.bind(f.store);
    f.store.save = () => { throw new Error('synthetic save failure'); };
    await assert.rejects(submitGroupWeave(f.store, f.id, p.id, p.draft.weave), /synthetic save failure/); f.store.save = save;
    assert.equal(f.store.record(`group-weave:${p.id}`), undefined);
    await submitGroupWeave(f.store, f.id, p.id, p.draft.weave);
    await tick(f.store, f.id, { name: 'failure fixture', call: async () => { throw new Error('fixture failure'); } });
    assert.equal((await groupWeaveProgress(f.store, f.id, p.id)).status, 'inconclusive');
    assert.equal(await tick(f.store, f.id, fixtureProvider(1)), false); assert.equal(f.store.get(f.id).calls, 1);
    const q = await f.preview(); await submitGroupWeave(f.store, f.id, q.id, q.draft.weave);
    const reserve = f.store.reserve.bind(f.store); f.store.reserve = attempt => { attempt.leaseUntil = Date.now() - 1; return reserve(attempt); };
    await tick(f.store, f.id, fixtureProvider(2)); f.store.reserve = reserve;
    await tick(f.store, f.id, fixtureProvider(3));
    assert.equal((await groupWeaveProgress(f.store, f.id, q.id)).status, 'inconclusive'); assert.equal(f.store.get(f.id).calls, 2);
  } finally { f.close(); }
});
