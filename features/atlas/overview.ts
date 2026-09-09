import type { Thought } from "./domain";

const names: Record<string, string> = { brief: "Mall brief", retail: "Retail", food: "Food hall", tools: "Tool library", rotation: "Pop-up shop", repair: "Repair + supper" };
export function overviewName(thought: Thought) {
  return names[thought.id] ?? (thought.title.length > 24 ? `${thought.title.slice(0, 23).trimEnd()}…` : thought.title);
}
export function overviewDiameter(zoom: number) { return Math.max(10, Math.min(48, zoom * 100)); }
export function overviewLabels(nodes: { id: string; position: { x: number; y: number }; data: { thought: Thought } }[], viewport: { x: number; y: number; zoom: number }, priority: string[]) {
  const boxes: { x: number; y: number; width: number; height: number }[] = [];
  const shown = new Set<string>();
  const diameter = overviewDiameter(viewport.zoom);
  const rank = (id: string) => priority.includes(id) ? priority.indexOf(id) : priority.length;
  const ordered = [...nodes].sort((a, b) => rank(a.id) - rank(b.id));
  for (const n of ordered) {
    if (viewport.zoom < .22 && !priority.includes(n.id)) continue;
    const width = 160;
    const box = { x: n.position.x * viewport.zoom + viewport.x + diameter / 2 - width / 2, y: n.position.y * viewport.zoom + viewport.y + diameter + 6, width, height: 38 };
    if (boxes.some(b => box.x < b.x + b.width && box.x + width > b.x && box.y < b.y + b.height && box.y + box.height > b.y)) continue;
    if (nodes.some(other => other.id !== n.id && box.x < other.position.x * viewport.zoom + viewport.x + diameter && box.x + width > other.position.x * viewport.zoom + viewport.x && box.y < other.position.y * viewport.zoom + viewport.y + diameter && box.y + box.height > other.position.y * viewport.zoom + viewport.y)) continue;
    boxes.push(box); shown.add(n.id);
  }
  return shown;
}
