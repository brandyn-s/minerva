// Synthetic provider only; optional Neon checks use a disposable schema.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { DatabaseSync } from 'node:sqlite';
import { loader } from '../tests/helpers/load-ts.mjs';
import { seedGroupWeave } from '../tests/helpers/group-weave-fixture.mjs';
const load = loader(), postgres = process.argv.includes('--postgres');
const { ExperimentStore } = load('features/experiments/store.ts'), { PostgresStore } = load('features/experiments/postgres-store.ts');
const { prepareGroupWeave, submitGroupWeave, groupWeaveProgress } = load('features/experiments/group-weave.ts');
const { tick } = load('features/experiments/runner.ts'), { fixtureProvider } = load('features/experiments/fixture-provider.ts');
if (postgres && !process.env.EXPEDITION_DATABASE_URL) throw new Error('Existing Expedition connection required');
const schema = 'group_weave_verify_' + randomUUID().replaceAll('-', '');
class IsolatedPostgresStore extends PostgresStore {
  query(sql, params) { return super.query(sql.replaceAll('expedition.', schema + '.').replaceAll('SCHEMA IF NOT EXISTS expedition', 'SCHEMA IF NOT EXISTS ' + schema), params); }
}
const dir = postgres ? undefined : mkdtempSync(tmpdir() + '/minerva-group-weave-stores-');
const store = postgres ? new IsolatedPostgresStore(process.env.EXPEDITION_DATABASE_URL) : new ExperimentStore(dir + '/runs.sqlite');
const other = postgres ? new IsolatedPostgresStore(process.env.EXPEDITION_DATABASE_URL) : new ExperimentStore(dir + '/runs.sqlite');
try {
  if (postgres) await store.initialize();
  const f = await seedGroupWeave(store), before = await store.get(f.id);
  async function legacyWrite() {
    return other.transaction(async () => {
      await other.query("SELECT set_config('minerva.selection_writer','reviewed-lens-v1',true)");
      const run = await other.get(f.id);
      await other.query('UPDATE expedition.runs SET value=$2 WHERE id=$1', [f.id, run]);
    });
  }
  if (postgres) await legacyWrite(); // Existing 2B runs remain writable by 2B code.
  const p = await prepareGroupWeave(store, f.id, f.lens.id, 2, f.choices), q = await prepareGroupWeave(store, f.id, f.lens.id, 2, f.choices);
  const save = store.save.bind(store); store.save = async () => { throw new Error('synthetic submit rollback'); };
  await assert.rejects(submitGroupWeave(store, f.id, p.id, p.draft.weave), /synthetic submit rollback/); store.save = save;
  assert.equal(await store.record(`group-weave:${p.id}`), undefined);
  if (postgres) {
    const raced = await Promise.allSettled([submitGroupWeave(store, f.id, p.id, p.draft.weave), submitGroupWeave(other, f.id, q.id, q.draft.weave)]);
    assert.equal(raced.filter(r => r.status === 'fulfilled').length, 1); assert.equal(raced.filter(r => r.status === 'rejected').length, 1);
  } else { await submitGroupWeave(store, f.id, p.id, p.draft.weave); await assert.rejects(submitGroupWeave(other, f.id, q.id, q.draft.weave), /current group Weave/); }
  const preview = (await store.get(f.id)).groupWeave === p.id ? p : q;
  await submitGroupWeave(other, f.id, preview.id, preview.draft.weave);
  if (postgres) await assert.rejects(legacyWrite(), /current group Weave worker/);
  else {
    const legacy = new DatabaseSync(dir + '/runs.sqlite'); legacy.function('minerva_selection_writer', () => 'reviewed-lens-v1');
    try { assert.throws(() => legacy.prepare('UPDATE runs SET value=value WHERE id=?').run(f.id), /minerva_group_weave_writer/); } finally { legacy.close(); }
  }
  let enter, release; const entered = new Promise(r => enter = r), barrier = new Promise(r => release = r);
  const generation = tick(store, f.id, { name: 'delayed fixture', call: async (...args) => { enter(); await barrier; return fixtureProvider(1).call(...args); } }); await entered;
  assert.equal(await tick(other, f.id, fixtureProvider(2)), false);
  await assert.rejects(Promise.resolve().then(() => other.control(f.id, 'resume')), /bounded group Weave/);
  release(); await generation;
  await tick(other, f.id, fixtureProvider(3)); assert.equal(await tick(store, f.id, fixtureProvider(4)), false);
  const progress = await groupWeaveProgress(store, f.id, preview.id), run = await store.get(f.id);
  assert.equal(progress.status, 'completed'); assert.equal(progress.calls, 2);
  assert.deepEqual(progress.candidate.parents, f.choices.map(c => c.candidateId));
  assert.equal(progress.candidate.weaveMappings.length, 2); assert.equal(run.status, 'paused'); assert.equal(run.groupWeave, undefined);
  assert.equal(run.maxCalls, before.maxCalls); assert.equal(run.maxCostMicros, before.maxCostMicros);
  assert.equal((await store.last(f.id, 'reading')).selection.configurationId, before.selection.id);
  if (postgres) await legacyWrite();
  console.log(JSON.stringify({ adapter: postgres ? 'Neon/PostgreSQL' : 'SQLite', corpus: 65, calls: 2, provider: 'synthetic only', status: run.status, concurrentSubmission: 'one accepted', workerRace: 'one reserved', rollback: 'atomic', legacyWriter: 'blocked only during bounded Weave', exactParentsAndContributions: true }));
} finally {
  if (postgres) await store.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
  store.close(); other.close(); if (dir) rmSync(dir, { recursive: true, force: true });
}
process.exit(0);
