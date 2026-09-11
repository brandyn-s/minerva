import { corpus, mechanismKey } from "./analysis";
import { currentLens, editLens, lensSchema, memberKey, newLens, type Lens, type LensEdit, type LensMember } from "../lenses/domain";
import type { Store } from "./store-contract";

export async function runLensCorpus(store: Store, runId: string) {
  const candidates = await corpus(store, runId);
  const members: LensMember[] = candidates.map(c => ({ key: memberKey({ sourceId: c.snapshot.id, revision: c.snapshot.revision, candidateId: c.id }), sourceId: c.snapshot.id, revision: c.snapshot.revision, candidateId: c.id, assessmentId: c.assessment?.id, title: c.snapshot.title, summary: c.snapshot.summary }));
  const buckets = new Map<string, { label: string; members: string[] }>();
  for (const c of candidates) { const key = mechanismKey(c); if (!key) continue; const g = buckets.get(key) ?? { label: c.assessment!.mechanism.slice(0, 120), members: [] }; g.members.push(`candidate:${c.id}`); buckets.set(key, g); }
  return { members, groups: [...buckets.values()] };
}
export async function runLenses(store: Store, runId: string) {
  const records = await store.all<Lens>(runId, "lens"), latest = new Map<string, Lens>();
  for (const raw of records) { const lens = lensSchema.parse(raw), previous = latest.get(lens.id); if (!previous || currentLens(previous).number < currentLens(lens).number) latest.set(lens.id, lens); }
  return [...latest.values()];
}
export async function saveRunLens(store: Store, runId: string, command: { id: string; expectedRevision: number; name?: string; seed?: "manual" | "mechanisms"; edit?: LensEdit }) {
  const previous = (await runLenses(store, runId)).find(l => l.id === command.id);
  if ((previous ? currentLens(previous).number : 0) !== command.expectedRevision) throw new Error("This lens changed. Reload lenses before editing again.");
  let next: Lens;
  if (previous) {
    if (!command.edit) throw new Error("Lens edit required");
    let edit = command.edit;
    if (edit.kind === "include") { const { members } = await runLensCorpus(store, runId); const ids = new Set(edit.members.map(m => m.key)); const known = members.filter(m => ids.has(m.key)); if (known.length !== ids.size) throw new Error("Candidate unavailable"); edit = { kind: "include", members: known }; }
    next = editLens(previous, edit);
  } else {
    if (!command.name) throw new Error("Lens name required");
    const { members, groups } = await runLensCorpus(store, runId);
    next = newLens({ kind: "run", runId }, members, command.name, command.seed === "mechanisms" ? "assessor-mechanisms" : "manual", command.seed === "mechanisms" ? groups : [], command.id);
  }
  // Immutable per-revision identity also rejects two writers editing the same base.
  await store.put("lens", `${runId}:lens:${next.id}:${currentLens(next).number}`, runId, next);
  return next;
}
