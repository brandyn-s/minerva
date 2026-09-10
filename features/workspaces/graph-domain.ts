import type { AtlasFixture, Thought, Relationship } from "../atlas/domain";
import { WorkspaceError } from "./domain";

export type LayoutRecord = { revision: number; x: number; y: number; width: number; height: number };
export type WorkspaceGraph = AtlasFixture & {
  workspaceId: string;
  revisions: Thought[];
  layouts: Record<string, LayoutRecord>;
  viewpoint: { revision: number; x: number; y: number; zoom: number };
};
export type GraphCommand = { commandId: string; workspaceId: string; actor: "local-user" } & (
  | { operation: "seed-mall" }
  | { operation: "create-idea"; ideaId: string; title: string; body: string }
  | { operation: "revise-idea"; ideaId: string; expectedRevision: number; title: string; body: string }
  | { operation: "set-layout"; ideaId: string; expectedRevision: number; x: number; y: number; width: number; height: number }
  | { operation: "set-viewpoint"; expectedRevision: number; x: number; y: number; zoom: number }
  | { operation: "connect-ideas"; edgeId: string; from: string; to: string; sourceRevision: number; targetRevision: number; kind: Relationship["kind"]; label: string; contribution: string }
);
export type GraphReceipt = { commandId: string; id: string; revision: number };
export type GraphAction = GraphCommand extends infer C ? C extends GraphCommand
  ? Omit<C, "commandId" | "workspaceId" | "actor"> : never : never;
export type AtlasSession = {
  initial: WorkspaceGraph;
  subscribe: (listener: (graph: WorkspaceGraph) => void) => () => void;
  command: (action: GraphAction) => Promise<void>;
};

export function parseGraphCommand(input: unknown): GraphCommand {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new WorkspaceError("Invalid graph command.", 400);
  const c = input as Record<string, unknown>;
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const required: Record<string, string[]> = {
    "seed-mall": [], "create-idea": ["ideaId", "title", "body"],
    "revise-idea": ["ideaId", "expectedRevision", "title", "body"],
    "set-layout": ["ideaId", "expectedRevision", "x", "y", "width", "height"],
    "set-viewpoint": ["expectedRevision", "x", "y", "zoom"],
    "connect-ideas": ["edgeId", "from", "to", "sourceRevision", "targetRevision", "kind", "label", "contribution"],
  };
  if (typeof c.operation !== "string" || !Object.hasOwn(required, c.operation) || c.actor !== "local-user")
    throw new WorkspaceError("Invalid graph operation or actor.", 400);
  const keys = [...required[c.operation], "commandId", "workspaceId", "actor", "operation"];
  if (Object.keys(c).length !== keys.length || keys.some((key) => !(key in c)))
    throw new WorkspaceError("Invalid graph command fields.", 400);
  for (const key of keys) {
    const v = c[key];
    if (["commandId", "workspaceId", "ideaId", "edgeId", "from", "to"].includes(key) && (typeof v !== "string" || !uuid.test(v)))
      throw new WorkspaceError(`Invalid ${key}.`, 400);
    if (["expectedRevision", "sourceRevision", "targetRevision"].includes(key) && (!Number.isSafeInteger(v) || (v as number) < (key === "expectedRevision" ? 0 : 1)))
      throw new WorkspaceError(`Invalid ${key}.`, 400);
    if (["x", "y", "width", "height", "zoom"].includes(key) && (typeof v !== "number" || !Number.isFinite(v) || Math.abs(v) > 100000))
      throw new WorkspaceError(`Invalid ${key}.`, 400);
    if (["title", "body", "label", "contribution"].includes(key) && (typeof v !== "string" || v.length > (key === "body" ? 20000 : key === "contribution" ? 4000 : 200)))
      throw new WorkspaceError(`Invalid ${key}.`, 400);
  }
  if ("title" in c && !(c.title as string).trim()) throw new WorkspaceError("An idea needs a title.", 400);
  if (c.operation === "set-layout" && ((c.width as number) < 200 || (c.width as number) > 1000 || (c.height as number) < 120 || (c.height as number) > 1600))
    throw new WorkspaceError("Card dimensions are outside the allowed range.", 400);
  if (c.operation === "set-viewpoint" && ((c.zoom as number) < 0.1 || (c.zoom as number) > 1.6))
    throw new WorkspaceError("Zoom is outside the allowed range.", 400);
  if (c.operation === "connect-ideas" && (!["context", "derivation", "recombination", "association"].includes(c.kind as string) || c.from === c.to))
    throw new WorkspaceError("Invalid relationship.", 400);
  return c as GraphCommand;
}
export function assertAcyclic(edges: Relationship[], from: string, to: string) {
  const seen = new Set<string>();
  const pending = [to];
  while (pending.length) {
    const id = pending.pop()!;
    if (id === from) throw new WorkspaceError("Derivation cannot form a cycle.", 409);
    if (seen.has(id)) continue;
    seen.add(id);
    pending.push(...edges.filter((e) => e.from === id && e.kind !== "association" && e.kind !== "context").map((e) => e.to));
  }
}
export function userThought(id: string, title: string, body: string): Thought {
  return { id, revision: 1, title, body, summary: body.slice(0, 240), kind: "exploration",
    contribution: "User-authored material; no assessed inheritance.",
    move: { title: "Develop this idea", question: "What should change?", preview: "Live generation is not connected yet." } };
}
