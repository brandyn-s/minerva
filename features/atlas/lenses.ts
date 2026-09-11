import type { Thought } from "./domain";
import type { ThemeGroup } from "./themes";
import { currentLens, memberKey, newLens, type Lens, type LensMember } from "../lenses/domain";

export function atlasMembers(cards: Thought[]): LensMember[] {
  return cards.map(c => ({ key: memberKey({ sourceId: c.id, revision: c.revision }), sourceId: c.id, revision: c.revision, title: c.title, summary: c.summary }));
}
export function atlasLens(cards: Thought[], name: string, themes?: ThemeGroup[]) {
  const members = atlasMembers(cards);
  return newLens({ kind: "atlas" }, members, name, themes ? "constellation-themes" : "manual", themes?.map(g => ({ label: g.name, members: members.filter(m => g.memberIds.includes(m.sourceId)).map(m => m.key) })));
}
export function lensThemes(lens: Lens, cards: Thought[]): ThemeGroup[] {
  const r = currentLens(lens), current = new Map(atlasMembers(cards).map(m => [m.key, m.sourceId]));
  const groups = r.groups.map(g => ({ name: g.label, reason: "", memberIds: g.members.flatMap(k => current.has(k) ? [current.get(k)!] : []) }));
  const assigned = new Set(groups.flatMap(g => g.memberIds));
  const unassigned = cards.filter(c => !assigned.has(c.id)).map(c => c.id);
  return [...groups, ...(unassigned.length ? [{ name: "Awaiting classification", reason: "Unassigned or newer revisions", memberIds: unassigned }] : [])];
}
export function remapAtlasLens(lens: Lens, ids: Map<string, string>): Lens {
  const next = structuredClone(lens), keys = new Map<string, string>();
  next.members = next.members.map(m => { const sourceId = ids.get(m.sourceId) ?? m.sourceId, key = memberKey({ sourceId, revision: m.revision }); keys.set(m.key, key); return { ...m, sourceId, key }; });
  const remap = (k: string) => keys.get(k)!;
  next.revisions = next.revisions.map(r => ({ ...r, members: r.members.map(remap), unassigned: r.unassigned.map(remap), groups: r.groups.map(g => ({ ...g, members: g.members.map(remap), representative: g.representative ? remap(g.representative) : null })) }));
  return next;
}
