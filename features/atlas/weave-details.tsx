"use client";
import { useState } from "react";
import { Button, Field, Summary, Textarea } from "../../components/ui/controls";
import type { Thought, CardRevision } from "./domain";
import type { Snapshot } from "../experiments/contracts";
import { contributionSource, type WeaveReview } from "../experiments/weave";
import { snapshotOf } from "./weave";

export default function WeaveDetails({ card, revision, review, variant, compare }: {
  card: Thought; revision: CardRevision;
  review: (note: WeaveReview) => void;
  variant: (revision: CardRevision) => void;
  compare: (before: Snapshot, after: Snapshot) => void;
}) {
  const [notes, setNotes] = useState<Record<string, string>>({});
  const operation = revision.receipt?.operation ?? revision.experiment?.operation;
  if (!operation?.weave || !revision.weaveMappings) return null;
  const input = operation.weave;
  return <details className="weave-details"><Summary>Selected contributions · revision {revision.number}</Summary>
    <p className="small-note">The explanations below are model claims about this result. Your notes stay separate.</p>
    {input.interaction && <p>Requested interaction: {input.interaction}</p>}
    {input.selections.map(selection => {
      const source = contributionSource(operation.sources, selection)!;
      const mapping = revision.weaveMappings!.find(m => m.selectionId === selection.id)!;
      return <section key={selection.id} className="weave-source">
        <h3>{source.title}</h3><p>{selection.text}</p>
        {selection.excerpt && <blockquote>{selection.excerpt.text}</blockquote>}
        <details><Summary>Source revision {source.revision} · {source.title}</Summary><p>{source.summary}</p><div className="weave-passage">{source.body}</div></details>
        <p><strong>{mapping.status}</strong> · {mapping.explanation}</p>
        {mapping.output && <details><Summary>Result passage · {mapping.output.field}</Summary><blockquote>{mapping.output.text}</blockquote><div className="weave-passage">{(() => {
          const text = revision[mapping.output.field], start = text.indexOf(mapping.output.text);
          return <>{text.slice(0, start)}<mark>{mapping.output.text}</mark>{text.slice(start + mapping.output.text.length)}</>;
        })()}</div></details>}
        {(card.weaveReviews ?? []).filter(n => n.revision === revision.number && n.selectionId === selection.id).map(note => <p key={note.id} className="weave-review"><strong>Your note</strong> · {note.text}</p>)}
        <details><Summary>Add your interpretation</Summary><Field label={`Your interpretation · ${source.title}`}><Textarea aria-label={`Your interpretation · ${source.title}`} rows={2} maxLength={2000} value={notes[selection.id] ?? ""} onChange={e => setNotes(previous => ({ ...previous, [selection.id]: e.target.value }))} /></Field>
          <Button disabled={!notes[selection.id]?.trim()} onClick={() => {
            review({ id: crypto.randomUUID(), revision: revision.number, selectionId: selection.id, text: notes[selection.id].trim(), at: new Date().toISOString() });
            setNotes(previous => ({ ...previous, [selection.id]: "" }));
          }}>Save interpretation</Button></details>
      </section>;
    })}
    <div className="weave-actions"><Button onClick={() => variant(revision)}>Change a contribution</Button>
      {input.variantOf && <Button onClick={() => compare(input.variantOf!, snapshotOf(card, revision.number))}>Compare with original</Button>}</div>
  </details>;
}
