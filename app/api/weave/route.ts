import { z } from "zod";
import { snapshotSchema } from "@/features/experiments/contracts";
import { directOperation } from "@/features/experiments/direct";
export const maxDuration = 60;
export async function POST(request: Request) {
  try {
    const sources=z.array(snapshotSchema).min(2).max(8).parse(await request.json());
    const {output,receipt}=await directOperation({kind:"weave",goal:"Combine these ideas",constraints:[],sources,exposure:[],intent:"Preserve each source's distinct contribution",step:1,count:1},request.signal);
    return Response.json({card:output.cards[0],contributions:output.contributions,receipt});
  }catch(error){return Response.json({error:error instanceof Error ? error.message : String(error)},{status:400});}
}
