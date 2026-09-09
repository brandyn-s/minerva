import type { ThemeGroup } from "./themes";

export function applyRegroup(current: ThemeGroup[], incoming: ThemeGroup[], ids: string[], nodes: { id: string; position: { x: number; y: number } }[]) {
  const affected = new Set(ids);
  // Preserve slots so untouched theme headings and cards keep their coordinates.
  const all = nodes.every(n => affected.has(n.id));
  const groups = (all ? [] : current).map(g => ({ ...g, memberIds: g.memberIds.filter(id => !affected.has(id)) }));
  for (const group of incoming) {
    const existing = groups.find(g => g.name === group.name);
    if (existing) existing.memberIds.push(...group.memberIds);
    else {
      const empty = groups.findIndex(g => !g.memberIds.length);
      const replacement = { ...group, memberIds: [...group.memberIds] };
      if (empty >= 0) groups[empty] = replacement;
      else groups.push(replacement);
    }
  }
  const layout = Object.fromEntries(nodes.filter(n => !affected.has(n.id)).map(n => [n.id, n.position]));
  groups.forEach((group, index) => {
    const remaining = group.memberIds.filter(id => !affected.has(id));
    let y = Math.max(-320, ...remaining.map(id => layout[id]?.y ?? -320)) + 480;
    for (const id of group.memberIds.filter(id => affected.has(id))) {
      layout[id] = { x: index * 760, y }; y += 480;
    }
  });
  return { groups, layout };
}
