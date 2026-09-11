import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { loader } from './helpers/load-ts.mjs';
const load = loader();
const { newLens, currentLens, editLens, lensSchema } = load('features/lenses/domain.ts');
const { atlasLens, atlasMembers, lensThemes } = load('features/atlas/lenses.ts');
const { fixtureSave, atlasSaveSchema, mergeAtlas } = load('features/atlas/local-state.ts');
const { cardEdit, reviseCard } = load('features/atlas/card-revisions.ts');
const { ExperimentStore } = load('features/experiments/store.ts');
const { runLensCorpus, saveRunLens, runLenses } = load('features/experiments/lenses.ts');
const title = lens => currentLens(lens);
test('split, rename, move, merge and repeated undo retain exact partition and group identity', () => {
  let lens = atlasLens(fixtureSave().thoughts, 'Coordination');
  const original = structuredClone(lens), members = lens.members.slice(0, 2).map(m => m.key);
  lens = editLens(lens, { kind: 'split', label: 'Shared', members });
  const groupId = title(lens).groups[0].id;
  lens = editLens(lens, { kind: 'rename', groupId, label: 'Together' });
  assert.equal(title(lens).groups[0].id, groupId);
  lens = editLens(lens, { kind: 'representative', groupId, member: members[1] });
  assert.equal(title(editLens(lens, { kind: 'move', members: [members[1]], groupId })).groups[0].representative, members[1]);
  lens = editLens(lens, { kind: 'move', members: [members[1]], groupId: null });
  assert.equal(title(lens).groups[0].representative, members[0]);
  lens = editLens(lens, { kind: 'undo' });
  assert.equal(title(lens).groups[0].representative, members[1]);
  lens = editLens(lens, { kind: 'undo' });
  assert.equal(title(lens).groups[0].representative, members[0]);
  lens = editLens(lens, { kind: 'split', label: 'Other', members: [lens.members[2].key] });
  const groups = title(lens).groups.map(g => g.id);
  lens = editLens(lens, { kind: 'merge', groupIds: groups, label: 'Common' });
  assert.equal(title(lens).groups[0].members.length, 3);
  assert.ok(!groups.includes(title(lens).groups[0].id));
  assert.equal(title(lens).members.length, original.members.length);
  assert.deepEqual(original, { ...lens, members: original.members, revisions: [lens.revisions[0]] });
  for (const mutate of [r => r.unassigned.push(members[0]), r => r.groups[0].members.push('missing'), r => r.groups[0].representative = 'missing']) {
    const bad = structuredClone(lens); mutate(title(bad)); assert.equal(lensSchema.safeParse(bad).success, false);
  }
});
test('new revisions await classification and undo restores earlier coverage without losing references', () => {
  const save = fixtureSave(), card = save.thoughts[0];
  let lens = atlasLens(save.thoughts, 'Lens', [{ name: 'All', reason: '', memberIds: save.thoughts.map(c => c.id) }]);
  const updated = save.thoughts.map(c => c.id === card.id ? reviseCard(c, { ...cardEdit(c), body: 'Changed mechanism' }) : c);
  assert.ok(!lensThemes(lens, updated)[0].memberIds.includes(card.id));
  assert.ok(lensThemes(lens, updated).at(-1).memberIds.includes(card.id));
  const added = atlasMembers(updated).filter(m => !title(lens).members.includes(m.key));
  lens = editLens(lens, { kind: 'include', members: added });
  assert.equal(title(lens).members.length, save.thoughts.length + 1);
  assert.ok(title(lens).unassigned.includes(added[0].key));
  lens = editLens(lens, { kind: 'undo' });
  assert.equal(title(lens).members.length, save.thoughts.length);
  assert.equal(lens.members.length, save.thoughts.length + 1);
});
test('legacy saves, exact historical references and divergent lens/card imports survive reload', async () => {
  const base = fixtureSave(); assert.ok(atlasSaveSchema.parse(base));
  const incoming = structuredClone(base), card = incoming.thoughts[0];
  incoming.thoughts[0] = reviseCard(card, { ...cardEdit(card), body: 'Incoming mechanism' });
  incoming.lenses = [atlasLens(incoming.thoughts, 'Perspective')];
  incoming.activeLensId = incoming.lenses[0].id;
  base.thoughts[0] = reviseCard(card, { ...cardEdit(card), body: 'Local mechanism' });
  const merged = (await mergeAtlas(base, incoming)).save;
  assert.notEqual(merged.lenses[0].members[0].sourceId, card.id);
  assert.equal(merged.lenses[0].members[0].revision, 2);
  assert.equal((await mergeAtlas(merged, incoming)).save.lenses.length, 1);
  const branch = structuredClone(merged);
  branch.lenses[0] = editLens(branch.lenses[0], { kind: 'describe', name: 'Incoming view', description: '' });
  merged.lenses[0] = editLens(merged.lenses[0], { kind: 'describe', name: 'Local view', description: '' });
  const divergent = (await mergeAtlas(merged, branch)).save;
  assert.equal(divergent.lenses.length, 2);
  assert.equal((await mergeAtlas(divergent, branch)).save.lenses.length, 2);
  const malformed = structuredClone(merged); malformed.lenses[0].members[0].revision = 999;
  assert.equal(atlasSaveSchema.safeParse(malformed).success, false);
});
test('run lenses use complete corpus, preserve assessment versions, reject stale edits and leave selection untouched', async () => {
  const dir = mkdtempSync(tmpdir() + '/minerva-lenses-'), path = dir + '/runs.sqlite';
  let store = new ExperimentStore(path);
  try {
    const runId = randomUUID();
    store.create({ id: runId, goal: 'Explore', constraints: [], initial: [], policy: 'diversity', maxCalls: 2, maxCostMicros: 0, callReservationMicros: 0, capacity: 4, seed: 1, provider: 'fixture', mode: 'explore' });
    for (let n = 0; n < 65; n++) {
      const id = randomUUID();
      store.put('candidate', id, runId, { id, snapshot: { id, revision: 1, title: `Candidate ${n}`, summary: 'Frozen', body: 'Full body' } });
      store.put('assessment', `assessment-${n}`, runId, { id: `assessment-${n}`, candidateId: id, mechanism: n < 40 ? 'Shared queue' : 'Local ownership', constraints: 'preserved' });
    }
    const before = store.get(runId), id = randomUUID();
    let lens = await saveRunLens(store, runId, { id, expectedRevision: 0, name: 'Mechanisms', seed: 'mechanisms' });
    assert.equal(title(lens).members.length, 65);
    assert.deepEqual(title(lens).groups.map(g => g.members.length), [40, 25]);
    const assessment = lens.members[0].assessmentId;
    store.put('assessment', 'new-assessment', runId, { id: 'new-assessment', candidateId: lens.members[0].candidateId, mechanism: 'Reassessed', constraints: 'preserved' });
    assert.equal((await runLensCorpus(store, runId)).members[0].assessmentId, 'new-assessment');
    const edit = { kind: 'merge', groupIds: title(lens).groups.map(g => g.id), label: 'Together' };
    lens = await saveRunLens(store, runId, { id, expectedRevision: 1, edit });
    assert.equal(title(lens).groups[0].members.length, 65);
    assert.equal(lens.members[0].assessmentId, assessment);
    await assert.rejects(saveRunLens(store, runId, { id, expectedRevision: 1, edit }), /changed/);
    assert.deepEqual(store.get(runId), before);
    store.close(); store = new ExperimentStore(path);
    assert.equal(title((await runLenses(store, runId))[0]).groups[0].members.length, 65);
    assert.equal((await runLenses(store, randomUUID())).length, 0);
  } finally { store.close(); rmSync(dir, { recursive: true, force: true }); }
});
