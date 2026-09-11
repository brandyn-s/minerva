"use client";
import { useEffect, useRef } from "react";
import PanelHeader from "../../components/ui/panel-header";
import LensWorkspace from "../lenses/editor";
import { type Lens, type LensEdit } from "../lenses/domain";
import { atlasMembers } from "./lenses";
import type { Thought } from "./domain";
export default function LensPanel({ lenses, activeId, cards, choose, create, edit, close }: { lenses: Lens[]; activeId: string | null; cards: Thought[]; choose: (id: string) => void; create: (name: string, seeded: boolean) => Promise<void>; edit: (edit: LensEdit) => void; close: () => void }) {
  const root = useRef<HTMLElement>(null);
  useEffect(() => { root.current?.focus(); }, []);
  return <aside ref={root} tabIndex={-1} className="detail-panel unified-pane lens-panel" role="dialog" aria-label="Lenses" onKeyDown={e => { if (e.key === "Escape") { e.stopPropagation(); close(); } }}>
    <PanelHeader title="Lenses" close={close} /><div className="pane-body">
      <p>Group ideas through a question you care about.</p>
      <LensWorkspace lenses={lenses} activeId={activeId} members={atlasMembers(cards)} choose={choose} create={create} edit={edit} seededLabel="Existing Constellation themes"
        inspect={member => { const revision = cards.find(c => c.id === member.sourceId)?.revisions.find(r => r.number === member.revision); if (!revision) throw new Error("Historical source unavailable"); return revision.body; }} />
    </div>
  </aside>;
}
