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
export const weaveSchema = (parentCount: number) => z.object({
  card: cardSchema,
  contributions: z.array(
    z.string().describe("One line explaining this parent's contribution, in input order"),
  ).length(parentCount),
});
export type GeneratedCard = z.infer<typeof cardSchema>;
export type LiveFeature = "wander" | "weave";

export const moveSchema = z.object({
  title: z.string(),
  question: z.string(),
  preview: z.string().describe("One line previewing the direction"),
});
export const movesSchema = z.object({ moves: z.array(moveSchema).length(3) });
export const moveCardSchema = z.object({ cards: z.array(cardSchema).length(1) });
export const wanderRequestSchema = sourceSchema.extend({ intent: z.enum(["wander", "move"]).default("wander"), move: moveSchema.optional() });
export type ContextualMove = z.infer<typeof moveSchema>;
export const contextCardSchema = sourceSchema.extend({
  relationships: z.array(z.object({
    from: z.string(), to: z.string(), kind: z.string(), label: z.string(),
    contribution: z.string().optional(),
  })),
});
export const talkRequestSchema = z.object({
  messages: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() })).min(1),
  cards: z.array(contextCardSchema),
});
export type TalkRequest = z.infer<typeof talkRequestSchema>;
