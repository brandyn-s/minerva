import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { chromium } from "playwright";

const base = process.env.MINERVA_URL || "http://127.0.0.1:3000";
const endpoint = `${base}/internal/workspaces`;
const post = async (command, expected = 200) => {
  const result = await fetch(endpoint, { method: "POST",
    headers: { "Content-Type": "application/json", Origin: base }, body: JSON.stringify(command) });
  const body = await result.json();
  assert.equal(result.status, expected, JSON.stringify(body));
  return body.workspace;
};
const identity = (workspaceId) => ({ commandId: randomUUID(), actor: "local-user", workspaceId });
const id = randomUUID();
const create = { ...identity(id), operation: "create-workspace", name: `Verification ${id}`,
  brief: "Food and repair", constraints: "Synthetic data only" };
const first = await post(create);
// Discard the first acknowledgement and replay the same request, concurrently.
const replays = await Promise.all([post(create), post(Object.fromEntries(Object.entries(create).reverse()))]);
assert.deepEqual(replays, [first, first]);
await post({ ...create, name: "Changed payload" }, 409);
const revision = { ...create, ...identity(id), operation: "revise-workspace", expectedRevision: 1, brief: "Staffed repair" };
const second = await post(revision);
assert.equal(second.revision, 2);
await post({ ...revision, commandId: randomUUID() }, 409);
const graphPost = async (action, expected = 200) => {
  const result = await fetch(`${base}/internal/graph`, { method: "POST", headers: { "Content-Type": "application/json", Origin: base },
    body: JSON.stringify({ ...identity(id), ...action }) });
  const data = await result.json();
  assert.equal(result.status, expected, JSON.stringify(data));
  return data;
};
await graphPost({ operation: "seed-mall" });
const graph = await (await fetch(`${base}/internal/graph?workspaceId=${id}`)).json();
assert.equal(graph.thoughts.length, 7);
assert.equal(graph.relationships.length, 9);
const repair = graph.thoughts.find((t) => t.kind === "recombination");
const parent = graph.relationships.find((e) => e.to === repair.id);
await graphPost({ operation: "connect-ideas", edgeId: randomUUID(), from: repair.id, to: parent.from,
  sourceRevision: repair.revision, targetRevision: graph.thoughts.find((t) => t.id === parent.from).revision,
  kind: "derivation", label: "invalid cycle", contribution: "" }, 409);
const layout = graph.layouts[repair.id];
await graphPost({ operation: "set-layout", ideaId: repair.id, expectedRevision: layout.revision,
  x: layout.x + 100, y: layout.y, width: layout.width, height: layout.height });
const duplicate = await post({ ...identity(randomUUID()), operation: "duplicate-workspace",
  sourceWorkspaceId: id, expectedRevision: 2, name: "Independent verification copy" });
assert.notEqual(duplicate.id, id);
const exported = await (await fetch(`${endpoint}?export=${duplicate.id}`)).json();
assert.equal(exported.version, 1);
assert.equal(exported.revisions.length, 3);
assert.ok(exported.revisions.every((r) => r.workspaceId === duplicate.id));
assert.equal(exported.ideas.length, 7);
assert.equal(exported.ideaRevisions.length, 8);
const copiedIds = new Set(exported.ideas.map((idea) => idea.id));
assert.ok(exported.relationships.every((e) => copiedIds.has(e.from) && copiedIds.has(e.to)));
assert.ok(graph.thoughts.every((idea) => !copiedIds.has(idea.id)));
const browser = await chromium.launch({ headless: true, executablePath: process.env.MINERVA_CHROMIUM });
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(`${base}/workspaces`);
  await page.getByRole("button", { name: `${create.name} · revision 2`, exact: true }).click();
  assert.equal(await page.getByLabel("Brief", { exact: true }).inputValue(), "Staffed repair");
  await page.getByLabel("Brief", { exact: true }).fill("Edited through the browser");
  await page.getByRole("button", { name: "Save workspace", exact: true }).click();
  await page.getByRole("status").filter({ hasText: "Saved revision 3." }).waitFor();
  await page.reload();
  await page.getByRole("button", { name: `${create.name} · revision 3`, exact: true }).click();
  assert.equal(await page.getByLabel("Brief", { exact: true }).inputValue(), "Edited through the browser");
  await page.getByRole("link", { name: "Open atlas", exact: true }).click();
  await page.getByRole("button", { name: "Thoughts 7" }).waitFor();
  await page.getByRole("button", { name: "Read as text", exact: true }).click();
  await page.getByRole("heading", { name: repair.title, exact: true }).waitFor();
  await page.getByRole("button", { name: "Close panel", exact: true }).click();
  await page.getByRole("button", { name: "New idea", exact: true }).click();
  await page.getByRole("button", { name: "Thoughts 8" }).waitFor();
  await page.reload();
  await page.getByRole("button", { name: "Thoughts 8" }).waitFor();
  await page.screenshot({ path: "/tmp/minerva-saved-atlas.png" });
  await page.goto(`${base}/workspaces`);
  await page.getByRole("button", { name: `${create.name} · revision 3`, exact: true }).click();
  await page.getByLabel(`Type ${create.name} to confirm deletion`).fill(create.name);
  await page.getByRole("button", { name: "Delete workspace", exact: true }).click();
  await page.getByRole("status").filter({ hasText: "Saved revision 4." }).waitFor();
  await page.reload();
  await page.getByLabel("Show deleted workspaces").check();
  await page.getByRole("button", { name: `${create.name} · deleted`, exact: true }).click();
  await page.getByRole("button", { name: "Restore workspace", exact: true }).click();
  await page.getByRole("status").filter({ hasText: "Saved revision 5." }).waitFor();
  await page.setViewportSize({ width: 390, height: 844 });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
} finally { await browser.close(); }
for (const workspaceId of [id, duplicate.id]) {
  const snapshot = await (await fetch(`${endpoint}?export=${workspaceId}`)).json();
  const w = snapshot.workspace;
  await post({ ...identity(workspaceId), operation: "delete-workspace", expectedRevision: w.revision, confirmation: w.name });
}
const forbidden = await fetch(endpoint, { method: "POST",
  headers: { Origin: "https://unrelated.example", "Content-Type": "application/json" }, body: JSON.stringify(create) });
assert.equal(forbidden.status, 403);
console.log("Real Postgres: create/open/revise/reload, receipt replay, changed-payload denial, stale writes, independent duplicate/history, JSON export, recoverable delete/restore and cross-origin denial passed. Only this run's synthetic workspaces were changed; both are now deleted.");
