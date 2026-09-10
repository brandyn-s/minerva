import type { Thought, Relationship, CardRevision } from "./domain";

export type CardEdit = Pick<
  Thought,
  "revision" | "title" | "summary" | "body" | "contribution"
>;
export function cardEdit(card: Thought): CardEdit {
  const { revision, title, summary, body, contribution } = card;
  return { revision, title, summary, body, contribution };
}
export function firstRevision(card: Pick<Thought, "title" | "summary" | "body">, cause = "starting material", time = new Date().toISOString()): CardRevision {
  return { number: 1, time, cause, title: card.title, summary: card.summary, body: card.body };
}
export function reviseCard(card: Thought, edit: CardEdit, cause = "edited", details: Pick<CardRevision, "note" | "branch"> = {}): Thought {
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
    revisions: [...card.revisions, { number: card.revision + 1, time: new Date().toISOString(), cause,
      title: edit.title.trim(), summary: edit.summary, body: edit.body, ...details }],
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

export function revertCard(card: Thought, number: number): Thought {
  const revision = card.revisions.find(r => r.number === number);
  if (!revision) throw new Error("That revision is unavailable.");
  return reviseCard(card, { ...cardEdit(card), title: revision.title, summary: revision.summary, body: revision.body }, `reverted to revision ${number}`);
}
// Hirschberg LCS keeps memory linear even for long imported text.
export function wordDiff(before: string, after: string): { kind: "same" | "added" | "removed"; text: string }[] {
  const a = before.match(/\s+|[^\s]+/g) ?? [], b = after.match(/\s+|[^\s]+/g) ?? [];
  const row = (x: string[], y: string[]) => {
    let prev = new Uint32Array(y.length + 1);
    for (const word of x) {
      const next = new Uint32Array(y.length + 1);
      for (let j = 0; j < y.length; j++) next[j + 1] = word === y[j] ? prev[j] + 1 : Math.max(prev[j + 1], next[j]);
      prev = next;
    }
    return prev;
  };
  const common = (x: string[], y: string[]): string[] => {
    if (!x.length || !y.length) return [];
    if (x.length === 1) return y.includes(x[0]) ? x : [];
    const middle = Math.floor(x.length / 2), left = row(x.slice(0, middle), y), right = row(x.slice(middle).reverse(), [...y].reverse());
    let split = 0;
    for (let j = 1; j <= y.length; j++) if (left[j] + right[y.length - j] > left[split] + right[y.length - split]) split = j;
    return [...common(x.slice(0, middle), y.slice(0, split)), ...common(x.slice(middle), y.slice(split))];
  };
  const result: ReturnType<typeof wordDiff> = [];
  const push = (kind: "same" | "added" | "removed", text: string) => {
    if (result.at(-1)?.kind === kind) result[result.length - 1].text += text;
    else result.push({kind, text});
  };
  let i = 0, j = 0;
  for (const word of common(a, b)) {
    while (a[i] !== word) push("removed", a[i++]);
    while (b[j] !== word) push("added", b[j++]);
    push("same", word); i++; j++;
  }
  while (i < a.length) push("removed", a[i++]);
  while (j < b.length) push("added", b[j++]);
  return result;
}
