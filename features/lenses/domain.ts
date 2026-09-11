import { z } from "zod";

const key = z.string().min(1).max(300);
const label = z.string().trim().min(1).max(120);
export const lensMemberSchema = z.object({ key, sourceId: key, revision: z.number().int().positive(), title: z.string(), summary: z.string(), candidateId: z.string().optional(), assessmentId: z.string().optional() });
const groupSchema = z.object({ id: z.string().uuid(), label, members: z.array(key), representative: key.nullable() });
const revisionSchema = z.object({ number: z.number().int().positive(), prior: z.number().int().positive().nullable(), undoTo: z.number().int().positive().nullable(), at: z.iso.datetime(), change: z.string(), name: label, description: z.string().max(2000), status: z.enum(["proposed", "reviewed"]), members: z.array(key), groups: z.array(groupSchema), unassigned: z.array(key) });
export const lensSchema = z.object({ version: z.literal(1), id: z.string().uuid(), scope: z.discriminatedUnion("kind", [z.object({ kind: z.literal("atlas") }), z.object({ kind: z.literal("run"), runId: z.string().uuid() })]), origin: z.enum(["manual", "constellation-themes", "assessor-mechanisms"]), members: z.array(lensMemberSchema), revisions: z.array(revisionSchema).min(1) }).superRefine((lens, ctx) => {
  const fail = (message: string) => ctx.addIssue({ code: "custom", message });
  const keys = new Set(lens.members.map(m => m.key));
  if (keys.size !== lens.members.length) fail("Duplicate lens member");
  for (const m of lens.members) if (m.key !== memberKey(m) || (lens.scope.kind === "run") !== !!m.candidateId) fail("Lens member scope mismatch");
  lens.revisions.forEach((r, i) => {
    if (r.number !== i + 1 || r.prior !== (i || null) || (r.undoTo !== null && r.undoTo >= r.number)) fail("Invalid lens history");
    const assigned = r.groups.flatMap(g => g.members), covered = [...assigned, ...r.unassigned];
    if (new Set(r.members).size !== r.members.length || r.members.some(k => !keys.has(k)) || covered.length !== r.members.length || new Set(covered).size !== covered.length || covered.some(k => !r.members.includes(k))) fail("Every lens member must occur exactly once");
    if (new Set(r.groups.map(g => g.id)).size !== r.groups.length) fail("Duplicate group identity");
    for (const g of r.groups) if (g.representative !== null && !g.members.includes(g.representative)) fail("Representative must belong to its group");
  });
});
export type Lens = z.infer<typeof lensSchema>;
export type LensMember = z.infer<typeof lensMemberSchema>;
export type LensRevision = Lens["revisions"][number];
export function memberKey(m: Pick<LensMember, "sourceId" | "revision" | "candidateId">) { return m.candidateId ? `candidate:${m.candidateId}` : `card:${m.sourceId}:${m.revision}`; }
export function currentLens(lens: Lens) { return lens.revisions.at(-1)!; }
export function newLens(scope: Lens["scope"], members: LensMember[], name: string, origin: Lens["origin"] = "manual", groups: { label: string; members: string[] }[] = [], id = crypto.randomUUID()): Lens {
  const assigned = new Set(groups.flatMap(g => g.members));
  return lensSchema.parse({ version: 1, id, scope, origin, members, revisions: [{ number: 1, prior: null, undoTo: null, at: new Date().toISOString(), change: "Created lens", name, description: "", status: origin === "manual" ? "reviewed" : "proposed", members: members.map(m => m.key), groups: groups.map(g => ({ ...g, id: crypto.randomUUID(), representative: g.members[0] ?? null })), unassigned: members.filter(m => !assigned.has(m.key)).map(m => m.key) }] });
}
export const lensEditSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("describe"), name: label, description: z.string().max(2000) }),
  z.object({ kind: z.literal("rename"), groupId: z.string().uuid(), label }),
  z.object({ kind: z.literal("move"), members: z.array(key).min(1), groupId: z.string().uuid().nullable() }),
  z.object({ kind: z.literal("split"), members: z.array(key).min(1), label }),
  z.object({ kind: z.literal("merge"), groupIds: z.array(z.string().uuid()).min(2), label }),
  z.object({ kind: z.literal("representative"), groupId: z.string().uuid(), member: key }),
  z.object({ kind: z.literal("include"), members: z.array(lensMemberSchema).min(1) }),
  z.object({ kind: z.literal("review") }), z.object({ kind: z.literal("undo") }),
]);
export type LensEdit = z.infer<typeof lensEditSchema>;
export function editLens(lens: Lens, input: LensEdit): Lens {
  const edit = lensEditSchema.parse(input), previous = currentLens(lens);
  const next = structuredClone(lens), r = structuredClone(previous);
  const group = (id: string) => { const g = r.groups.find(g => g.id === id); if (!g) throw new Error("Group unavailable"); return g; };
  const detach = (keys: string[]) => {
    if (new Set(keys).size !== keys.length || keys.some(k => !r.members.includes(k))) throw new Error("Unknown or duplicate member");
    const chosen = new Set(keys);
    r.unassigned = r.unassigned.filter(k => !chosen.has(k));
    for (const g of r.groups) { g.members = g.members.filter(k => !chosen.has(k)); if (g.representative && chosen.has(g.representative)) g.representative = g.members[0] ?? null; }
  };
  let change = "";
  switch (edit.kind) {
    case "describe": r.name = edit.name; r.description = edit.description; change = "Edited lens description"; break;
    case "rename": group(edit.groupId).label = edit.label; change = "Renamed group"; break;
    case "move": { const target = edit.groupId ? group(edit.groupId) : undefined, representative = target?.representative; detach(edit.members); if (target) { target.members.push(...edit.members); target.representative = representative ?? target.representative ?? edit.members[0]; } else r.unassigned.push(...edit.members); change = `Moved ${edit.members.length} members`; break; }
    case "split": detach(edit.members); r.groups.push({ id: crypto.randomUUID(), label: edit.label, members: edit.members, representative: edit.members[0] }); change = `Created group from ${edit.members.length} members`; break;
    case "merge": { if (new Set(edit.groupIds).size !== edit.groupIds.length) throw new Error("Choose different groups"); const merged = edit.groupIds.map(group), members = merged.flatMap(g => g.members); r.groups = r.groups.filter(g => !edit.groupIds.includes(g.id)); r.groups.push({ id: crypto.randomUUID(), label: edit.label, members, representative: merged.find(g => g.representative)?.representative ?? null }); change = `Merged ${merged.length} complete groups`; break; }
    case "representative": { const g = group(edit.groupId); if (!g.members.includes(edit.member)) throw new Error("Representative must belong to its group"); g.representative = edit.member; change = "Changed representative"; break; }
    case "include": { for (const m of edit.members) { if (!next.members.some(known => known.key === m.key)) next.members.push(m); if (!r.members.includes(m.key)) { r.members.push(m.key); r.unassigned.push(m.key); } } change = "Included new revisions as unassigned"; break; }
    case "review": r.status = "reviewed"; change = "Reviewed grouping"; break;
    case "undo": { if (!previous.undoTo) throw new Error("No lens edit to undo"); Object.assign(r, structuredClone(lens.revisions[previous.undoTo - 1])); change = `Undid revision ${previous.number}`; break; }
  }
  next.revisions.push({ ...r, number: previous.number + 1, prior: previous.number, undoTo: edit.kind === "undo" ? r.undoTo : previous.number, at: new Date().toISOString(), change });
  return lensSchema.parse(next);
}
