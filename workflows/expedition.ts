import { canAdvance } from "../features/experiments/group-weave";
import { sleep } from "workflow";
import { experimentStore } from "../features/experiments/runtime";
import { tick } from "../features/experiments/runner";
import { gatewayProvider } from "../features/experiments/gateway";
import { fixtureProvider } from "../features/experiments/fixture-provider";
async function advance(id:string){
  "use step";
  const store=await experimentStore();
  try{const run=await store.get(id);if(!run||!canAdvance(run))return false;
    await tick(store,id,run.provider==='fixture'?fixtureProvider(run.seed+run.calls):gatewayProvider);
    return canAdvance(await store.get(id));
  }finally{store.close();}
}
// A retry re-reads persisted reservations; it never replays an uncertain invocation.
advance.maxRetries=3;
export async function expeditionWorkflow(id:string){
  "use workflow";
  while(await advance(id))await sleep('1s');
}
