import { createHash, randomUUID } from "node:crypto";
import { stableJson } from "../atlas/stable-json";
import { currentLens } from "../lenses/domain";
import { corpus } from "./analysis";
import { runLenses } from "./lenses";
import { configurationFromLens, selectWithLens, type SelectionConfiguration, type SelectionDecision, appliedSelection } from "./selection";
import type { Store } from "./store-contract";

export type SelectionPreview = { id: string; runId: string; at: string; fingerprint: string; configuration: SelectionConfiguration; decision: SelectionDecision; previous: string[]; previousProtectedIds: string[]; entering: string[]; leaving: string[]; candidates: { id: string; title: string; assessment: string }[] };
export type SelectionApplication = { id: string; previewId: string; runId: string; configurationId: string; revision: number; lensId: string; lensRevision: number; active: string[]; at: string };
async function snapshot(store: Store, runId: string, lensId: string) {
  const run = await store.get(runId);
  if (!run || run.status !== "paused") throw new Error("Pause this expedition before previewing or applying a lens.");
  if (run.groupWeave) throw new Error("Wait for the in-flight group Weave to settle before applying a lens.");
  const attempts = await store.attempts(runId);
  for (const a of attempts) if (a.status === "reserved" && a.leaseUntil < Date.now()) { a.status = "uncertain"; a.error = "Worker lease expired; reservation retained; invocation is not replayed"; await store.saveAttempt(a); }
  if (attempts.some(a => a.status === "reserved")) throw new Error("Wait for the in-flight call to settle before applying a lens.");
  const lens = (await runLenses(store, runId)).find(l => l.id === lensId);
  if (!lens) throw new Error("Lens unavailable. Reload lenses.");
  const candidates = await corpus(store, runId);
  const fingerprint = createHash("sha256").update(stableJson({ run, lens, candidates: candidates.map(c => [c.id, c.snapshot.id, c.snapshot.revision, c.assessment?.id ?? null]), attempts: attempts.map(a => [a.id, a.status]) })).digest("hex");
  return { run, lens, candidates, fingerprint };
}
export async function previewSelection(store: Store, runId: string, lensId: string, lensRevision: number, protectedIds: string[]) {
  return store.transaction(async () => {
    const state = await snapshot(store, runId, lensId);
    if (currentLens(state.lens).number !== lensRevision) throw new Error("This lens changed. Reload it before previewing.");
    const configuration = configurationFromLens(state.lens, state.run, protectedIds, (state.run.selection?.revision ?? 0) + 1);
    // Lens membership stays frozen; admission uses the current complete corpus.
    configuration.assessments = state.candidates.map(c => ({ candidateId: c.id, assessmentId: c.assessment?.id }));
    const decision = selectWithLens(state.candidates, configuration, Math.floor(state.run.calls / 2));
    const preview: SelectionPreview = { id: randomUUID(), runId, at: new Date().toISOString(), fingerprint: state.fingerprint, configuration, decision, previous: state.run.active, previousProtectedIds: (await appliedSelection(store, state.run))?.protectedIds ?? [], entering: decision.active.filter(id => !state.run.active.includes(id)), leaving: state.run.active.filter(id => !decision.active.includes(id)), candidates: state.candidates.map(c => ({ id: c.id, title: c.snapshot.title, assessment: c.assessment?.constraints ?? "pending" })) };
    await store.put("selection-preview", preview.id, runId, preview);
    return preview;
  });
}
export async function applySelection(store: Store, runId: string, previewId: string) {
  return store.transaction(async () => {
    // Acquire the same run lock as control, worker reservation and lens edits.
    if (!await store.get(runId)) throw new Error("Run unavailable.");
    const existing = await store.scopedRecord<SelectionApplication>(runId, `applied:${previewId}`);
    if (existing) return existing;
    const preview = await store.scopedRecord<SelectionPreview>(runId, previewId);
    if (!preview || !preview.configuration || preview.runId !== runId) throw new Error("Selection preview unavailable.");
    const state = await snapshot(store, runId, preview.configuration.lensId);
    if (state.fingerprint !== preview.fingerprint) throw new Error("This preview is stale. Recompute it before applying.");
    const configuration = { ...preview.configuration, appliedAt: new Date().toISOString() };
    const decision = selectWithLens(state.candidates, configuration, preview.decision.step);
    if (stableJson(decision) !== stableJson(preview.decision)) throw new Error("Selection changed. Recompute the preview.");
    const application: SelectionApplication = { id: `applied:${previewId}`, previewId, runId, configurationId: configuration.id, revision: configuration.revision, lensId: configuration.lensId, lensRevision: configuration.lensRevision, active: decision.active, at: configuration.appliedAt };
    await store.put("selection-configuration", configuration.id, runId, configuration);
    await store.put("selection-application", application.id, runId, application);
    state.run.selection = { id: configuration.id, revision: configuration.revision };
    state.run.active = [...decision.active];
    await store.save(state.run);
    return application;
  });
}
