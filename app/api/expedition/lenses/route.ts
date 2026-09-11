import { z } from "zod";
import { expeditionOwner } from "@/features/experiments/session";
import { experimentStore } from "@/features/experiments/runtime";
import { runLensCorpus, runLenses, saveRunLens } from "@/features/experiments/lenses";
import { lensEditSchema } from "@/features/lenses/domain";
export const runtime = "nodejs";
const commandSchema = z.object({ runId: z.string().uuid(), id: z.string().uuid(), expectedRevision: z.number().int().nonnegative(), name: z.string().trim().min(1).max(120).optional(), seed: z.enum(["manual", "mechanisms"]).optional(), edit: lensEditSchema.optional() });
export async function GET(request: Request) {
  let store;
  try {
    store = await experimentStore(request);
    const runId = z.string().uuid().parse(new URL(request.url).searchParams.get("runId"));
    const run = await store.get(runId);
    if (!run || run.owner !== await expeditionOwner()) return Response.json({ error: "Run unavailable" }, { status: 404 });
    const [corpus, lenses] = await Promise.all([runLensCorpus(store, runId), runLenses(store, runId)]);
    return Response.json({ members: corpus.members, lenses, coverage: { total: corpus.members.length, complete: true } });
  } catch { return Response.json({ error: "Could not load the complete corpus. Try again." }, { status: 503 }); }
  finally { await store?.close(); }
}
export async function POST(request: Request) {
  let store;
  try {
    const command = commandSchema.parse(await request.json());
    store = await experimentStore(request);
    const run = await store.get(command.runId);
    if (!run || run.owner !== await expeditionOwner()) return Response.json({ error: "Run unavailable" }, { status: 404 });
    return Response.json({ lens: await saveRunLens(store, command.runId, command) });
  } catch { return Response.json({ error: "Could not save this lens. Reload lenses to check for a newer revision before retrying." }, { status: 409 }); }
  finally { await store?.close(); }
}
