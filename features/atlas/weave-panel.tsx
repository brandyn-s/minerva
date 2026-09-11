"use client";
import { useEffect, useRef, useState } from "react";
import { Button, Field, Select, Summary, Textarea } from "../../components/ui/controls";
import PanelHeader from "../../components/ui/panel-header";
import type { Thought } from "./domain";
import type { ContributionSelection } from "../experiments/weave";
import { resolveSnapshot, newWeaveDraft, type WeaveDraft } from "./weave";

function ExcerptPicker({ source, value, change }: {
  source: WeaveDraft["sources"][number]; value?: ContributionSelection["excerpt"];
  change: (value?: ContributionSelection["excerpt"]) => void;
}) {
  const [field, setField] = useState<"summary" | "body">(value?.field ?? "body");
  const [range, setRange] = useState<{ start: number; end: number }>();
  const [error, setError] = useState("");
  return <details className="weave-excerpt"><Summary>{value ? "Selected excerpt" : "Choose an excerpt (optional)"}</Summary>
    {value && <><blockquote>{value.text}</blockquote><Button onClick={() => change(undefined)}>Remove excerpt</Button></>}
    <Field label={`Source field · ${source.title}`}><Select aria-label={`Source field · ${source.title}`} value={field} onChange={e => { setField(e.target.value as typeof field); setRange(undefined); }}><option value="summary">Summary</option><option value="body">Body</option></Select></Field>
    <p className="small-note">Select text below, then use the selection.</p>
    <Textarea aria-label={`Source text · ${source.title}`} readOnly rows={6} value={source[field]} onSelect={e => setRange({ start: e.currentTarget.selectionStart, end: e.currentTarget.selectionEnd })} onKeyUp={e => setRange({ start: e.currentTarget.selectionStart, end: e.currentTarget.selectionEnd })} onPointerUp={e => setRange({ start: e.currentTarget.selectionStart, end: e.currentTarget.selectionEnd })} />
    <Button disabled={!range || range.start === range.end} onClick={() => {
      if (!range) return;
      const text = source[field].slice(range.start, range.end);
      if (text.length > 4000) { setError("Choose an excerpt of up to 4,000 characters."); return; }
      change({ field, ...range, text }); setError("");
    }}>Use selected excerpt</Button>{error && <p role="alert">{error}</p>}
  </details>;
}

export default function WeavePanel({ draft, change, cards, busy, error, run, close }: {
  draft: WeaveDraft; change: (draft: WeaveDraft) => void; cards: Thought[];
  busy: boolean; error: string; run: (wholeCards: boolean) => void; close: () => void;
}) {
  const root = useRef<HTMLElement>(null);
  useEffect(() => { root.current?.focus(); }, []);
  const currentSources = draft.sources.map(s => resolveSnapshot(s, cards));
  const newer = currentSources.some((c, i) => c && c.revision !== draft.sources[i].revision);
  function update(id: string, patch: Partial<ContributionSelection>) {
    change({ ...draft, weave: { ...draft.weave, selections: draft.weave.selections.map(s => s.id === id ? { ...s, ...patch } : s) } });
  }
  return <aside ref={root} tabIndex={-1} className="detail-panel weave-panel unified-pane" role="dialog" aria-label="Prepare Weave" onKeyDown={e => { if (e.key === "Escape") { e.stopPropagation(); close(); } }}>
    <PanelHeader title={draft.weave.variantOf ? "Weave a variant" : "Weave"} close={close} />
    <div className="pane-body">
      <p>Choose what to carry forward from each idea.</p>
      {draft.weave.variantOf && <p className="small-note">Comparing with {draft.weave.variantOf.title} · revision {draft.weave.variantOf.revision}. Both results stay in the atlas.</p>}
      {newer && <details><Summary>Newer source revisions available</Summary><p>Keep using the saved sources, or update them. Updating keeps your contribution text and clears excerpts for reselection.</p><Button disabled={busy || currentSources.some(c => !c)} onClick={() => {
        const next = newWeaveDraft(currentSources.filter((c): c is Thought => !!c));
        next.weave.interaction = draft.weave.interaction;
        next.weave.variantOf = draft.weave.variantOf;
        next.weave.selections = next.weave.selections.map((s, i) => ({ ...s, text: draft.weave.selections.find(old => old.sourceId === draft.sources[i].id)!.text }));
        change(next);
      }}>Use current revisions</Button></details>}
      <fieldset disabled={busy} className="weave-fields"><legend className="sr-only">Selected contributions</legend>
      {draft.weave.selections.map(selection => {
        const source = draft.sources.find(s => s.id === selection.sourceId)!;
        const current = resolveSnapshot(source, cards);
        return <section key={selection.id} className="weave-source">
          <h3>{source.title}</h3><p className="small-note">Source revision {source.revision}{current && current.revision !== source.revision ? ` · current revision is ${current.revision}; this Weave uses the saved source` : !current ? " · saved source snapshot" : ""}</p>
          <Field label={`Carry forward · ${source.title}`}><Textarea aria-label={`Carry forward · ${source.title}`} rows={3} maxLength={2000} value={selection.text} onChange={e => update(selection.id, { text: e.target.value })} /></Field>
          <ExcerptPicker source={source} value={selection.excerpt} change={excerpt => update(selection.id, { excerpt })} />
        </section>;
      })}
      <Field label="How should they interact? (optional)"><Textarea aria-label="How should they interact? (optional)" rows={2} maxLength={2000} value={draft.weave.interaction} placeholder="Let waiting for a repair become time for a shared meal" onChange={e => change({ ...draft, weave: { ...draft.weave, interaction: e.target.value } })} /></Field>
      </fieldset>
      <details><Summary>Context used</Summary><p>Contribution statements and selected excerpts are sent in full. Surrounding sources are bounded to the first 400 bytes of each title, 600 of each summary, 3,000 of each body and 400 of each existing contribution. Full source revisions stay with the result.</p></details>
      {error && <p role="alert">{error} Your selections are kept.</p>}
      <div className="weave-actions"><Button variant="primary" busy={busy} disabled={draft.weave.selections.some(s => !s.text.trim())} onClick={() => run(false)}>{busy ? "Weaving…" : error ? "Try Weave again" : "Weave contributions"}</Button>
        <Button disabled={busy} onClick={() => run(true)}>Weave whole cards</Button></div>
    </div>
  </aside>;
}
