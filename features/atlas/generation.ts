import { z } from "zod";

export const sourceSchema = z.object({
  id: z.string(),
  title: z.string(),
  summary: z.string(),
  body: z.string(),
});
export const cardSchema = z.object({
  title: z.string().describe("A short, specific title"),
  summary: z.string().describe("One sentence describing the idea"),
  body: z.string().describe("One short paragraph making the idea concrete"),
});
export const wanderSchema = z.object({ cards: z.array(cardSchema).min(2).max(3) });
export const weaveSchema = z.object({
  card: cardSchema,
  contributions: z.tuple([
    z.string().describe("One line explaining the first parent's contribution"),
    z.string().describe("One line explaining the second parent's contribution"),
  ]),
});
export type GeneratedCard = z.infer<typeof cardSchema>;
export type LiveFeature = "wander" | "weave";
