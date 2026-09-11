// Run against an isolated local production server using the same temporary SQLite path.
// This writes synthetic records only and never invokes a provider or starts a worker.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { loader } from '../tests/helpers/load-ts.mjs';
const base = process.env.MINERVA_LENS_TEST_URL, db = process.env.MINERVA_LENS_TEST_DB;
if (!base || !db || !['127.0.0.1', 'localhost'].includes(new URL(base).hostname) || !db.startsWith('/tmp/minerva-lenses-')) throw new Error('Use an isolated loopback server and /tmp/minerva-lenses-* database');
const { ExperimentStore } = loader()('features/experiments/store.ts');
const store = new ExperimentStore(db), runId = randomUUID(), lensId = randomUUID();
const at = new Date().toISOString();
const run = store.create({ id: runId, goal: 'Synthetic lens verification', constraints: [], initial: [], policy: 'diversity', maxCalls: 2, maxCostMicros: 0, callReservationMicros: 0, capacity: 4, seed: 1, provider: 'fixture', mode: 'explore' });
store.control(runId, 'stop');
for (let n = 0; n < 65; n++) {
  const id = randomUUID(), operationId = randomUUID();
  store.put('operation', operationId, runId, { id: operationId, version: 1, kind: 'root', goal: run.goal, constraints: [], sources: [], exposure: [], intent: '', count: 1 });
  store.put('candidate', id, runId, { id, operationId, snapshot: { id, revision: 1, title: `Fixture ${n}`, summary: 'Frozen synthetic idea', body: `Complete text for fixture ${n}` }, parents: [], exposure: [], rootIds: [id], admission: 'eligible', at });
  store.put('assessment', `assessment-${id}`, runId, { id: `assessment-${id}`, candidateId: id, mechanism: n < 40 ? 'Shared queue' : 'Local ownership', constraints: 'preserved', evidence: 'Frozen synthetic idea', changed: 'yes', actionability: 'supported', explanation: 'Synthetic', version: 1, level: 'textual', assessor: 'fixture', at, sourceOperation: operationId });
}
const before = store.get(runId);
async function post(command) { return fetch(`${base}/api/expedition/lenses`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ runId, id: lensId, ...command }) }); }
try {
  const response = await post({ expectedRevision: 0, name: 'Frozen test', seed: 'mechanisms' });
  assert.equal(response.status, 200); const { lens } = await response.json();
  assert.deepEqual(lens.revisions[0].groups.map(g => g.members.length), [40, 25]);
  const edit = { kind: 'merge', groupIds: lens.revisions[0].groups.map(g => g.id), label: 'Together' };
  const racers = await Promise.all([post({ expectedRevision: 1, edit }), post({ expectedRevision: 1, edit })]);
  assert.deepEqual(racers.map(r => r.status).sort(), [200, 409]);
  const loaded = await fetch(`${base}/api/expedition/lenses?runId=${runId}`).then(r => r.json());
  assert.equal(loaded.coverage.total, 65); assert.equal(loaded.lenses[0].revisions.at(-1).groups[0].members.length, 65);
  const member = loaded.lenses[0].members[0];
  const detail = await fetch(`${base}/api/expedition/runs?id=${runId}&candidateId=${member.candidateId}`).then(r => r.json());
  assert.match(detail.candidate.snapshot.body, /Complete text/);
  assert.equal((await fetch(`${base}/api/expedition/lenses?runId=${randomUUID()}`)).status, 404);
  const foreign = await fetch(`${base}/api/expedition/lenses`, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://example.invalid' }, body: JSON.stringify({ runId, id: lensId, expectedRevision: 2, edit: { kind: 'undo' } }) });
  assert.equal(foreign.status, 409);
  assert.deepEqual(store.get(runId), before);
  assert.equal(store.attempts(runId).length, 0);
  console.log(JSON.stringify({ completeMembers: 65, concurrentEdits: 'one accepted, one stale', detail: 'exact candidate', missingRun: 404, crossOrigin: 'rejected', generationCalls: 0, runUnchanged: true }));
} finally { store.close(); }
