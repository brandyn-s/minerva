import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {loader} from '../tests/helpers/load-ts.mjs';
const load=loader(),{PostgresStore}=load('features/experiments/postgres-store.ts'),{tick}=load('features/experiments/runner.ts'),{fixtureProvider}=load('features/experiments/fixture-provider.ts');
const store=new PostgresStore(process.env.EXPEDITION_DATABASE_URL),other=new PostgresStore(process.env.EXPEDITION_DATABASE_URL),ids=[];
const create=async(extra={})=>{const id=randomUUID();ids.push(id);return store.create({id,owner:'verification-'+id,goal:'Synthetic hosted storage verification',maxCalls:4,maxCostMicros:0,callReservationMicros:0,provider:'fixture',...extra});};
try{
 await store.initialize();
 const run=await create();let release,entered;const waiting=new Promise(r=>entered=r),blocked=new Promise(r=>release=r);const provider={name:'synthetic-delay',call:async(...args)=>{entered();await blocked;return fixtureProvider(1).call(...args);}};
 const first=tick(store,run.id,provider);await waiting;
 assert.equal(await tick(other,run.id,fixtureProvider(2)),false,'Concurrent worker must not reserve a second call');
 await other.control(run.id,'stop');release();await first;
 assert.equal(await store.count(run.id,'candidate'),0,'Stop rejects late results');assert.equal((await store.get(run.id)).calls,1);
 const resumed=await create();assert.equal((await store.create(resumed)).id,resumed.id,"Idempotent create survives JSONB key ordering");await tick(store,resumed.id,fixtureProvider(1));await other.control(resumed.id,'pause');assert.equal(await tick(store,resumed.id,fixtureProvider(2)),false);await other.control(resumed.id,'resume');
 while(await tick(other,resumed.id,fixtureProvider(3))){}
 assert.equal((await store.get(resumed.id)).calls,4);assert.equal(await store.count(resumed.id,'candidate'),2);assert.equal(await store.count(resumed.id,'assessment'),2);
 assert.equal((await store.page(resumed.id,'candidate',0,1)).more,true);
 await assert.rejects(()=>store.transaction(async()=>{const r=await store.get(resumed.id);r.goal='should roll back';await store.save(r);throw new Error('abort');}));
 assert.equal((await store.get(resumed.id)).goal,resumed.goal);
 const stagnant=await create({maxCalls:20});
 const repeated={name:'synthetic-repeat',call:async plan=>{
  const input=JSON.parse(plan.prompt);
  if(input.artifact)return fixtureProvider().call(plan);
  return {cards:[{title:'Renamed draft '+input.step,summary:'Central coordinator allocates resources',body:'Central coordinator allocates resources. Each allocation must fit remaining capacity.'}],note:'Fixture only',contributions:input.sources.map(()=> 'Same source')};
 }};
 for(let i=0;i<6;i++)assert.equal(await tick(i%2?other:store,stagnant.id,repeated),true);
 assert.equal(await tick(other,stagnant.id,repeated),false);
 assert.match((await store.get(stagnant.id)).reason,/^Stagnation:/);
 assert.equal((await store.get(stagnant.id)).calls,6);
 assert.equal(await store.count(stagnant.id,'candidate'),3);
 assert.equal(await store.count(stagnant.id,'assessment'),3);
 const stale=await create(),reserve=store.reserve.bind(store);store.reserve=async attempt=>{await other.transaction(async()=>{const r=await other.get(stale.id);r.maxCalls++;await other.save(r);});return reserve(attempt);};assert.equal(await tick(store,stale.id,fixtureProvider(1)),false);assert.equal((await store.get(stale.id)).calls,0,'Budget changes invalidate already planned work');store.reserve=reserve;
 console.log('PASS: PostgreSQL concurrent admission, cross-connection Stop/Pause/Resume, retained results, paging, rollback and stagnation across connections; synthetic provider only.');
}finally{
 for(const id of ids)for(const table of ['records','attempts','interventions','runs'])await store.query(`DELETE FROM expedition.${table} WHERE ${table==='runs'?'id':'run_id'}=$1`,[id]);
}
process.exit(0);
