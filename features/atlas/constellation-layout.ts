import type { ThemeGroup } from "./themes";

type Point = { x: number; y: number };
export const CLUSTER_CARD_WIDTH = 290;
export const CLUSTER_ROW = 260;
const COLUMN = 330;
const HEADING = 120;
const GAP = 100;

/** Pack themes into shelves; a large theme grows in rows, never one long column. */
export function constellationLayout(groups: ThemeGroup[], ids: string[]) {
  const members = new Set(groups.flatMap(g => g.memberIds));
  const buckets = [...groups.map(g => g.memberIds), ids.filter(id => !members.has(id))];
  const positions: Record<string, Point> = {};
  let x = 0, y = 0, shelfHeight = 0;
  for (const bucket of buckets) {
    if (!bucket.length) continue;
    const columns = Math.min(3, Math.ceil(Math.sqrt(bucket.length)));
    const width = (columns - 1) * COLUMN + CLUSTER_CARD_WIDTH;
    const height = HEADING + Math.ceil(bucket.length / columns) * CLUSTER_ROW;
    if (x && x + width > 1500) { x = 0; y += shelfHeight + GAP; shelfHeight = 0; }
    bucket.forEach((id, i) => { positions[id] = { x: x + (i % columns) * COLUMN, y: y + HEADING + Math.floor(i / columns) * CLUSTER_ROW }; });
    x += width + GAP;
    shelfHeight = Math.max(shelfHeight, height);
  }
  return positions;
}

/** Headings follow their members, including deliberate moves and partial regrouping. */
export function constellationHeading(ids: string[], positions: Record<string, Point>) {
  const points = ids.map(id => positions[id]).filter(Boolean);
  if (!points.length) return { x: 0, y: 0, width: CLUSTER_CARD_WIDTH };
  const x = Math.min(...points.map(p => p.x));
  return { x, y: Math.min(...points.map(p => p.y)) - HEADING, width: Math.max(CLUSTER_CARD_WIDTH, Math.min(620, Math.max(...points.map(p => p.x)) - x + CLUSTER_CARD_WIDTH)) };
}
