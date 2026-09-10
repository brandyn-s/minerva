import { z } from "zod";
import { cardSchema } from "./generation";
export const developmentResultSchema = cardSchema.extend({ note: z.string().min(1).describe("One line claiming what changed and why; not a verified outcome") });
export const developmentRequestSchema = z.object({
  intent: z.string().trim().min(1).max(500), step: z.number().int().min(1).max(3),
  card: cardSchema.extend({ id: z.string(), revision: z.number().int().positive() }),
  priorSteps: z.array(developmentResultSchema.extend({ step: z.number().int().min(1).max(3) })),
});
