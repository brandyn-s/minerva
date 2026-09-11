import { canAdvance, groupWeaveProgress, settleGroupWeave } from "./group-weave";
import { randomUUID } from "node:crypto";
import { appliedSelection, selectWithLens, selectionReceipt, type SelectionConfiguration, type SelectionDecision } from "./selection";
import { behaviorSpace } from "./contracts";
import type { Run, Operation, Candidate, Assessment, Attempt, Intervention } from "./contracts";
import { executeOperation, assess, planOperation, planAssessment, type Provider } from "./operators";
import type { Store as ExperimentStore } from "./store-contract";
import { corpus, selectPopulation, analyze } from "./analysis";
export function chooseOperation(run: Run, candidates: Candidate[], selection?: { config: SelectionConfiguration; decision: SelectionDecision }): Operation {
    const selected = selection ? selection.decision.active.map(id => candidates.find(c => c.id === id)!).filter(Boolean) : candidates.filter(c => run.active.includes(c.id));
    const initialWeave = !selection && run.calls === 0 && run.initial.length > 1;
    const iteration = Math.floor(run.calls / 2), modulus = Math.max(1, selected.length);
    const index = ((run.seed + iteration) % modulus + modulus) % modulus;
    const independent = run.policy === "independent" || (iteration > 0 && iteration % 4 === 0);
    const parent = selected[index]?.snapshot ?? (selection ? undefined : run.initial[0]);
    const kind = initialWeave ? "weave" : independent || !parent ? "root" : selected.length >= 2 && iteration % 3 === 0 ? "weave" : iteration % 3 === 2 ? "develop" : "wander";
    const sources = initialWeave ? run.initial : kind === "root" ? [] : kind === "weave" ? [selected[index].snapshot, selected[(index + Math.max(1, Math.floor(selected.length / 2))) % selected.length].snapshot] : [parent!];
    const selectedParents = sources.map(source => selected.find(c => c.snapshot === source)?.id).filter((id): id is string => !!id);
    const axes = Object.keys(behaviorSpace) as (keyof typeof behaviorSpace)[];
    const axis = axes[iteration % axes.length], values = behaviorSpace[axis];
    const targeted = run.policy === "scorebook-baseline" ? `Explore a different declared behavior: ${axis} = ${values[((run.seed + iteration) % values.length + values.length) % values.length]}. Preserve the goal.` : undefined;
    return { ...(selection ? { selection: selectionReceipt(selection.config, selection.decision, selectedParents, kind === "root" ? "Scheduled independent root; no population context" : "Selected from the applied lens population") } : {}), id: randomUUID(), version: 1, kind, goal: run.goal, constraints: run.constraints, sources, exposure: [], intent: run.direction || targeted || (kind === "develop" ? "Develop a concrete test while preserving the goal" : kind === "weave" ? "Combine the distinct source mechanisms" : "Explore a different operative mechanism"), step: iteration + 1, count: 1, runId: run.id, strategy: { policy: run.policy, iteration, reason: kind === "root" ? "Scheduled independent root; no population context" : `Select ${kind} from retained candidates in stable seeded order` } };
}
function candidateFrom(op: Operation, result: Awaited<ReturnType<typeof executeOperation>>, candidates: Candidate[]): Candidate {
    const id = randomUUID();
    const parents = op.groupWeave?.groups.map(g => g.candidateId) ?? op.selection?.parentIds ?? op.sources.map(s => candidates.findLast(c => c.snapshot.id === s.id && c.snapshot.revision === s.revision)?.id ?? `${s.id}@${s.revision}`);
    const rootIds = parents.length ? [...new Set(parents.flatMap(p => candidates.find(c => c.id === p)?.rootIds ?? [p]))] : [id];
    return { id, snapshot: { ...result.cards[0], id: op.kind === "develop" ? op.sources[0].id : id, revision: op.kind === "develop" ? op.sources[0].revision + 1 : 1 }, ...(result.weaveMappings ? { weaveMappings: result.weaveMappings } : {}), operationId: op.id, parents, exposure: op.exposure.map(s => `${s.id}@${s.revision}`), rootIds, admission: "pending", at: new Date().toISOString() };
}
export async function proposeIntervention(store: ExperimentStore, input: {
    runId: string;
    readingId: string;
    candidateId: string;
    challenge: string;
    intent: string;
    operationKind: "wander" | "develop";
}): Promise<Intervention> {
    const run = (await store.get(input.runId)), candidate = (await store.record<Candidate>(input.candidateId));
    const reading = (await store.record<{
        runId: string;
        groups: {
            candidates: string[];
        }[];
    }>(input.readingId));
    if (!run || !candidate || !reading || reading.runId !== run.id || !reading.groups.some(g => g.candidates.includes(candidate.id)))
        throw new Error("Intervention sources unavailable");
    const result: Intervention = { ...input, id: randomUUID(), allowance: 2, status: "proposed" };
    (await store.intervention(result));
    return result;
}
export async function tick(store: ExperimentStore, runId: string, provider: Provider, owner = randomUUID()): Promise<boolean> {
    (await store.recover(Date.now()));
    const run = (await store.get(runId));
    if (!run || !canAdvance(run))
        return false;
    const candidates = (await corpus(store, run.id)), attempts = (await store.attempts(run.id));
    const directed = run.groupWeave ? await groupWeaveProgress(store, run.id, run.groupWeave) : undefined;
    if (directed?.finished) { await settleGroupWeave(store, run.id, directed.request.id); return false; }
    if (directed?.inFlight) return false;
    if (!directed && attempts.length >= 3 && attempts.slice(-3).every(a => ["failed", "uncertain"].includes(a.status))) {
        (await store.transaction(async () => { const r = (await store.get(run.id))!; r.status = "completed"; r.reason = "Three consecutive failed or uncertain attempts; partial evidence retained"; (await store.save(r)); }));
        return false;
    }
    const config = await appliedSelection(store, run);
    const selection = config ? { config, decision: selectWithLens(candidates, config, Math.floor(run.calls / 2)) } : undefined;
    const reassessment = directed ? undefined : (await store.all<{
        id: string;
        candidateId: string;
        reason: string;
    }>(run.id, "assessment-request")).find(q => !attempts.some(a => a.assessmentRequestId === q.id));
    const pending = directed ? directed.candidate : reassessment ? candidates.find(c => c.id === reassessment.candidateId) : candidates.find(c => !c.assessment && !attempts.some(a => a.candidateId === c.id && a.stage === "assessment"));
    const intervention = directed ? undefined : (await store.interventions(run.id)).find(i => i.status === "proposed");
    let op: Operation;
    if (directed) op = directed.request.operation;
    else if (pending)
        op = (await store.record<Operation>(pending.operationId))!;
    else if (intervention) {
        const candidate = (await store.record<Candidate>(intervention.candidateId))!;
        op = { ...(selection ? { selection: selectionReceipt(selection.config, selection.decision, [candidate.id], "Explicit user intervention; source chosen separately from the retained population") } : {}), id: randomUUID(), version: 1, kind: intervention.operationKind, goal: run.goal, constraints: run.constraints, sources: [candidate.snapshot], exposure: [], intent: intervention.intent, step: 1, count: 1, runId: run.id };
    }
    else
        op = chooseOperation(run, candidates, selection);
    const manifest = pending ? planAssessment(pending, op) : planOperation(op);
    const attempt: Attempt = { groupWeaveId: directed?.request.id, selectionAtPlanning: run.selection?.id, controlVersionAtPlanning: run.controlVersion ?? 0, corpusVersionAtPlanning: run.corpusVersion ?? 0, maxCallsAtPlanning:run.maxCalls, assessmentRequestId: reassessment?.id, id: randomUUID(), runId: run.id, sequence: run.calls + 1, stage: pending ? "assessment" : "generation", candidateId: pending?.id, operation: op, status: "reserved", owner, leaseUntil: Date.now() + 120000, reservedMicros: run.callReservationMicros, cost: "reserved-upper-bound", manifest, at: new Date().toISOString() };
    if (!(await store.reserve(attempt)))
        return false;
    if (intervention && !pending) {
        intervention.status = "running";
        intervention.operationId = op.id;
        (await store.intervention(intervention));
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 90000);
    // Observe Stop independently of the initiating browser. Pause admits completion, no further dispatch.
    const cancellation = setInterval(() => { void Promise.resolve(store.get(run.id)).then(r=>{if(r?.status==="stopped")controller.abort();}).catch(()=>controller.abort()); }, 1000);
    try {
        if (pending) {
            const judgment = await assess(pending, op, provider, controller.signal, async (usage) => (await store.observeUsage(attempt.id, owner, usage)));
            const assessment: Assessment = { ...judgment, id: randomUUID(), candidateId: pending.id, version: 1, level: "textual", assessor: provider.name, at: new Date().toISOString(), sourceOperation: op.id };
            if ((await store.finish(attempt.id, owner, undefined, assessment))) {
                (await store.transaction(async () => { const current = (await store.get(run.id))!; const population = await corpus(store, run.id), applied = await appliedSelection(store, current); current.active = applied ? selectWithLens(population, applied, Math.floor(current.calls / 2)).active : selectPopulation(population, current); (await store.save(current)); }));
                const reading = (await analyze(store, run.id));
                for (const i of (await store.interventions(run.id)).filter(i => i.operationId === op.id)) {
                    i.status = "completed";
                    i.resultId = pending.id;
                    i.updatedReadingId = reading.id;
                    i.outcome = judgment.changed === "yes" && judgment.constraints === "preserved" && judgment.actionability === "supported" ? "Textually supported mechanism change preserving stated constraints; external validation pending" : "No supported escape under the stated assessment";
                    (await store.intervention(i));
                }
            }
        }
        else {
            const result = await executeOperation(op, provider, controller.signal, async (usage) => (await store.observeUsage(attempt.id, owner, usage)));
            const candidate = candidateFrom(op, result, candidates);
            (await store.finish(attempt.id, owner, candidate));
        }
    }
    catch (error) {
        (await store.finish(attempt.id, owner, undefined, undefined, error instanceof Error ? error.message : String(error)));
        for (const i of (await store.interventions(run.id)).filter(i => i.operationId === op.id)) {
            i.status = "inconclusive";
            i.outcome = "Operation or assessment failed; recorded evidence retained";
            (await store.intervention(i));
        }
    }
    finally {
        clearTimeout(timer);
        clearInterval(cancellation);
        if (directed) await settleGroupWeave(store, run.id, directed.request.id);
    }
    return true;
}
