"use client";
import { useEffect, useRef, useState } from "react";
import { Button } from "../../components/ui/controls";
import SelectionControls from "./selection-controls";
import GroupWeaveControls from "./group-weave-controls";
import LensWorkspace from "../lenses/editor";
import { currentLens, type Lens, type LensEdit, type LensMember } from "../lenses/domain";
async function fetchLenses(runId: string, signal?: AbortSignal): Promise<{ lenses: Lens[]; members: LensMember[] }> {
  const response = await fetch(`/api/expedition/lenses?runId=${runId}`, { signal });
  const data = await response.json();
  if (!response.ok || !data.coverage?.complete) throw new Error(data.error ?? "Complete corpus unavailable");
  return data;
}
export default function ExpeditionLenses({ runId, runStatus }: { runId: string; runStatus?: string }) {
  const [lenses, setLenses] = useState<Lens[]>([]), [members, setMembers] = useState<LensMember[]>([]), [activeId, setActiveId] = useState<string | null>(null);
  const [busy, setBusy] = useState(true), [loaded, setLoaded] = useState(false), [error, setError] = useState("");
  const submitting = useRef(false);
  async function reload() {
    setBusy(true); setError("");
    try { const data = await fetchLenses(runId); setLenses(data.lenses); setMembers(data.members); setActiveId(id => data.lenses.some(l => l.id === id) ? id : data.lenses[0]?.id ?? null); setLoaded(true); }
    catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  }
  useEffect(() => {
    const controller = new AbortController();
    void fetchLenses(runId, controller.signal).then(data => { if (controller.signal.aborted) return; setLenses(data.lenses); setMembers(data.members); setActiveId(data.lenses[0]?.id ?? null); setLoaded(true); }).catch(e => { if (!controller.signal.aborted) setError(e instanceof Error ? e.message : String(e)); }).finally(() => { if (!controller.signal.aborted) setBusy(false); });
    return () => controller.abort();
  }, [runId]);
  async function save(command: { id: string; expectedRevision: number; name?: string; seed?: string; edit?: LensEdit }) {
    if (submitting.current) return;
    submitting.current = true; setBusy(true); setError("");
    try { const response = await fetch("/api/expedition/lenses", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ runId, ...command }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error); setLenses(ls => [...ls.filter(l => l.id !== data.lens.id), data.lens]); setActiveId(data.lens.id); }
    finally { submitting.current = false; setBusy(false); }
  }
  async function place(candidateId: string, groupId: string | null) {
    const data = await fetchLenses(runId), lens = data.lenses.find(l => l.id === activeId), member = data.members.find(m => m.candidateId === candidateId);
    if (!lens || !member) throw new Error("Result unavailable. Reload lenses.");
    let revision = currentLens(lens).number;
    if (!currentLens(lens).members.includes(member.key)) { await save({ id: lens.id, expectedRevision: revision, edit: { kind: "include", members: [member] } }); revision++; }
    await save({ id: lens.id, expectedRevision: revision, edit: { kind: "move", members: [member.key], groupId } });
    await reload();
  }
  const activeLens = lenses.find(l => l.id === activeId);
  return <section aria-label="Expedition lenses">
    <p className="small-note">Interpret this corpus without changing exploration. Editing and switching lenses make no model calls.</p>
    <Button disabled={busy} onClick={() => void reload()}>Reload lenses</Button>
    {busy && <p role="status">Loading or saving lens…</p>}{error && <p role="alert">{error}</p>}
    {loaded && <LensWorkspace actions={activeLens && <><SelectionControls key={`selection-${activeId}`} runId={runId} runStatus={runStatus} lens={activeLens} members={members} /><GroupWeaveControls key={`weave-${activeId}`} runId={runId} runStatus={runStatus} lens={activeLens} place={place} /></>} lenses={lenses} members={members} activeId={activeId} choose={setActiveId} busy={busy} seededLabel="Existing assessor mechanism groups"
      create={(name, seeded) => save({ id: crypto.randomUUID(), expectedRevision: 0, name, seed: seeded ? "mechanisms" : "manual" })}
      edit={edit => { const lens = lenses.find(l => l.id === activeId)!; return save({ id: lens.id, expectedRevision: currentLens(lens).number, edit }); }}
      inspect={async member => { const response = await fetch(`/api/expedition/runs?id=${runId}&candidateId=${member.candidateId}`); const data = await response.json(); if (!response.ok || data.candidate?.id !== member.candidateId) throw new Error("Candidate unavailable"); return data.candidate.snapshot.body; }} />}
  </section>;
}
