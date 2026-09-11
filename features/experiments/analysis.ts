import { randomUUID } from "node:crypto";
import { appliedSelection, selectWithLens } from "./selection";
import type { Candidate, Assessment, Reading, Run } from "./contracts";
import type { Store as ExperimentStore } from "./store-contract";
export async function corpus(store: ExperimentStore, runId: string): Promise<Candidate[]> {
    const assessments = (await store.all<Assessment>(runId, "assessment"));
    const latest = new Map(assessments.map(a => [a.candidateId, a]));
    return (await store.all<Candidate>(runId, "candidate")).map(c => ({ ...c, assessment: latest.get(c.id), admission: latest.has(c.id) ? latest.get(c.id)!.constraints === "violated" ? "rejected" : "eligible" : "pending" }));
}
export function mechanismKey(candidate: Candidate) {
    // Explicit baseline equivalence, not a claim of semantic identity.
    return candidate.assessment?.mechanism.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}
export function selectPopulation(candidates: Candidate[], run: Run): string[] {
    const eligible = candidates.filter(c => c.assessment && c.assessment.constraints !== "violated");
    const rank = (c: Candidate) => Number(c.assessment?.constraints === "preserved") + Number(c.assessment?.actionability === "supported");
    const sorted = [...eligible].sort((a, b) => rank(b) - rank(a));
    if (run.policy === "fitness")
        return sorted.slice(0, run.capacity).map(c => c.id);
    if (run.policy === "independent")
        return eligible.slice(-run.capacity).map(c => c.id);
    const niches = new Map<string, Candidate>();
    for (const c of sorted) {
        const key = run.policy === "scorebook-baseline" ? c.assessment?.behavior ? JSON.stringify(c.assessment.behavior) : undefined : mechanismKey(c);
        if (key && !niches.has(key))
            niches.set(key, c);
    }
    return [...niches.values()].slice(0, run.capacity).map(c => c.id);
}
export async function analyze(store: ExperimentStore, runId: string): Promise<Reading> {
    return store.transaction(async () => {
    const run = await store.get(runId);
    if (!run) throw new Error("Run unavailable");
    const candidates = await corpus(store, runId), config = await appliedSelection(store, run);
    const groups = new Map<string, { members: Candidate[]; label: string; reviewed: boolean; representative?: string }>();
    const decision = config ? selectWithLens(candidates, config, Math.floor(run.calls / 2)) : undefined;
    if (decision) {
        const byId = new Map(candidates.map(c => [c.id, c]));
        for (const group of decision.groups) if (group.members.length) groups.set(group.id, { members: group.members.map(id => byId.get(id)!), label: group.label, reviewed: !group.provisional, representative: group.retained[0] ?? group.eligible[0] ?? group.members[0] });
    } else for (const c of candidates) {
        const key = mechanismKey(c);
        if (key) { const group = groups.get(key) ?? { members: [], label: c.assessment!.mechanism, reviewed: false }; group.members.push(c); groups.set(key, group); }
    }
    const groupSizes = new Map([...groups.values()].flatMap(g => g.members.map(c => [c.id, g.members.length] as const)));
    const reading: Reading = { id: randomUUID(), runId, version: 1, at: new Date().toISOString(), through: candidates.length,
        ...(config ? { selection: { configurationId: config.id, revision: config.revision, lensId: config.lensId, lensRevision: config.lensRevision, step: decision!.step } } : {}),
        representation: config ? `${config.name} · lens revision ${config.lensRevision} · ${config.policy}` : "assessor-mechanism-normalization-v1", coverage: { candidates: candidates.length, assessed: candidates.filter(c => c.assessment).length, excluded: candidates.filter(c => !c.assessment).length },
        groups: [...groups.values()].map(({ members, label, reviewed, representative }) => {
            const roots = [...new Set(members.flatMap(c => c.rootIds))];
            // Only independently generated roots with no population exposure are evidence for independent returns.
            const independent = members.filter(c => c.parents.length === 0 && c.exposure.length === 0).length >= 2;
            return { mechanism: label, candidates: members.map(c => c.id), representative: representative ?? members[0].id, roots, independent, status: reviewed ? "reviewed group" : independent && !config ? "candidate recurrence" : "provisional group" };
        }),
        unusual: candidates.filter(c => !c.assessment || (groupSizes.get(c.id) ?? 0) === 1).map(c => c.id),
        observations: [], hypotheses: [], limitations: [...(config ? ["Reviewed groups reflect an applied human interpretation; new and unassigned candidates use separate provisional buckets. Admission still follows the latest assessment."] : []), "Textual assessments may disagree or conflate different mechanisms; exact normalized labels are only a baseline lens.", "Shared brief, model and evaluator are common exposure even for independent roots.", "Sampling is unequal and coverage is not exhaustive. Group frequency is not attraction strength.", "No causal attractor, real-world feasibility, or global novelty claim is established."] };
    const probes = (await store.all<{
        id: string;
        candidateId: string;
        capacityPreserved: boolean;
        input: {
            model: string;
        };
    }>(runId, "probe"));
    reading.probes = probes.map(p => ({ id: p.id, candidateId: p.candidateId, capacityPreserved: p.capacityPreserved, model: p.input.model }));
    reading.observations = [`${reading.coverage.assessed} of ${candidates.length} candidate revisions have textual assessments.`, `${reading.groups.filter(g => g.independent).length} groups include independent root returns under this lens.`];
    reading.observations.push(...probes.map(p => `Simulation ${p.id} on candidate ${p.candidateId}: capacity ${p.capacityPreserved ? "preserved" : "exceeded"} in explicitly selected model ${p.input.model}. This does not validate its correspondence to the idea.`));
    reading.hypotheses = reading.groups.filter(g => g.candidates.length > 1).map(g => `Test whether “${g.mechanism}” persists after a controlled change; inspect all ${g.candidates.length} supporting revisions and counterexamples.`);
    (await store.reading(reading));
    return reading;
    });
}
export function readingPreview(reading: Reading | undefined) {
    if (!reading)
        return undefined;
    return { ...reading, observations: reading.observations.slice(0, 20), probes: reading.probes?.slice(-20), groups: reading.groups.slice(0, 20).map(g => ({ ...g, candidateCount: g.candidates.length, candidates: g.candidates.slice(0, 5), roots: g.roots.slice(0, 5) })), unusual: reading.unusual.slice(0, 20), hypotheses: reading.hypotheses.slice(0, 20), preview: { totalGroups: reading.groups.length, totalUnusual: reading.unusual.length, maxCandidatesPerGroup: 5 } };
}
