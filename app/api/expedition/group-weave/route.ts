import { z } from "zod";
import { expeditionOwner } from "@/features/experiments/session";
import { experimentStore } from "@/features/experiments/runtime";
import { dispatch } from "@/features/experiments/dispatch";
import { groupWeaveOptions, groupWeaveProgress, prepareGroupWeave, submitGroupWeave, type GroupWeaveRequest } from "@/features/experiments/group-weave";
import { weaveInputSchema } from "@/features/experiments/weave";
export const runtime = "nodejs";
const commands = z.discriminatedUnion("action", [
  z.object({ action: z.literal("prepare"), runId: z.string().uuid(), lensId: z.string().uuid(), lensRevision: z.number().int().positive(), choices: z.array(z.object({ groupId: z.string().uuid(), candidateId: z.string().uuid() })).length(2) }),
  z.object({ action: z.literal("submit"), runId: z.string().uuid(), previewId: z.string().uuid(), weave: weaveInputSchema }),
  z.object({ action: z.literal("retry-dispatch"), runId: z.string().uuid(), requestId: z.string().uuid() }),
]);
export async function GET(request: Request) {
  let store;
  try {
    const url = new URL(request.url), runId = z.string().uuid().parse(url.searchParams.get("runId")), lensId = z.string().uuid().parse(url.searchParams.get("lensId"));
    store = await experimentStore(request); const run = await store.get(runId);
    if (!run || run.owner !== await expeditionOwner()) return Response.json({ error: "Run unavailable" }, { status: 404 });
    const requests = (await store.all<GroupWeaveRequest>(runId, "group-weave-request")).filter(r => r.operation.groupWeave?.lensId === lensId).slice(-10);
    const history = [];
    for (const r of requests) history.push(await groupWeaveProgress(store, runId, r.id));
    return Response.json({ ...await groupWeaveOptions(store, runId, lensId), history });
  } catch { return Response.json({ error: "Group exploration is unavailable. Reload lenses and try again." }, { status: 503 }); }
  finally { await store?.close(); }
}
export async function POST(request: Request) {
  let store;
  try {
    const command = commands.parse(await request.json()); store = await experimentStore(request);
    const run = await store.get(command.runId);
    if (!run || run.owner !== await expeditionOwner()) return Response.json({ error: "Run unavailable" }, { status: 404 });
    if (command.action === "prepare") return Response.json({ preview: await prepareGroupWeave(store, command.runId, command.lensId, command.lensRevision, command.choices) });
    const requestId = command.action === "submit" ? (await submitGroupWeave(store, command.runId, command.previewId, command.weave)).id : command.requestId;
    if (command.action === "retry-dispatch" && run.groupWeave !== requestId) throw new Error("This Weave is no longer pending. Reload its result.");
    let dispatchStarted = true;
    if ((await store.get(command.runId))?.groupWeave === requestId) try { await dispatch(command.runId); } catch { dispatchStarted = false; }
    return Response.json({ progress: await groupWeaveProgress(store, command.runId, requestId), dispatchStarted });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const known = /^(Pause this|Wait for|This Weave needs|This lens changed|Review this|Choose two|A selected|Choose assessed|Preparation unavailable|This preparation|This submission|Group Weave starts|Contribution (source|excerpt)|This Weave is no longer)/.test(message);
    return Response.json({ error: known ? message : "Could not submit this Weave. Refresh the preparation before trying again." }, { status: 409 });
  } finally { await store?.close(); }
}
