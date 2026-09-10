import { randomUUID } from "node:crypto";
import { z } from "zod";
import type { Store as ExperimentStore } from "./store-contract";
import type { Candidate } from "./contracts";
// A bounded executable model, not execution of generated code. Model selection is
// explicit: this tests a proposed formalization, not the truth of the source prose.
export const probeSchema = z.object({ runId: z.string().uuid(), candidateId: z.string().uuid(), model: z.enum(["central-queue", "independent-reservations"]), capacity: z.number().int().min(1).max(100), requests: z.array(z.number().int().min(0).max(100)).min(1).max(100) });
export async function probe(store: ExperimentStore, raw: z.infer<typeof probeSchema>) {
    const input = probeSchema.parse(raw), candidate = (await store.scopedRecord<Candidate>(input.runId, input.candidateId));
    if (!candidate)
        throw new Error("Candidate unavailable");
    let remaining = input.capacity;
    const allocations = input.requests.map(request => { const allocated = Math.min(request, input.model === "central-queue" ? remaining : input.capacity); if (input.model === "central-queue")
        remaining -= allocated; return allocated; });
    const total = allocations.reduce((a, b) => a + b, 0);
    const result = { id: randomUUID(), version: 1, level: "simulation", candidateId: candidate.id, sourceRevision: candidate.snapshot.revision, input, allocations, total, capacityPreserved: total <= input.capacity, at: new Date().toISOString(), limitation: "Observation in an explicitly selected toy allocation model; the mapping from idea to model is not independently validated." };
    (await store.put("probe", result.id, input.runId, result));
    return result;
}
