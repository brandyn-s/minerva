import { z } from "zod";
import { start } from "workflow/api";
import { eq } from "drizzle-orm";
import { database } from "@/features/workspaces/postgres";
import { WorkspaceError } from "@/features/workspaces/domain";
import { permitsWorkspaceRequest, servingOrigins } from "@/features/workspaces/request-policy";
import { prepareExploration, admitExploration, explorationState, controlExploration, decideProposal } from "@/features/exploration/service";
import { explorationWorkflow } from "@/features/exploration/workflow";
import { runs } from "@/features/exploration/schema";

export const runtime = "nodejs";
export const maxDuration = 60;
const uuid = z.string().uuid();
const commandSchema = z.discriminatedUnion("operation", [
  z.object({ operation: z.literal("preview"), workspaceId: uuid, change: z.string().min(1).max(2000),
    sources: z.array(z.object({ id: uuid, revision: z.number().int().positive() }).strict()).max(4) }).strict(),
  z.object({ operation: z.literal("start"), commandId: uuid, manifestId: uuid, hash: z.string().length(64) }).strict(),
  z.object({ operation: z.literal("control"), commandId: uuid, runId: uuid, action: z.enum(["pause", "resume", "stop", "recover"]) }).strict(),
  z.object({ operation: z.literal("decide"), commandId: uuid, workspaceId: uuid, ideaId: uuid, revision: z.number().int().positive(),
    decision: z.enum(["kept", "set aside", "unkept draft"]), historicalContext: z.boolean(), acknowledgeUnreviewed: z.boolean() }).strict(),
]);
function response(value: unknown, status = 200) { return Response.json(value, { status, headers: { "Cache-Control": "no-store" } }); }
function allowed(request: Request) {
  return permitsWorkspaceRequest(request, servingOrigins());
}
async function dispatch(runId: string) {
  const [run] = await database().select().from(runs).where(eq(runs.id, runId));
  if (!run || run.workflowId || run.state !== "admitted") return;
  try {
    const workflow = await start(explorationWorkflow, [run.id]);
    await database().update(runs).set({ workflowId: workflow.runId, updatedAt: new Date() }).where(eq(runs.id, run.id));
  } catch {
    await database().update(runs).set({ error: "Dispatch interrupted. Retry the same start to reconcile the saved admission." }).where(eq(runs.id, run.id));
    throw new WorkspaceError("Dispatch interrupted. Retry the same start to recover the saved run.", 503);
  }
}
export async function GET(request: Request) {
  if (!allowed(request)) return response({ error: "Request origin is not allowed." }, 403);
  const parsed = uuid.safeParse(new URL(request.url).searchParams.get("workspaceId"));
  if (!parsed.success) return response({ error: "Invalid workspace ID." }, 400);
  try { return response(await explorationState(parsed.data)); }
  catch { return response({ error: "Run state is temporarily unavailable." }, 503); }
}
export async function POST(request: Request) {
  if (!allowed(request)) return response({ error: "Request origin is not allowed." }, 403);
  if (request.headers.get("content-type")?.split(";")[0] !== "application/json") return response({ error: "Expected JSON." }, 415);
  try {
    const reader = request.body?.getReader();
    if (!reader) return response({ error: "Expected a command." }, 400);
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { value, done } = await reader.read(); if (done) break;
      size += value.byteLength;
      if (size > 16000) { await reader.cancel(); return response({ error: "Command too large." }, 413); }
      chunks.push(value);
    }
    let body: unknown;
    try { body = JSON.parse(Buffer.concat(chunks).toString("utf8")); }
    catch { return response({ error: "Invalid JSON." }, 400); }
    const parsed = commandSchema.safeParse(body);
    if (!parsed.success) return response({ error: "Invalid exploration command." }, 400);
    const command = parsed.data;
    if (command.operation === "preview") return response(await prepareExploration(command.workspaceId, command.sources, command.change));
    if (command.operation === "decide") return response(await decideProposal(command.commandId, command.workspaceId, command.ideaId,
      command.revision, command.decision, command.historicalContext, command.acknowledgeUnreviewed));
    if (command.operation === "control") {
      const result = await controlExploration(command.commandId, command.runId, command.action);
      if (command.action === "resume") await dispatch(command.runId);
      return response(result);
    }
    const run = await admitExploration(command.commandId, command.manifestId, command.hash);
    await dispatch(run.id);
    return response({ runId: run.id });
  } catch (error) {
    if (error instanceof WorkspaceError) return response({ error: error.message }, error.status);
    return response({ error: "Operation interrupted. Retry the same command to recover its receipt." }, 503);
  }
}
