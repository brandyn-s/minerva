import { z } from "zod";
import { operationSourceSchema } from "@/features/experiments/contracts";
import { directOperation } from "@/features/experiments/direct";
import { weaveInputSchema } from "@/features/experiments/weave";
export const maxDuration = 60;
export async function POST(request: Request) {
  try {
    const raw = await request.json();
    const input = z.object({ sources: z.array(operationSourceSchema).min(2).max(8), weave: weaveInputSchema.optional() }).parse(Array.isArray(raw) ? { sources: raw } : raw);
    const {output,receipt}=await directOperation({kind:"weave",goal:"Combine these ideas",constraints:[],...input,exposure:[],intent:"Preserve each source's distinct contribution",step:1,count:1},request.signal);
    return Response.json({card:output.cards[0],contributions:output.contributions,weaveMappings:output.weaveMappings,receipt});
  }catch(error){return Response.json({error:error instanceof Error ? error.message : String(error)},{status:400});}
}
