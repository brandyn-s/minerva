import { randomUUID } from "node:crypto";
import { z } from "zod";
import { localStore } from "@/features/experiments/runtime";
import { runConfigSchema, type Reading, type Candidate, type Operation } from "@/features/experiments/contracts";
import { analyze, readingPreview } from "@/features/experiments/analysis";
import { proposeIntervention } from "@/features/experiments/runner";
import { probe, probeSchema } from "@/features/experiments/probe";
export const runtime="nodejs";
export async function GET(request:Request){
 let store;
 try{
  store=localStore(request);const url=new URL(request.url),id=url.searchParams.get("id");
  if(!id)return Response.json({configured:true,runs:store.runs().map(({id,goal,status,calls,maxCalls,createdAt,provider})=>({id,goal,status,calls,maxCalls,createdAt,provider})),coverage:"Most recent 100 runs"});
  const run=store.get(id);if(!run)return Response.json({error:"Run unavailable"},{status:404});
  const candidateId=url.searchParams.get("candidateId");
  if(candidateId){const candidate=store.scopedRecord<Candidate>(id,candidateId);if(!candidate)return Response.json({error:"Candidate unavailable"},{status:404});return Response.json({candidate,operation:store.scopedRecord(id,candidate.operationId),assessments:store.assessments(id,candidateId),coverage:"At most five latest assessments"});}
  const kind=z.enum(["candidate","assessment","operation","reading"]).parse(url.searchParams.get("kind")??"candidate");
  const after=z.coerce.number().int().nonnegative().parse(url.searchParams.get("after")??0);
  const limit=z.coerce.number().int().min(1).max(100).parse(url.searchParams.get("limit")??30);
  const query=z.string().max(200).parse(url.searchParams.get("q")??"");
  const page=query?store.search(id,query,after,limit):store.page(id,kind,after,limit);
  const projected=kind==="reading"?page.items.map(item=>readingPreview(item as Reading)):kind==="operation"?page.items.map(item=>{const o=item as Operation;return {id:o.id,kind:o.kind,step:o.step,strategy:o.strategy,sources:o.sources.map(s=>({id:s.id,revision:s.revision})),exposure:o.exposure.map(s=>({id:s.id,revision:s.revision}))};}):kind==="candidate"?page.items.map(item=>{const c=item as Candidate;return {...c,rootIds:undefined,snapshot:{id:c.snapshot.id,revision:c.snapshot.revision,title:c.snapshot.title,summary:c.snapshot.summary}};}):page.items;
  const { initial, ...runView }=run;
  return Response.json({run:runView,initialCount:initial.length,...page,items:projected,interventions:store.interventions(id).slice(-30),readings:[readingPreview(store.last<Reading>(id,"reading"))].filter(Boolean),coverage:{kind,limit,after,truncated:page.more,omitted:["run.initial","page bodies and full operation context; use candidateId for exact detail"],candidateCount:store.count(id,"candidate")}});
 }catch(error){return Response.json({configured:false,error:error instanceof Error?error.message:String(error)},{status:503});}finally{store?.close();}
}
const commandSchema=z.discriminatedUnion("action",[
 z.object({action:z.literal("reassess"),id:z.string().uuid(),candidateId:z.string().uuid(),reason:z.string().min(1).max(2000),additionalCalls:z.literal(1)}),
 z.object({action:z.literal("probe"),input:probeSchema}),
 z.object({action:z.literal("create"),config:runConfigSchema}),
 z.object({action:z.enum(["pause","resume","stop","analyze"]),id:z.string().uuid()}),
 z.object({action:z.literal("intervene"),id:z.string().uuid(),readingId:z.string().uuid(),candidateId:z.string().uuid(),challenge:z.string().min(1).max(2000),intent:z.string().min(1).max(2000),operationKind:z.enum(["wander","develop"]),additionalCalls:z.literal(2)}),
]);
export async function POST(request:Request){
 let store;
 try{
  store=localStore(request);const command=commandSchema.parse(await request.json());
  if(command.action==="probe"){const result=probe(store,command.input);return Response.json({...result,reading:readingPreview(analyze(store,command.input.runId))});}
  if(command.action==="create"){
   if(command.config.provider==="gateway"&&process.env.MINERVA_EXPERIMENT_LIVE!=="1")throw new Error("Live worker calls are not enabled");
   return Response.json(store.create(command.config));
  }
  if(command.action==="analyze")return Response.json(readingPreview(analyze(store,command.id)));
  if(command.action==="reassess"){
   const s=store;return Response.json(s.transaction(()=>{const run=s.get(command.id);if(!run||!s.scopedRecord(command.id,command.candidateId))throw new Error("Candidate unavailable");const q={id:randomUUID(),candidateId:command.candidateId,reason:command.reason};s.put("assessment-request",q.id,run.id,q);run.maxCalls++;run.maxCostMicros+=run.callReservationMicros;run.status="running";run.execution="worker";run.reason=undefined;s.save(run);return q;}));
  }
  if(command.action==="intervene"){
   const s=store;
   return Response.json(s.transaction(()=>{
    const run=s.get(command.id);if(!run)throw new Error("Run unavailable");
    const value=proposeIntervention(s,{runId:command.id,readingId:command.readingId,candidateId:command.candidateId,challenge:command.challenge,intent:command.intent,operationKind:command.operationKind});
    // Explicitly authorized in the command, never an implicit success redefinition.
    run.maxCalls+=command.additionalCalls;run.maxCostMicros+=command.additionalCalls*run.callReservationMicros;run.status="running";run.reason=undefined;s.save(run);return value;
   }));
  }
  return Response.json(store.control(command.id,command.action));
 }catch(error){return Response.json({error:error instanceof Error?error.message:String(error)},{status:400});}finally{store?.close();}
}
