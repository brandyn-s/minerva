"use client";

import { Button, Summary, Input, Textarea } from "../../components/ui/controls";

import { useEffect, useRef, useState } from "react";
import {
  CornersOut,
  Compass,
  PencilSimple,
  DotsThree,
  GitBranch,
  CaretRight,
  Circle,
  CircleDashed,
} from "../../components/ui/icons";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Thought, Relationship } from "./domain";
import { cardConnections, cardEdit, wordDiff, type CardEdit } from "./card-revisions";
import PanelHeader from "../../components/ui/panel-header";
import DownloadButton from "./download-button";

type Props = {
  card: Thought;
  cards: Thought[];
  relationships: Relationship[];
  revert: (number: number) => void;
  develop: () => void;
  draft?: CardEdit;
  setDraft: (draft?: CardEdit) => void;
  save: (edit: CardEdit) => void;
  inspect: (id: string) => void;
  focus: (id: string) => void;
  explore: () => void;
  close: () => void;
  folded: boolean;
  toggleFold: () => void;
  descendantCount: number;
  showBranch: () => void;
};
const tabs = ["Content", "Connections", "History"] as const;
type Tab = (typeof tabs)[number];

export default function CardPane(props: Props) {
  const { card, cards, relationships, draft, setDraft } = props;
  const [tab, setTab] = useState<Tab>("Content");
  const [menu, setMenu] = useState(false);
  const [error, setError] = useState("");
  const scroll = useRef<HTMLDivElement>(null);
  const titleInput = useRef<HTMLInputElement>(null);
  const root = useRef<HTMLElement>(null);
  const more = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const { parents, children, related, context } = cardConnections(
    card.id,
    relationships,
  );
  const connectionCount =
    parents.length + children.length + related.length + context.length;
  const byId = new Map(cards.map((item) => [item.id, item]));
  const dirty =
    draft && JSON.stringify(draft) !== JSON.stringify(cardEdit(card));
  useEffect(() => {
    root.current?.focus();
  }, []);
  useEffect(() => {
    scroll.current?.scrollTo(0, 0);
  }, [tab]);
  const editing = !!draft;
  useEffect(() => {
    if (editing) titleInput.current?.focus();
  }, [editing]);
  useEffect(() => {
    if (!menu) return;
    menuRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
    const outside = (event: PointerEvent) => {
      if (
        !menuRef.current?.contains(event.target as Node) &&
        !more.current?.contains(event.target as Node)
      )
        setMenu(false);
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [menu]);
  function save(edit: CardEdit) {
    try {
      props.save(edit);
      setDraft(undefined);
      setError("");
      setTab("Content");
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not save this card.",
      );
    }
  }
  function link(edge: Relationship) {
    const otherId = edge.from === card.id ? edge.to : edge.from;
    return (
      <div className="card-pane-relation" key={edge.id}>
        <Button onClick={() => props.inspect(otherId)}>
          {byId.get(otherId)?.title ?? otherId}
          <CaretRight aria-hidden="true" />
        </Button>
        <p>
          {edge.label}
          {edge.kind === "derivation" || edge.kind === "recombination"
            ? ` · derived from revision ${edge.sourceRevision} of ${byId.get(edge.from)?.title ?? edge.from}${(byId.get(edge.from)?.revision ?? 0) > edge.sourceRevision ? " · Parent has moved on" : ""}`
            : ""}
        </p>
        {edge.contribution && <blockquote>{edge.contribution}</blockquote>}
        {(edge.kind === "derivation" || edge.kind === "recombination") && (
          <details>
            <Summary>Source excerpt</Summary>
            <p>
              {byId.get(edge.from)?.revisions.find(r => r.number === edge.sourceRevision)?.body ?? "This source revision predates the imported history and is unavailable."}
            </p>
          </details>
        )}
      </div>
    );
  }
  const body = card.body.startsWith(card.summary)
    ? card.body.slice(card.summary.length).trimStart()
    : card.body;
  return (
    <aside
      className="detail-panel card-inspector unified-pane"
      role="dialog"
      aria-modal="false"
      aria-label={card.title}
      tabIndex={-1}
      ref={root}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.stopPropagation();
          if (menu) {
            setMenu(false);
            more.current?.focus();
          } else props.close();
        }
      }}
    >
      <header className="card-pane-header">
        <PanelHeader title="Card" close={props.close} actions={<Button variant="quiet" onClick={() => props.focus(card.id)}><CornersOut aria-hidden="true" />Focus on canvas</Button>} />
        <h2>{card.title}</h2>
        <p className="card-pane-meta">
          {card.provenance?.feature ??
            (card.kind === "proposal" ? "Source material" : card.kind)}{" "}
          · Revision {card.revision}
        </p>
        <div
          role="tablist"
          aria-label="Card sections"
          className="card-pane-tabs"
        >
          {tabs.map((name, index) => (
            <Button
              key={name}
              id={`card-tab-${name}`}
              role="tab"
              aria-selected={tab === name}
              aria-controls="card-pane-body"
              tabIndex={tab === name ? 0 : -1}
              disabled={!!draft}
              onClick={() => {
                setTab(name);
                setError("");
              }}
              onKeyDown={(event) => {
                if (
                  !["ArrowLeft", "ArrowRight", "Home", "End"].includes(
                    event.key,
                  )
                )
                  return;
                event.preventDefault();
                const next =
                  event.key === "Home"
                    ? 0
                    : event.key === "End"
                      ? 2
                      : (index + (event.key === "ArrowRight" ? 1 : 2)) %
                        tabs.length;
                setTab(tabs[next]);
                document.getElementById(`card-tab-${tabs[next]}`)?.focus();
              }}
            >
              {name}
              {name === "Connections" && <span>{connectionCount}</span>}
            </Button>
          ))}
        </div>
      </header>
      <div
        className="card-pane-body"
        id="card-pane-body"
        role="tabpanel"
        aria-labelledby={`card-tab-${tab}`}
        tabIndex={0}
        ref={scroll}
      >
        {error && <p role="alert">{error}</p>}
        {tab === "Content" &&
          (draft ? (
            <form
              id="card-edit-form"
              onSubmit={(event) => {
                event.preventDefault();
                save(draft);
              }}
            >
              <p className="small-note">
                Unsaved edits stay here while you browse. Save or Cancel to
                finish.
              </p>
              {(
                [
                  ["title", "Title"],
                  ["summary", "Summary"],
                  ["body", "Body"],
                  ["contribution", "Contribution"],
                ] as const
              ).map(([key, label]) => (
                <label key={key}>
                  {label}
                  {key === "title" ? (
                    <Input
                      aria-label={label}
                      ref={titleInput}
                      required
                      value={draft[key]}
                      onChange={(event) =>
                        setDraft({ ...draft, [key]: event.target.value })
                      }
                    />
                  ) : (
                    <Textarea
                      aria-label={label}
                      rows={key === "body" ? 6 : 3}
                      value={draft[key]}
                      onChange={(event) =>
                        setDraft({ ...draft, [key]: event.target.value })
                      }
                    />
                  )}
                </label>
              ))}
            </form>
          ) : (
            <article>
              <p className="card-pane-summary">{card.summary}</p>
              {body && (
                <div className="card-pane-markdown">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {body}
                  </ReactMarkdown>
                </div>
              )}
              <h3>Contribution</h3>
              <p>{card.contribution}</p>
              {card.generation && (
                <details>
                  <Summary>Generation context and mechanism</Summary>
                  <p>{card.generation.mechanism}</p>
                  <p>
                    Prerequisites: {card.generation.prerequisites.join("; ")}
                  </p>
                  <p>
                    Uncertainties: {card.generation.uncertainties.join("; ")}
                  </p>
                  <p>Requested: {card.generation.requestedChange}</p>
                  <p>Observed: {card.generation.observedChange}</p>
                  <p className="small-note">
                    Original generation · {card.generation.model} · input{" "}
                    {card.generation.manifestId}
                  </p>
                </details>
              )}
              {card.assessment && (
                <details>
                  <Summary>Assessment of this revision</Summary>
                  <p>{card.assessment.goalFidelity}</p>
                  <p>{card.assessment.constraints}</p>
                  <p>{card.assessment.causalDependencies}</p>
                  <p>{card.assessment.transformation}</p>
                  <p>
                    Model assessment; real-world feasibility remains unverified.
                  </p>
                </details>
              )}
              {card.provenance && (
                <details>
                  <Summary>Provenance</Summary>
                  <p>
                    {card.provenance.feature} · {card.provenance.tag}
                  </p>
                  <p>
                    Sources at generation:{" "}
                    {card.provenance.sourceTitles.join("; ")}
                  </p>
                  {card.provenance.moveTitle && (
                    <p>Move: {card.provenance.moveTitle}</p>
                  )}
                </details>
              )}
            </article>
          ))}
        {tab === "Connections" && (
          <section>
            <div className="card-pane-section-heading">
              <h3>Follow the thread</h3>
              {props.descendantCount > 0 && (
                <Button onClick={props.showBranch}>
                  <GitBranch aria-hidden="true" />
                  Show branch
                </Button>
              )}
            </div>
            <div className="card-pane-lineage">
              <section>
                <CircleDashed
                  className="card-pane-node"
                  aria-hidden="true"
                />
                <span className="instrument-label">
                  {parents.length ? "Parents" : "Origin"}
                </span>
                {parents.length ? (
                  parents.map(link)
                ) : (
                  <p>Starting material. No parent ideas.</p>
                )}
              </section>
              <section>
                <Circle
                  className="card-pane-node"
                  aria-hidden="true"
                />
                <span className="instrument-label">Current idea</span>
                <h3>{card.title}</h3>
              </section>
              <section>
                <GitBranch
                  className="card-pane-node"
                  aria-hidden="true"
                />
                <span className="instrument-label">
                  Developed from this · {children.length}
                </span>
                {children.length ? (
                  children.map(link)
                ) : (
                  <p>No descendants yet.</p>
                )}
              </section>
            </div>
            {props.descendantCount > 0 && (
              <Button className="card-pane-fold" onClick={props.toggleFold}>
                {props.folded
                  ? "Show descendants on canvas"
                  : "Hide descendants on canvas"}
              </Button>
            )}
            <h3>Related ideas</h3>
            <p className="small-note">
              Associations do not establish inheritance.
            </p>
            {related.length ? related.map(link) : <p>No related ideas.</p>}
            {context.length > 0 && (
              <>
                <h3>Shared context</h3>
                <p className="small-note">
                  Shared brief is context, not parentage.
                </p>
                {context.map(link)}
              </>
            )}
          </section>
        )}
        {tab === "History" && <section aria-label="Revision history">
          <h3>How this idea changed</h3>
          <p className="small-note">Saved with this atlas. Revert creates a new revision; earlier content stays here.</p>
          {[...card.revisions].reverse().map(item => {
            const previous = card.revisions.find(r => r.number === item.number - 1);
            return <section className="card-revision" key={item.number} aria-label={`Revision ${item.number}`}>
              <h3>Revision {item.number}{item.number === card.revision ? " · Current" : ""}</h3>
              <p className="small-note">{item.prepared ? "Prepared" : <time dateTime={item.time}>{new Date(item.time).toLocaleString()}</time>} · {item.cause}</p>
              {item.note && <p>Model claim: {item.note}</p>}
              <h4>Title</h4><div className="revision-diff" aria-label="Title changes">{wordDiff(previous?.title ?? "", item.title).map((part, i) => part.kind === "added" ? <ins key={i}>{part.text}</ins> : part.kind === "removed" ? <del key={i}>{part.text}</del> : <span key={i}>{part.text}</span>)}</div>
              <h4>Summary</h4><p>{item.summary}</p>
              <h4>Body</h4><div className="revision-diff" aria-label="Body changes">{wordDiff(previous?.body ?? "", item.body).map((part, i) => part.kind === "added" ? <ins key={i}>{part.text}</ins> : part.kind === "removed" ? <del key={i}>{part.text}</del> : <span key={i}>{part.text}</span>)}</div>
              <h4>Contribution</h4>{item.contribution === undefined ? <p>Historical contribution unknown.</p> : <div className="revision-diff" aria-label="Contribution changes">{wordDiff(previous?.contribution ?? "", item.contribution).map((part, i) => part.kind === "added" ? <ins key={i}>{part.text}</ins> : part.kind === "removed" ? <del key={i}>{part.text}</del> : <span key={i}>{part.text}</span>)}</div>}
              {item.number !== card.revision && <Button onClick={() => props.revert(item.number)}>Revert to revision {item.number}</Button>}
            </section>;
          })}
        </section>}
      </div>
      <footer className="card-pane-footer">
        {!draft && (
          <Button
            className="card-pane-relationship-summary"
            onClick={() => setTab("Connections")}
          >
            <GitBranch aria-hidden="true" />
            <span>
              {parents.length
                ? `${parents.length} parent${parents.length === 1 ? "" : "s"}`
                : "Starting material"}{" "}
              · {props.descendantCount} descendant
              {props.descendantCount === 1 ? "" : "s"}
            </span>
            <CaretRight aria-hidden="true" />
          </Button>
        )}
        <div className="card-pane-actions">
          {draft ? (
            <>
              <span className="small-note">
                {dirty ? "Unsaved edits" : "No changes yet"}
              </span>
              <Button
                onClick={() => {
                  setDraft(undefined);
                  setError("");
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary" className="card-pane-primary"
                type="submit"
                form="card-edit-form"
                disabled={!dirty || !draft.title.trim()}
              >
                Save changes
              </Button>
            </>
          ) : (
            <>
              <Button onClick={props.develop}>Develop</Button>
              <Button variant="primary" className="card-pane-primary" aria-label="Explore this idea" onClick={props.explore}>
                <Compass aria-hidden="true" />
                Explore
              </Button>
              <Button
                onClick={() => {
                  setDraft(cardEdit(card));
                  setTab("Content");
                  setMenu(false);
                }}
              >
                <PencilSimple aria-hidden="true" />
                Edit
              </Button>
              <div className="card-pane-more">
                <Button
                  ref={more}
                  aria-label="More card actions"
                  aria-expanded={menu}
                  onClick={() => setMenu(!menu)}
                >
                  <DotsThree aria-hidden="true" />
                </Button>
                {menu && (
                  <div ref={menuRef}>
                    <DownloadButton
                      card={card}
                      cards={cards}
                      relationships={relationships}
                    />
                    <Button
                      onClick={() => {
                        setTab("History");
                        setMenu(false);
                      }}
                    >
                      View history
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </footer>
    </aside>
  );
}
