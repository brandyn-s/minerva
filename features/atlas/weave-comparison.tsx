"use client";
import { useEffect, useRef } from "react";
import { Button } from "../../components/ui/controls";
import PanelHeader from "../../components/ui/panel-header";
import type { Snapshot } from "../experiments/contracts";
import { wordDiff } from "./card-revisions";

export default function WeaveComparison({ pair, close }: { pair: [Snapshot, Snapshot]; close: () => void }) {
  const root = useRef<HTMLElement>(null);
  useEffect(() => { root.current?.focus(); }, []);
  return <aside ref={root} tabIndex={-1} className="detail-panel compare-panel unified-pane" role="dialog" aria-label="Compare Weave variants" onKeyDown={e => { if (e.key === "Escape") { e.stopPropagation(); close(); } }}>
    <PanelHeader title="Compare variants" close={close} />
    <div className="pane-body"><div className="comparison-grid">{pair.map((snapshot, index) => <section key={index}>
      <p className="small-note">{index ? "Variant" : "Original"} · revision {snapshot.revision}</p><h3>{snapshot.title}</h3><p>{snapshot.summary}</p><div className="weave-passage">{snapshot.body}</div>
    </section>)}</div><h3>What changed in the body</h3><div className="revision-diff">{wordDiff(pair[0].body, pair[1].body).map((part, i) => part.kind === "added" ? <ins key={i}>{part.text}</ins> : part.kind === "removed" ? <del key={i}>{part.text}</del> : <span key={i}>{part.text}</span>)}</div><Button onClick={close}>Return to result</Button></div>
  </aside>;
}
