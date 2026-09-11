import { z } from "zod";
import { expeditionOwner } from "@/features/experiments/session";
import { experimentStore } from "@/features/experiments/runtime";
import { previewSelection, applySelection } from "@/features/experiments/selection-service";
import { appliedSelection } from "@/features/experiments/selection";
import { analyze } from "@/features/experiments/analysis";
export const runtime = "nodejs";
const commandSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("preview"), runId: z.string().uuid(), lensId: z.string().uuid(), lensRevision: z.number().int().positive(), protectedIds: z.array(z.string().uuid()).max(1000) }),
  z.object({ action: z.literal("apply"), runId: z.string().uuid(), previewId: z.string().uuid() }),
]);
export async function GET(request: Request) {
  let store;
  try {
    store = await experimentStore(request);
    const runId = z.string().uuid().parse(new URL(request.url).searchParams.get("runId")), run = await store.get(runId);
    if (!run || run.owner !== await expeditionOwner()) return Response.json({ error: "Run unavailable" }, { status: 404 });
    return Response.json({ status: run.status, capacity: run.capacity, inFlight: (await store.attempts(runId)).some(a => a.status === "reserved" && a.leaseUntil >= Date.now()), active: run.active, configuration: await appliedSelection(store, run) ?? null });
  } catch { return Response.json({ error: "Selection is temporarily unavailable." }, { status: 503 }); }
  finally { await store?.close(); }
}
export async function POST(request: Request) {
  let store;
  try {
    const command = commandSchema.parse(await request.json());
    store = await experimentStore(request);
    const run = await store.get(command.runId);
    if (!run || run.owner !== await expeditionOwner()) return Response.json({ error: "Run unavailable" }, { status: 404 });
    if (command.action === "preview") return Response.json({ preview: await previewSelection(store, command.runId, command.lensId, command.lensRevision, command.protectedIds) });
    const application = await applySelection(store, command.runId, command.previewId);
    let readingUpdated = true;
    try { await analyze(store, command.runId); } catch { readingUpdated = false; }
    return Response.json({ application, readingUpdated });
  } catch (error) {
    const known = error instanceof Error && /Pause this|in-flight|lens changed|Lens unavailable|Review this|Protect at most|protected candidate|preview is stale|Selection changed/.test(error.message);
    return Response.json({ error: known ? (error as Error).message : "Could not update selection. Reload and recompute the preview before retrying." }, { status: 409 });
  } finally { await store?.close(); }
}
