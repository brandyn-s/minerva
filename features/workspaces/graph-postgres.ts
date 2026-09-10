import { createHash, randomUUID } from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import { database } from "./postgres";
import { ideas, ideaRevisions, ideaRelationships, ideaLayouts, viewpoints, graphReceipts, workspaces } from "./schema";
import { WorkspaceError } from "./domain";
import { assertAcyclic, userThought, type GraphCommand, type GraphReceipt, type WorkspaceGraph } from "./graph-domain";
import { mallFixture } from "../atlas/fixture";
import { assessments } from "../exploration/schema";

export async function readWorkspaceGraph(workspaceId: string): Promise<WorkspaceGraph> {
  return database().transaction(async (tx) => {
    const [workspace] = await tx.select().from(workspaces).where(eq(workspaces.id, workspaceId));
    if (!workspace || workspace.deleted) throw new WorkspaceError("Workspace not found or deleted.", 404);
    const current = await tx.select().from(ideas).where(eq(ideas.workspaceId, workspaceId));
    const revisions = await tx.select().from(ideaRevisions).where(eq(ideaRevisions.workspaceId, workspaceId));
    const savedAssessments = await tx.select().from(assessments);
    const thoughts = current.map((i) => {
      const content = revisions.find((r) => r.ideaId === i.id && r.revision === i.revision)!.content;
      const assessment = savedAssessments.find((a) => a.ideaId === i.id && a.revision === i.revision);
      return { ...content,
        assessment: assessment?.report ?? undefined };
    });
    const layouts = await tx.select().from(ideaLayouts).where(eq(ideaLayouts.workspaceId, workspaceId));
    const relationships = await tx.select().from(ideaRelationships).where(eq(ideaRelationships.workspaceId, workspaceId));
    const [viewpoint] = await tx.select().from(viewpoints).where(eq(viewpoints.workspaceId, workspaceId));
    return { workspaceId, thoughts, relationships, revisions: revisions.map((r) => r.content),
      positions: Object.fromEntries(layouts.map((l) => [l.ideaId, { x: l.x, y: l.y }])),
      layouts: Object.fromEntries(layouts.map((l) => [l.ideaId, l])),
      viewpoint: viewpoint ?? { revision: 0, x: 0, y: 0, zoom: 1 } };
  }, { isolationLevel: "repeatable read", accessMode: "read only" });
}

