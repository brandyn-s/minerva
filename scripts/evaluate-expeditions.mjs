// Deterministic integration comparison. These results do not measure model efficacy.
import { loader } from '../tests/helpers/load-ts.mjs';
import {mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';
import {randomUUID,createHash} from 'node:crypto';
import {tmpdir} from 'node:os';
const load=loader(),{ExperimentStore}=load('features/experiments/store.ts'),{tick}=load('features/experiments/runner.ts'),{fixtureProvider}=load('features/experiments/fixture-provider.ts'),{corpus,mechanismKey}=load('features/experiments/analysis.ts');
const protocol={version:1,provider:'synthetic-fixture-v1',policies:['independent','scorebook-baseline','diversity'],seeds:{development:[1,2,3],heldOut:[11,12,13]},maxCalls:24,capacity:8,goal:'Allocate scarce shared resources',constraints:['Retain total capacity'],assessment:'known-truth synthetic mechanism descriptors',scorebookBaseline:'Approximation using declared behavior coordinates and targeted variation; not exact historical replay',limitations:['No live efficacy result','The synthetic assessor is an oracle fixture, not evidence of LLM reliability','No tuning against held-out results']};
const directory=mkdtempSync(tmpdir()+'/minerva-evaluation-'),store=new ExperimentStore(directory+'/runs.sqlite'),results=[];
try{
 for(const [split,seeds] of Object.entries(protocol.seeds))for(const seed of seeds)for(const policy of protocol.policies){
  const run=store.create({id:randomUUID(),goal:protocol.goal,constraints:protocol.constraints,initial:[],policy,maxCalls:protocol.maxCalls,maxCostMicros:0,callReservationMicros:0,capacity:protocol.capacity,seed,provider:'fixture',mode:'explore'});
  let steps=0;while(await tick(store,run.id,fixtureProvider(seed+steps))){steps++;if(steps>protocol.maxCalls+1)throw new Error('Unbounded execution');}
  const candidates=corpus(store,run.id),assessed=candidates.filter(c=>c.assessment),mechanisms=new Set(assessed.map(mechanismKey));
  results.push({runId:run.id,split,seed,policy,calls:store.get(run.id).calls,candidates:candidates.length,assessed:assessed.length,supportedMechanisms:mechanisms.size,retained:store.get(run.id).active.length,constraintViolations:assessed.filter(c=>c.assessment.constraints==='violated').length,unassessed:candidates.length-assessed.length,failedAttempts:store.attempts(run.id).filter(a=>a.status!=='committed').length,syntheticCostMicros:0, evidence:{run:store.get(run.id),attempts:store.attempts(run.id),operations:store.all(run.id,'operation'),candidates:store.all(run.id,'candidate'),assessments:store.all(run.id,'assessment'),readings:store.all(run.id,'reading'),interventions:store.interventions(run.id)}});
 }
 mkdirSync('evaluation-artifacts/transition',{recursive:true});const data={protocol,protocolSha256:createHash('sha256').update(JSON.stringify(protocol)).digest('hex'),results};writeFileSync('evaluation-artifacts/transition/comparison.json',JSON.stringify(data,null,2));console.log(JSON.stringify({runs:results.length,calls:results.reduce((n,r)=>n+r.calls,0),allWithinBudget:results.every(r=>r.calls===protocol.maxCalls),output:'evaluation-artifacts/transition/comparison.json',claim:'software integration only'}));
}finally{store.close();rmSync(directory,{recursive:true,force:true});}
