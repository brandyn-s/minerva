"use client";

import { Button, Input, Summary } from "../../components/ui/controls";

import { useState } from "react";
import { FileText, Lightbulb, GitMerge, Compass, ChevronRight, ChevronDown, MoreHorizontal } from "../../components/ui/icons";
import type { Thought, Relationship } from "./domain";
import FieldGuideHeading from "./field-guide-heading";
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
      <FieldGuideHeading title="Browse thoughts" image="/images/thoughts-olive.png" close={close} actions={
        downloadable && <details className="catalogue-menu" onKeyDown={event => {
          if (event.key === "Escape" && event.currentTarget.open) {
            event.stopPropagation(); event.currentTarget.open = false;
            event.currentTarget.querySelector("summary")?.focus();
          }
        }}>
          <Summary variant="secondary" iconOnly aria-label="Thought options"><MoreHorizontal /></Summary>
          <div><DownloadButton cards={cards} relationships={relationships} /></div>
        </details>} />
      <label className="field-guide-label">Find a thought
      <Input aria-label="Find a thought" type="search" autoComplete="off" placeholder="Search titles" value={query} onChange={event => setQuery(event.target.value)} />
      </label>
    </div>
    <div className="catalogue-list">
      {visible.map(card => {
        const Icon = typeIcons[card.kind];
        const isOpen = expanded === card.id;
        return <section className={`catalogue-entry${selected.includes(card.id) ? " is-selected" : ""}`} key={card.id}>
          <div className="catalogue-row">
            <Input type="checkbox" aria-label={`Select ${card.title}`} checked={selected.includes(card.id)} onChange={() => select(card.id)} />
            <Icon className="catalogue-kind" aria-hidden="true" />
            <Button variant="content" className="catalogue-disclosure" aria-expanded={isOpen} aria-controls={`thought-preview-${card.id}`} onClick={() => setExpanded(isOpen ? null : card.id)}>
              <span><strong>{card.title}</strong><span className="instrument-label">{card.kind}</span></span>
              {isOpen ? <ChevronDown /> : <ChevronRight />}
            </Button>
          </div>
          {foldedUnder?.has(card.id) && <p className="catalogue-fold">folded under {foldedUnder.get(card.id)!.map(id => cards.find(c => c.id === id)?.title).join(", ")} <Button onClick={() => unfold?.(card.id)}>Unfold</Button></p>}
          <div id={`thought-preview-${card.id}`} hidden={!isOpen} className="catalogue-preview">
            <p>{card.summary || card.body}</p>
            <div className="catalogue-actions">
              <Button onClick={() => focus(card.id)}>Show in atlas</Button>
              {downloadable && <DownloadButton card={card} cards={cards} relationships={relationships} />}
            </div>
          </div>
        </section>;
      })}
      {visible.length === 0 && <p className="catalogue-empty">No thoughts match “{query}”. Try another title.</p>}
    </div>
    <footer className="catalogue-footer" aria-live="polite">{query.trim() ? `${visible.length} of ${cards.length} thoughts · ` : `${cards.length} thoughts · `}{selected.length} selected</footer>
  </>;
}
