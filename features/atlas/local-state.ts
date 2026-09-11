import { z } from "zod";
import { operationSchema, receiptSchema } from "../experiments/contracts";
import { stableJson } from "./stable-json";
import { expeditionStepSchema, readingSchema, validateReading } from "./expedition";
import { themesSchema, cardHash } from "./themes";
import { firstRevision } from "./card-revisions";
import { mallFixture } from "./fixture";

const id = z.string().regex(/^[A-Za-z0-9][A-Za-z0-9_-]*$/, "Invalid atlas id").refine(s => !["__proto__", "constructor", "prototype"].includes(s) && !s.startsWith("theme-"), "Invalid atlas id");
const point = z.object({ x: z.number(), y: z.number() });
const camera = point.extend({ zoom: z.number().min(.03).max(1.6) });
const view = z.enum(["Lineage", "Evolution", "Constellation"]);
export const revisionSchema = z.object({ number: z.number().int().positive(), time: z.iso.datetime(), cause: z.string(),
  title: z.string(), summary: z.string(), body: z.string(), contribution: z.string().optional(), prepared: z.boolean().optional(), note: z.string().optional(),
  receipt: receiptSchema.optional(),
  experiment: z.object({ candidateId: z.string(), operation: operationSchema }).optional(),
  branch: z.object({ intent: z.string(), step: z.number().int().min(1).max(3), runId: z.string() }).optional() });
