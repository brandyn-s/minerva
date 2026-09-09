import { z } from "zod";
import { cardSchema, sourceSchema, type GeneratedCard } from "./generation";

export const expeditionRequestSchema = z.object({
  goal: z.string().refine(value => value.trim().length > 0, "Enter a goal"),
  frontier: sourceSchema,
  cards: z.array(sourceSchema).max(4),
  step: z.number().int().min(1).max(5),
});
export const expeditionStepSchema = z.object({
  card: cardSchema,
  rationale: z.string().min(1).describe("One line explaining how this step pursues the frozen goal"),
  reached: z.boolean().describe("Your tentative self-report: does the goal now appear reached? This is a claim, not verified success."),
  reason: z.string().min(1).describe("Explain your reached or not-reached self-report"),
});
export type ExpeditionStep = z.infer<typeof expeditionStepSchema> & { id: string; step: number };
export const readingRequestSchema = z.object({
  goal: z.string().min(1),
  cards: z.array(sourceSchema.extend({ step: z.number().int().min(1).max(5) })).min(1).max(5),
});
const references = z.array(z.number().int().min(1).max(5)).min(1).describe("Actual supplied step numbers supporting this item");
const item = z.object({ text: z.string().min(1), steps: references });
export const readingSchema = z.object({
  groups: z.array(z.object({ mechanism: z.string().min(1), steps: references })).min(1),
  changes: z.array(z.object({ step: z.number().int().min(1).max(5), why: z.string().min(1) })),
  observations: z.array(item.extend({ kind: z.literal("observation") })),
  hypotheses: z.array(item.extend({ kind: z.literal("hypothesis") })),
  experiments: z.array(item).length(2),
  coverage: item.describe("Name what this expedition did not try; link to the steps whose limits you describe"),
});
export type Reading = z.infer<typeof readingSchema>;
export function validateReading(value: unknown, steps: number[]): Reading {
  const reading = readingSchema.parse(value);
  const grouped = reading.groups.flatMap(g => g.steps);
  if (grouped.length !== steps.length || new Set(grouped).size !== steps.length || steps.some(s => !grouped.includes(s))) {
    throw new Error("Reading groups must assign every expedition step exactly once.");
  }
  const referenced = [...grouped, ...reading.changes.map(c => c.step), ...reading.observations.flatMap(i => i.steps),
    ...reading.hypotheses.flatMap(i => i.steps), ...reading.experiments.flatMap(i => i.steps), ...reading.coverage.steps];
  if (referenced.some(s => !steps.includes(s))) throw new Error("Reading references an unavailable expedition step.");
  return reading;
}
// Compare both fields independently using normalized character bigram Dice similarity.
// Two consecutive similar transitions (three generated cards) constitute stagnation.
export function nearIdentical(a: GeneratedCard, b: GeneratedCard): boolean {
  const similar = (left: string, right: string) => {
    const normalize = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
    const x = normalize(left), y = normalize(right);
    if (x === y) return true;
    if (Math.min(x.length, y.length) < 2) return false;
    const grams = new Map<string, number>();
    for (let i = 0; i < x.length - 1; i++) grams.set(x.slice(i, i + 2), (grams.get(x.slice(i, i + 2)) ?? 0) + 1);
    let overlap = 0;
    for (let i = 0; i < y.length - 1; i++) {
      const gram = y.slice(i, i + 2), count = grams.get(gram) ?? 0;
      if (count) { overlap++; grams.set(gram, count - 1); }
    }
    return 2 * overlap / (x.length + y.length - 2) >= .9;
  };
  return similar(a.title, b.title) && similar(a.summary, b.summary);
}
