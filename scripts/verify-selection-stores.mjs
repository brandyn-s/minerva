// Synthetic records only. Never dispatch a worker or call a live provider.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { DatabaseSync } from 'node:sqlite';
import { loader } from '../tests/helpers/load-ts.mjs';
const load = loader(), postgres = process.argv.includes('--postgres');
const { ExperimentStore } = load('features/experiments/store.ts'), { PostgresStore } = load('features/experiments/postgres-store.ts');
const { previewSelection, applySelection } = load('features/experiments/selection-service.ts');
const { saveRunLens } = load('features/experiments/lenses.ts');
const { tick } = load('features/experiments/runner.ts'), { fixtureProvider } = load('features/experiments/fixture-provider.ts');
const { analyze, corpus } = load('features/experiments/analysis.ts');
if (postgres && !process.env.EXPEDITION_DATABASE_URL) throw new Error('The existing Expedition connection is required');
const dir = postgres ? undefined : mkdtempSync(tmpdir() + '/minerva-selection-stores-');
// Exercise the exact adapter SQL in a disposable schema on the existing Neon
// resource. Never install test triggers or fixtures in the application's schema.
const schema = 'selection_verify_' + randomUUID().replaceAll('-', '');
class IsolatedPostgresStore extends PostgresStore {
  query(sql, params) { return super.query(sql.replaceAll('expedition.', schema + '.').replaceAll('SCHEMA IF NOT EXISTS expedition', 'SCHEMA IF NOT EXISTS ' + schema), params); }
}
const store = postgres ? new IsolatedPostgresStore(process.env.EXPEDITION_DATABASE_URL) : new ExperimentStore(dir + '/runs.sqlite');
const other = postgres ? new IsolatedPostgresStore(process.env.EXPEDITION_DATABASE_URL) : new ExperimentStore(dir + '/runs.sqlite');
const id = randomUUID(), at = new Date().toISOString();
try {
  if (postgres) await store.initialize();
  await store.create({ id, owner: `selection-verification-${id}`, goal: 'Synthetic selection verification', provider: 'fixture', execution: 'manual', maxCalls: 12, maxCostMicros: 0, callReservationMicros: 0, capacity: 3 });
  const candidates = [];
  for (let n = 0; n < 65; n++) {
    const candidateId = randomUUID(), operationId = randomUUID(); candidates.push(candidateId);
    await store.put('operation', operationId, id, { id: operationId, version: 1, kind: 'root', goal: 'Synthetic selection verification', constraints: [], sources: [], exposure: [], intent: '', step: 1, count: 1 });
    await store.put('candidate', candidateId, id, { id: candidateId, snapshot: { id: candidateId, revision: 1, title: `Fixture ${n}`, summary: 'A shared queue', body: 'A shared queue coordinates resources.' }, operationId, parents: [], exposure: [], rootIds: [candidateId], admission: 'eligible', at });
    await store.put('assessment', `assessment-${candidateId}`, id, { id: `assessment-${candidateId}`, candidateId, mechanism: `Mechanism ${n % 5}`, constraints: 'preserved', actionability: 'supported', changed: 'yes', evidence: 'shared queue', explanation: 'fixture', version: 1, level: 'textual', at, sourceOperation: operationId, assessor: 'fixture' });
  }
  await store.control(id, 'pause');
  let lens = await saveRunLens(store, id, { id: randomUUID(), expectedRevision: 0, name: 'Coordination', seed: 'mechanisms' });
  lens = await saveRunLens(store, id, { id: lens.id, expectedRevision: 1, edit: { kind: 'review' } });
  const p = await previewSelection(store, id, lens.id, 2, [candidates[0]]), q = await previewSelection(store, id, lens.id, 2, []);
  assert.equal(p.candidates.length, 65);
  if (postgres) {
    await store.query('DROP TRIGGER selection_writer ON expedition.runs');
    await assert.rejects(applySelection(store, id, p.id), /guard must be installed/);
    assert.equal((await store.get(id)).selection, undefined);
    await store.installSelectionGuard();
  }
  // SQLite's synchronous busy wait cannot overlap two async transactions in one
  // JS event loop; its cross-process lock is covered by the real HTTP verifier.
  if (postgres) {
    const raced = await Promise.allSettled([applySelection(store, id, p.id), applySelection(other, id, q.id)]);
    assert.equal(raced.filter(r => r.status === 'fulfilled').length, 1);
    assert.equal(raced.filter(r => r.status === 'rejected').length, 1);
  } else { await applySelection(store, id, p.id); await assert.rejects(applySelection(other, id, q.id), /stale/); }
  const appliedRun = await store.get(id); assert.equal(appliedRun.status, 'paused'); assert.equal(appliedRun.calls, 0);
  const currentPreview = appliedRun.selection.id === p.configuration.id ? p : q;
  assert.deepEqual(appliedRun.active, currentPreview.decision.active);
  await store.control(id, 'resume');
  // Simulate the write performed by a pre-selection worker on its own connection.
  const beforeLegacy = await store.get(id);
  if (postgres) await assert.rejects(other.query('UPDATE expedition.runs SET value=$2 WHERE id=$1', [id, { ...beforeLegacy, calls: beforeLegacy.calls + 1 }]), /current selection worker/);
  else {
    const legacy = new DatabaseSync(dir + '/runs.sqlite');
    try { assert.throws(() => legacy.prepare('UPDATE runs SET value=? WHERE id=?').run(JSON.stringify({ ...beforeLegacy, calls: beforeLegacy.calls + 1 }), id), /minerva_selection_writer/); } finally { legacy.close(); }
  }
  assert.deepEqual(await store.get(id), beforeLegacy);
  await applySelection(other, id, currentPreview.id); assert.equal((await store.get(id)).status, 'running', 'Idempotent replay must not pause a resumed run');
  let enter, release; const entered = new Promise(r => enter = r), blocked = new Promise(r => release = r);
  const delayed = { name: 'fixture-delay', call: async (...args) => { enter(); await blocked; return fixtureProvider(1).call(...args); } };
  const first = tick(store, id, delayed); await entered;
  assert.equal(await tick(other, id, fixtureProvider(2)), false);
  await other.control(id, 'pause');
  await assert.rejects(previewSelection(other, id, lens.id, 2, []), /in-flight/);
  release(); await first;
  const generated = (await corpus(store, id)).at(-1), operation = await store.record(generated.operationId);
  assert.equal(operation.selection.configurationId, appliedRun.selection.id);
  assert.deepEqual(generated.parents, operation.selection.parentIds);
  const later = await previewSelection(store, id, lens.id, 2, []);
  // Failure after writing the configuration must roll back the entire application.
  const put = store.put.bind(store); store.put = async (kind, ...args) => { if (kind === 'selection-application') throw new Error('synthetic rollback'); return put(kind, ...args); };
  await assert.rejects(applySelection(store, id, later.id), /synthetic rollback/); store.put = put;
  assert.equal(await store.record(later.configuration.id), undefined);
  assert.equal((await store.get(id)).selection.id, appliedRun.selection.id);
  await store.control(id, 'resume');
  const reserve = store.reserve.bind(store);
  store.reserve = async attempt => { await other.control(id, 'pause'); await other.control(id, 'resume'); return reserve(attempt); };
  assert.equal(await tick(store, id, fixtureProvider(3)), false, 'A worker planned before a control change must not reserve'); store.reserve = reserve;
  await tick(store, id, fixtureProvider(4));
  const reading = await analyze(store, id);
  assert.equal(reading.selection.configurationId, appliedRun.selection.id);
  assert.ok(reading.groups.find(g => g.candidates.includes(generated.id)).status === 'provisional group');
  console.log(JSON.stringify({ adapter: postgres ? 'PostgreSQL' : 'SQLite', completeCorpus: 65, apply: 'matches preview and stays paused', concurrency: 'serialized', rollback: 'atomic', staleWorker: 'rejected', legacyWriter: 'rejected before reserving a call', exactParents: 'retained', reading: 'uses applied lens', liveModelCalls: 0 }));
} finally {
  if (postgres) await store.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
  await store.close(); await other.close(); if (dir) rmSync(dir, { recursive: true, force: true });
}
process.exit(0);
