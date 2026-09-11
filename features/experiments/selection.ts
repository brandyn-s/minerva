import { z } from "zod";
import { currentLens, type Lens } from "../lenses/domain";
import type { Store } from "./store-contract";
import type { Run, Candidate } from "./contracts";

export const selectionReceiptSchema = z.object({ configurationId: z.string().uuid(), revision: z.number().int().positive(), lensId: z.string().uuid(), lensRevision: z.number().int().positive(), policy: z.literal("reviewed-lens-v1"), step: z.number().int().nonnegative(), activeCandidateIds: z.array(z.string()), parentIds: z.array(z.string()), reason: z.string(), reasons: z.array(z.object({ candidateId: z.string(), reason: z.string() })) });
export type SelectionReceipt = z.infer<typeof selectionReceiptSchema>;
export type SelectionConfiguration = { id: string; runId: string; revision: number; appliedAt: string; policy: "reviewed-lens-v1"; lensId: string; lensRevision: number; name: string; groups: { id: string; label: string; members: string[]; representative: string | null }[]; unassigned: string[]; assessments: { candidateId: string; assessmentId?: string }[]; protectedIds: string[]; capacity: number; seed: number };
export type SelectionGroup = { id: string; label: string; members: string[]; representative: string | null; provisional: boolean };
export type SelectionDecision = { step: number; active: string[]; groups: (SelectionGroup & { eligible: string[]; retained: string[] })[]; reasons: { candidateId: string; reason: string }[]; excluded: { candidateId: string; reason: string; protected: boolean }[]; protectedEligible: string[]; omittedGroups: string[]; uncertain: string[] };
export function configurationFromLens(lens: Lens, run: { id: string; capacity: number; seed: number }, protectedIds: string[], revision: number): SelectionConfiguration {
  const r = currentLens(lens);
  if (lens.scope.kind !== "run" || lens.scope.runId !== run.id) throw new Error("Choose a lens from this expedition.");
  if (r.status !== "reviewed") throw new Error("Review this lens before using it for exploration.");
  if (new Set(protectedIds).size !== protectedIds.length) throw new Error("Duplicate protected candidates.");
  if (protectedIds.length >= run.capacity) throw new Error(`Protect at most ${run.capacity - 1} candidates to leave space for exploration.`);
  const member = new Map(lens.members.map(m => [m.key, m]));
  const candidate = (key: string) => { const id = member.get(key)?.candidateId; if (!id) throw new Error("Exact candidate reference unavailable."); return id; };
  return { id: crypto.randomUUID(), runId: run.id, revision, appliedAt: new Date().toISOString(), policy: "reviewed-lens-v1", lensId: lens.id, lensRevision: r.number, name: r.name, groups: r.groups.map(g => ({ id: g.id, label: g.label, members: g.members.map(candidate), representative: g.representative ? candidate(g.representative) : null })), unassigned: r.unassigned.map(candidate), assessments: r.members.map(key => ({ candidateId: candidate(key), assessmentId: member.get(key)!.assessmentId })), protectedIds: [...protectedIds].sort(), capacity: run.capacity, seed: run.seed };
}
export function selectionGroups(candidates: Candidate[], config: SelectionConfiguration): SelectionGroup[] {
  const known = new Set(candidates.map(c => c.id)), assigned = new Set(config.groups.flatMap(g => g.members));
  const groups: SelectionGroup[] = config.groups.map(g => ({ ...g, members: g.members.filter(id => known.has(id)), provisional: false }));
  const provisional = new Map<string, SelectionGroup>();
  for (const c of candidates) {
    if (assigned.has(c.id)) continue;
    const mechanism = c.assessment?.mechanism.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
    const key = mechanism ? `provisional:${mechanism}` : "unassessed";
    const group = provisional.get(key) ?? { id: key, label: mechanism ? `Provisional: ${c.assessment!.mechanism}` : "Awaiting assessment", members: [], representative: null, provisional: true };
    group.members.push(c.id); provisional.set(key, group);
  }
  return [...groups, ...provisional.values()];
}
export function selectWithLens(candidates: Candidate[], config: SelectionConfiguration, step: number): SelectionDecision {
  if (!Number.isInteger(step) || step < 0) throw new Error("Invalid selection step.");
  const byId = new Map(candidates.map(c => [c.id, c]));
  if (config.protectedIds.some(id => !byId.has(id))) throw new Error("A protected candidate is unavailable.");
  if (config.protectedIds.length >= config.capacity) throw new Error("Protected candidates leave no space for exploration.");
  const eligible = (id: string) => { const c = byId.get(id); return !!c?.assessment && c.assessment.constraints !== "violated"; };
  const score = (id: string) => { const a = byId.get(id)?.assessment; return Number(a?.constraints === "preserved") + Number(a?.actionability === "supported"); };
  const rank = (a: string, b: string) => score(b) - score(a) || (a < b ? -1 : a > b ? 1 : 0);
  const groups = selectionGroups(candidates, config).map(g => ({ ...g, eligible: g.members.filter(eligible).sort(rank), retained: [] as string[] }));
  const protectedEligible = config.protectedIds.filter(eligible).sort(), active = [...protectedEligible];
  const reasons = protectedEligible.map(candidateId => ({ candidateId, reason: "Explicitly protected and currently eligible" }));
  const available = groups.filter(g => g.eligible.length).sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  const offset = available.length ? ((config.seed + step) % available.length + available.length) % available.length : 0;
  const order = [...available.slice(offset), ...available.slice(0, offset)];
  // Protected members already represent their groups. Allocate remaining slots across other groups.
  for (const g of order) {
    if (active.length >= config.capacity) break;
    if (g.eligible.some(id => active.includes(id))) continue;
    const candidateId = g.representative && g.eligible.includes(g.representative) ? g.representative : g.eligible[0];
    active.push(candidateId); reasons.push({ candidateId, reason: `${g.provisional ? "Provisional bucket" : "Reviewed group"}: ${g.label}; ${candidateId === g.representative ? "chosen representative" : "quality rank, then candidate ID"}` });
  }
  for (const g of groups) g.retained = g.members.filter(id => active.includes(id));
  return { step, active, groups, reasons, protectedEligible, omittedGroups: available.filter(g => !g.retained.length).map(g => g.id), uncertain: active.filter(id => byId.get(id)!.assessment!.constraints === "unclear"), excluded: candidates.filter(c => !eligible(c.id)).map(c => ({ candidateId: c.id, protected: config.protectedIds.includes(c.id), reason: c.assessment ? "Latest assessment reports a constraint violation" : "Awaiting assessment" })) };
}
export function selectionReceipt(config: SelectionConfiguration, decision: SelectionDecision, parentIds: string[], reason: string): SelectionReceipt {
  return { configurationId: config.id, revision: config.revision, lensId: config.lensId, lensRevision: config.lensRevision, policy: config.policy, step: decision.step, activeCandidateIds: decision.active, parentIds, reason, reasons: decision.reasons };
}

export async function appliedSelection(store: Store, run: Run) {
  if (!run.selection) return undefined;
  const config = await store.scopedRecord<SelectionConfiguration>(run.id, run.selection.id);
  if (!config || config.runId !== run.id || config.revision !== run.selection.revision || config.policy !== "reviewed-lens-v1") throw new Error("Applied selection configuration unavailable.");
  return config;
}
