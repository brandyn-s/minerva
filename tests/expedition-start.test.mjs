import test from 'node:test';
import assert from 'node:assert/strict';
import {loader} from './helpers/load-ts.mjs';
const load=loader(),{startConfig}=load('features/experiments/start.ts'),{chooseOperation}=load('features/experiments/runner.ts');
const settings={provider:'fixture',maxCalls:12,maxCostMicros:0,callReservationMicros:0};
const source={id:'a',revision:2,title:'Shared workshop',summary:'A community repair space',body:'Keep the existing building',contribution:''};
test('selection alone starts; direction and brief reach shared operations',()=>{
 const c=startConfig({id:crypto.randomUUID(),sources:[source],direction:'More abstract',brief:'Reuse the dead mall',constraints:['No demolition']},settings);
 assert.equal(c.goal,'Reuse the dead mall');assert.deepEqual(c.constraints,['No demolition']);assert.equal(c.maxCalls,12);
 const op=chooseOperation({...c,calls:0,active:[]},[]);assert.equal(op.kind,'wander');assert.equal(op.intent,'More abstract');assert.equal(op.sources[0].revision,2);
 assert.equal(startConfig({id:crypto.randomUUID(),sources:[source]},settings).direction,'');
});
test('multiple selected ideas seed Weave; blank unselected starts are rejected',()=>{
 const c=startConfig({id:crypto.randomUUID(),sources:[source,{...source,id:'b'}]},settings);assert.equal(chooseOperation({...c,calls:0,active:[]},[]).kind,'weave');
 assert.throws(()=>startConfig({id:crypto.randomUUID()},settings));
});

test('saved overall limit bounds server-selected call allocation',()=>{
 const c=startConfig({id:crypto.randomUUID(),sources:[source],limitMicros:1000000},{provider:'gateway',maxCalls:12,maxCostMicros:6000000,callReservationMicros:500000});assert.equal(c.maxCalls,2);assert.equal(c.maxCostMicros,1000000);
 assert.throws(()=>startConfig({id:crypto.randomUUID(),sources:[source],limitMicros:99999999},settings));
});
test('large source revisions remain whole while provider excerpts are bounded',()=>{
 const {planOperation}=load('features/experiments/operators.ts');
 const full={...source,body:'€'.repeat(30000),summary:'x'.repeat(6000)};
 const op={id:crypto.randomUUID(),version:1,kind:'weave',goal:'Explore',constraints:[],sources:Array.from({length:8},(_,i)=>({...full,id:'source-'+i})),exposure:Array.from({length:8},(_,i)=>({...full,id:'exposed-'+i})),intent:'',step:1,count:1};
 const plan=planOperation(op),sent=JSON.parse(plan.prompt);assert.ok(Buffer.byteLength(plan.prompt)<100000);assert.ok(sent.sources[0].omittedBytes>0);assert.equal(op.sources[0].body,full.body);assert.equal(sent.sources[0].revision,full.revision);
});
