import { z } from "zod";

export const snapshotSchema = z.object({
  id: z.string().min(1).max(200), revision: z.number().int().positive(),
  title: z.string().max(1000), summary: z.string().max(8000), body: z.string().max(32000), contribution: z.string().max(8000).optional(),
});
export type Snapshot = z.infer<typeof snapshotSchema>;
export const operationSchema = z.object({
  id: z.string().uuid(), version: z.literal(1), kind: z.enum(["root", "wander", "weave", "develop"]),
  goal: z.string().trim().min(1).max(2000), constraints: z.array(z.string().max(1000)).max(30),
  sources: z.array(snapshotSchema).max(8), exposure: z.array(snapshotSchema).max(8).default([]),
  intent: z.string().max(2000).default(""), intentId: z.string().optional(), intentVersion: z.number().int().positive().optional(),
  step: z.number().int().positive().default(1), count: z.number().int().min(1).max(3).default(1),
  runId: z.string().uuid().optional(),
  strategy: z.object({ policy:z.string(), iteration:z.number().int().nonnegative(), reason:z.string() }).optional(),
}).superRefine((o, ctx) => {
  const required = o.kind === "root" ? 0 : o.kind === "weave" ? 2 : 1;
  if ((o.kind === "weave" ? o.sources.length < required : o.sources.length !== required) || (o.kind === "root" && o.exposure.length)) ctx.addIssue({ code: "custom", message: "Invalid sources/exposure for operation" });
});
export type Operation = z.infer<typeof operationSchema>;
export const outputSchema = z.object({ cards: z.array(snapshotSchema.omit({ id: true, revision: true })).min(1).max(3), note: z.string().max(4000), contributions: z.array(z.string().max(2000)).max(8) });
export type OperationOutput = z.infer<typeof outputSchema>;
export const behaviorSpace = {
  actor: ["individual", "pair", "group", "institution", "environment"],
  medium: ["digital", "conversation", "physical", "ambient", "hybrid"],
  timescale: ["moment", "session", "day", "ongoing", "lifecycle"],
  unit: ["instruction", "action", "artifact", "relationship", "rule", "environment"],
  collaboration: ["solo", "handoff", "coordination", "negotiation", "collective"],
  evidence: ["immediate-feedback", "state-change", "trace", "peer-observation", "delayed-consequence", "self-verification"],
} as const;
export const behaviorSchema = z.object({ actor:z.enum(behaviorSpace.actor),medium:z.enum(behaviorSpace.medium),timescale:z.enum(behaviorSpace.timescale),unit:z.enum(behaviorSpace.unit),collaboration:z.enum(behaviorSpace.collaboration),evidence:z.enum(behaviorSpace.evidence) });
export const assessmentSchema = z.object({
  behavior: behaviorSchema.optional(),
  mechanism: z.string().min(1).max(1000), evidence: z.string().min(1).max(8000),
  constraints: z.enum(["preserved", "violated", "unclear"]), changed: z.enum(["yes", "no", "unclear"]),
  actionability: z.enum(["supported", "unsupported", "unclear"]), explanation: z.string().max(4000),
});
export type Assessment = z.infer<typeof assessmentSchema> & { id: string; candidateId: string; version: 1; level: "textual" | "simulation" | "external"; assessor: string; at: string; sourceOperation: string };
export type Candidate = { id: string; snapshot: Snapshot; operationId: string; parents: string[]; exposure: string[]; rootIds: string[]; assessment?: Assessment; admission: "pending" | "eligible" | "rejected"; at: string };
export type Attempt = { maxCallsAtPlanning?:number; assessmentRequestId?:string; usage?: {inputTokens?:number;outputTokens?:number;totalTokens?:number}; id: string; runId: string; sequence: number; stage: "generation" | "assessment"; candidateId?: string; operation: Operation; status: "reserved" | "committed" | "failed" | "uncertain" | "cancelled"; owner: string; leaseUntil: number; reservedMicros: number; cost: "reserved-upper-bound"; manifest?: { model: string; system: string; prompt: string; schemaVersion: number; maxOutputTokens: number }; error?: string; at: string };
export const runConfigSchema = z.object({
  title: z.string().max(200).optional(), direction: z.string().max(1000).optional(), owner: z.string().optional(),
  id: z.string().uuid(), goal: z.string().trim().min(1).max(2000), constraints: z.array(z.string().max(1000)).max(30).default([]),
  initial: z.array(snapshotSchema).max(8).default([]), policy: z.enum(["independent", "fitness", "diversity", "scorebook-baseline"]).default("diversity"),
  maxCalls: z.number().int().min(2).max(10000), maxCostMicros: z.number().int().nonnegative(), callReservationMicros: z.number().int().nonnegative(),
  capacity: z.number().int().min(2).max(1000).default(40), seed: z.number().int().default(1),
  execution: z.enum(["worker", "manual"]).default("worker"),
  provider: z.enum(["fixture", "gateway"]).default("fixture"), mode: z.enum(["explore", "goal"]).default("explore"),
}).superRefine((c, ctx) => { if (c.provider === "gateway" && c.callReservationMicros === 0) ctx.addIssue({ code: "custom", message: "Live runs require an explicit conservative call allowance" }); });
export type RunConfig = z.infer<typeof runConfigSchema>;
export type Run = RunConfig & { version: 1; status: "running" | "paused" | "stopped" | "completed"; calls: number; reservedMicros: number; active: string[]; createdAt: string; reason?: string };
export type Reading = { probes?: {id:string;candidateId:string;capacityPreserved:boolean;model:string}[]; preview?: {totalGroups:number;totalUnusual:number;maxCandidatesPerGroup:number}; id: string; runId: string; version: 1; at: string; through: number; representation: string; coverage: { candidates: number; assessed: number; excluded: number }; groups: { candidateCount?:number; mechanism: string; candidates: string[]; representative: string; roots: string[]; independent: boolean; status: "provisional group" | "candidate recurrence" }[]; unusual: string[]; observations: string[]; hypotheses: string[]; limitations: string[] };
export type Intervention = { id: string; runId: string; readingId: string; candidateId: string; challenge: string; intent: string; operationKind: "wander" | "develop"; allowance: number; status: "proposed" | "running" | "completed" | "inconclusive"; operationId?: string; resultId?: string; outcome?: string; updatedReadingId?: string };

export const receiptSchema = z.object({ operation: operationSchema, manifest: z.object({ model: z.string(), system: z.string(), prompt: z.string(), schemaVersion: z.number(), maxOutputTokens: z.number() }), status: z.literal("committed"), at: z.string() });
export type OperationReceipt = z.infer<typeof receiptSchema>;
