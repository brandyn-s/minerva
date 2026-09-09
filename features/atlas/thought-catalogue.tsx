"use client";

import { useState } from "react";
import { FileText, Lightbulb, GitMerge, Compass, ChevronRight, ChevronDown, MoreHorizontal, X } from "lucide-react";
import type { Thought, Relationship } from "./domain";
import DownloadButton from "./download-button";

const typeIcons = { brief: FileText, proposal: Lightbulb, recombination: GitMerge, exploration: Compass };

export default function ThoughtCatalogue({ cards, relationships, selected, select, focus, close, downloadable, foldedUnder, unfold }: {
  foldedUnder?: Map<string, string[]>; unfold?: (id: string) => void;
  cards: Thought[]; relationships: Relationship[]; selected: string[];
  select: (id: string) => void; focus: (id: string) => void; close: () => void; downloadable: boolean;
}) {
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const visible = cards.filter(card => card.title.toLowerCase().includes(query.trim().toLowerCase()));
  return <>
    <div className="catalogue-sticky">
      <header className="catalogue-header">
        <h2>Browse thoughts <span>{cards.length}</span></h2>
        {downloadable && <details className="catalogue-menu" onKeyDown={event => {
          if (event.key === "Escape" && event.currentTarget.open) {
            event.stopPropagation(); event.currentTarget.open = false;
            event.currentTarget.querySelector("summary")?.focus();
          }
        }}>
          <summary aria-label="Thought options"><MoreHorizontal size={20} /></summary>
          <div><DownloadButton cards={cards} relationships={relationships} /></div>
        </details>}
        <button aria-label="Close panel" onClick={close}><X size={20} /></button>
      </header>
      <input aria-label="Find a thought" type="search" autoComplete="off" placeholder="Search titles" value={query} onChange={event => setQuery(event.target.value)} />
    </div>
    <div className="catalogue-list">
      {visible.map(card => {
        const Icon = typeIcons[card.kind];
        const isOpen = expanded === card.id;
        return <section className={`catalogue-entry${selected.includes(card.id) ? " is-selected" : ""}`} key={card.id}>
          <div className="catalogue-row">
            <input type="checkbox" aria-label={`Select ${card.title}`} checked={selected.includes(card.id)} onChange={() => select(card.id)} />
            <Icon className="catalogue-kind" size={25} aria-hidden="true" />
            <button className="catalogue-disclosure" aria-expanded={isOpen} aria-controls={`thought-preview-${card.id}`} onClick={() => setExpanded(isOpen ? null : card.id)}>
              <span><strong>{card.title}</strong><span className="instrument-label">{card.kind} · {card.decision}</span></span>
              {isOpen ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
            </button>
          </div>
          {foldedUnder?.has(card.id) && <p className="catalogue-fold">folded under {foldedUnder.get(card.id)!.map(id => cards.find(c => c.id === id)?.title).join(", ")} <button onClick={() => unfold?.(card.id)}>Unfold</button></p>}
          <div id={`thought-preview-${card.id}`} hidden={!isOpen} className="catalogue-preview">
            <p>{card.summary || card.body}</p>
            <div className="catalogue-actions">
              <button onClick={() => focus(card.id)}>Show in atlas</button>
              {downloadable && <DownloadButton card={card} cards={cards} relationships={relationships} />}
            </div>
          </div>
        </section>;
      })}
      {visible.length === 0 && <p className="catalogue-empty">No thoughts match “{query}”. Try another title.</p>}
    </div>
    <footer className="catalogue-footer" aria-live="polite">{query.trim() && `${visible.length} of ${cards.length} thoughts · `}{selected.length} selected</footer>
  </>;
}
