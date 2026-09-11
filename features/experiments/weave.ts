import { z } from "zod";

const field = z.enum(["summary", "body"]);
export const contributionSelectionSchema = z.object({
  id: z.string().min(1).max(200), sourceId: z.string().min(1).max(200),
  sourceRevision: z.number().int().positive(), text: z.string().trim().min(1).max(2000),
  excerpt: z.object({ field, start: z.number().int().nonnegative(), end: z.number().int().positive(), text: z.string().min(1).max(4000) }).optional(),
});
export const weaveInputSchema = z.object({
  version: z.literal(1), selections: z.array(contributionSelectionSchema).min(2).max(8),
  interaction: z.string().max(2000),
  variantOf: z.object({ id: z.string().min(1).max(200), revision: z.number().int().positive(), title: z.string().max(1000), summary: z.string().max(8000), body: z.string().max(32000) }).optional(),
});
export const weaveMappingSchema = z.object({
  selectionId: z.string().min(1).max(200),
  status: z.enum(["retained", "transformed", "not used", "uncertain"]),
  explanation: z.string().min(1).max(2000),
  output: z.object({ field, text: z.string().min(1).max(2000) }).nullable(),
});
export const weaveMappingsSchema = z.array(weaveMappingSchema).min(2).max(8);
export const weaveReviewSchema = z.object({
  id: z.string(), revision: z.number().int().positive(), selectionId: z.string(),
  text: z.string().trim().min(1).max(2000), at: z.iso.datetime(),
});
export type WeaveInput = z.infer<typeof weaveInputSchema>;
export type ContributionSelection = z.infer<typeof contributionSelectionSchema>;
export type WeaveMapping = z.infer<typeof weaveMappingSchema>;
export type WeaveReview = z.infer<typeof weaveReviewSchema>;
type Source = { id: string; revision: number; summary: string; body: string };

export function validateWeaveInput(input: WeaveInput, sources: Source[]) {
  if (input.selections.length !== sources.length || new Set(sources.map(s => s.id)).size !== sources.length ||
    new Set(input.selections.map(s => s.id)).size !== input.selections.length ||
    new Set(input.selections.map(s => s.sourceId)).size !== sources.length) throw new Error("Choose one contribution per distinct source.");
  for (const selection of input.selections) {
    const source = sources.find(s => s.id === selection.sourceId && s.revision === selection.sourceRevision);
    if (!source) throw new Error("Contribution source revision is unavailable.");
    const q = selection.excerpt;
    if (q && (q.end <= q.start || source[q.field].slice(q.start, q.end) !== q.text || q.end > source[q.field].length))
      throw new Error("Contribution excerpt does not match its source revision.");
  }
  return input;
}

export function validateWeaveMappings(input: WeaveInput, mappings: WeaveMapping[], output: Pick<Source, "summary" | "body">) {
  if (mappings.length !== input.selections.length || new Set(mappings.map(m => m.selectionId)).size !== mappings.length)
    throw new Error("Missing or duplicate contribution mappings.");
  for (const mapping of mappings) {
    if (!input.selections.some(s => s.id === mapping.selectionId)) throw new Error("Unknown contribution mapping.");
    if (mapping.output && !output[mapping.output.field].includes(mapping.output.text)) throw new Error("Contribution output quotation is not in the result.");
    if (["retained", "transformed"].includes(mapping.status) && !mapping.output) throw new Error("A claimed contribution needs a result quotation.");
  }
  return mappings;
}
