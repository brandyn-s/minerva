import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { zodSchema } from 'ai';
import { loader } from './helpers/load-ts.mjs';

const { executeOperation } = loader()('features/experiments/operators.ts');
const card = { title: 'Repair supper', summary: 'Share tools and a meal.', body: 'Repair household items around a shared table.' };
const source = (id) => ({ ...card, id: String(id), revision: 1 });
const operation = (kind, count, sourceCount) => ({
  id: randomUUID(), version: 1, kind, count,
  goal: 'Reuse a vacant shop', constraints: [], sources: Array.from({ length: sourceCount }, (_, i) => source(i)),
  exposure: [], intent: '', step: 1,
});

test('Weave supplies the model an exact one-card schema and one contribution per source', async () => {
  for (const sourceCount of [2, 8]) {
    const valid = { cards: [card], note: 'Combined proposal', contributions: Array.from({ length: sourceCount }, (_, i) => `Source ${i} contribution`) };
    const output = await executeOperation(operation('weave', 1, sourceCount), {
      name: 'schema-aware fixture',
      async call(_plan, schema) {
        const json = await zodSchema(schema).jsonSchema;
        assert.equal(json.properties.cards.minItems, 1);
        assert.equal(json.properties.cards.maxItems, 1);
        assert.equal(json.properties.contributions.minItems, sourceCount);
        assert.equal(json.properties.contributions.maxItems, sourceCount);
        for (const count of [0, 2, 3]) {
          assert.equal(schema.safeParse({ ...valid, cards: Array(count).fill(card) }).success, false);
        }
        for (const count of [sourceCount - 1, sourceCount + 1]) {
          assert.equal(schema.safeParse({ ...valid, contributions: Array(count).fill('Contribution') }).success, false);
        }
        return schema.parse(valid);
      },
    });
    assert.deepEqual(output, valid);
  }
});

test('other operations keep their own card count without requiring Weave contributions', async () => {
  for (const [kind, count, sources] of [['wander', 1, 1], ['wander', 2, 1], ['wander', 3, 1], ['root', 1, 0], ['develop', 1, 1]]) {
    const output = await executeOperation(operation(kind, count, sources), {
      name: 'schema-aware fixture',
      async call(_plan, schema) {
        const json = await zodSchema(schema).jsonSchema;
        assert.equal(json.properties.cards.minItems, count);
        assert.equal(json.properties.cards.maxItems, count);
        return schema.parse({ cards: Array(count).fill(card), note: 'Proposal', contributions: [] });
      },
    });
    assert.equal(output.cards.length, count);
  }
});

test('final Weave validation still rejects a provider that ignores the schema', async () => {
  const op = operation('weave', 1, 2);
  await assert.rejects(executeOperation(op, {
    name: 'malformed fixture',
    call: async () => ({ cards: [card, card], note: '', contributions: ['Tools', 'Food'] }),
  }), /Wrong number of generated cards/);
  await assert.rejects(executeOperation(op, {
    name: 'malformed fixture',
    call: async () => ({ cards: [card], note: '', contributions: ['Tools'] }),
  }), /Missing source contributions/);
});
