import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { loader } from '../tests/helpers/load-ts.mjs';
const load = loader(), { ExperimentStore } = load('features/experiments/store.ts'), { analyze, readingPreview } = load('features/experiments/analysis.ts');
const results = [];
for (const size of [100, 1000, 10000]) {
    const directory = mkdtempSync(tmpdir() + '/minerva-scale-'), store = new ExperimentStore(directory + '/db');
    try {
        const run = store.create({ id: randomUUID(), goal: 'Synthetic load fixture', maxCalls: 10000, maxCostMicros: 0, callReservationMicros: 0 });
        store.transaction(() => {
            for (let i = 0; i < size; i++) {
                const id = randomUUID(), mechanism = `Known mechanism ${i % 17}`, at = '2026-09-10T00:00:00.000Z';
                store.put('candidate', id, run.id, { id, snapshot: { id, revision: 1, title: `Synthetic ${i}`, summary: mechanism, body: mechanism }, operationId: `op-${i}`, parents: [], exposure: [], rootIds: [id], admission: 'pending', at });
                store.put('assessment', `a-${id}`, run.id, { id: `a-${id}`, candidateId: id, mechanism, evidence: mechanism, constraints: 'preserved', changed: 'unclear', actionability: 'supported', explanation: 'Known-truth synthetic fixture', version: 1, level: 'textual', assessor: 'synthetic', at, sourceOperation: `op-${i}` });
            }
        });
        let start = performance.now();
        const page = store.page(run.id, 'candidate', 0, 30);
        const pageMs = performance.now() - start;
        assert.equal(page.items.length, 30);
        assert.equal(page.more, true);
        start = performance.now();
        const reading = (await analyze(store, run.id)), preview = readingPreview(reading);
        const analysisMs = performance.now() - start;
        const bytes = Buffer.byteLength(JSON.stringify(preview));
        assert.ok(bytes < 20000);
        assert.equal(reading.coverage.candidates, size);
        assert.equal(preview.groups.length, 17);
        assert.ok(preview.groups.every(g => g.candidates.length <= 5));
        results.push({ candidates: size, pageSize: page.items.length, pageMs, analysisMs, readingPreviewBytes: bytes });
    }
    finally {
        store.close();
        rmSync(directory, { recursive: true, force: true });
    }
}
mkdirSync('evaluation-artifacts/transition', { recursive: true });
writeFileSync('evaluation-artifacts/transition/scale.json', JSON.stringify({ kind: 'synthetic local measurements; not model throughput', results }, null, 2));
console.log(JSON.stringify(results));
