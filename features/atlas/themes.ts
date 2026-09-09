import { z } from "zod";

export const themeCardSchema = z.object({ id: z.string(), title: z.string(), body: z.string() });
export const themesRequestSchema = z.object({ cards: z.array(themeCardSchema).min(1), existingGroups: z.array(z.string()).default([]) });
export const themesSchema = z.object({ groups: z.array(z.object({ name: z.string().min(1), reason: z.string().min(1), memberIds: z.array(z.string()).min(1) })).min(1) });
export type ThemeGroup = z.infer<typeof themesSchema>["groups"][number];
export function validateThemes(value: unknown, ids: string[], existing: string[] = []) {
  const result = themesSchema.parse(value);
  const members = result.groups.flatMap(g => g.memberIds);
  if (new Set(result.groups.map(g => g.name)).size !== result.groups.length || members.length !== ids.length || new Set(members).size !== ids.length || members.some(id => !ids.includes(id))) throw new Error("Themes must assign every submitted card exactly once.");
  if (existing.length && result.groups.filter(g => !existing.includes(g.name)).length > 1) throw new Error("Incremental grouping may open only one new theme.");
  return result.groups;
}
export async function cardHash(card: { title: string; body: string }) {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify([card.title, card.body])));
  return Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2, "0")).join("");
}
