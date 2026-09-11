import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { zodSchema } from 'ai';
import { loader } from './helpers/load-ts.mjs';
const load = loader();
const { operationSchema } = load('features/experiments/contracts.ts');
const { executeOperation, planOperation } = load('features/experiments/operators.ts');
const { validateWeaveMappings } = load('features/experiments/weave.ts');
const { newWeaveDraft, weaveRequest, acceptWeave, variantDraft, resolveSnapshot, weaveMarkdown } = load('features/atlas/weave.ts');
const { fixtureSave, atlasSaveSchema, mergeAtlas } = load('features/atlas/local-state.ts');
const { reviseCard, cardEdit } = load('features/atlas/card-revisions.ts');
const { materialize } = load('features/experiments/import.ts');
function example() {
  const save = fixtureSave();
  const cards = save.thoughts.filter(c => ['food', 'tools'].includes(c.id));
  assert.equal(cards.length, 2);
  const draft = newWeaveDraft(cards);
  const request = weaveRequest(draft);
  const op = operationSchema.parse({ ...request, id: randomUUID(), version: 1, kind: 'weave', goal: 'Reuse the mall', constraints: [] });
  const output = { cards: [{ title: 'Repair supper', summary: 'Share a meal while repairing.', body: 'A shared meal accompanies borrowing and repair.' }], note: 'A speculative interaction', contributions: ['Shared meal', 'Borrowing and repair'], weaveMappings: op.weave.selections.map(s => ({ selectionId: s.id, status: 'transformed', explanation: 'Contributes to the shared activity.', output: { field: 'body', text: 'A shared meal' } })) };
  const response = { card: output.cards[0], contributions: output.contributions, weaveMappings: output.weaveMappings, receipt: { operation: op, manifest: planOperation(op), status: 'committed', at: new Date().toISOString() } };
  return { save, cards, draft, request, op, output, response };
}
test('selections retain late Unicode excerpts and use a required mapping schema', async () => {
  const { op, output } = example();
  const source = op.sources[0];
  source.body = 'early '.repeat(900) + 'Shared 🍲 meals support peer learning.';
  const text = 'Shared 🍲 meals support peer learning.';
  op.weave.selections[0].excerpt = { field: 'body', start: source.body.indexOf(text), end: source.body.length, text };
  const plan = planOperation(op), context = JSON.parse(plan.prompt);
  assert.ok(!context.sources[0].body.includes(text));
  assert.ok(context.sources[0].omittedBytes > 0);
  assert.equal(context.selectedContributions[0].excerpt.text, text);
  await executeOperation(op, { name: 'fixture', call: async (_, schema) => {
    const json = await zodSchema(schema).jsonSchema;
    assert.ok(json.required.includes('weaveMappings'));
    assert.equal(json.properties.weaveMappings.minItems, 2);
    return output;
  } });
});
test('invalid selections fail before invoking a provider', async () => {
  const { op, output } = example();
  for (const mutate of [
    o => { o.weave.selections[0].sourceRevision++; },
    o => { o.weave.selections[1].sourceId = o.weave.selections[0].sourceId; },
    o => { o.weave.selections[1].id = o.weave.selections[0].id; },
    o => { o.weave.selections[0].excerpt = { field: 'body', start: 0, end: 6, text: 'wrong!' }; },
    o => { o.kind = 'develop'; },
  ]) {
    const bad = structuredClone(op); mutate(bad); let called = false;
    await assert.rejects(executeOperation(bad, { name: 'fixture', call: async () => { called = true; return output; } }));
    assert.equal(called, false);
  }
});
test('mapping identities and quotations are validated, not their semantic truth', () => {
  const { op, output } = example();
  assert.doesNotThrow(() => validateWeaveMappings(op.weave, output.weaveMappings, output.cards[0]));
  for (const mutate of [
    m => m.pop(), m => { m[1].selectionId = m[0].selectionId; },
    m => { m[0].selectionId = 'unknown'; }, m => { m[0].output.text = 'Invented quotation'; },
    m => { m[0].output = null; },
  ]) {
    const bad = structuredClone(output.weaveMappings); mutate(bad);
    assert.throws(() => validateWeaveMappings(op.weave, bad, output.cards[0]));
  }
  const honest = structuredClone(output.weaveMappings); honest[0].status = 'not used'; honest[0].output = null;
  assert.doesNotThrow(() => validateWeaveMappings(op.weave, honest, output.cards[0]));
});
test('receipt mismatch cannot insert a result and variants freeze the original result', () => {
  const { request, response } = example();
  const card = acceptWeave(response, request);
  const draft = variantDraft(card, card.revisions[0]);
  assert.equal(draft.weave.variantOf.id, card.id);
  draft.weave.selections[0].text = 'Changed contribution';
  assert.notEqual(draft.weave.selections[0].text, card.revisions[0].receipt.operation.weave.selections[0].text);
  const bad = structuredClone(response); bad.receipt.operation.sources[0].body = 'Another source';
  assert.throws(() => acceptWeave(bad, request), /does not match/);
});
test('history, interpretation and source links survive edit, save and divergent import', async () => {
  const { save, request, response, cards } = example();
  const original = acceptWeave(response, request);
  original.weaveReviews = [{ id: randomUUID(), revision: 1, selectionId: request.weave.selections[0].id, text: 'The meal is incidental here.', at: new Date().toISOString() }];
  const card = reviseCard(original, { ...cardEdit(original), body: 'A later result body.' });
  save.thoughts.push(card); save.positions.Lineage[card.id] = { x: 2500, y: 0 };
  save.relationships.push(...cards.map((c, i) => ({ id: 'woven-' + i, from: c.id, to: card.id, sourceRevision: 1, kind: 'recombination', label: 'Weave' })));
  const restored = atlasSaveSchema.parse(JSON.parse(JSON.stringify(save)));
  assert.deepEqual(restored.thoughts.at(-1), card);
  const local = fixtureSave();
  const conflict = local.thoughts.find(c => c.id === cards[0].id);
  conflict.body = 'Conflicting source'; conflict.revisions[0].body = conflict.body;
  const merged = await mergeAtlas(local, restored);
  const snapshot = card.revisions[0].receipt.operation.sources[0];
  const resolved = resolveSnapshot(snapshot, merged.save.thoughts);
  assert.ok(resolved.id.startsWith('fork-'));
  assert.equal(resolved.importedFromId, cards[0].id);
  assert.equal(merged.save.relationships.find(e => e.to === card.id && e.from === resolved.id)?.sourceRevision, 1);
  const again = await mergeAtlas(merged.save, restored);
  assert.equal(again.added, 0);
  assert.equal(again.save.thoughts.find(c => c.id === card.id).weaveReviews.length, 1);
  const annotated = structuredClone(restored);
  annotated.thoughts.at(-1).weaveReviews.push({ ...original.weaveReviews[0], id: randomUUID(), text: 'A second interpretation.' });
  const withNote = await mergeAtlas(again.save, annotated);
  assert.equal(withNote.updated, 1);
  assert.equal(withNote.save.thoughts.find(c => c.id === card.id).weaveReviews.length, 2);
  const md = weaveMarkdown(card, 1);
  assert.match(md, /The meal is incidental/); assert.match(md, /Model claim/); assert.ok(md.includes(snapshot.body));
  const bad = structuredClone(restored); bad.thoughts.at(-1).revisions[0].weaveMappings[0].output.text = 'Missing quotation';
  assert.equal(atlasSaveSchema.safeParse(bad).success, false);
});
test('materialized experiment results preserve the same selected contributions', () => {
  const { op, output } = example(), id = randomUUID();
  const candidate = { id, snapshot: { ...output.cards[0], id, revision: 1 }, operationId: op.id, parents: [], exposure: [], rootIds: [], admission: 'pending', at: new Date().toISOString(), weaveMappings: output.weaveMappings };
  const result = materialize(candidate, op, []);
  assert.deepEqual(result.card.revisions[0].weaveMappings, output.weaveMappings);
  assert.deepEqual(result.card.revisions[0].experiment.operation.weave, op.weave);
  const save = fixtureSave(); save.thoughts.push(...result.sources, result.card); save.relationships.push(...result.edges);
  for (const c of [...result.sources, result.card]) save.positions.Lineage[c.id] = { x: 3000, y: 0 };
  assert.doesNotThrow(() => atlasSaveSchema.parse(save));
  const collision = structuredClone(result.sources[0]);
  collision.summary = 'A conflicting summary'; collision.revisions[0].summary = collision.summary;
  const rematerialized = materialize(candidate, op, [collision]);
  assert.notEqual(rematerialized.edges[0].from, collision.id);
  assert.equal(rematerialized.sources[0].summary, op.sources[0].summary);
});
