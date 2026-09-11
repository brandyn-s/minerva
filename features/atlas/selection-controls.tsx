"use client";
import { LoadingStatus } from "../../components/ui/loading-status";
import { useEffect, useRef, useState } from "react";
import { Button, Field, Input, Summary } from "../../components/ui/controls";
import { currentLens, type Lens, type LensMember } from "../lenses/domain";
import type { SelectionConfiguration } from "../experiments/selection";
import type { SelectionPreview, SelectionApplication } from "../experiments/selection-service";

type State = { status: string; capacity: number; inFlight: boolean; active: string[]; configuration: SelectionConfiguration | null };
async function request(url: string, body?: unknown) {
  const response = await fetch(url, body ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : undefined);
  const data = await response.json(); if (!response.ok) throw new Error(data.error ?? "Selection unavailable"); return data;
}
export default function SelectionControls({ runId, lens, members, runStatus }: { runId: string; lens: Lens; members: LensMember[]; runStatus?: string }) {
  const [open, setOpen] = useState(false), [state, setState] = useState<State>(), [protectedIds, setProtectedIds] = useState<string[]>([]), [query, setQuery] = useState("");
  const [preview, setPreview] = useState<SelectionPreview>(), [applied, setApplied] = useState<SelectionApplication>(), [error, setError] = useState(""), [busy, setBusy] = useState(false);
  const pending = useRef(false), revision = currentLens(lens);
  const previewSection = useRef<HTMLElement>(null);
  useEffect(() => {
    const section = previewSection.current, body = section?.closest<HTMLElement>(".pane-body");
    if (preview && section && body) body.scrollTop += section.getBoundingClientRect().top - body.getBoundingClientRect().top - 12;
  }, [preview]);
  const status = runStatus ?? state?.status;
  const stale = preview && (preview.configuration.lensRevision !== revision.number || status !== "paused");
  const titles = new Map([...members.map(m => [m.candidateId!, m.title] as const), ...(preview?.candidates.map(c => [c.id, c.title] as const) ?? [])]);
  const title = (id: string) => titles.get(id) ?? id;
  async function run(action: () => Promise<void>) { if (pending.current) return; pending.current = true; setBusy(true); setError(""); try { await action(); } catch (e) { setError(e instanceof Error ? e.message : String(e)); } finally { pending.current = false; setBusy(false); } }
  async function refresh(initial = false) { const next: State = await request(`/api/expedition/selection?runId=${runId}`); setState(next); if (initial) setProtectedIds(next.configuration?.protectedIds ?? []); }
  const rows = members.filter(m => m.title.toLowerCase().includes(query.toLowerCase()));
  return <section className="selection-controls" aria-label="Use lens for exploration">
    <Button aria-expanded={open} onClick={() => { if (!open) { setPreview(undefined); setApplied(undefined); void run(() => refresh(true)); } setOpen(v => !v); }}>Use for exploration</Button>
    {open && <>
      <p>Preview which eligible candidates this lens will retain. Applying keeps the expedition paused; resume when ready.</p>
      {state && <>
        <p className="small-note">Capacity {state.capacity} · protect up to {state.capacity - 1}. {state.configuration ? `Applied: ${state.configuration.name}, lens revision ${state.configuration.lensRevision}, selection ${state.configuration.revision}.` : "No lens has been applied."}</p>
        {status !== "paused" && <p role="status">{status === "running" ? "Pause the expedition before previewing." : "Selection changes require a paused expedition. This run has ended."}</p>}
        {status === "running" && <Button disabled={busy} onClick={() => void run(async () => { await request("/api/expedition/runs", { action: "pause", id: runId }); await refresh(); })}>Pause expedition</Button>}
        {state.inFlight && <LoadingStatus title="Finishing the current generation…" description="Refresh after it finishes." />}
        <Button disabled={busy} onClick={() => void run(() => refresh())}>Refresh run state</Button>
        <details><Summary>Protect candidates · {protectedIds.length} selected</Summary>
          <p className="small-note">Protection retains an eligible candidate. Missing assessments or reported constraint violations prevent retention.</p>
          <Field label="Find a candidate to protect"><Input aria-label="Find a candidate to protect" value={query} onChange={e => setQuery(e.target.value)} /></Field>
          <ul className="lens-members">{rows.slice(0, 30).map(m => <li key={m.key}><label className="lens-check"><Input type="checkbox" aria-label={`Protect ${m.title}`} checked={protectedIds.includes(m.candidateId!)} disabled={busy} onChange={() => { setProtectedIds(ids => ids.includes(m.candidateId!) ? ids.filter(id => id !== m.candidateId) : [...ids, m.candidateId!]); setPreview(undefined); setApplied(undefined); }} />{m.title}</label></li>)}</ul>
          {rows.length > 30 && <p className="small-note">Showing 30 of {rows.length}; search to reach every candidate. Your other selections are retained.</p>}
        </details>
        {revision.status !== "reviewed" && <p className="small-note">Mark this lens reviewed before applying it to exploration.</p>}
        <Button disabled={busy || status !== "paused" || state.inFlight || revision.status !== "reviewed"} onClick={() => void run(async () => { const data = await request("/api/expedition/selection", { action: "preview", runId, lensId: lens.id, lensRevision: revision.number, protectedIds }); setPreview(data.preview); setApplied(undefined); })}>{preview ? "Recompute preview" : "Preview population"}</Button>
      </>}
      {preview && <section ref={previewSection} aria-label="Selection preview">
        <h3>{preview.configuration.name} · lens revision {preview.configuration.lensRevision}</h3>
        <p role="status">{preview.decision.active.length} of {preview.configuration.capacity} slots · {preview.entering.length} entering · {preview.leaving.length} leaving</p>
        <p className="small-note">{preview.candidates.length} candidates considered · selection step {preview.decision.step}. Current assessments determine eligibility. Unassigned and new candidates use separate provisional buckets.</p>
        <details open><Summary>Entering · {preview.entering.length}</Summary><ul>{preview.entering.map(id => <li key={id}>{title(id)}</li>)}</ul></details>
        <details><Summary>Leaving the active population · {preview.leaving.length}</Summary><p className="small-note">These candidates remain in the archive.</p><ul>{preview.leaving.map(id => <li key={id}>{title(id)}</li>)}</ul></details>
        <details><Summary>Retained candidates and reasons</Summary><ul>{preview.decision.reasons.map(r => <li key={r.candidateId}>{title(r.candidateId)} — {r.reason}{preview.decision.uncertain.includes(r.candidateId) ? "; constraints remain uncertain" : ""}</li>)}</ul></details>
        <details><Summary>Groups · {preview.decision.groups.length} · {preview.decision.omittedGroups.length} omitted by capacity</Summary><ul>{preview.decision.groups.map(g => <li key={g.id}>{g.label}: {g.retained.length} retained / {g.eligible.length} eligible{preview.decision.omittedGroups.includes(g.id) ? " · omitted this step; opportunity rotates with the recorded seed and step" : ""}</li>)}</ul></details>
        <details><Summary>Protection changes</Summary><p>Protected: {preview.configuration.protectedIds.map(title).join(", ") || "None"}.</p><p>Protection removed: {preview.previousProtectedIds.filter(id => !preview.configuration.protectedIds.includes(id)).map(title).join(", ") || "None"}.</p></details>
        {preview.decision.excluded.some(c => c.protected) && <p role="status">Protected but not eligible: {preview.decision.excluded.filter(c => c.protected).map(c => `${title(c.candidateId)} (${c.reason})`).join("; ")}.</p>}
        {stale && !applied && <p role="alert">The lens or run changed. Recompute before applying.</p>}
        {!applied && <Button variant="primary" disabled={busy || !!stale} onClick={() => void run(async () => { const data = await request("/api/expedition/selection", { action: "apply", runId, previewId: preview.id }); setApplied(data.application); await refresh(); })}>Apply preview · stay paused</Button>}
      </section>}
      {applied && <section aria-label="Applied selection"><p role="status">Selection {applied.revision} applied: {applied.active.length} retained. {status === "paused" ? "The expedition stays paused." : `Run status: ${status}.`}</p><Button disabled={busy || status !== "paused"} onClick={() => void run(async () => { await request("/api/expedition/runs", { action: "resume", id: runId }); await refresh(); })}>Resume expedition</Button><p className="small-note">Resume uses the existing call and spending limits.</p></section>}
      {busy && <LoadingStatus title="Updating selection…" />}{error && <p role="alert">{error}</p>}
    </>}
  </section>;
}
