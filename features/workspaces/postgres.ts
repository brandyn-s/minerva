import { createHash, randomUUID } from "node:crypto";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { and, eq, inArray, sql } from "drizzle-orm";
import { manifests, runs, attempts, assessments, decisions, runControls } from "../exploration/schema";
import { applyWorkspaceCommand, WorkspaceError, type WorkspaceCommand } from "./domain";
import { workspaces, workspaceRevisions, workspaceReceipts, ideas, ideaRevisions, ideaLayouts, ideaRelationships, viewpoints, graphReceipts } from "./schema";

const state = globalThis as typeof globalThis & { minervaWorkspacePool?: Pool };
export function database() {
  if (!process.env.DATABASE_URL)
    throw new WorkspaceError("Workspace storage is not configured. Set DATABASE_URL and explicitly run database migrations.", 503);
  state.minervaWorkspacePool ??= new Pool({ connectionString: process.env.DATABASE_URL,
    max: 5, connectionTimeoutMillis: 3000, idleTimeoutMillis: 10000,
    statement_timeout: 10000 });
  return drizzle(state.minervaWorkspacePool);
}
export async function listWorkspaces() {
  return database().select().from(workspaces).orderBy(workspaces.name, workspaces.id);
}
export async function executeWorkspaceCommand(command: WorkspaceCommand) {
  // Fixed property ordering makes payload identity independent of JSON key order.
  const payloadIdentity = createHash("sha256").update(JSON.stringify(
    Object.fromEntries(Object.entries(command).sort(([a], [b]) => a.localeCompare(b))),
  )).digest("hex");
  return database().transaction(async (tx) => {
    // Transaction-scoped locks work with poolers and serialize creation and retries.
    await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${command.commandId}, 0))`);
    const [receipt] = await tx.select().from(workspaceReceipts)
      .where(eq(workspaceReceipts.commandId, command.commandId));
    if (receipt) {
      if (receipt.payloadIdentity !== payloadIdentity)
        throw new WorkspaceError("Command ID was already used for different input.", 409);
      return receipt.result;
    }
    const sourceId = command.operation === "duplicate-workspace" ? command.sourceWorkspaceId : command.workspaceId;
    for (const id of [...new Set([command.workspaceId, sourceId])].sort())
      await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${id}, 1))`);
    const [current] = await tx.select().from(workspaces).where(eq(workspaces.id, sourceId));
    const next = applyWorkspaceCommand(command, current);
    if (command.operation === "delete-workspace") {
      const active = await tx.select({ id: runs.id }).from(runs).where(and(eq(runs.workspaceId, sourceId),
        inArray(runs.state, ["admitted", "running", "awaiting-input"])));
      if (active.length) throw new WorkspaceError("Stop active explorations before deleting this workspace.", 409);
    }
    if (current && command.operation !== "duplicate-workspace") await tx.update(workspaces).set(next).where(eq(workspaces.id, next.id));
    else await tx.insert(workspaces).values(next);
    if (command.operation === "duplicate-workspace") {
      const history = await tx.select().from(workspaceRevisions).where(eq(workspaceRevisions.workspaceId, sourceId));
      if (history.length) await tx.insert(workspaceRevisions).values(history.map((r) => ({ ...r, workspaceId: next.id })));
      const sourceIdeas = await tx.select().from(ideas).where(eq(ideas.workspaceId, sourceId));
      const ids = new Map(sourceIdeas.map((idea) => [idea.id, randomUUID()]));
      if (sourceIdeas.length) {
        await tx.insert(ideas).values(sourceIdeas.map((idea) => ({ ...idea, id: ids.get(idea.id)!, workspaceId: next.id })));
        const revisions = await tx.select().from(ideaRevisions).where(eq(ideaRevisions.workspaceId, sourceId));
        await tx.insert(ideaRevisions).values(revisions.map((r) => ({ ...r, workspaceId: next.id,
          ideaId: ids.get(r.ideaId)!, content: { ...r.content, id: ids.get(r.ideaId)! } })));
        const layouts = await tx.select().from(ideaLayouts).where(eq(ideaLayouts.workspaceId, sourceId));
        if (layouts.length) await tx.insert(ideaLayouts).values(layouts.map((l) => ({ ...l, workspaceId: next.id, ideaId: ids.get(l.ideaId)! })));
        const edges = await tx.select().from(ideaRelationships).where(eq(ideaRelationships.workspaceId, sourceId));
        if (edges.length) await tx.insert(ideaRelationships).values(edges.map((edge) => ({ ...edge, id: randomUUID(),
          workspaceId: next.id, from: ids.get(edge.from)!, to: ids.get(edge.to)! })));
      }
      const [viewpoint] = await tx.select().from(viewpoints).where(eq(viewpoints.workspaceId, sourceId));
      if (viewpoint) await tx.insert(viewpoints).values({ ...viewpoint, workspaceId: next.id });
    }
    await tx.insert(workspaceRevisions).values({ workspaceId: next.id, revision: next.revision,
      name: next.name, brief: next.brief, constraints: next.constraints, deleted: next.deleted });
    await tx.insert(workspaceReceipts).values({ commandId: command.commandId,
      workspaceId: next.id, actor: command.actor, payloadIdentity, result: next });
    return next;
  });
}

