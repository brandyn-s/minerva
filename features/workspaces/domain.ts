export type Workspace = {
  id: string;
  revision: number;
  name: string;
  brief: string;
  constraints: string;
  deleted: boolean;
};

export type WorkspaceCommand = {
  commandId: string;
  actor: "local-user";
  workspaceId: string;
} & (
  | { operation: "create-workspace"; name: string; brief: string; constraints: string }
  | { operation: "revise-workspace"; expectedRevision: number; name: string; brief: string; constraints: string }
  | { operation: "delete-workspace"; expectedRevision: number; confirmation: string }
  | { operation: "restore-workspace"; expectedRevision: number }
  | { operation: "duplicate-workspace"; expectedRevision: number; sourceWorkspaceId: string; name: string }
);

export class WorkspaceError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

export function parseCommand(value: unknown): WorkspaceCommand {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new WorkspaceError("Expected a workspace command.", 400);
  const v = value as Record<string, unknown>;
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  for (const key of ["commandId", "workspaceId"])
    if (typeof v[key] !== "string" || !uuid.test(v[key]))
      throw new WorkspaceError(`Invalid ${key}.`, 400);
  if (v.actor !== "local-user") throw new WorkspaceError("Invalid actor.", 400);
  if (!["create-workspace", "revise-workspace", "delete-workspace", "restore-workspace", "duplicate-workspace"].includes(v.operation as string))
    throw new WorkspaceError("Unknown workspace operation.", 400);
  const fields = new Set(["commandId", "actor", "workspaceId", "operation"]);
  const textFields = v.operation === "create-workspace" || v.operation === "revise-workspace"
    ? [["name", 160], ["brief", 20000], ["constraints", 10000]] as const
    : v.operation === "duplicate-workspace" ? [["name", 160]] as const : [];
  for (const [key, limit] of textFields) {
    fields.add(key);
    if (typeof v[key] !== "string" || v[key].length > limit)
      throw new WorkspaceError(`Invalid ${key} (maximum ${limit} characters).`, 400);
  }
  if (fields.has("name") && !(v.name as string).trim()) throw new WorkspaceError("A workspace needs a name.", 400);
  if (v.operation !== "create-workspace") {
    fields.add("expectedRevision");
    if (!Number.isSafeInteger(v.expectedRevision) || (v.expectedRevision as number) < 1)
      throw new WorkspaceError("An expected revision is required.", 400);
  }
  if (v.operation === "delete-workspace") {
    fields.add("confirmation");
    if (typeof v.confirmation !== "string" || v.confirmation.length > 160)
      throw new WorkspaceError("Confirm the workspace name to delete it.", 400);
  }
  if (v.operation === "duplicate-workspace") {
    fields.add("sourceWorkspaceId");
    if (typeof v.sourceWorkspaceId !== "string" || !uuid.test(v.sourceWorkspaceId) || v.sourceWorkspaceId === v.workspaceId)
      throw new WorkspaceError("Duplicate requires an independent workspace ID.", 400);
  }
  if (Object.keys(v).some((key) => !fields.has(key)))
    throw new WorkspaceError("Unexpected command field.", 400);
  return v as WorkspaceCommand;
}

export function applyWorkspaceCommand(command: WorkspaceCommand, current?: Workspace): Workspace {
  if (command.operation === "create-workspace" && current)
    throw new WorkspaceError("Workspace already exists.", 409);
  if (command.operation !== "create-workspace") {
    if (!current) throw new WorkspaceError("Workspace not found.", 404);
    if (current.revision !== command.expectedRevision)
      throw new WorkspaceError("Workspace changed. Reopen it before applying your edits.", 409);
    if (current.deleted && command.operation !== "restore-workspace")
      throw new WorkspaceError("Restore this workspace before changing it.", 409);
    if (command.operation === "delete-workspace" && command.confirmation !== current.name)
      throw new WorkspaceError("The confirmation must match the workspace name.", 400);
    if (command.operation === "delete-workspace" || command.operation === "restore-workspace")
      return { ...current, revision: current.revision + 1, deleted: command.operation === "delete-workspace" };
    if (command.operation === "duplicate-workspace")
      return { ...current, id: command.workspaceId, name: command.name.trim(), revision: current.revision + 1, deleted: false };
  }
  return { id: command.workspaceId, revision: (current?.revision ?? 0) + 1,
    name: command.name.trim(), brief: command.brief, constraints: command.constraints, deleted: false };
}
