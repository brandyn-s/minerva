import { boolean, doublePrecision, foreignKey, integer, jsonb, pgTable, primaryKey, text, timestamp, uuid } from "drizzle-orm/pg-core";
import type { Workspace } from "./domain";
import type { Thought, Relationship } from "../atlas/domain";
import type { GraphReceipt } from "./graph-domain";

export const workspaces = pgTable("workspaces", {
  id: uuid("id").primaryKey(),
  revision: integer("revision").notNull(),
  name: text("name").notNull(),
  brief: text("brief").notNull(),
  constraints: text("constraints").notNull(),
  deleted: boolean("deleted").notNull().default(false),
});
export const workspaceRevisions = pgTable("workspace_revisions", {
  workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id),
  revision: integer("revision").notNull(),
  name: text("name").notNull(),
  brief: text("brief").notNull(),
  constraints: text("constraints").notNull(),
  deleted: boolean("deleted").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [primaryKey({ columns: [table.workspaceId, table.revision] })]);
export const workspaceReceipts = pgTable("workspace_receipts", {
  commandId: uuid("command_id").primaryKey(),
  workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id),
  actor: text("actor").notNull(),
  payloadIdentity: text("payload_identity").notNull(),
  result: jsonb("result").$type<Workspace>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const ideas = pgTable("ideas", {
  id: uuid("id").primaryKey(), workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id),
  revision: integer("revision").notNull(),
});
export const ideaRevisions = pgTable("idea_revisions", {
  workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id),
  ideaId: uuid("idea_id").notNull().references(() => ideas.id), revision: integer("revision").notNull(),
  content: jsonb("content").$type<Thought>().notNull(),
}, (t) => [primaryKey({ columns: [t.workspaceId, t.ideaId, t.revision] })]);
export const ideaRelationships = pgTable("idea_relationships", {
  id: uuid("id").primaryKey(), workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id),
  from: uuid("from_id").notNull(), to: uuid("to_id").notNull(),
  sourceRevision: integer("source_revision").notNull(), targetRevision: integer("target_revision").notNull(),
  kind: text("kind").$type<Relationship["kind"]>().notNull(), label: text("label").notNull(),
  contribution: text("contribution").notNull(),
}, (t) => [
  foreignKey({ columns: [t.workspaceId, t.from, t.sourceRevision], foreignColumns: [ideaRevisions.workspaceId, ideaRevisions.ideaId, ideaRevisions.revision] }),
  foreignKey({ columns: [t.workspaceId, t.to, t.targetRevision], foreignColumns: [ideaRevisions.workspaceId, ideaRevisions.ideaId, ideaRevisions.revision] }),
]);
export const ideaLayouts = pgTable("idea_layouts", {
  ideaId: uuid("idea_id").primaryKey().references(() => ideas.id),
  workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id),
  revision: integer("revision").notNull(), x: doublePrecision("x").notNull(), y: doublePrecision("y").notNull(),
  width: doublePrecision("width").notNull(), height: doublePrecision("height").notNull(),
});
export const viewpoints = pgTable("viewpoints", {
  workspaceId: uuid("workspace_id").primaryKey().references(() => workspaces.id), revision: integer("revision").notNull(),
  x: doublePrecision("x").notNull(), y: doublePrecision("y").notNull(), zoom: doublePrecision("zoom").notNull(),
});
export const graphReceipts = pgTable("graph_receipts", {
  commandId: uuid("command_id").primaryKey(), workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id),
  payloadIdentity: text("payload_identity").notNull(), result: jsonb("result").$type<GraphReceipt>().notNull(),
});