export async function exportWorkspace(id: string) {
  return database().transaction(async (tx) => {
    const [workspace] = await tx.select().from(workspaces).where(eq(workspaces.id, id));
    if (!workspace) throw new WorkspaceError("Workspace not found.", 404);
    const revisions = await tx.select().from(workspaceRevisions)
      .where(eq(workspaceRevisions.workspaceId, id)).orderBy(workspaceRevisions.revision);
    const receipts = await tx.select().from(workspaceReceipts)
      .where(eq(workspaceReceipts.workspaceId, id)).orderBy(workspaceReceipts.createdAt, workspaceReceipts.commandId);
    const savedIdeas = await tx.select().from(ideas).where(eq(ideas.workspaceId, id));
    const savedRevisions = await tx.select().from(ideaRevisions).where(eq(ideaRevisions.workspaceId, id));
    const relationships = await tx.select().from(ideaRelationships).where(eq(ideaRelationships.workspaceId, id));
    const layouts = await tx.select().from(ideaLayouts).where(eq(ideaLayouts.workspaceId, id));
    const views = await tx.select().from(viewpoints).where(eq(viewpoints.workspaceId, id));
    const graphCommands = await tx.select().from(graphReceipts).where(eq(graphReceipts.workspaceId, id));
    const savedRuns = await tx.select().from(runs).where(eq(runs.workspaceId, id));
    const runIds = savedRuns.map((run) => run.id);
    const ideaIds = savedIdeas.map((idea) => idea.id);
    const exploration = {
      manifests: await tx.select().from(manifests).where(eq(manifests.workspaceId, id)), runs: savedRuns,
      attempts: runIds.length ? await tx.select().from(attempts).where(inArray(attempts.runId, runIds)) : [],
      controls: runIds.length ? await tx.select().from(runControls).where(inArray(runControls.runId, runIds)) : [],
      assessments: ideaIds.length ? await tx.select().from(assessments).where(inArray(assessments.ideaId, ideaIds)) : [],
      decisions: await tx.select().from(decisions).where(eq(decisions.workspaceId, id)),
    };
    return { format: "minerva-workspace", version: 1, scope: "workspace-atlas-and-exploration",
      exportedAt: new Date().toISOString(), workspace, revisions, receipts,
      ideas: savedIdeas, ideaRevisions: savedRevisions, relationships, layouts, viewpoints: views, graphReceipts: graphCommands, exploration };
  }, { isolationLevel: "repeatable read", accessMode: "read only" });
}
