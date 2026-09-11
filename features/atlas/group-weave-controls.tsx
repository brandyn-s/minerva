"use client";
import { LoadingStatus } from "../../components/ui/loading-status";
import { useEffect, useRef, useState } from "react";
import { Button, Field, Select, Summary } from "../../components/ui/controls";
import { currentLens, type Lens } from "../lenses/domain";
import type { GroupWeavePreview, GroupWeaveProgress, groupWeaveOptions } from "../experiments/group-weave";
import { WeaveFields } from "./weave-panel";
import type { WeaveDraft } from "./weave";

type Options = Awaited<ReturnType<typeof groupWeaveOptions>> & { history: GroupWeaveProgress[] };
async function request(body: unknown) {
  const response = await fetch("/api/expedition/group-weave", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await response.json(); if (!response.ok) throw new Error(data.error); return data;
}
export default function GroupWeaveControls({ runId, lens, runStatus, place }: { runId: string; lens: Lens; runStatus?: string; place: (candidateId: string, groupId: string | null) => Promise<void> }) {
  const [open, setOpen] = useState(false), [options, setOptions] = useState<Options>(), [choices, setChoices] = useState([{ groupId: "", candidateId: "" }, { groupId: "", candidateId: "" }]);
  const [preview, setPreview] = useState<GroupWeavePreview>(), [draft, setDraft] = useState<WeaveDraft>(), [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false), [error, setError] = useState(""), [notice, setNotice] = useState("");
  const [destinations, setDestinations] = useState<Record<string, string>>({});
  const pending = useRef(false), fetchSequence = useRef(0), region = useRef<HTMLElement>(null), revision = currentLens(lens);
  async function reload() {
    const sequence = ++fetchSequence.current, response = await fetch(`/api/expedition/group-weave?runId=${runId}&lensId=${lens.id}`), data = await response.json();
    if (!response.ok) throw new Error(data.error); if (sequence === fetchSequence.current) setOptions(data);
  }
  useEffect(() => {
    if (!open) return;
    let active = true;
    const refresh = async () => {
      const sequence = ++fetchSequence.current;
      try { const response = await fetch(`/api/expedition/group-weave?runId=${runId}&lensId=${lens.id}`), data = await response.json(); if (!response.ok) throw new Error(data.error); if (active && sequence === fetchSequence.current) setOptions(data); }
      catch (e) { if (active) setError(e instanceof Error ? e.message : String(e)); }
    };
    void refresh(); const timer = options?.pending ? setInterval(() => void refresh(), 2000) : undefined;
    return () => { active = false; clearInterval(timer); };
  }, [open, runId, lens.id, revision.number, runStatus, options?.pending]);
  useEffect(() => {
    const section = region.current, body = section?.closest<HTMLElement>(".pane-body");
    if (preview && section && body) body.scrollTop += section.getBoundingClientRect().top - body.getBoundingClientRect().top - 12;
  }, [preview]);
  async function act(action: () => Promise<void>) {
    if (pending.current) return; pending.current = true; setBusy(true); setError(""); setNotice("");
    try { await action(); } catch (e) { setError(e instanceof Error ? e.message : String(e)); } finally { pending.current = false; setBusy(false); }
  }
  function choose(index: number, groupId: string, candidateId?: string) {
    setChoices(rows => rows.map((row, i) => i === index ? { groupId, candidateId: candidateId ?? options?.groups.find(g => g.id === groupId)?.representative ?? "" } : row));
    setPreview(undefined); setSubmitted(false);
  }
  const stale = preview && (preview.lensRevision !== revision.number || options?.status !== "paused");
  return <section className="group-weave-controls" aria-label="Explore across groups">
    <Button aria-expanded={open} onClick={() => setOpen(v => !v)}>Explore across groups</Button>
    {open && <>
      <p>Choose two approaches, then decide what to carry forward. One Weave and its assessment use two calls from this expedition. It stays paused afterward.</p>
      <Button disabled={busy} onClick={() => void act(reload)}>Refresh group exploration</Button>
      {!options && !error && <LoadingStatus title="Loading group exploration…" />}
      {options && <>
        <p className="small-note">{options.total} candidates · {options.callsRemaining} calls remaining{options.costLimitMicros ? ` · up to $${(options.costLimitMicros / 1e6).toFixed(2)} from the existing allowance` : " · synthetic fixture"}.</p>
        {options.status !== "paused" && <p role="status">Pause the expedition before preparing a Weave.</p>}
        {options.status === "running" && <Button disabled={busy} onClick={() => void act(async () => { const r = await fetch("/api/expedition/runs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "pause", id: runId }) }); if (!r.ok) throw new Error("Could not pause this expedition."); await reload(); })}>Pause for group Weave</Button>}
        {!options.reviewed && <p>Mark this lens reviewed before exploring across its groups.</p>}
        <fieldset className="weave-fields" disabled={busy || options.pending}><legend className="sr-only">Choose groups and sources</legend>
          {choices.map((choice, index) => { const group = options.groups.find(g => g.id === choice.groupId); return <section key={index}>
            <Field label={`Approach ${index + 1}`}><Select aria-label={`Approach ${index + 1}`} value={choice.groupId} onChange={e => choose(index, e.target.value)}><option value="">Choose a group</option>{options.groups.map(g => <option key={g.id} value={g.id} disabled={choices[1 - index].groupId === g.id}>{g.label} · {g.members.length}</option>)}</Select></Field>
            {group && <Field label={`Source from ${group.label}`}><Select aria-label={`Source from ${group.label}`} value={choice.candidateId} onChange={e => choose(index, choice.groupId, e.target.value)}><option value="">Choose an eligible candidate</option>{group.members.map(m => <option key={m.id} value={m.id} disabled={!m.eligible}>{m.title} · r{m.revision}{m.id === group.representative ? " · proposed representative" : ""}{m.assessment !== "preserved" ? ` · ${m.assessment}` : ""}</option>)}</Select></Field>}
          </section>; })}
        </fieldset>
        <Button disabled={busy || options.pending || options.status !== "paused" || !options.reviewed || choices.some(c => !c.groupId || !c.candidateId)} onClick={() => void act(async () => { const data = await request({ action: "prepare", runId, lensId: lens.id, lensRevision: revision.number, choices }); const next: WeaveDraft = data.preview.draft; setPreview(data.preview); setDraft(previous => previous ? { ...next, weave: { ...next.weave, interaction: previous.weave.interaction, selections: next.weave.selections.map(s => { const old = previous.weave.selections.find(o => o.candidateId === s.candidateId); return old ? { ...s, text: old.text, excerpt: old.excerpt } : s; }) } } : next); setSubmitted(false); })}>{preview ? "Prepare again" : "Prepare contributions"}</Button>
      </>}
      {preview && draft && !submitted && <section ref={region} aria-label="Prepare group Weave">
        <h3>{preview.groups.map(g => g.label).join(" × ")}</h3><p className="small-note">{preview.lensName} · lens revision {preview.lensRevision}. Exact source candidates are frozen for this preparation.</p>
        <WeaveFields draft={draft} change={setDraft} busy={busy} />
        {stale && <p role="alert">The lens or run changed. Prepare again before submitting.</p>}
        <Button variant="primary" busy={busy} disabled={!!stale || draft.weave.selections.some(s => !s.text.trim())} onClick={() => void act(async () => { const data = await request({ action: "submit", runId, previewId: preview.id, weave: draft.weave }); setSubmitted(true); if (!data.dispatchStarted) setNotice("Weave saved. The worker could not start; retry its dispatch below."); await reload(); })}>Weave contributions · 2 calls</Button>
      </section>}
      {options?.pending && <LoadingStatus title="Weave is combining these groups…" description="The expedition remains paused." />}
      {options?.history.slice().reverse().map(item => <section key={item.request.id} aria-label="Group Weave result">
        <h3>{item.request.operation.groupWeave!.groups.map(g => g.label).join(" × ")}</h3>
        <p role="status">{item.status} · {item.calls} of 2 calls used.</p>
        {item.error && <p>{item.status === "inconclusive" ? "This attempt is inconclusive and will not be replayed automatically. Completed evidence and reserved allowance remain recorded." : "This Weave was stopped; completed evidence remains available."}</p>}
        {!item.finished && <Button disabled={busy} onClick={() => void act(async () => { const data = await request({ action: "retry-dispatch", runId, requestId: item.request.id }); if (!data.dispatchStarted) throw new Error("The worker could not start. Try again shortly."); await reload(); })}>Retry worker dispatch</Button>}
        {item.candidate && <>
          <h3>{item.candidate.snapshot.title}</h3><p>{item.candidate.snapshot.summary}</p>
          <details><Summary>Read result and contributions</Summary><div className="weave-passage">{item.candidate.snapshot.body}</div>{item.request.operation.weave!.selections.map(selection => {
            const mapping = item.candidate!.weaveMappings?.find(m => m.selectionId === selection.id);
            return <section key={selection.id}><h4>{item.request.operation.sources.find(s => s.candidateId === selection.candidateId)!.title}</h4><p>Carry forward: {selection.text}</p>{selection.excerpt && <blockquote>{selection.excerpt.text}</blockquote>}{mapping && <><p><strong>{mapping.status}</strong> · {mapping.explanation}</p>{mapping.output && <><p className="small-note">Result passage · {mapping.output.field}</p><blockquote>{mapping.output.text}</blockquote></>}</>}</section>;
          })}<p className="small-note">These mappings are model claims. Assessment: {item.candidate.assessment?.constraints ?? "pending"}.</p></details>
          <Field label={`Place ${item.candidate.snapshot.title}`}><Select aria-label={`Place ${item.candidate.snapshot.title}`} value={destinations[item.request.id] ?? ""} onChange={e => setDestinations(d => ({ ...d, [item.request.id]: e.target.value }))}><option value="">Unassigned</option>{revision.groups.map(g => <option key={g.id} value={g.id}>{g.label}</option>)}</Select></Field>
          <Button disabled={busy} onClick={() => void act(async () => { await place(item.candidate!.id, destinations[item.request.id] || null); setNotice("Result placed in this lens. Exploration still uses its separately applied configuration."); })}>Place result in lens</Button>
        </>}
      </section>)}
      {busy && <LoadingStatus title="Updating group Weave…" />}{notice && <p role="status">{notice}</p>}{error && <p role="alert">{error} Contribution drafts are kept.</p>}
    </>}
  </section>;
}
