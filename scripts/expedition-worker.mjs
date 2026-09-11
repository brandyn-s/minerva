// Node 24 local worker; intentionally separate from request/browser lifetimes.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve, dirname } from 'node:path';
import ts from 'typescript';
const requirePackage=createRequire(import.meta.url),cache=new Map();
function load(path){
 path=resolve(path);if(cache.has(path))return cache.get(path);
 const exports={};cache.set(path,exports);
 const code=ts.transpileModule(readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 new Function('exports','require',code)(exports,name=>name.startsWith('.')?load(resolve(dirname(path),name.endsWith('.ts')?name:name+'.ts')):requirePackage(name));return exports;
}
if(!process.env.MINERVA_EXPERIMENT_DB||process.env.VERCEL)throw new Error('Set MINERVA_EXPERIMENT_DB to a private durable local path. Serverless filesystems are unsupported.');
const {ExperimentStore}=load('features/experiments/store.ts'),{tick}=load('features/experiments/runner.ts'),{fixtureProvider}=load('features/experiments/fixture-provider.ts');
const store=new ExperimentStore(process.env.MINERVA_EXPERIMENT_DB);
let running=true;process.on('SIGTERM',()=>{running=false;});process.on('SIGINT',()=>{running=false;});
try{
 do{
  const runs=store.runnable();
  // DatabaseSync has one transaction context. Overlapping async ticks on this
  // connection can nest transactions; use separate worker processes for parallelism.
  for(const run of runs.slice(0,4)){
   if(run.provider==='gateway'&&(process.env.MINERVA_EXPERIMENT_LIVE!=='1'||!(Number(process.env.MINERVA_GATEWAY_CALL_CEILING_MICROS)>0)||run.callReservationMicros<Number(process.env.MINERVA_GATEWAY_CALL_CEILING_MICROS))){store.control(run.id,'pause');console.error('Paused live run: enable live calls and configure a verified conservative per-call ceiling covered by the run allowance');continue;}
   const provider=run.provider==='fixture'?fixtureProvider(run.seed+run.calls):load('features/experiments/gateway.ts').gatewayProvider;
   await tick(store,run.id,provider);
  }
  if(process.argv.includes('--once'))break;
  if(running)await new Promise(r=>setTimeout(r,300));
 }while(running);
}finally{store.close();}
