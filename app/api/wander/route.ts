import { wanderRequestSchema } from "@/features/atlas/generation";
import { directOperation, snapshot } from "@/features/experiments/direct";
export const maxDuration = 60;
export async function POST(request: Request) {
  try {
    const source = wanderRequestSchema.parse(await request.json());
    const move = source.intent === "move" && source.move;
    const {output,receipt} = await directOperation({ kind:"wander", goal:"Explore this idea", constraints:[], sources:[snapshot(source)], exposure:[], intent:move ? JSON.stringify(move) : "Explore possible directions", step:1, count:move ? 1 : 3 },request.signal);
    return Response.json({cards:output.cards,receipt});
  } catch(error) { return Response.json({error:error instanceof Error ? error.message : String(error)}, {status:400}); }
}
