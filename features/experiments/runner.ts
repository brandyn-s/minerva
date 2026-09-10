import { randomUUID } from "node:crypto";
import { behaviorSpace } from "./contracts";
import type { Run, Operation, Candidate, Assessment, Attempt, Intervention } from "./contracts";
import { executeOperation, assess, planOperation, planAssessment, type Provider } from "./operators";
import { ExperimentStore } from "./store";
import { corpus, selectPopulation, analyze } from "./analysis";

export function chooseOperation(run:Run,candidates:Candidate[]):Operation {
  const selected=candidates.filter(c=>run.active.includes(c.id));
  const iteration=Math.floor(run.calls/2), index=(run.seed+iteration) % Math.max(1,selected.length);
  const independent=run.policy==="independent"||iteration%4===0;
  const parent=selected[index]?.snapshot??run.initial[0];
  const kind=independent||!parent?"root":selected.length>=2&&iteration%3===0?"weave":iteration%3===2?"develop":"wander";
  const sources=kind==="root"?[]:kind==="weave"?[selected[index].snapshot,selected[(index+Math.max(1,Math.floor(selected.length/2)))%selected.length].snapshot]:[parent!];
  const axes=Object.keys(behaviorSpace) as (keyof typeof behaviorSpace)[];
  const axis=axes[iteration%axes.length],values=behaviorSpace[axis];
  const targeted=run.policy==="scorebook-baseline"?`Explore a different declared behavior: ${axis} = ${values[(run.seed+iteration)%values.length]}. Preserve the goal.`:undefined;
  return {id:randomUUID(),version:1,kind,goal:run.goal,constraints:run.constraints,sources,exposure:[],intent:targeted??(kind==="develop"?"Develop a concrete test while preserving the goal":kind==="weave"?"Combine the distinct source mechanisms": "Explore a different operative mechanism"),step:iteration+1,count:1,runId:run.id,strategy:{policy:run.policy,iteration,reason:kind==="root"?"Scheduled independent root; no population context":`Select ${kind} from retained candidates in stable seeded order`}};
}
function candidateFrom(op:Operation, result:Awaited<ReturnType<typeof executeOperation>>, candidates:Candidate[]):Candidate {
  const id=randomUUID();
  const parents=op.sources.map(s=>candidates.findLast(c=>c.snapshot.id===s.id&&c.snapshot.revision===s.revision)?.id??`${s.id}@${s.revision}`);
  const rootIds=parents.length?[...new Set(parents.flatMap(p=>candidates.find(c=>c.id===p)?.rootIds??[p]))]:[id];
  return {id,snapshot:{...result.cards[0],id:op.kind==="develop"?op.sources[0].id:id,revision:op.kind==="develop"?op.sources[0].revision+1:1},operationId:op.id,parents,exposure:op.exposure.map(s=>`${s.id}@${s.revision}`),rootIds,admission:"pending",at:new Date().toISOString()};
}
export function proposeIntervention(store:ExperimentStore,input:{runId:string;readingId:string;candidateId:string;challenge:string;intent:string;operationKind:"wander"|"develop"}):Intervention {
  const run=store.get(input.runId), candidate=store.record<Candidate>(input.candidateId);
  const reading=store.record<{runId:string;groups:{candidates:string[]}[]}>(input.readingId);
  if(!run||!candidate||!reading||reading.runId!==run.id||!reading.groups.some(g=>g.candidates.includes(candidate.id)))throw new Error("Intervention sources unavailable");
  const result:Intervention={...input,id:randomUUID(),allowance:2,status:"proposed"};store.intervention(result);return result;
}
export async function tick(store:ExperimentStore,runId:string,provider:Provider,owner=randomUUID()):Promise<boolean> {
  store.recover(Date.now());const run=store.get(runId);if(!run||run.status!=="running")return false;
  const candidates=corpus(store,run.id), attempts=store.attempts(run.id);
  if(attempts.length>=3&&attempts.slice(-3).every(a=>["failed","uncertain"].includes(a.status))){store.transaction(()=>{const r=store.get(run.id)!;r.status="completed";r.reason="Three consecutive failed or uncertain attempts; partial evidence retained";store.save(r);});return false;}
  const reassessment=store.all<{id:string;candidateId:string;reason:string}>(run.id,"assessment-request").find(q=>!attempts.some(a=>a.assessmentRequestId===q.id));
  const pending=reassessment?candidates.find(c=>c.id===reassessment.candidateId):candidates.find(c=>!c.assessment&&!attempts.some(a=>a.candidateId===c.id&&a.stage==="assessment"));
  const intervention=store.interventions(run.id).find(i=>i.status==="proposed");
  let op:Operation;
  if(pending)op=store.record<Operation>(pending.operationId)!;
  else if(intervention){
    const candidate=store.record<Candidate>(intervention.candidateId)!;
    op={id:randomUUID(),version:1,kind:intervention.operationKind,goal:run.goal,constraints:run.constraints,sources:[candidate.snapshot],exposure:[],intent:intervention.intent,step:1,count:1,runId:run.id};
  }else op=chooseOperation(run,candidates);
  const manifest=pending?planAssessment(pending,op):planOperation(op);
  const attempt:Attempt={assessmentRequestId:reassessment?.id,id:randomUUID(),runId:run.id,sequence:run.calls+1,stage:pending?"assessment":"generation",candidateId:pending?.id,operation:op,status:"reserved",owner,leaseUntil:Date.now()+120000,reservedMicros:run.callReservationMicros,cost:"reserved-upper-bound",manifest,at:new Date().toISOString()};
  if(!store.reserve(attempt))return false;
  if(intervention&&!pending){intervention.status="running";intervention.operationId=op.id;store.intervention(intervention);}
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),90000);
  // Observe Stop independently of the initiating browser. Pause admits completion, no further dispatch.
  const cancellation=setInterval(()=>{if(store.get(run.id)?.status==="stopped")controller.abort();},100);
  try{
    if(pending){
      const judgment=await assess(pending,op,provider,controller.signal,usage=>store.observeUsage(attempt.id,owner,usage));
      const assessment:Assessment={...judgment,id:randomUUID(),candidateId:pending.id,version:1,level:"textual",assessor:provider.name,at:new Date().toISOString(),sourceOperation:op.id};
      if(store.finish(attempt.id,owner,undefined,assessment)){
        store.transaction(()=>{const current=store.get(run.id)!;current.active=selectPopulation(corpus(store,run.id),current);store.save(current);});
        const reading=analyze(store,run.id);
        for(const i of store.interventions(run.id).filter(i=>i.operationId===op.id)){
          i.status="completed";i.resultId=pending.id;i.updatedReadingId=reading.id;
          i.outcome=judgment.changed==="yes"&&judgment.constraints==="preserved"&&judgment.actionability==="supported"?"Textually supported mechanism change preserving stated constraints; external validation pending":"No supported escape under the stated assessment";
          store.intervention(i);
        }
      }
    }else{
      const result=await executeOperation(op,provider,controller.signal,usage=>store.observeUsage(attempt.id,owner,usage));
      const candidate=candidateFrom(op,result,candidates);
      store.finish(attempt.id,owner,candidate);
    }
  }catch(error){
    store.finish(attempt.id,owner,undefined,undefined,error instanceof Error?error.message:String(error));
    for(const i of store.interventions(run.id).filter(i=>i.operationId===op.id)){i.status="inconclusive";i.outcome="Operation or assessment failed; recorded evidence retained";store.intervention(i);}
  }finally{clearTimeout(timer);clearInterval(cancellation);}
  return true;
}
