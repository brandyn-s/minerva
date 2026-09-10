import type { Thought, Relationship } from "./domain";

export type CardEdit = Pick<
  Thought,
  "revision" | "title" | "summary" | "body" | "contribution"
>;
export function cardEdit(card: Thought): CardEdit {
  const { revision, title, summary, body, contribution } = card;
  return { revision, title, summary, body, contribution };
}
export function reviseCard(card: Thought, edit: CardEdit): Thought {
  if (edit.revision !== card.revision)
    throw new Error(
      "This card changed while you were editing. Cancel to load its current version.",
    );
  if (!edit.title.trim())
    throw new Error("Give this card a title before saving.");
  // An assessment describes the old revision; generation provenance remains original.
  const revised = {
    ...card,
    ...edit,
    title: edit.title.trim(),
    revision: card.revision + 1,
  };
  delete revised.assessment;
  return revised;
}
export function cardConnections(id: string, edges: Relationship[]) {
  const lineage = edges.filter(
    (edge) => edge.kind === "derivation" || edge.kind === "recombination",
  );
  return {
    parents: lineage.filter((edge) => edge.to === id),
    children: lineage.filter((edge) => edge.from === id),
    related: edges.filter(
      (edge) =>
        edge.kind === "association" && (edge.from === id || edge.to === id),
    ),
    context: edges.filter(
      (edge) => edge.kind === "context" && (edge.from === id || edge.to === id),
    ),
  };
}
