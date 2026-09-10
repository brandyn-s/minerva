"use client";

import { useEffect, useRef, useState } from "react";
import {
  CornersOut,
  X,
  Compass,
  PencilSimple,
  DotsThree,
  GitBranch,
  CaretRight,
  ArrowLeft,
  Circle,
  CircleDashed,
} from "@phosphor-icons/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Thought, Relationship } from "./domain";
import { cardConnections, cardEdit, type CardEdit } from "./card-revisions";
import DownloadButton from "./download-button";

type Props = {
  card: Thought;
  cards: Thought[];
  relationships: Relationship[];
  revisions: Thought[];
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
  const { card, cards, relationships, draft, setDraft, revisions } = props;
  const [tab, setTab] = useState<Tab>("Content");
  const [menu, setMenu] = useState(false);
  const [error, setError] = useState("");
  const [review, setReview] = useState<Thought>();
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
  }, [tab, review]);
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
      setReview(undefined);
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
        <button onClick={() => props.inspect(otherId)}>
          {byId.get(otherId)?.title ?? otherId}
          <CaretRight size={16} aria-hidden="true" />
        </button>
        <p>
          {edge.label}
          {edge.kind === "derivation" || edge.kind === "recombination"
            ? ` · source revision ${edge.sourceRevision}`
            : ""}
        </p>
        {edge.contribution && <blockquote>{edge.contribution}</blockquote>}
        {(edge.kind === "derivation" || edge.kind === "recombination") && (
          <details>
            <summary>Source excerpt</summary>
            <p>
              {(
                revisions.find(
                  (item) =>
                    item.id === edge.from &&
                    item.revision === edge.sourceRevision,
                ) ??
                cards.find(
                  (item) =>
                    item.id === edge.from &&
                    item.revision === edge.sourceRevision,
                )
              )?.body ??
                "This source revision is not available in this session."}
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
      className="detail-panel card-inspector"
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
        <div className="card-pane-top">
          <span className="instrument-label">Card</span>
          <div>
            <button
              className="card-pane-focus"
              onClick={() => props.focus(card.id)}
            >
              <CornersOut size={19} aria-hidden="true" />
              Focus on canvas
            </button>
            <button aria-label="Close panel" onClick={props.close}>
              <X size={22} aria-hidden="true" />
            </button>
          </div>
        </div>
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
            <button
              key={name}
              id={`card-tab-${name}`}
              role="tab"
              aria-selected={tab === name}
              aria-controls="card-pane-body"
              tabIndex={tab === name ? 0 : -1}
              disabled={!!draft}
              onClick={() => {
                setTab(name);
                setReview(undefined);
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
                setReview(undefined);
                document.getElementById(`card-tab-${tabs[next]}`)?.focus();
              }}
            >
              {name}
              {name === "Connections" && <span>{connectionCount}</span>}
            </button>
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
                    <input
                      ref={titleInput}
                      required
                      value={draft[key]}
                      onChange={(event) =>
                        setDraft({ ...draft, [key]: event.target.value })
                      }
                    />
                  ) : (
                    <textarea
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
                  <summary>Generation context and mechanism</summary>
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
                  <summary>Assessment of this revision</summary>
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
                  <summary>Provenance</summary>
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
                <button onClick={props.showBranch}>
                  <GitBranch size={16} aria-hidden="true" />
                  Show branch
                </button>
              )}
            </div>
            <div className="card-pane-lineage">
              <section>
                <CircleDashed
                  className="card-pane-node"
                  size={16}
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
                  size={16}
                  weight="fill"
                  aria-hidden="true"
                />
                <span className="instrument-label">Current idea</span>
                <h3>{card.title}</h3>
              </section>
              <section>
                <GitBranch
                  className="card-pane-node"
                  size={16}
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
              <button className="card-pane-fold" onClick={props.toggleFold}>
                {props.folded
                  ? "Show descendants on canvas"
                  : "Hide descendants on canvas"}
              </button>
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
        {tab === "History" && (
          <section>
            <h3>How this idea changed</h3>
            <p className="small-note">
              Earlier versions saved during this session. Current text is saved
              with the atlas; earlier versions are cleared on reload.
            </p>
            {review ? (
              <>
                <button onClick={() => setReview(undefined)}>
                  <ArrowLeft size={16} aria-hidden="true" />
                  All versions
                </button>
                <h3>
                  Revision {review.revision} · {review.title}
                </h3>
                <p>{review.summary}</p>
                <div className="card-pane-markdown">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {review.body}
                  </ReactMarkdown>
                </div>
                <h3>Contribution</h3>
                <p>{review.contribution}</p>
                <button
                  onClick={() =>
                    save({ ...cardEdit(review), revision: card.revision })
                  }
                >
                  Restore this version
                </button>
              </>
            ) : (
              <>
                {[...revisions.filter((item) => item.id === card.id), card]
                  .reverse()
                  .map((item, index) => (
                    <div className="card-pane-version" key={item.revision}>
                      <div>
                        <strong>
                          Revision {item.revision}
                          {index === 0 ? " · Current" : ""}
                        </strong>
                        <p>{item.title}</p>
                      </div>
                      {index > 0 && (
                        <button onClick={() => setReview(item)}>
                          Review
                          <CaretRight size={16} aria-hidden="true" />
                        </button>
                      )}
                    </div>
                  ))}
              </>
            )}
          </section>
        )}
      </div>
      <footer className="card-pane-footer">
        {!draft && (
          <button
            className="card-pane-relationship-summary"
            onClick={() => setTab("Connections")}
          >
            <GitBranch size={19} aria-hidden="true" />
            <span>
              {parents.length
                ? `${parents.length} parent${parents.length === 1 ? "" : "s"}`
                : "Starting material"}{" "}
              · {props.descendantCount} descendant
              {props.descendantCount === 1 ? "" : "s"}
            </span>
            <CaretRight size={16} aria-hidden="true" />
          </button>
        )}
        <div className="card-pane-actions">
          {draft ? (
            <>
              <span className="small-note">
                {dirty ? "Unsaved edits" : "No changes yet"}
              </span>
              <button
                onClick={() => {
                  setDraft(undefined);
                  setError("");
                }}
              >
                Cancel
              </button>
              <button
                className="card-pane-primary"
                type="submit"
                form="card-edit-form"
                disabled={!dirty || !draft.title.trim()}
              >
                Save changes
              </button>
            </>
          ) : (
            <>
              <button className="card-pane-primary" onClick={props.explore}>
                <Compass size={21} aria-hidden="true" />
                Explore this idea
              </button>
              <button
                onClick={() => {
                  setDraft(cardEdit(card));
                  setTab("Content");
                  setMenu(false);
                }}
              >
                <PencilSimple size={19} aria-hidden="true" />
                Edit
              </button>
              <div className="card-pane-more">
                <button
                  ref={more}
                  aria-label="More card actions"
                  aria-expanded={menu}
                  onClick={() => setMenu(!menu)}
                >
                  <DotsThree size={24} aria-hidden="true" />
                </button>
                {menu && (
                  <div ref={menuRef}>
                    <DownloadButton
                      card={card}
                      cards={cards}
                      relationships={relationships}
                    />
                    <button
                      onClick={() => {
                        setTab("History");
                        setMenu(false);
                      }}
                    >
                      View history
                    </button>
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