export async function executeGraphCommand(command: GraphCommand): Promise<GraphReceipt> {
  const payloadIdentity = createHash("sha256").update(JSON.stringify(Object.fromEntries(
    Object.entries(command).sort(([a], [b]) => a.localeCompare(b)),
  ))).digest("hex");
  return database().transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${command.commandId}, 0))`);
    const [receipt] = await tx.select().from(graphReceipts).where(eq(graphReceipts.commandId, command.commandId));
    if (receipt) {
      if (receipt.payloadIdentity !== payloadIdentity) throw new WorkspaceError("Command ID was reused with different input.", 409);
      return receipt.result;
    }
    await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${command.workspaceId}, 1))`);
    const [workspace] = await tx.select().from(workspaces).where(eq(workspaces.id, command.workspaceId));
    if (!workspace || workspace.deleted) throw new WorkspaceError("Workspace not found or deleted.", 404);
    const workspaceId = command.workspaceId;
    let result: GraphReceipt = { commandId: command.commandId, id: workspaceId, revision: 1 };
    if (command.operation === "seed-mall") {
      const existing = await tx.select().from(ideas).where(eq(ideas.workspaceId, workspaceId)).limit(1);
      if (existing.length) throw new WorkspaceError("Seed only an empty workspace; duplicate a seeded workspace to start again.", 409);
      const fixture = mallFixture();
      const grandchild = userThought("grandchild", "One evening, six repairs", "Pilot a staffed repair supper with six low-risk household objects. Attendance and feasibility remain untested.");
      fixture.thoughts.push(grandchild);
      fixture.positions.grandchild = { x: 1800, y: 400 };
      fixture.relationships.push({ id: "grandchild-edge", from: "repair", to: "grandchild", kind: "derivation", sourceRevision: 1, label: "small pilot", contribution: "Retains repair participation and the shared meal." },
        { id: "association-return", from: "tools", to: "rotation", kind: "association", sourceRevision: 1, label: "equipment sharing", contribution: "Semantic return link; no parentage." });
      const ids = new Map(fixture.thoughts.map((t) => [t.id, randomUUID()]));
      for (const thought of fixture.thoughts) {
        const id = ids.get(thought.id)!;
        const content = { ...thought, id };
        await tx.insert(ideas).values({ id, workspaceId, revision: thought.id === "tools" ? 2 : 1 });
        await tx.insert(ideaRevisions).values({ workspaceId, ideaId: id, revision: 1, content });
        if (thought.id === "tools") await tx.insert(ideaRevisions).values({ workspaceId, ideaId: id, revision: 2,
          content: { ...content, revision: 2, body: `${content.body}\n\nRevision 2: supervised sessions need a named competent host. Earlier relationships retain source revision 1.` } });
        await tx.insert(ideaLayouts).values({ workspaceId, ideaId: id, revision: 1, ...fixture.positions[thought.id], width: 290, height: 200 });
      }
      await tx.insert(ideaRelationships).values(fixture.relationships.map((r) => ({ ...r, id: randomUUID(),
        workspaceId, from: ids.get(r.from)!, to: ids.get(r.to)!, targetRevision: 1, contribution: r.contribution ?? "" })));
    } else if (command.operation === "set-viewpoint") {
      const [current] = await tx.select().from(viewpoints).where(eq(viewpoints.workspaceId, workspaceId));
      if ((current?.revision ?? 0) !== command.expectedRevision) throw new WorkspaceError("Viewpoint changed; reload its latest state.", 409);
      const next = { workspaceId, revision: command.expectedRevision + 1, x: command.x, y: command.y, zoom: command.zoom };
      await tx.insert(viewpoints).values(next).onConflictDoUpdate({ target: viewpoints.workspaceId, set: next });
      result = { ...result, revision: next.revision };
    } else if (command.operation === "connect-ideas") {
      const parents = await tx.select().from(ideas).where(eq(ideas.workspaceId, workspaceId));
      if (!parents.some((i) => i.id === command.from && i.revision === command.sourceRevision) ||
          !parents.some((i) => i.id === command.to && i.revision === command.targetRevision))
        throw new WorkspaceError("A relationship endpoint changed or belongs to another workspace.", 409);
      const edges = await tx.select().from(ideaRelationships).where(eq(ideaRelationships.workspaceId, workspaceId));
      if (command.kind === "derivation" || command.kind === "recombination") assertAcyclic(edges, command.from, command.to);
      if (edges.some((e) => e.from === command.from && e.to === command.to && e.kind === command.kind))
        throw new WorkspaceError("This relationship already exists.", 409);
      await tx.insert(ideaRelationships).values({ workspaceId, id: command.edgeId, from: command.from, to: command.to,
        kind: command.kind, sourceRevision: command.sourceRevision, targetRevision: command.targetRevision,
        label: command.label, contribution: command.contribution });
      result = { ...result, id: command.edgeId };
    } else {
      const [idea] = await tx.select().from(ideas).where(and(eq(ideas.id, command.ideaId), eq(ideas.workspaceId, workspaceId)));
      if (command.operation === "create-idea") {
        if (idea) throw new WorkspaceError("Idea already exists.", 409);
        const content = userThought(command.ideaId, command.title, command.body);
        await tx.insert(ideas).values({ workspaceId, id: content.id, revision: 1 });
        await tx.insert(ideaRevisions).values({ workspaceId, ideaId: content.id, revision: 1, content });
        await tx.insert(ideaLayouts).values({ workspaceId, ideaId: content.id, revision: 1, x: 0, y: 0, width: 290, height: 200 });
      } else {
        if (!idea) throw new WorkspaceError("Idea not found.", 404);
        if (command.operation === "revise-idea") {
          if (idea.revision !== command.expectedRevision) throw new WorkspaceError("Idea changed; inspect its latest revision.", 409);
          const [previous] = await tx.select().from(ideaRevisions).where(and(eq(ideaRevisions.ideaId, idea.id), eq(ideaRevisions.revision, idea.revision)));
          const revision = idea.revision + 1;
          await tx.insert(ideaRevisions).values({ workspaceId, ideaId: idea.id, revision,
            content: { ...previous.content, revision, title: command.title, body: command.body, summary: command.body.slice(0, 240) } });
          await tx.update(ideas).set({ revision }).where(eq(ideas.id, idea.id));
          result = { ...result, revision };
        } else {
          const [previous] = await tx.select().from(ideaLayouts).where(eq(ideaLayouts.ideaId, idea.id));
          if (previous.revision !== command.expectedRevision) throw new WorkspaceError("Layout changed; inspect its latest position.", 409);
          const revision = previous.revision + 1;
          await tx.update(ideaLayouts).set({ revision, x: command.x, y: command.y, width: command.width, height: command.height }).where(eq(ideaLayouts.ideaId, idea.id));
          result = { ...result, revision };
        }
      }
      result = { ...result, id: command.ideaId };
    }
    await tx.insert(graphReceipts).values({ workspaceId, commandId: command.commandId, payloadIdentity, result });
    return result;
  });
}
