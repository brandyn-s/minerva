import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {loader} from '../tests/helpers/load-ts.mjs';
const {ExperimentStore}=loader()('features/experiments/store.ts');
const dir=mkdtempSync(tmpdir()+'/minerva-process-'),path=dir+'/db',ids=[randomUUID(),randomUUID()];
let store=new ExperimentStore(path);for(const id of ids)store.create({id,goal:'Restart test',maxCalls:2,maxCostMicros:0,callReservationMicros:0});store.close();
try{
 for(let step=1;step<=3;step++){
  const result=spawnSync(process.execPath,['scripts/expedition-worker.mjs','--once'],{env:{...process.env,MINERVA_EXPERIMENT_DB:path},encoding:'utf8',timeout:30000});assert.equal(result.status,0,result.stderr);
  store=new ExperimentStore(path);for(const id of ids){assert.equal(store.get(id).calls,Math.min(step,2));if(step===3){assert.equal(store.get(id).status,'completed');assert.equal(store.count(id,'candidate'),1);assert.equal(store.count(id,'assessment'),1);}}store.close();
 }
 console.log('PASS: three independent worker processes resume two durable runs without nested transactions or duplicate commits.');
}finally{rmSync(dir,{recursive:true,force:true});}