const thought = z.object({
  revisions: z.array(revisionSchema).min(1),
  id, importedFromId: id.optional(), revision: z.number().int().nonnegative(), title: z.string(), summary: z.string(), body: z.string(),
  kind: z.enum(["brief", "proposal", "recombination", "exploration"]),
  contribution: z.string(), move: z.object({ title: z.string(), question: z.string(), preview: z.string() }),
  provenance: z.object({ feature: z.string(), tag: z.string(), sourceTitles: z.array(z.string()), moveTitle: z.string().optional() }).optional(),
  generation: z.object({ model: z.string(), manifestId: z.string(), mechanism: z.string(), prerequisites: z.array(z.string()), uncertainties: z.array(z.string()), requestedChange: z.string(), observedChange: z.string() }).optional(),
  assessment: z.object({ goalFidelity: z.string(), constraints: z.string(), causalDependencies: z.string(), transformation: z.string() }).optional(),
});
const relationship = z.object({ id, from: id, to: id, kind: z.enum(["context", "derivation", "recombination", "association"]), label: z.string(), sourceRevision: z.number().int().nonnegative(), contribution: z.string().optional() });
export const expeditionRecordSchema = z.object({
  run: z.object({ goal: z.string(), budget: z.number().int().min(2).max(5), steps: z.array(expeditionStepSchema.extend({ id, step: z.number().int().min(1).max(5) })).max(5), stop: z.string().optional() }),
  reading: z.object({ result: readingSchema, cards: z.array(thought) }).optional(), notes: z.array(z.string()),
});
const size = z.object({ width: z.number().min(200).max(1000), height: z.number().min(120).max(1600) });
const layout = z.object({ positions: z.record(id, point), sizes: z.record(id, size) });
const change = z.object({ kind: z.enum(["move", "resize", "arrange"]), before: layout, after: layout });
export function emptyHistory() { return { Lineage: { undo: [], redo: [] }, Evolution: { undo: [], redo: [] }, Constellation: { undo: [], redo: [] } }; }
const saveV3 = z.object({
  sizes: z.record(view, z.record(id, size)),
  layoutHistory: z.record(view, z.object({ undo: z.array(change).max(50), redo: z.array(change).max(50) })),
  folds: z.array(id),
  version: z.literal(3), intents: z.array(z.object({ id, text: z.string().trim().min(1).max(500) })), thoughts: z.array(thought).min(1), relationships: z.array(relationship),
  positions: z.record(view, z.record(id, point)), cameras: z.partialRecord(view, camera),
  perspective: view, selected: z.array(id), active: id, focusedId: id.nullable(),
  themeCache: z.object({ groups: z.array(themesSchema.shape.groups.element.extend({ memberIds: z.array(id) })), hashes: z.record(id, z.string()), time: z.string() }).optional(),
  messages: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() })),
  expeditions: z.array(expeditionRecordSchema), activeExpedition: z.number().int().nonnegative().nullable(),
}).superRefine((save, ctx) => {
  const ids = new Set(save.thoughts.map(c => c.id));
  const fail = (message: string) => ctx.addIssue({ code: "custom", message });
  for (const card of save.thoughts) {
    const last = card.revisions.at(-1)!;
    if (!last || (last.contribution !== undefined && card.contribution !== last.contribution) || card.revisions.some((r, i) => r.number !== i + 1) || card.revision !== last.number || (["title", "summary", "body"] as const).some(key => card[key] !== last[key])) fail("Invalid card revision history");
  }
  if (new Set(save.intents.map(i => i.id)).size !== save.intents.length) fail("Duplicate intent ids");
  if (ids.size !== save.thoughts.length) fail("Duplicate card ids");
  if (new Set(save.relationships.map(e => e.id)).size !== save.relationships.length) fail("Duplicate edge ids");
  const refs = [...save.selected, save.active, ...(save.focusedId ? [save.focusedId] : []), ...save.relationships.flatMap(e => [e.from, e.to]),
    ...Object.values(save.positions).flatMap(p => Object.keys(p)), ...save.folds,
    ...Object.values(save.sizes).flatMap(p => Object.keys(p)),
    ...Object.values(save.layoutHistory).flatMap(h => [...h.undo, ...h.redo].flatMap(c => [c.before, c.after].flatMap(l => [...Object.keys(l.positions), ...Object.keys(l.sizes)]))), ...Object.keys(save.themeCache?.hashes ?? {}), ...(save.themeCache?.groups.flatMap(g => g.memberIds) ?? [])];
  if (refs.some(ref => !ids.has(ref))) fail("Atlas references a missing card");
  if (save.thoughts.some(c => !save.positions.Lineage[c.id])) fail("Every card needs a Lineage position");
  if (Object.values(save.layoutHistory).some(h => h.undo.length + h.redo.length > 50)) fail("Layout history exceeds 50 changes");
  if (new Set(save.folds).size !== save.folds.length) fail("Duplicate folded cards");
  if (new Set(save.selected).size !== save.selected.length) fail("Duplicate selected cards");
  if (save.themeCache) {
    const groups = save.themeCache.groups, members = groups.flatMap(g => g.memberIds);
    if (new Set(groups.map(g => g.name)).size !== groups.length || new Set(members).size !== members.length) fail("Duplicate theme groups or members");
  }
  if (save.activeExpedition !== null && !save.expeditions[save.activeExpedition]) fail("Missing active expedition");
  for (const entry of save.expeditions) {
    const steps = entry.run.steps;
    if (steps.length > entry.run.budget || steps.some((s, i) => s.step !== i + 1 || !ids.has(s.id))) fail("Invalid expedition steps");
    if (entry.reading) {
      if (entry.reading.cards.length !== steps.length || entry.reading.cards.some((c, i) => c.id !== steps[i]?.id)) fail("Invalid reading cards");
      try { validateReading(entry.reading.result, steps.map(s => s.step)); } catch { fail("Invalid reading references"); }
    }
  }
});
export const atlasSaveSchema = z.preprocess(raw => {
  if (!raw || typeof raw !== "object" || !("version" in raw) || ![1, 2].includes(raw.version as number)) return raw;
  const legacy = raw as Record<string, unknown>;
  const migrateCard = (value: unknown) => {
    if (!value || typeof value !== "object") return value;
    const card = value as Record<string, unknown>;
    return { ...card, revision: 1, revisions: [{ number: 1, time: new Date().toISOString(), cause: "imported current content", title: card.title, summary: card.summary, body: card.body }] };
  };
  return { ...legacy, ...(raw.version === 1 ? { sizes: { Lineage: {}, Evolution: {}, Constellation: {} }, layoutHistory: emptyHistory(), folds: [] } : {}),
    version: 3, intents: [], thoughts: Array.isArray(legacy.thoughts) ? legacy.thoughts.map(migrateCard) : legacy.thoughts,
    expeditions: Array.isArray(legacy.expeditions) ? legacy.expeditions.map(entry => {
      if (!entry || typeof entry !== "object") return entry;
      const reading = entry.reading;
      return { ...entry, reading: reading && typeof reading === "object" ? { ...reading, cards: Array.isArray(reading.cards) ? reading.cards.map(migrateCard) : reading.cards } : reading };
    }) : legacy.expeditions };
}, saveV3);
export type AtlasSave = z.infer<typeof atlasSaveSchema>;
export type ExpeditionRecord = z.infer<typeof expeditionRecordSchema>;
export function fixtureSave(): AtlasSave {
  const fixture = mallFixture();
  return { version: 3, intents: [], sizes: { Lineage: {}, Evolution: {}, Constellation: {} }, layoutHistory: emptyHistory(), folds: [], thoughts: fixture.thoughts, relationships: fixture.relationships, positions: { Lineage: fixture.positions, Evolution: {}, Constellation: {} }, cameras: {}, perspective: "Lineage", selected: [], active: "repair", focusedId: null, messages: [], expeditions: [], activeExpedition: null };
}
export function seedSave(seed: string): AtlasSave {
  const body = seed.trim();
  if (!body) throw new Error("Write a seed before starting fresh.");
  const title = body.split("\n")[0].slice(0, 100);
  const card = {
    id: `seed-${crypto.randomUUID()}`, title, body, summary: body.slice(0, 240),
    kind: "brief" as const, contribution: "User-directed starting seed", revision: 1,
    move: { title: "Explore this seed", question: "What possibilities does this seed open?", preview: "Develop a concrete direction from your starting idea." },
  };
  return atlasSaveSchema.parse({ ...fixtureSave(), thoughts: [{ ...card, revisions: [firstRevision(card, "user-directed seed")] }],
    relationships: [], positions: { Lineage: { [card.id]: { x: 0, y: 0 } }, Evolution: {}, Constellation: {} },
    active: card.id, selected: [card.id] });
}
export function interruptSavedRuns(save: AtlasSave): AtlasSave {
  return { ...save, expeditions: save.expeditions.map(entry => entry.run.stop ? entry : { ...entry, run: { ...entry.run, stop: `Step ${entry.run.steps.length + 1} was interrupted by leaving the atlas. Completed cards remain.` } }) };
}
export const SAVE_KEY = "root-atlas";
export const RECOVERY_PREFIX = "root-atlas-recovery-";
async function database() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open("minerva-atlas", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("saves");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
// Preserve change order, including a reset queued behind an earlier debounce.
let writes: Promise<void> = Promise.resolve();
export function writeSave(save: AtlasSave | null) {
  const snapshot = save && structuredClone(save);
  const next = writes.catch(() => {}).then(() => commitSave(snapshot));
  writes = next;
  return next;
}
async function commitSave(save: AtlasSave | null) {
  const db = await database();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("saves", "readwrite");
      if (save) tx.objectStore("saves").put(save, SAVE_KEY); else tx.objectStore("saves").delete(SAVE_KEY);
      tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error); tx.onabort = () => reject(tx.error);
    });
  } finally { db.close(); }
}
let restoring: Promise<{ save: AtlasSave; notice: string }> | undefined;
export function restoreSave() {
  restoring ??= restoreFromDatabase().finally(() => { restoring = undefined; });
  return restoring;
}
async function restoreFromDatabase(): Promise<{ save: AtlasSave; notice: string }> {
  const db = await database();
  try {
    const raw = await new Promise<unknown>((resolve, reject) => {
      const request = db.transaction("saves").objectStore("saves").get(SAVE_KEY);
      request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
    });
    if (raw === undefined) return { save: fixtureSave(), notice: "" };
    const result = atlasSaveSchema.safeParse(raw);
    if (result.success) return { save: interruptSavedRuns(result.data), notice: "" };
    const recoveryKey = `${RECOVERY_PREFIX}${Date.now()}-${crypto.randomUUID()}`;
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("saves", "readwrite");
      tx.objectStore("saves").put(raw, recoveryKey); tx.objectStore("saves").delete(SAVE_KEY);
      tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error); tx.onabort = () => reject(tx.error);
    });
    return { save: fixtureSave(), notice: "The save could not be read. A recovery copy was kept in this browser." };
  } finally { db.close(); }
}
export async function mergeAtlas(current: AtlasSave, incoming: AtlasSave) {
  const merged = structuredClone(current);
  // Identity is independent of text. Preserve divergent histories as deterministic forks.
  const ids = new Map<string, string>();
  let added = 0, updated = 0;
  const prefix = (a: typeof current.thoughts[number], b: typeof a) =>
    a.revisions.length <= b.revisions.length && a.revisions.every((revision, i) => stableJson(revision) === stableJson(b.revisions[i]));
  for (const card of incoming.thoughts) {
    const candidates = merged.thoughts.filter(c => c.id === card.id || c.importedFromId === card.id);
    const compatible = candidates.find(c => prefix(c, card) || prefix(card, c));
    let newId = compatible?.id ?? card.id;
    if (compatible) {
      if (card.revisions.length > compatible.revisions.length) {
        const index = merged.thoughts.indexOf(compatible);
        merged.thoughts[index] = { ...card, id: compatible.id, importedFromId: compatible.importedFromId };
        updated++;
      }
      ids.set(card.id, newId); continue;
    }
    if (merged.thoughts.some(c => c.id === newId)) {
      const digest = await cardHash({ title: card.id, body: stableJson(card.revisions) });
      newId = `fork-${digest}`;
      if (merged.thoughts.some(c => c.id === newId)) throw new Error("Conflicting imported identity");
    }
    ids.set(card.id, newId); added++;
    merged.thoughts.push({ ...card, id: newId, ...(newId !== card.id ? { importedFromId: card.id } : {}) });
    for (const perspective of ["Lineage", "Evolution", "Constellation"] as const) {
      const position = incoming.positions[perspective][card.id];
      if (position) merged.positions[perspective][newId] = position;
      if (incoming.sizes[perspective][card.id]) merged.sizes[perspective][newId] = incoming.sizes[perspective][card.id];
    }
  }
  const edgeContent = (e: AtlasSave["relationships"][number]) => JSON.stringify([e.from, e.to, e.kind, e.label, e.sourceRevision, e.contribution ?? ""]);
  const edges = new Set(merged.relationships.map(edgeContent));
  for (const edge of incoming.relationships) {
    const next = { ...edge, id: crypto.randomUUID(), from: ids.get(edge.from)!, to: ids.get(edge.to)! };
    const key = edgeContent(next);
    if (!edges.has(key)) { merged.relationships.push(next); edges.add(key); }
  }
  // Keep local conversation, cameras and grouping. Retain imported run readings and
  // notes, with card references remapped, without duplicating identical runs.
  for (const entry of incoming.expeditions) {
    const next = { ...entry, run: { ...entry.run, steps: entry.run.steps.map(s => ({ ...s, id: ids.get(s.id)! })) },
      reading: entry.reading && { ...entry.reading, cards: entry.reading.cards.map(c => ({ ...c, id: ids.get(c.id)! })) } };
    if (!merged.expeditions.some(e => JSON.stringify(e) === JSON.stringify(next))) merged.expeditions.push(next);
  }
  for (const intent of incoming.intents) if (!merged.intents.some(i => i.text === intent.text)) merged.intents.push({ ...intent, id: crypto.randomUUID() });
  merged.layoutHistory = emptyHistory();
  merged.folds = [...new Set([...merged.folds, ...incoming.folds.map(id => ids.get(id)!)])];
  return { save: atlasSaveSchema.parse(merged), added, updated, skipped: incoming.thoughts.length - added - updated };
}

export async function recoveryCopies(): Promise<{ key: string; value: unknown }[]> {
  const db = await database();
  try { return await new Promise((resolve, reject) => {
    const request = db.transaction("saves").objectStore("saves").openCursor();
    const copies: { key: string; value: unknown }[] = [];
    request.onsuccess = () => { const cursor = request.result; if (!cursor) { resolve(copies); return; }
      if (String(cursor.key).startsWith(RECOVERY_PREFIX)) copies.push({ key: String(cursor.key), value: cursor.value });
      cursor.continue(); };
    request.onerror = () => reject(request.error);
  }); } finally { db.close(); }
}
export async function discardRecovery(key: string) {
  if (!key.startsWith(RECOVERY_PREFIX)) throw new Error("Invalid recovery key");
  const db = await database();
  try { await new Promise<void>((resolve, reject) => {
    const tx = db.transaction("saves", "readwrite"); tx.objectStore("saves").delete(key);
    tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error);
  }); } finally { db.close(); }
}
