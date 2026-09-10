import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';
import { loader } from './helpers/load-ts.mjs';
const load=loader(), {ExperimentStore}=load('features/experiments/store.ts');
const {fixtureSave,mergeAtlas,atlasSaveSchema}=load('features/atlas/local-state.ts');
const {cardEdit,reviseCard,revertCard}=load('features/atlas/card-revisions.ts');
test('identity merge retains extensions, divergent forks and unrelated equal text',async()=>{
 const a=fixtureSave(),b=structuredClone(a),orig=a.thoughts[1];
 b.thoughts[1]=reviseCard(orig,{...cardEdit(orig),contribution:'New attribution'});
 assert.equal(b.thoughts[1].revisions.at(-1).contribution,'New attribution');
 const extended=await mergeAtlas(a,b);assert.equal(extended.added,0);assert.equal(extended.updated,1);assert.equal(extended.save.thoughts[1].revision,2);
 assert.equal((await mergeAtlas(extended.save,a)).added,0);
 assert.equal(revertCard(b.thoughts[1],1).contribution,orig.contribution);
 const conflict=structuredClone(a);conflict.thoughts[1]=reviseCard(orig,{...cardEdit(orig),body:'Other path'});
 const forked=await mergeAtlas(extended.save,conflict);assert.equal(forked.added,1);assert.equal((await mergeAtlas(forked.save,conflict)).added,0);
 const legacy=structuredClone(a);for(const c of legacy.thoughts)for(const r of c.revisions)delete r.contribution;
 assert.equal(atlasSaveSchema.parse(legacy).thoughts[1].revisions[0].contribution,undefined);
 const other=structuredClone(a);const copy=structuredClone(orig);copy.id='unrelated';other.thoughts.push(copy);other.positions.Lineage.unrelated={x:0,y:0};
 assert.equal((await mergeAtlas(a,other)).added,1);
});
test('durable transactions preserve identity and reserve budget atomically across connections',()=>{
 const dir=mkdtempSync(tmpdir()+'/minerva-db-');const path=dir+'/runs.sqlite';let s=new ExperimentStore(path);const second=new ExperimentStore(path);
 try{
  const id=randomUUID(),config={id,goal:'Explore',constraints:[],initial:[],policy:'independent',maxCalls:2,maxCostMicros:10,callReservationMicros:5,capacity:4,seed:1,provider:'fixture',mode:'explore'};
  s.create(config);s.create(config);assert.throws(()=>s.create({...config,goal:'Changed'}));
  const op={id:randomUUID(),version:1,kind:'root',goal:'Explore',constraints:[],sources:[],exposure:[],intent:'',step:1,count:1,runId:id};
  const a={id:randomUUID(),runId:id,sequence:1,stage:'generation',operation:op,status:'reserved',owner:'one',leaseUntil:Date.now()+10000,reservedMicros:5,cost:'reserved-upper-bound',at:new Date().toISOString()};
  assert.equal(s.reserve(a),true);assert.equal(second.reserve({...a,id:randomUUID()}),false);
  assert.equal(second.finish(a.id,'wrong'),false);assert.equal(s.finish(a.id,'one'),true);assert.equal(s.finish(a.id,'one'),false);
  s.put('assessment','assessment-1',id,{judgment:'unclear'});assert.throws(()=>s.put('assessment','assessment-1',id,{judgment:'supported'}));s.put('assessment','assessment-2',id,{judgment:'supported'});
  s.close();s=new ExperimentStore(path);assert.equal(s.get(id).calls,1);assert.equal(s.all(id,'assessment').length,2);
  assert.equal(s.reserve({...a,id:randomUUID()}),false,"Stale plan sequence must be rejected");
  const b={...a,sequence:2,id:randomUUID(),operation:{...op,id:randomUUID()},leaseUntil:1};assert.equal(s.reserve(b),true);s.recover(Date.now());assert.equal(s.attempt(b.id).status,'uncertain');assert.equal(s.get(id).reservedMicros,10);
  assert.equal(s.reserve({...a,sequence:3,id:randomUUID()}),false);assert.equal(s.get(id).status,'completed');
 }finally{s.close();second.close();rmSync(dir,{recursive:true,force:true});}
});
