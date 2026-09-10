import { randomUUID } from "node:crypto";
import { operationSchema, snapshotSchema, type Operation, type RunConfig, type Attempt, type Candidate } from "./contracts";
import { executeOperation, planOperation } from "./operators";
import { gatewayProvider } from "./gateway";
import { localStore } from "./runtime";

export async function directOperation(raw: Omit<Operation, "id" | "version">, signal: AbortSignal) {
  const op = operationSchema.parse({ ...raw, id: randomUUID(), version: 1 });
  const manifest=planOperation(op),store=process.env.MINERVA_EXPERIMENT_DB?localStore():undefined;
  let attempt:Attempt|undefined;
  try{
    if(store){
      const allowance=Number(process.env.MINERVA_DIRECT_CALL_ALLOWANCE_MICROS??0),id=randomUUID();
      const config={id,goal:op.goal,constraints:op.constraints,initial:op.sources,policy:"independent",maxCalls:2,maxCostMicros:allowance,callReservationMicros:allowance,capacity:2,seed:1,provider:"gateway",mode:"goal",execution:"manual"} as RunConfig;
      store.create(config);op.runId=id;
      attempt={id:randomUUID(),runId:id,sequence:1,stage:"generation",operation:op,status:"reserved",owner:randomUUID(),leaseUntil:Date.now()+120000,reservedMicros:allowance,cost:"reserved-upper-bound",manifest,at:new Date().toISOString()};
      if(!store.reserve(attempt))throw new Error("Direct operation allowance unavailable");
    }
    const output = await executeOperation(op, gatewayProvider, signal, usage=>{if(store&&attempt)store.observeUsage(attempt.id,attempt.owner,usage);});
    const at=new Date().toISOString();
    if(store&&attempt){
      const candidates:Candidate[]=output.cards.map(card=>{const id=randomUUID();return {id,snapshot:{...card,id:op.kind==="develop"?op.sources[0].id:id,revision:op.kind==="develop"?op.sources[0].revision+1:1},operationId:op.id,parents:op.sources.map(s=>`${s.id}@${s.revision}`),exposure:op.exposure.map(s=>`${s.id}@${s.revision}`),rootIds:op.sources.map(s=>`${s.id}@${s.revision}`),admission:"pending",at};});
      if(!store.finish(attempt.id,attempt.owner,candidates))throw new Error("Operation completion expired or cancelled");
      store.transaction(()=>{const run=store.get(attempt!.runId)!;run.status="completed";run.reason="Direct operation completed";store.save(run);});
    }
    return { output, receipt: { operation: op, manifest, status: "committed" as const, at } };
  }catch(error){if(store&&attempt)store.finish(attempt.id,attempt.owner,undefined,undefined,error instanceof Error?error.message:String(error));throw error;}finally{store?.close();}
}
export function snapshot(raw: unknown) { return snapshotSchema.parse(raw); }
