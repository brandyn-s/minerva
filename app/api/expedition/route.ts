import { expeditionRequestSchema } from "@/features/atlas/expedition";
import { directOperation } from "@/features/experiments/direct";
export const maxDuration=60;
// Compatibility for existing single-step clients; the durable UI uses /runs.
export async function POST(request:Request){
 try{
  const input=expeditionRequestSchema.parse(await request.json());
  if(!input.frontier.revision)throw new Error("An exact frontier revision is required");
  const {output,receipt}=await directOperation({kind:"wander",goal:input.goal,constraints:[],sources:[{...input.frontier,revision:input.frontier.revision}],exposure:input.cards.map(c=>{if(!c.revision)throw new Error("An exact exposed revision is required");return {...c,revision:c.revision};}),intent:input.goal,step:input.step,count:1},request.signal);
  return Response.json({card:output.cards[0],rationale:output.note,reached:false,reason:"No observed stopping predicate was evaluated",receipt});
 }catch(error){return Response.json({error:error instanceof Error?error.message:String(error)},{status:400});}
}
