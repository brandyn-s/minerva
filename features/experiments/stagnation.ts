import type { Candidate } from "./contracts";

// A bounded repetition guard, not a semantic judgment or a claim of success.
// Renaming a draft does not count as progress; substantive body changes do.
function similar(left: string, right: string): boolean {
  const normalize = (value: string) => value.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
  const a = normalize(left), b = normalize(right);
  if (a === b) return true;
  if (!a || !b) return false;
  if (Math.min(a.length, b.length) < 2) return false;
  const grams = new Map<string, number>();
  for (let i = 0; i < a.length - 1; i++) grams.set(a.slice(i, i + 2), (grams.get(a.slice(i, i + 2)) ?? 0) + 1);
  let overlap = 0;
  for (let i = 0; i < b.length - 1; i++) {
    const gram = b.slice(i, i + 2), count = grams.get(gram) ?? 0;
    if (count) { overlap++; grams.set(gram, count - 1); }
  }
  return 2 * overlap / (a.length + b.length - 2) >= .9;
}

export function stagnantDrafts(candidates: Candidate[]): boolean {
  const recent = candidates.slice(-3).map(candidate => candidate.snapshot);
  return recent.length === 3 && recent.every(draft => draft.body.trim()) && recent.slice(1).every((draft, index) =>
    similar(draft.summary, recent[index].summary) && similar(draft.body, recent[index].body));
}
