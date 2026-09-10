import { developmentRequestSchema } from "@/features/atlas/development";
import { directOperation } from "@/features/experiments/direct";
export const maxDuration=60;
export async function POST(request:Request){
  try{
    const input=developmentRequestSchema.parse(await request.json());
    const {output,receipt}=await directOperation({kind:"develop",goal:input.intent,constraints:[],sources:[input.card],exposure:input.priorSteps.slice(-8).map(s=>{if(!s.id||!s.revision)throw new Error("Exact prior-step source revisions are required");return {id:s.id,revision:s.revision,title:s.title,summary:s.summary,body:s.body};}),intent:input.intent,step:input.step,count:1},request.signal);
    return Response.json({...output.cards[0],note:output.note,receipt});
  }catch(error){return Response.json({error:error instanceof Error ? error.message : String(error)},{status:400});}
}
