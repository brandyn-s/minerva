import { createHash, randomUUID } from "node:crypto";
import { stableJson } from "../atlas/stable-json";
import { currentLens } from "../lenses/domain";
import { corpus } from "./analysis";
import { runLenses } from "./lenses";
import { operationSchema, type Operation, type Run, type Candidate } from "./contracts";
import { appliedSelection, selectWithLens, selectionReceipt } from "./selection";
import { validateWeaveInput, weaveInputSchema, type WeaveInput } from "./weave";
import type { Store } from "./store-contract";

export type GroupChoice = { groupId: string; candidateId: string };
export type GroupWeavePreview = { id: string; runId: string; lensId: string; lensRevision: number; lensName: string; fingerprint: string; at: string; groups: NonNullable<Operation["groupWeave"]>["groups"]; draft: { sources: Operation["sources"]; weave: WeaveInput }; costLimitMicros: number };
export type GroupWeaveRequest = { id: string; runId: string; at: string; operation: Operation; costLimitMicros: number };
export type GroupWeaveProgress = { request: GroupWeaveRequest; status: "queued" | "weaving" | "assessing" | "completed" | "inconclusive" | "cancelled"; finished: boolean; inFlight: boolean; candidate?: Candidate; error?: string; calls: number };
export function canAdvance(run?: Run) { return !!run && (run.status === "running" || (run.status === "paused" && !!run.groupWeave)); }
async function state(store: Store, run: Run, lensId: string) {
  const lens = (await runLenses(store, run.id)).find(l => l.id === lensId);
  if (!lens) throw new Error("Lens unavailable. Reload lenses.");
  const candidates = await corpus(store, run.id), revision = currentLens(lens);
  const fingerprint = createHash("sha256").update(stableJson({ run, lens, candidates: candidates.map(c => [c.id, c.assessment?.id ?? null]) })).digest("hex");
  return { lens, revision, candidates, fingerprint };
}
async function settled(store: Store, runId: string) {
  const run = await store.get(runId);
  if (!run || run.status !== "paused") throw new Error("Pause this expedition before preparing a group Weave.");
  if (run.groupWeave) throw new Error("Wait for the current group Weave to finish.");
  for (const a of await store.attempts(runId)) if (a.status === "reserved") {
    if (a.leaseUntil >= Date.now()) throw new Error("Wait for the in-flight call to settle.");
    a.status = "uncertain"; a.error = "Worker lease expired; reservation retained; invocation is not replayed"; await store.saveAttempt(a);
  }
  if (run.calls + 2 > run.maxCalls || run.reservedMicros + 2 * run.callReservationMicros > run.maxCostMicros) throw new Error("This Weave needs two calls within the existing expedition allowance.");
  return run;
}
export async function groupWeaveOptions(store: Store, runId: string, lensId: string) {
  return store.transaction(async () => {
    const run = await store.get(runId); if (!run) throw new Error("Run unavailable.");
    const { lens, revision, candidates } = await state(store, run, lensId), byId = new Map(candidates.map(c => [c.id, c]));
    const member = new Map(lens.members.map(m => [m.key, m.candidateId]));
    const rank = (c: Candidate) => Number(c.assessment?.constraints === "preserved") + Number(c.assessment?.actionability === "supported");
    const groups = revision.groups.map(g => {
      const members = g.members.map(key => byId.get(member.get(key)!)).filter((c): c is Candidate => !!c).sort((a, b) => rank(b) - rank(a) || a.id.localeCompare(b.id));
      const eligible = members.filter(c => c.assessment && c.assessment.constraints !== "violated");
      const representative = eligible.find(c => c.id === member.get(g.representative ?? "")) ?? eligible[0];
      return { id: g.id, label: g.label, representative: representative?.id ?? null, members: members.map(c => ({ id: c.id, title: c.snapshot.title, revision: c.snapshot.revision, eligible: eligible.includes(c), assessment: c.assessment?.constraints ?? "pending" })) };
    });
    return { status: run.status, pending: !!run.groupWeave, lensRevision: revision.number, reviewed: revision.status === "reviewed", groups, total: candidates.length, callsRemaining: run.maxCalls - run.calls, costLimitMicros: 2 * run.callReservationMicros };
  });
}
export async function prepareGroupWeave(store: Store, runId: string, lensId: string, lensRevision: number, choices: GroupChoice[]) {
  return store.transaction(async () => {
    const run = await settled(store, runId), s = await state(store, run, lensId);
    if (s.revision.number !== lensRevision) throw new Error("This lens changed. Reload before preparing.");
    if (s.revision.status !== "reviewed") throw new Error("Review this lens before exploring across groups.");
    if (choices.length !== 2 || new Set(choices.map(c => c.groupId)).size !== 2 || new Set(choices.map(c => c.candidateId)).size !== 2) throw new Error("Choose two candidates from distinct groups.");
    const memberKeys = new Map(s.lens.members.map(m => [m.candidateId, m.key]));
    const sources = choices.map(choice => {
      const group = s.revision.groups.find(g => g.id === choice.groupId), candidate = s.candidates.find(c => c.id === choice.candidateId);
      if (!group || !candidate || !group.members.includes(memberKeys.get(candidate.id) ?? "")) throw new Error("A selected candidate is outside its group.");
      if (!candidate.assessment || candidate.assessment.constraints === "violated") throw new Error("Choose assessed candidates without reported constraint violations.");
      return { ...candidate.snapshot, candidateId: candidate.id };
    });
    const preview: GroupWeavePreview = { id: randomUUID(), runId, lensId, lensRevision, lensName: s.revision.name, fingerprint: s.fingerprint, at: new Date().toISOString(), groups: choices.map(c => ({ id: c.groupId, label: s.revision.groups.find(g => g.id === c.groupId)!.label, candidateId: c.candidateId })), draft: { sources, weave: { version: 1, interaction: "", selections: sources.map(s => ({ id: randomUUID(), sourceId: s.id, sourceRevision: s.revision, candidateId: s.candidateId, text: (s.contribution || s.summary).slice(0, 2000) })) } }, costLimitMicros: 2 * run.callReservationMicros };
    await store.put("group-weave-preview", preview.id, runId, preview); return preview;
  });
}
export async function submitGroupWeave(store: Store, runId: string, previewId: string, input: WeaveInput) {
  return store.transaction(async () => {
    if (!await store.get(runId)) throw new Error("Run unavailable.");
    const weave = weaveInputSchema.parse(input);
    const existing = await store.scopedRecord<GroupWeaveRequest>(runId, `group-weave:${previewId}`);
    if (existing) { if (stableJson(existing.operation.weave) !== stableJson(weave)) throw new Error("This submission already exists with different contributions."); return existing; }
    const run = await settled(store, runId), preview = await store.scopedRecord<GroupWeavePreview>(runId, previewId);
    if (!preview?.draft || preview.runId !== runId) throw new Error("Preparation unavailable. Prepare again.");
    const s = await state(store, run, preview.lensId);
    if (s.fingerprint !== preview.fingerprint) throw new Error("This preparation is stale. Prepare again before submitting.");
    if (weave.variantOf) throw new Error("Group Weave starts a new bounded result.");
    validateWeaveInput(weave, preview.draft.sources);
    const config = await appliedSelection(store, run), parents = preview.groups.map(g => g.candidateId);
    const operation = operationSchema.parse({ id: randomUUID(), version: 1, kind: "weave", goal: run.goal, constraints: run.constraints, sources: preview.draft.sources, exposure: [], intent: "Explore an interaction between the explicitly selected groups and contributions", step: Math.floor(run.calls / 2) + 1, count: 1, runId, weave,
      groupWeave: { requestId: preview.id, lensId: preview.lensId, lensRevision: preview.lensRevision, groups: preview.groups },
      ...(config ? { selection: selectionReceipt(config, selectWithLens(s.candidates, config, Math.floor(run.calls / 2)), parents, "Explicit group Weave; the user chose these exact candidates separately from automatic population selection") } : {}) });
    const request: GroupWeaveRequest = { id: preview.id, runId, at: new Date().toISOString(), operation, costLimitMicros: preview.costLimitMicros };
    await store.put("group-weave-request", `group-weave:${request.id}`, runId, request);
    run.groupWeave = request.id; await store.save(run); return request;
  });
}
export async function groupWeaveProgress(store: Store, runId: string, requestId: string): Promise<GroupWeaveProgress> {
  const request = await store.scopedRecord<GroupWeaveRequest>(runId, `group-weave:${requestId}`);
  if (!request) throw new Error("Group Weave unavailable.");
  const attempts = (await store.attempts(runId)).filter(a => a.groupWeaveId === requestId), inFlight = attempts.some(a => a.status === "reserved");
  const candidate = await store.candidateForOperation(runId, request.operation.id);
  if (candidate) { candidate.assessment = (await store.assessments(runId, candidate.id))[0]; candidate.admission = candidate.assessment ? candidate.assessment.constraints === "violated" ? "rejected" : "eligible" : "pending"; }
  const failed = attempts.find(a => ["failed", "uncertain", "cancelled"].includes(a.status));
  const cancelled = (await store.get(runId))?.status === "stopped";
  const completed = attempts.some(a => a.stage === "assessment" && a.status === "committed");
  const status = completed ? "completed" : failed ? failed.status === "cancelled" ? "cancelled" : "inconclusive" : cancelled ? "cancelled" : candidate ? "assessing" : attempts.length ? "weaving" : "queued";
  return { request, candidate, status, finished: completed || !!failed || cancelled, inFlight, error: failed?.error, calls: attempts.length };
}
export async function settleGroupWeave(store: Store, runId: string, requestId: string) {
  return store.transaction(async () => {
    const run = await store.get(runId); if (run?.groupWeave !== requestId) return;
    if ((await groupWeaveProgress(store, runId, requestId)).finished) { delete run.groupWeave; await store.save(run); }
  });
}
