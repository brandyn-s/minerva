"use client";

import { ArrowClockwise } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import { validateThemes, type ThemeGroup } from "./themes";

type Card = { id: string; title: string; body: string };
export default function RegroupPanel({ cards, ids, close, apply, onGenerate }: {
  onGenerate: () => void;
  cards: Card[]; ids: string[]; close: () => void; apply: (groups: ThemeGroup[]) => void;
}) {
  const [groups, setGroups] = useState<ThemeGroup[]>();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const controller = useRef<AbortController | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const [source] = useState(() => cards.filter(c => ids.includes(c.id)));
  const stale = source.some(c => !cards.some(n => n.id === c.id && n.title === c.title && n.body === c.body));
  useEffect(() => {
    heading.current?.focus();
    return () => { controller.current?.abort();  };
  }, []);
  function dismiss(action = close) {
    action();
    requestAnimationFrame(() => document.querySelector<HTMLButtonElement>("[data-regroup-trigger]")?.focus({ preventScroll: true }));
  }
  async function preview() {
    onGenerate();
    controller.current?.abort();
    const request = new AbortController();
    controller.current = request;
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/themes", { method: "POST", headers: { "Content-Type": "application/json" }, signal: request.signal,
        body: JSON.stringify({ cards: source.map(({ id, title, body }) => ({ id, title, body })), existingGroups: [] }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to regroup these ideas.");
      setGroups(validateThemes(result, ids));
      requestAnimationFrame(() => heading.current?.focus());
    } catch (e) {
      if (!request.signal.aborted) setError(e instanceof Error ? e.message : "Unable to regroup these ideas.");
    } finally { if (!request.signal.aborted) setBusy(false); }
  }
  return <section className="regroup-panel" aria-labelledby="regroup-title" onKeyDown={e => { if (e.key === "Escape") { e.stopPropagation(); dismiss(); } }}>
    <header><h2 id="regroup-title" ref={heading} tabIndex={-1}>{ids.length === cards.length ? "Regroup all ideas" : "Regroup selected ideas"}</h2><button aria-label="Close regroup preview" onClick={() => dismiss()}>Close</button></header>
    <p>{ids.length} of {cards.length} ideas</p>
    <div className="regroup-content">
      {groups ? <><h3>Proposed themes for {ids.length} ideas</h3><ul>{groups.map(g => <li key={g.name}><div><strong>{g.name}</strong><p>{g.reason}</p><details><summary>Review ideas</summary><ul>{g.memberIds.map(id => <li key={id}>{cards.find(c => c.id === id)?.title}</li>)}</ul></details></div><span aria-label={`${g.memberIds.length} ideas`}>{g.memberIds.length}</span></li>)}</ul></>
        : <><h3>Find fresh connections</h3><p>Preview new themes for this selection before changing your constellation.</p><details><summary>Review {ids.length} selected ideas</summary><ul>{source.map(c => <li key={c.id}>{c.title}</li>)}</ul></details></>}
      {busy && <p role="status" className="regroup-loading"><ArrowClockwise size={18} className="composer-spinner" aria-hidden="true" />Finding themes for {ids.length} ideas…</p>}
      {error && <p role="alert">{error}</p>}
      {stale && <p role="alert">These ideas changed. Close this preview and regroup the updated selection.</p>}
    </div>
    <p className="regroup-note">{ids.length < cards.length ? `${cards.length - ids.length} other ideas stay in their current themes. ` : ""}Your current grouping stays until you choose Apply.</p>
    <footer><button onClick={() => dismiss()}>Cancel</button>{groups ? <button className="primary" disabled={stale} onClick={() => dismiss(() => apply(groups))}>Apply to {ids.length} ideas</button> : <button className="primary regroup-preview" aria-busy={busy} disabled={busy || stale} onClick={() => void preview()}>{busy && <ArrowClockwise size={18} className="composer-spinner" aria-hidden="true" />}{busy ? "Preparing preview…" : error ? "Retry" : "Preview themes"}</button>}</footer>
  </section>;
}
