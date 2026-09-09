import { integer, jsonb, pgTable, primaryKey, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { workspaces, ideas } from "../workspaces/schema";
import type { Manifest, ProposalArtifact, Assessment } from "./domain";

export const manifests = pgTable("operation_manifests", {
  id: uuid("id").primaryKey(), workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id),
  hash: text("hash").notNull(), content: jsonb("content").$type<Manifest>().notNull(),
});
export type RunState = "admitted" | "running" | "awaiting-input" | "completed" | "failed" | "stopped";
export const runs = pgTable("operation_runs", {
  id: uuid("id").primaryKey(), workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id),
  manifestId: uuid("manifest_id").notNull().references(() => manifests.id),
  commandId: uuid("command_id").notNull().unique(), payloadIdentity: text("payload_identity").notNull(),
  state: text("state").$type<RunState>().notNull(), workflowId: text("workflow_id"), dispatchGeneration: integer("dispatch_generation").notNull().default(0),
  reservedMicros: integer("reserved_micros").notNull(), error: text("error"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
export const attempts = pgTable("operation_attempts", {
  runId: uuid("run_id").notNull().references(() => runs.id), slot: integer("slot").notNull(),
  purpose: text("purpose").$type<"generate" | "assess">().notNull(),
  status: text("status").$type<"admitted" | "completed" | "failed" | "uncertain">().notNull(),
  proposalId: uuid("proposal_id").notNull(), input: text("input").notNull(),
  artifact: jsonb("artifact").$type<ProposalArtifact | Assessment>(),
  usage: jsonb("usage").$type<{ inputTokens: number; outputTokens: number; estimatedUsd: number; finishReason: string }>(),
  error: text("error"),
}, (t) => [primaryKey({ columns: [t.runId, t.slot, t.purpose] })]);
export const assessments = pgTable("proposal_assessments", {
  ideaId: uuid("idea_id").notNull().references(() => ideas.id), revision: integer("revision").notNull(),
  runId: uuid("run_id").notNull().references(() => runs.id),
  state: text("state").$type<"pending" | "unavailable" | Assessment["state"]>().notNull(),
  report: jsonb("report").$type<Assessment>(),
}, (t) => [primaryKey({ columns: [t.ideaId, t.revision] })]);
export const decisions = pgTable("proposal_decisions", {
  commandId: uuid("command_id").primaryKey(), workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id),
  ideaId: uuid("idea_id").notNull().references(() => ideas.id), revision: integer("revision").notNull(),
  decision: text("decision").$type<"kept" | "set aside" | "unkept draft">().notNull(),
  payloadIdentity: text("payload_identity").notNull(), historicalContext: integer("historical_context").notNull(),
  acknowledgedUnreviewed: integer("acknowledged_unreviewed").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
export const spending = pgTable("application_spending", {
  id: text("id").primaryKey(), reservedMicros: integer("reserved_micros").notNull(),
});
export const runControls = pgTable("run_controls", {
  commandId: uuid("command_id").primaryKey(), runId: uuid("run_id").notNull().references(() => runs.id),
  payloadIdentity: text("payload_identity").notNull(), result: jsonb("result").$type<{ state: RunState }>().notNull(),
});
