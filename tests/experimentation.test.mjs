import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { loader } from './helpers/load-ts.mjs';
const load = loader(), { ExperimentStore } = load('features/experiments/store.ts'), { tick, proposeIntervention } = load('features/experiments/runner.ts'), { fixtureProvider } = load('features/experiments/fixture-provider.ts'), { analyze, corpus, selectPopulation } = load('features/experiments/analysis.ts'), { executeOperation, planOperation, assess } = load('features/experiments/operators.ts');
function setup() { const dir = mkdtempSync(tmpdir() + '/minerva-run-'), store = new ExperimentStore(dir + '/state.sqlite'); return { store, cleanup: () => { store.close(); rmSync(dir, { recursive: true, force: true }); } }; }
function config(extra = {}) { return { id: randomUUID(), goal: 'Allocate shared resources', constraints: ['Retain capacity'], initial: [], policy: 'diversity', maxCalls: 12, maxCostMicros: 0, callReservationMicros: 0, capacity: 8, seed: 2, provider: 'fixture', mode: 'explore', ...extra }; }
test('shared operators enforce exact evidence, isolated roots and source contributions', async () => {
    const op = { id: randomUUID(), version: 1, kind: 'root', goal: 'Test', constraints: [], sources: [], exposure: [], intent: '', step: 1, count: 1 };
    assert.throws(() => planOperation({ ...op, exposure: [{ id: 'a', revision: 1, title: 'a', summary: 'a', body: 'a' }] }));
    assert.deepEqual(JSON.parse(planOperation(op).prompt).sources, []);
    const output = await executeOperation(op, fixtureProvider());
    assert.equal(output.cards.length, 1);
    const c = { id: 'c', snapshot: { ...output.cards[0], id: 'c', revision: 1 } };
    await assert.rejects(assess(c, op, { name: 'bad', call: async () => ({ mechanism: 'x', evidence: 'Invented quotation', constraints: 'preserved', changed: 'yes', actionability: 'supported', explanation: '' }) }), /exact artifact/);
});
test('run produces retained population and evidence, then tests an explicit intervention', async () => {
    const { store, cleanup } = setup();
    try {
        const run = store.create(config());
        for (let n = 0; n < 12; n++)
            assert.equal(await tick(store, run.id, fixtureProvider(1 + n)), true);
        assert.equal(await tick(store, run.id, fixtureProvider()), false);
        assert.equal(store.get(run.id).status, 'completed');
        const candidates = (await corpus(store, run.id));
        assert.equal(candidates.length, 6);
        assert.equal(store.all(run.id, 'assessment').length, 6);
        assert.ok(store.get(run.id).active.length > 0);
        const reading = (await analyze(store, run.id));
        assert.equal(reading.coverage.candidates, 6);
        assert.ok(reading.limitations.length);
        const intervention = (await proposeIntervention(store, { runId: run.id, readingId: reading.id, candidateId: candidates[0].id, challenge: 'Test mechanism change', intent: 'Let peers allocate directly', operationKind: 'develop' }));
        store.transaction(() => { const r = store.get(run.id); r.maxCalls += 2; r.status = 'running'; store.save(r); });
        await tick(store, run.id, fixtureProvider(6));
        await tick(store, run.id, fixtureProvider(7));
        const done = store.interventions(run.id).find(i => i.id === intervention.id);
        assert.equal(done.status, 'completed');
        assert.ok(done.updatedReadingId);
        assert.equal(store.get(run.id).calls, 14);
        assert.equal(store.record(done.resultId).snapshot.id, candidates[0].snapshot.id);
        assert.equal(store.record(done.resultId).snapshot.revision, candidates[0].snapshot.revision + 1);
    }
    finally {
        cleanup();
    }
});
test('stop rejects late results; pause retains completion and prevents new dispatch', async () => {
    const { store, cleanup } = setup();
    try {
        const run = store.create(config());
        let release;
        const delayed = { name: 'delayed', call: () => new Promise(r => { release = r; }) };
        const pending = tick(store, run.id, delayed);
        await new Promise(r => setTimeout(r, 10));
        store.control(run.id, 'stop');
        release({ cards: [{ title: 'Late', summary: 'Late', body: 'Late' }], contributions: [], note: 'Late' });
        await pending;
        assert.equal(store.all(run.id, 'candidate').length, 0);
        assert.equal(store.attempts(run.id)[0].status, 'cancelled');
        const other = store.create(config());
        const pending2 = tick(store, other.id, delayed);
        await new Promise(r => setTimeout(r, 10));
        store.control(other.id, 'pause');
        release({ cards: [{ title: 'Completed', summary: 'Completed', body: 'Completed' }], contributions: [], note: 'Completed' });
        await pending2;
        assert.equal(store.all(other.id, 'candidate').length, 1);
        assert.equal(await tick(store, other.id, fixtureProvider()), false);
    }
    finally {
        cleanup();
    }
});
test('normalized descriptor changes do not establish attractors and revisions do not count as independent roots', async () => {
    const { store, cleanup } = setup();
    try {
        const r = store.create(config()), base = { operationId: 'op', parents: ['shared-root'], exposure: [], rootIds: ['shared-root'], admission: 'pending', at: 'now' };
        for (let i = 0; i < 3; i++) {
            const id = `candidate-${i}`;
            store.put('candidate', id, r.id, { ...base, id, snapshot: { id: 'one-artifact', revision: i + 1, title: `Different wording ${i}`, summary: 'same', body: 'Central coordinator' } });
            store.put('assessment', `a-${i}`, r.id, { id: `a-${i}`, candidateId: id, mechanism: 'Central coordinator', evidence: 'Central coordinator', constraints: 'preserved', actionability: 'supported', changed: 'no', version: 1, level: 'textual', assessor: 'fixture', at: 'now', sourceOperation: 'op' });
        }
        const reading = (await analyze(store, r.id));
        assert.equal(reading.groups.length, 1);
        assert.equal(reading.groups[0].independent, false);
        assert.equal(reading.groups[0].status, 'provisional group');
        assert.equal(selectPopulation((await corpus(store, r.id)), r).length, 1);
    }
    finally {
        cleanup();
    }
});
test('materialized Develop appends once and preserves locally diverged sources', () => {
    const { materialize } = load('features/experiments/import.ts'), { fixtureSave } = load('features/atlas/local-state.ts');
    const base = fixtureSave().thoughts[1], op = { id: randomUUID(), version: 1, kind: 'develop', goal: 'Test', constraints: [], sources: [{ id: base.id, revision: base.revision, title: base.title, summary: base.summary, body: base.body, contribution: base.contribution }], exposure: [], intent: 'Change mechanism', step: 1, count: 1 };
    const candidate = { id: randomUUID(), snapshot: { ...op.sources[0], revision: 2, body: 'A new mechanism' }, operationId: op.id, parents: [`${base.id}@1`], exposure: [], rootIds: ['initial'], admission: 'pending', at: 'now' };
    const first = materialize(candidate, op, [base]);
    assert.equal(first.card.id, base.id);
    assert.equal(first.card.revision, 2);
    assert.equal(materialize(candidate, op, [first.card]).card.revision, 2);
    const changed = { ...base, title: 'Local changes' };
    const fork = materialize(candidate, op, [changed]);
    assert.equal(fork.card.id, candidate.id);
    assert.equal(changed.title, 'Local changes');
});
test('simulation outcomes remain separate evidence and update the next reading', async () => {
    const { probe } = load('features/experiments/probe.ts'), { store, cleanup } = setup();
    try {
        const run = store.create(config()), id = randomUUID();
        store.put('candidate', id, run.id, { id, snapshot: { id, revision: 1, title: 'Allocation', summary: 'Allocation', body: 'Allocate resources' }, operationId: 'op', parents: [], exposure: [], rootIds: [id], at: 'now', admission: 'pending' });
        const input = { runId: run.id, candidateId: id, capacity: 5, requests: [4, 4] };
        assert.equal((await probe(store, { ...input, model: 'central-queue' })).capacityPreserved, true);
        assert.equal((await probe(store, { ...input, model: 'independent-reservations' })).capacityPreserved, false);
        const reading = (await analyze(store, run.id));
        assert.equal(reading.probes.length, 2);
        assert.equal(reading.coverage.assessed, 0);
        assert.equal(store.all(run.id, 'assessment').length, 0);
    }
    finally {
        cleanup();
    }
});
test('typed and voice context stays bounded and prioritizes focus without hiding omissions', () => {
    const { boundContext, boundMessages } = load('features/atlas/context.ts');
    const cards = Array.from({ length: 10000 }, (_, i) => ({ id: `c-${i}`, revision: 1, title: `Title ${i}`, summary: 'Summary', body: '😀'.repeat(10000), relationships: [] }));
    const context = boundContext(cards, ['c-9998'], 'c-9999');
    assert.equal(context.cards[0].id, 'c-9999');
    assert.equal(context.cards[1].id, 'c-9998');
    assert.ok(Buffer.byteLength(JSON.stringify(context)) < 130000);
    assert.equal(context.contextCoverage.omittedCards, 10000 - context.cards.length);
    assert.equal(context.contextCoverage.truncatedCardIds.length, context.cards.length);
    assert.equal(boundMessages(Array.from({ length: 100 }, () => ({ role: 'user', content: 'x'.repeat(10000) }))).length, 12);
});
