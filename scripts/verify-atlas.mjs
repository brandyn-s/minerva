import {verifyExpedition, startExpedition, waitForRun} from "./expedition-journey.mjs";
import assert from "node:assert/strict";
import { loader } from "../tests/helpers/load-ts.mjs";
const load = loader();
const { operationSchema } = load("features/experiments/contracts.ts");
const { planOperation } = load("features/experiments/operators.ts");
import { createHash, randomUUID } from "node:crypto";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { execFileSync } from "node:child_process";
import { chromium } from "playwright";

const talkText = "A tool library could pair borrowing with a repair lesson.";
const streamServer = createServer((request, response) => {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Headers", "content-type");
  if (request.method === "OPTIONS") { response.end(); return; }
  response.setHeader("Content-Type", "application/x-ndjson");
  response.write(JSON.stringify({ text: talkText.slice(0, 20) }) + "\n");
  setTimeout(() => response.end(JSON.stringify({ text: talkText.slice(20) }) + "\n" + JSON.stringify({ done: true }) + "\n"), 900);
});
await new Promise((resolve) => streamServer.listen(0, "127.0.0.1", resolve));
const mockStreamUrl = `http://127.0.0.1:${streamServer.address().port}/api/talk`;
const liveVoice = process.env.MINERVA_LIVE === "1" && process.env.MINERVA_VOICE_ONLY === "1";
const voiceInput = "Suggest one practical use for an empty shopping mall. Reply in one short sentence.";
let voiceFile = process.env.MINERVA_VOICE_WAV;
if (liveVoice && !voiceFile) {
  voiceFile = "/tmp/minerva-voice-input.wav";
  execFileSync("/usr/bin/say", ["-o", "/tmp/minerva-voice-input.aiff", voiceInput + " [[slnc 3000]]"]);
  execFileSync("/usr/bin/afconvert", ["-f", "WAVE", "-d", "LEI16@24000", "/tmp/minerva-voice-input.aiff", voiceFile]);
}
const browser = await chromium.launch({
  executablePath: process.env.MINERVA_CHROMIUM || undefined,
  args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream",
    ...(voiceFile ? [`--use-file-for-fake-audio-capture=${voiceFile}`] : [])],
});
const artifacts = process.env.MINERVA_ARTIFACTS || "/tmp/minerva-evidence";
await mkdir(artifacts, { recursive: true });
const errors = [];
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
page.on("pageerror", (e) => errors.push(e.message));
const base = process.env.MINERVA_URL || "http://127.0.0.1:3000";
// Exercise legacy card metadata against the real route, never a mocked response.
if (process.env.MINERVA_WANDER_REGRESSION === "1") {
  const source = { id: "menders-table", title: "The Six-Week Mender's Table", summary: "A rotating repair-and-supper stall in the mall food hall.", body: "A different fixer tests their trade every six weeks.", move: { title: "Explore this direction", question: "Where could this idea lead?", preview: "Explore a repair stall." } };
  const response = await page.request.post(`${base}/api/wander`, { data: source, timeout: 90000 });
  const output = await response.json();
  assert.equal(response.status(), 200, JSON.stringify(output));
  assert.ok(output.cards.length >= 2 && output.cards.length <= 3, "legacy source move metadata must still produce a full Wander");
  await writeFile(`${artifacts}/wander-regression.json`, JSON.stringify({ source, output }, null, 2));
}
const button = (name) => page.getByRole("button", { name, exact: true });
const clearSelection = async () => { if (await button("Clear selection").count()) await button("Clear selection").click(); };
const transform = () =>
  page.locator(".react-flow__viewport").getAttribute("style");
const settle = () => page.waitForTimeout(350);
const openAtlasMenu = async () => {
  if (await page.locator(".atlas-menu").getAttribute("open") === null) await page.locator(".atlas-menu > summary").click();
};
const resetFixture = async () => {
  await openAtlasMenu();
  await button("Reset to fixture").click();
  await button("Confirm Reset").click();
  await page.waitForFunction(() => document.querySelectorAll(".thought").length === 6);
  await settle();
};
const storedSave = () => page.evaluate(() => new Promise((resolve, reject) => {
  const open = indexedDB.open("minerva-atlas", 1);
  open.onsuccess = () => {
    const db = open.result, request = db.transaction("saves").objectStore("saves").get("root-atlas");
    request.onsuccess = () => { resolve(request.result); db.close(); }; request.onerror = () => reject(request.error);
  }; open.onerror = () => reject(open.error);
}));
const cameraKey = async (key, target = page) => {
  await target.locator(".field").focus();
  await target.keyboard.press(key);
};
const fit = async () => {
  await cameraKey("0");
  await settle();
};
const close = async () => {
  await button("Close panel").click();
};
if (process.env.MINERVA_SELECTION_DOCK_ONLY === "1") {
  try {
    await page.goto(base);
    await page.getByRole("button", { name: "Select A food hall", exact: true }).click();
    const dock = page.locator(".light-selection-dock");
    const action = name => dock.getByRole("button", { name, exact: true });
    assert.ok(await action("Wander").isEnabled());
    assert.equal(await action("Weave").count(), 0);
    await page.screenshot({ path: `${artifacts}/selection-dock-desktop.png` });
    assert.equal(await action("Compare").count(), 0);
    await action("Expedition").click();
    await page.getByRole("dialog", { name: "Expedition", exact: true }).waitFor(); await close();
    await page.route("**/api/moves", route => route.fulfill({ status: 500, json: { error: "Prepared moves fixture" } }));
    await action("Wander").click();
    await page.getByRole("dialog").waitFor(); await close();
    await page.getByRole("button", { name: "Select A shared tool library", exact: true }).click();
    assert.equal(await action("Wander").count(), 0);
    assert.equal(await action("Expedition").count(), 0);
    assert.ok(await action("Weave").isEnabled());
    await action("Compare").click();
    await page.getByRole("dialog").waitFor(); await close();
    await page.setViewportSize({ width: 390, height: 844 });
    assert.ok(await dock.evaluate(el => { const r = el.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth; }));
    await page.screenshot({ path: `${artifacts}/selection-dock-mobile.png` });
    await page.route("**/api/weave", async route => {
      await new Promise(resolve => setTimeout(resolve, 600));
      await route.fulfill({ json: { card: { title: "Repair supper", summary: "Share tools and supper.", body: "A repair station beside shared tables." }, contributions: ["Shared tables", "Tools and skills"] } });
    });
    await action("Weave").click();
    await page.locator(".generation-progress").waitFor();
    assert.equal(await action("Weave").count(), 0);
    await page.waitForFunction(() => [...document.querySelectorAll(".thought")].some(el => el.textContent.includes("Repair supper")));
    await action("Clear selection").click();
    await dock.waitFor({ state: "hidden" });
    assert.deepEqual(errors, []);
    console.log("Selection dock: single/multiple selection, all actions, loading, clearing and narrow layout passed.");
  } finally { await browser.close(); streamServer.close(); }
  process.exit(0);
}
if (process.env.MINERVA_EXPEDITION_ONLY === "1") {
  try { await verifyExpedition(page, base, artifacts); assert.deepEqual(errors, []); }
  finally { await browser.close(); streamServer.close(); }
  process.exit(0);
}
const catalogueRow = (target, title) => target.locator(".catalogue-entry").filter({ has: target.getByText(title, { exact: true }) });
async function focusFromIndex(target, title) {
  const row = catalogueRow(target, title);
  await row.locator(".catalogue-disclosure").click();
  await row.getByRole("button", { name: "Show in atlas", exact: true }).click();
}
async function inspectFromIndex(title) {
  await page.getByRole("button", { name: /^Thoughts / }).click();
  await focusFromIndex(page, title);
  await button("Open card").click();
}
async function selectCatalogue(target, title, only = false) {
  await target.getByRole("button", { name: /^Thoughts / }).click();
  if (only) for (const checkbox of await target.locator(".catalogue-entry input:checked").all()) await checkbox.uncheck();
  await catalogueRow(target, title).getByRole("checkbox").check();
  await target.getByRole("button", { name: "Close panel", exact: true }).click();
}
async function focusInspected(target) {
  const title = await target.getByRole("dialog").getAttribute("aria-label");
  await target.getByRole("button", { name: "Close panel", exact: true }).click();
  await target.getByRole("button", { name: /^Thoughts / }).click();
  await focusFromIndex(target, title);
}
async function assertAttached() {
  const attached = await page.evaluate(() => {
    const path = document.querySelector('[data-id="food-repair"] .react-flow__edge-path');
    return ["food", "repair"].every((id, index) => {
      const node = document.querySelector(`[data-id="${id}"]`);
      const surface = node.querySelector(".overview-target") || node.querySelector(".thought");
      const rect = surface.getBoundingClientRect();
      const point = path.getPointAtLength(index ? path.getTotalLength() : 0)
        .matrixTransform(path.getScreenCTM());
      if ((surface.classList.contains("compact-target") || surface.classList.contains("scale-target"))) {
        return Math.abs(Math.hypot(point.x - (rect.left + rect.width / 2),
          point.y - (rect.top + rect.height / 2)) - rect.width / 2) < 3;
      }
      return point.x >= rect.left - 3 && point.x <= rect.right + 3 &&
        point.y >= rect.top - 3 && point.y <= rect.bottom + 3 &&
        Math.min(Math.abs(point.x - rect.left), Math.abs(point.x - rect.right),
          Math.abs(point.y - rect.top), Math.abs(point.y - rect.bottom)) < 3;
    });
  });
  assert.ok(attached, "connection endpoints must follow visible card boundaries");
}
async function verifyDevelopment() {
  console.log("Development: opening fixture");
  await page.goto(base); await resetFixture();
  const waitSave = async predicate => {
    const end = Date.now() + 90000;
    while (Date.now() < end) { const save = await storedSave(); if (save && predicate(save)) return save; await page.waitForTimeout(100); }
    throw new Error("Development save did not reach expected state");
  };
  const card = (save, id) => save.thoughts.find(c => c.id === id);
  const start = await waitSave(s => s.version === 3); console.log("Development: editing");
  const original = card(start, "food");
  await inspectFromIndex(original.title);
  for (let edit = 1; edit <= 2; edit++) {
    await button("More card actions").click(); await button("Edit").click();
    await page.getByLabel("Title", { exact: true }).fill(`A ${edit === 1 ? "small" : "winter"} food hall`);
    await page.getByLabel("Summary", { exact: true }).fill(`Summary ${edit}`);
    await page.getByLabel("Body", { exact: true }).fill(edit === 1 ? "A small warm hall." : "A small winter hall.");
    await button("Save changes").click();
    await waitSave(s => card(s, "food").revision === edit + 1);
  }
  await page.getByRole("tab", { name: "History", exact: true }).click();
  const third = page.getByRole("region", { name: "Revision 3", exact: true });
  assert.equal(await third.locator('[aria-label="Title changes"] ins').innerText(), "winter");
  assert.equal(await third.locator('[aria-label="Title changes"] del').innerText(), "small");
  assert.equal(await third.locator('[aria-label="Body changes"] ins').innerText(), "winter");
  assert.equal(await third.locator('[aria-label="Body changes"] del').innerText(), "warm");
  await button("Revert to revision 1").click();
  const reverted = await waitSave(s => card(s, "food").revision === 4);
  assert.equal(card(reverted, "food").revisions.length, 4);
  for (const key of ["title", "summary", "body"]) assert.equal(card(reverted, "food")[key], original[key]);
  assert.equal(card(reverted, "food").revisions[3].cause, "reverted to revision 1");
  assert.ok(reverted.relationships.some(e => e.from === "food" && e.to === "repair" && e.sourceRevision === 1));
  await close(); await inspectFromIndex("Repair, then stay for supper");
  await page.getByRole("tab", { name: /^Connections/ }).click();
  await page.getByText(/derived from revision 1 of A food hall · Parent has moved on/).waitFor();
  await close();
  console.log("Development: generation and reuse");
  const requests = [];
  const intent = "Make this cheaper to pilot";
  await page.route("**/api/develop", async route => {
    const input = route.request().postDataJSON(); requests.push(input);
    await route.fulfill({ json: { title: `${input.card.title} ${input.step}`, summary: `Pilot step ${input.step}`, body: `Run a smaller pilot at step ${input.step}.`, note: `Reduced scope in step ${input.step} to test cheaply.` } });
  });
  await inspectFromIndex("Independent retail shops"); await button("Develop").click();
  await page.getByLabel("Intent", {exact:true}).fill(intent); await page.getByLabel("Steps", {exact:true}).selectOption("2");
  await button("Start development").click(); await page.getByText("2 steps completed. Revisions are kept in History.", {exact:true}).waitFor();
  let developed = await waitSave(s => card(s, "retail").revision === 3);
  assert.equal(card(developed,"retail").revisions.length, 3);
  assert.equal(card(developed,"retail").revisions[2].cause, `branch step 2 of ${intent}`);
  assert.equal(requests[1].card.revision, 2); assert.equal(requests[1].priorSteps.length, 1);
  await close();
  await fit();
  for (let i = 0; i < 15 && !await page.locator('.overview-target').count(); i++) { await cameraKey("-"); await settle(); }
  assert.ok(await page.locator('.overview-target').count());
  assert.ok(await page.locator('.overview-name').count(), "overview titles are visible");
  assert.equal(await page.locator('.overview-target .revision-badge').count(), 0, "overview labels stay title-only after Develop");
  await page.screenshot({ path: `${artifacts}/revision-overview.png` });
  for (let i = 0; i < 20 && !await page.locator('[data-id="retail"] .card-content').count(); i++) { await cameraKey("+"); await settle(); }
  assert.ok(await page.locator('[data-id="retail"] .card-content').count());
  assert.equal(await page.locator('.revision-badge').count(), 0, "expanded cards omit revision labels too");
  await fit();
  await inspectFromIndex(card(developed, "retail").title);
  await close(); await inspectFromIndex("A shared tool library"); await button("Develop").click();
  await button(`Reuse intent: ${intent}`).click();
  developed = await waitSave(s => card(s, "tools").revision === 2);
  assert.equal(card(developed,"tools").revisions[1].cause, `branch step 1 of ${intent}`);
  assert.equal(requests[2].intent, intent); assert.equal(developed.intents.length, 1);
  console.log("Development: round trips");
  await close(); await page.reload(); await waitSave(s => card(s,"food").revisions.length === 4);
  await openAtlasMenu(); const download = page.waitForEvent("download"); await button("Export atlas").click();
  const bytes = await readFile(await (await download).path()); const exported = JSON.parse(bytes);
  assert.deepEqual(exported.thoughts, developed.thoughts); assert.deepEqual(exported.intents, developed.intents);
  await page.getByRole("button", {name:/^Thoughts /}).click(); await page.locator(".catalogue-menu > summary").click();
  const markdownDownload = page.waitForEvent("download"); await button("Download all cards").click();
  const markdown = await readFile(await (await markdownDownload).path(), "utf8");
  assert.ok(markdown.includes("reverted to revision 1")); assert.ok(markdown.includes(`branch step 2 of ${intent}`));
  await close();
  const upload = async data => { await openAtlasMenu(); await page.getByLabel("Import atlas file", {exact:true}).setInputFiles({name:"history.json",mimeType:"application/json",buffer:Buffer.from(JSON.stringify(data))}); await button("Replace").click(); await button("Confirm Replace").click(); };
  await resetFixture(); await upload(exported);
  const imported = await waitSave(s => card(s,"retail").revision === 3);
  assert.deepEqual(imported.thoughts, exported.thoughts); assert.deepEqual(imported.intents, exported.intents);
  const v2 = structuredClone(exported); v2.version = 2; delete v2.intents; for (const c of v2.thoughts) delete c.revisions;
  await upload(v2);
  const migrated = await waitSave(s => s.version === 3 && s.thoughts.every(c => c.revision === 1));
  assert.equal(migrated.intents.length, 0);
  for (const c of migrated.thoughts) { assert.equal(c.revisions.length,1); assert.equal(c.revisions[0].body,c.body); assert.equal(c.revisions[0].title,c.title); }
  await page.unroute("**/api/develop");
  // A late response after Stop must never create another revision.
  await resetFixture(); let release;
  await page.route("**/api/develop", async route => {
    if (route.request().postDataJSON().step === 1) return route.fulfill({json:{title:"First step",summary:"Kept",body:"Completed step",note:"A completed change"}});
    await new Promise(resolve => { release = resolve; });
    await route.fulfill({json:{title:"Late",summary:"Late",body:"Late",note:"Late"}}).catch(()=>{});
  });
  await inspectFromIndex("A food hall"); await button("Develop").click(); await page.getByLabel("Intent",{exact:true}).fill("Test Stop");
  await page.getByLabel("Steps",{exact:true}).selectOption("2");
  await button("Start development").click(); while (!release) await page.waitForTimeout(20);
  await button("Stop").click(); release(); await settle(); assert.equal(card(await storedSave(),"food").revision,2);
  await close(); await page.unroute("**/api/develop");
  if (process.env.MINERVA_LIVE === "1") {
    await resetFixture();
    await inspectFromIndex("A food hall"); await button("Develop").click();
    await page.getByLabel("Intent",{exact:true}).fill(intent); await page.getByLabel("Steps",{exact:true}).selectOption("2");
    await button("Start development").click();
    await page.getByText("2 steps completed. Revisions are kept in History.",{exact:true}).waitFor({timeout:150000});
    const live = await waitSave(s => card(s,"food").revision === 3);
    await writeFile(`${artifacts}/develop-live.json`,JSON.stringify({intent,revisions:card(live,"food").revisions},null,2));
    await page.screenshot({path:`${artifacts}/develop-live.png`}); await close();
  }
  await resetFixture();
  console.log("C04/C05: edits, word diffs, revert, source revision, Develop, reuse, Stop, reload, JSON/Markdown and v2 migration passed.");
}
if (process.env.MINERVA_DEVELOP_ONLY === "1") {
  try { await verifyDevelopment(); assert.deepEqual(errors, []); }
  finally { await browser.close(); await new Promise(resolve => streamServer.close(resolve)); }
  process.exit(0);
}

try {
  if (process.env.MINERVA_VOICE_ONLY !== "1") {
  await verifyDevelopment();
  await page.goto(base);
  await page.locator(".thought").first().waitFor();
  await settle();
  await fit();
  // Camera behavior is checked below; CSS visibility of the legacy controls
  // is not part of the replay contract across dev and production stylesheets.
  assert.equal(await button("Denser study").count(), 0);
  assert.equal(await button("Mall demo").count(), 0);
  assert.equal(await page.locator(".thought").count(), 6);
  assert.equal(await page.locator(".react-flow__edge").count(), 7);
  assert.ok(
    (await page
      .locator(".field")
      .evaluate((e) => e.getBoundingClientRect().height / innerHeight)) >= 0.8,
  );
  await page.screenshot({ path: `${artifacts}/desktop.png` });
  await assertAttached();
  // Farthest zoom-out must preserve distinct, clickable overview markers.
  for (let i = 0; i < 15; i++) await cameraKey("-");
  await settle();
  await assertAttached();
  const markerRects = await page
    .locator(".overview-target")
    .evaluateAll((elements) =>
      elements.map((e) => {
        const r = e.getBoundingClientRect();
        return {
          label: e.textContent,
          left: r.left,
          right: r.right,
          top: r.top,
          bottom: r.bottom,
        };
      }),
    );
  assert.equal(markerRects.length, 6);
  for (let i = 0; i < markerRects.length; i++)
    for (let j = i + 1; j < markerRects.length; j++) {
      const a = markerRects[i],
        b = markerRects[j];
      assert.ok(
        !(
          a.left < b.right &&
          a.right > b.left &&
          a.top < b.bottom &&
          a.bottom > b.top
        ),
        `overview markers overlap: ${a.label}, ${b.label}`,
      );
    }
  await fit();

  // IB01: drag across title pans without selecting text or opening inspection.
  const title = page.locator('[data-id="food"] .card-title');
  const box = await title.boundingBox();
  const initial = await transform();
  await page.mouse.move(box.x + 25, box.y + 15);
  await page.mouse.down();
  await page.mouse.move(box.x + 105, box.y + 60, { steps: 8 });
  await page.mouse.up();
  assert.notEqual(
    await transform(),
    initial,
    "pan across title must move camera",
  );
  assert.equal(await page.evaluate(() => getSelection().toString()), "");
  assert.equal(
    await page.getByRole("dialog").count(),
    0,
    "pan must not inspect",
  );
  await fit();

  // Moving a card changes both node position and its attached edge, without camera movement.
  const node = page.locator('[data-id="food"]');
  const beforeNode = await node.evaluate((e) => e.style.transform);
  const edge = page.locator(
    '[data-id="food-repair"] path.react-flow__edge-path',
  );
  const beforeEdge = await edge.getAttribute("d");
  const grip = await page.locator('[data-id="food"] .card-grip').boundingBox();
  const camera = await transform();
  await page.mouse.move(grip.x + grip.width / 2, grip.y + grip.height / 2);
  await page.mouse.down();
  await page.mouse.move(grip.x + 75, grip.y + 65, { steps: 8 });
  await page.mouse.up();
  await settle();
  assert.notEqual(await node.evaluate((e) => e.style.transform), beforeNode);
  assert.notEqual(await edge.getAttribute("d"), beforeEdge);
  await assertAttached();
  assert.equal(await transform(), camera);
  await cameraKey("0");
  await settle();
  await page.locator(".field").focus();
  const oldZoom = await transform();
  await page.keyboard.press("+");
  await settle();
  assert.notEqual(await transform(), oldZoom, "keyboard zoom after dragging");
  await fit();

  // Overlap: pointer, keyboard and index inspection can each surface an older card.
  const retailNode = page.locator('[data-id="retail"]');
  const foodRect = await node.boundingBox();
  const retailRect = await retailNode.boundingBox();
  const foodGrip = await page
    .locator('[data-id="food"] .card-grip')
    .boundingBox();
  const startX = foodGrip.x + foodGrip.width / 2,
    startY = foodGrip.y + foodGrip.height / 2;
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(
    startX + retailRect.x + 65 - foodRect.x,
    startY + retailRect.y + 55 - foodRect.y,
    { steps: 10 },
  );
  await page.mouse.up();
  await settle();
  const overlap = { x: retailRect.x + 100, y: retailRect.y + 100 };
  const topCard = () =>
    page.evaluate(
      ({ x, y }) =>
        document
          .elementFromPoint(x, y)
          ?.closest(".react-flow__node")
          ?.getAttribute("data-id"),
      overlap,
    );
  assert.equal(await topCard(), "food", "dragged card should be on top");
  await page.mouse.click(retailRect.x + 10, retailRect.y + 70);
  await page.getByRole("dialog").waitFor();
  await close();
  assert.equal(
    await topCard(),
    "retail",
    "exposed lower card should come to front",
  );
  await page.locator(".field").focus();
  await page.locator('[data-id="food"] .card-grip').focus();
  assert.equal(
    await topCard(),
    "food",
    "keyboard focus should surface a covered card",
  );
  await inspectFromIndex("Independent retail shops");
  await close();
  const surfacedRetail = await retailNode.boundingBox();
  Object.assign(overlap, { x: surfacedRetail.x + 100, y: surfacedRetail.y + 100 });
  assert.equal(
    await topCard(),
    "retail",
    "index inspection should surface a covered card",
  );
  // Restore the original prepared positions before the existing source journeys.
  await resetFixture();
  await page.locator(".thought").first().waitFor();
  await settle();
  await fit();

  // IB05: both parents, reverse descendants, semantic endpoints, decision vs evidence.
  await button("Repair, then stay for supper").click();
  await page.getByRole("dialog").waitFor();
  const dialog = page.getByRole("dialog");
  assert.equal(await dialog.locator(".status-line").count(), 0, "default draft and unknown evidence labels stay hidden");
  const connections = () => dialog.getByRole("tab", { name: /^Connections/ }).click();
  await connections();
  assert.equal(await dialog.locator(".card-pane-lineage > section").first().locator(".card-pane-relation").count(), 2);
  await dialog.getByRole("button", { name: "A food hall", exact: true }).click();
  await connections();
  assert.match(await dialog.locator(".card-pane-lineage > section").nth(2).innerText(), /Repair, then stay for supper/);
  await dialog.getByRole("button", { name: "Repair, then stay for supper", exact: true }).click();
  await connections();
  await dialog.getByRole("button", { name: "A shared tool library", exact: true }).click();
  await connections();
  await dialog.getByRole("button", { name: "A shopfront for six weeks", exact: true }).click();
  assert.doesNotMatch(await dialog.innerText(), /Evidence: unknown/);
  assert.doesNotMatch(await dialog.innerText(), /\bkept\b/, "inspection omits the redundant kept label");
  await connections();
  await dialog.getByRole("button", { name: "A shared tool library", exact: true }).click();
  const textSelection = await dialog.locator(".card-pane-markdown").evaluate((e) => {
    const r = document.createRange();
    r.selectNodeContents(e);
    const s = getSelection();
    s.removeAllRanges();
    s.addRange(r);
    return s.toString();
  });
  assert.ok(
    textSelection.length > 30,
    "inspection text can be deliberately selected",
  );
  await close();

  // IB06: distant selection, comparison and source-specific prepared move keep the viewport.
  await button("Select Independent retail shops").click();
  await button("Select A shared tool library").click();
  const selectedCamera = await transform();
  await button("Compare").click();
  assert.equal(await page.locator(".comparison-grid section").count(), 2);
  await close();
  assert.equal(await transform(), selectedCamera);
  assert.equal(await page.locator(".thought.chosen").count(), 2);
  await clearSelection();

  await page.route("**/api/moves", route => route.fulfill({ json: { moves: [
    { title: "Try a workshop", question: "Who could learn here?", preview: "Host a repair workshop." },
    { title: "Share tools", question: "What could circulate?", preview: "Lend tools locally." },
    { title: "Invite neighbors", question: "Who could join?", preview: "Run an open evening." },
  ] } }));

  console.log("Atlas: Wander and Weave, retry and camera");
  // Wander and Weave: injected failure on the source card, retry and lineage.
  // Live direct-operation checks are explicit opt-ins; durable Expedition uses a synthetic worker.
  const live = process.env.MINERVA_LIVE_TALK_MOVES === "1";
  const evidence = { mode: live ? "live Gateway" : "mocked responses", url: base, model: "anthropic/claude-sonnet-5" };
  const card = (title) => ({ title, summary: `${title} summary`, body: `${title} concrete draft.` });
  const mocked = {
    wander: { cards: [card("Repair apprenticeships"), card("Borrow a workshop")] },
    weave: { card: card("Cook and mend evenings"), contributions: ["Food brings people together.", "Tools enable shared repairs."] },
  };
  async function assertGenerationVisible(camera, selection) {
    await settle();
    assert.equal(await transform(), camera, "generation completion preserves the camera");
    assert.deepEqual((await storedSave()).selected, selection, "generation completion preserves deliberate selection");
  }
  async function selectFromIndex(title) {
    await selectCatalogue(page, title);
  }
  let total = 6;
  for (const feature of ["wander", "weave"]) {
    if (feature === "wander") await selectFromIndex("A shared tool library");
    else {
      await clearSelection();
      await selectFromIndex("A food hall");
      await selectFromIndex("A shared tool library");
      assert.equal(await button("Weave").isEnabled(), true, "two parents remain supported");

    }
    if (feature === "wander") {
      assert.equal(await page.locator(".card-actions").count(), 0, "cards no longer repeat the move action");
      assert.equal(await page.locator('[data-id="tools"] .card-top .select-card').getAttribute("aria-pressed"), "true");
      for (const width of [1440, 390]) {
        await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
        const toolbar = page.locator(".selection-bar");
        const bar = await toolbar.boundingBox();
        const dismiss = await toolbar.getByRole("button", { name: "Clear selection", exact: true }).boundingBox();
        assert.ok(bar.x >= 0 && bar.x + bar.width <= width, "toolbar fits viewport");
        assert.ok(dismiss.width >= 44 && dismiss.height >= 44, "small X keeps a full click target");
        assert.ok(dismiss.x >= bar.x && dismiss.y >= bar.y && dismiss.x + dismiss.width <= bar.x + bar.width && dismiss.y + dismiss.height <= bar.y + bar.height, "dismissal remains inside the light selection dock");
        await page.screenshot({ path: `${artifacts}/wander-toolbar-${width}.png` });
      }
      await page.setViewportSize({ width: 1440, height: 900 });
    }
    const label = feature === "wander" ? "Wander" : "Weave";
    assert.equal(await button(feature === "wander" ? "Weave" : "Wander").count(), 0);
    let attempts = 0;
    let release;
    let pending = new Promise((resolve) => { release = resolve; });
    await page.route(`**/api/${feature}`, async (route) => {
      attempts++;
      await pending;
      evidence[`${feature}Input`] = route.request().postDataJSON();
      if (feature === "wander") {
        assert.equal(evidence.wanderInput.intent, "wander");
        assert.equal(evidence.wanderInput.move, undefined);
      }
      if (attempts === 1) await route.fulfill({ status: 500, json: { error: `${label} test failure` } });
      else if (live && process.env.MINERVA_LIVE_EXISTING === "1") await route.continue();
      else {
        const output = { ...mocked[feature] };
        if (feature === "weave") {
          const operation = operationSchema.parse({ ...evidence.weaveInput, id: randomUUID(), version: 1, kind: "weave", goal: "Combine these ideas", constraints: [] });
          output.receipt = { operation, manifest: planOperation(operation), status: "committed", at: new Date().toISOString() };
        }
        await route.fulfill({ json: output });
      }
    });
    const progress = page.locator(".generation-progress");
    let response, retryCamera, retrySelection;
    if (feature === "weave") {
      await button(label).click();
      await button("Weave whole cards").click();
      await button("Weaving…").waitFor();
      release();
      await page.getByRole("dialog", { name: "Prepare Weave" }).getByRole("alert").waitFor();
      assert.equal(await page.locator(".thought").count(), total, "failure adds no cards");
      pending = new Promise(resolve => { release = resolve; });
      const responsePromise = page.waitForResponse(r => r.url().endsWith("/api/weave") && r.status() === 200);
      await button("Weave whole cards").click();
      await button("Weaving…").waitFor();
      await close();
      await settle();
      retryCamera = await transform(); retrySelection = (await storedSave()).selected;
      release(); response = await responsePromise;
    } else {
    await button(label).click();
    if (feature === "wander") await button("Explore freely").click();

    await progress.waitFor();
    assert.match(await progress.innerText(), feature === "wander" ? /Wander is generating new cards/ : /Weave is combining your cards/);
    assert.equal(await page.locator('.selection-bar button').filter({ hasText: /^(Wander|Weave|Expedition)$/ }).count(), 0, "unavailable generation actions are hidden while busy");
    const actionSpinner = progress.locator(".generation-spinner");
    assert.equal(await actionSpinner.isVisible(), true, "active action has a visible spinner");
    const rotationBefore = await actionSpinner.evaluate((el) => getComputedStyle(el).transform);
    await page.waitForTimeout(150);
    assert.notEqual(await actionSpinner.evaluate((el) => getComputedStyle(el).transform), rotationBefore, "loading circle actually rotates");
    assert.ok(await page.locator('.thought[aria-busy="true"] .generation-spinner').count() > 0, "source cards display loading circles");
    // Progress survives overview, panning, clearing selection, and a narrow viewport.
    for (let i = 0; i < 15; i++) await cameraKey("-");
    assert.equal(await page.locator(".thought-generating .overview-target").first().evaluate((el) => getComputedStyle(el, "::after").animationName), "generation-spin", "overview source nodes retain a loading ring");
    const beforePendingPan = await transform();
    await page.mouse.move(60, 500);
    await page.mouse.down();
    await page.mouse.move(260, 550, { steps: 5 });
    await page.mouse.up();
    assert.notEqual(await transform(), beforePendingPan, "the atlas remains usable during generation");
    await clearSelection();
    await page.setViewportSize({ width: 390, height: 844 });
    await settle();
    assert.equal(await progress.isVisible(), true);
    const progressBox = await progress.boundingBox();
    assert.ok(progressBox.x >= 0 && progressBox.x + progressBox.width <= 390);
    assert.ok(progressBox.y >= 0 && progressBox.y + progressBox.height <= 844);
    await page.screenshot({ path: `${artifacts}/${feature}-pending.png` });
    await page.setViewportSize({ width: 1440, height: 900 });
    release();
    const sourceId = feature === "wander" ? "tools" : "food";
    const sourceCard = page.locator(`[data-id="${sourceId}"] .thought`);
    await sourceCard.getByRole("alert").waitFor();
    assert.equal(await sourceCard.getByRole("alert").innerText(), `${label} test failure`);
    assert.equal(await progress.count(), 0, "progress clears on failure");
    pending = new Promise((resolve) => { release = resolve; });
    assert.equal(await page.locator(".thought").count(), total, "failure adds no cards");
    const responsePromise = page.waitForResponse((response) => response.url().endsWith(`/api/${feature}`) && response.status() === 200, { timeout: 90000 });
    await sourceCard.getByRole("button", { name: `Retry ${label}`, exact: true }).click();
    await progress.waitFor();
    assert.equal(await progress.isVisible(), true, "retry restores progress without a selection");
    retryCamera = await transform(); retrySelection = (await storedSave()).selected;
    release();
    response = await responsePromise;
    }
    const output = await response.json();
    evidence[feature] = output;
    await writeFile(`${artifacts}/wander-weave.json`, JSON.stringify(evidence, null, 2));
    const cards = feature === "wander" ? output.cards : [output.card];
    assert.ok(feature === "wander" ? cards.length >= 2 && cards.length <= 3 : cards.length === 1);
    total += cards.length;
    await page.waitForFunction((count) => document.querySelectorAll(".thought").length === count, total);
    await settle();
    await assertGenerationVisible(retryCamera, retrySelection);
    assert.equal(await progress.count(), 0, "progress clears on success");
    assert.equal(attempts, 2, "only the explicit retry makes the next request");
    assert.equal(await page.locator(".react-flow__edge").count(), 7 + (feature === "wander" ? cards.length : evidence.wander.cards.length + 2));
    for (const result of cards) {
      assert.ok(result.title && result.summary && result.body);
      await inspectFromIndex(result.title);
      const inspection = page.getByRole("dialog");
      assert.equal(await inspection.locator(".card-pane-markdown").innerText(), result.body);
      await inspection.getByRole("tab", { name: /^Connections/ }).click();
      const links = inspection.locator(".card-pane-lineage > section").first().locator(".card-pane-relation");
      assert.equal(await links.count(), feature === "wander" ? 1 : 2);
      assert.match(await links.first().innerText(), /derived from revision 1/i);
      if (feature === "weave") {
        assert.equal(evidence.weaveInput.sources.length, 2);
        assert.equal(output.contributions.length, 2);
        for (const contribution of output.contributions) assert.ok((await links.allInnerTexts()).join(" ").includes(contribution));
        await focusInspected(page);
        const navigation = page.getByRole("region", { name: "Focused card connections" });
        await navigation.locator(".focus-connections > summary").click();
        await navigation.getByRole("button", { name: "Show ancestors", exact: true }).click();
        const wovenId = (await storedSave()).thoughts.find(c => c.title === result.title).id;
        assert.deepEqual((await page.locator(".react-flow__node.chain-highlighted").evaluateAll(nodes => nodes.map(n => n.dataset.id))).sort(), [wovenId, "food", "tools"].sort());
        assert.deepEqual(await navigation.getByRole("list", { name: "ancestors chain" }).getByRole("button").allTextContents(), ["A food hall", "A shared tool library"]);
        assert.equal(await page.locator(".react-flow__node.chain-dimmed").count(), total - 3);
        await navigation.getByRole("button", { name: "Clear", exact: true }).click();
        assert.equal(await page.locator(".chain-highlighted").count(), 0);
        await button("Open card").click();
      }
      await close();
    }
    await page.screenshot({ path: `${artifacts}/${feature}.png` });
    await page.unroute(`**/api/${feature}`);
  }
  // Typed conversation: failure, retry, streamed response, selected context and follow-up history.
  await clearSelection();
  let talkAttempts = 0;
  const talkInputs = [];
  await page.route("**/api/talk", async (route) => {
    talkAttempts++;
    talkInputs.push(route.request().postDataJSON());
    if (talkAttempts === 1) await route.fulfill({ status: 500, json: { error: "Talk test failure" } });
    else if (talkAttempts === 4) await route.fulfill({ contentType: "application/x-ndjson", body:
      JSON.stringify({ text: "Interrupted draft" }) + "\n" + JSON.stringify({ error: "Stream test failure" }) + "\n" });
    else if (live && talkAttempts === 2) await route.continue();
    // Playwright cannot rewrite an HTTPS request to the local HTTP streaming fixture.
    else if (base.startsWith("https:")) await route.fulfill({ contentType: "application/x-ndjson",
      body: JSON.stringify({ text: talkText }) + "\n" + JSON.stringify({ done: true }) + "\n" });
    else await route.continue({ url: mockStreamUrl });
  });
  await button("Talk to Minerva").click();
  await page.getByLabel("Message Minerva").fill("Suggest one concrete improvement to this selected idea in two sentences.");
  await page.getByLabel("Message Minerva").press("Enter");
  await page.getByRole("dialog").getByRole("alert").waitFor();
  assert.match(await page.getByRole("dialog").getByRole("alert").innerText(), /Talk test failure/);
  const talkResponse = page.waitForResponse((r) => r.url().endsWith("/api/talk") && r.status() === 200, { timeout: 90000 });
  await button("Retry").click();
  const replyResponse = await talkResponse;
  if (!live && base.startsWith("http:")) {
    await page.getByText(talkText.slice(0, 20), { exact: true }).waitFor();
    assert.ok(await button("Replying…").isVisible(), "partial reply renders while the stream is still open");
  }
  assert.equal(replyResponse.status(), 200);
  await button("Replying…").waitFor({ state: "hidden", timeout: 90000 });
  evidence.talk = await page.locator(".talk-transcript section").nth(1).locator(".body-copy").innerText();
  await writeFile(`${artifacts}/talk-moves.json`, JSON.stringify(evidence, null, 2));
  assert.ok(evidence.talk.length > 20);
  assert.equal(await page.getByRole("dialog").getByRole("alert").count(), 0);
  assert.ok((await page.locator(".talk-transcript").innerText()).includes(evidence.talk));
  assert.deepEqual(talkInputs[0], talkInputs[1], "retry retains the failed turn and context");
  assert.equal(talkInputs[1].cards.length, total, "empty selection still includes all fixture and generated cards");
  assert.deepEqual(talkInputs[1].selectedIds, []);
  for (const key of ["summary", "body", "relationships"]) assert.ok(talkInputs[1].cards[0][key].length);
  await close();
  await selectFromIndex("A food hall");
  await button("Talk to Minerva").click();
  assert.ok((await page.locator(".talk-transcript").innerText()).includes(evidence.talk), "dismiss keeps conversation in memory");
  await page.getByLabel("Message Minerva").fill("How does that connect");
  await page.getByLabel("Message Minerva").press("Shift+Enter");
  assert.equal(talkInputs.length, 2, "Shift+Enter does not send");
  await page.getByLabel("Message Minerva").pressSequentially("with this card?");
  await page.getByLabel("Message Minerva").press("Enter");
  await button("Replying…").waitFor({ state: "hidden" });
  assert.equal(talkInputs[2].messages.length, 3);
  assert.equal(talkInputs[2].messages[1].content, evidence.talk);
  assert.equal(talkInputs[2].cards.length, total, "selection does not restrict canvas context");
  assert.deepEqual(talkInputs[2].selectedIds, ["food"]);
  assert.equal(talkInputs[2].messages[2].content, "How does that connect\nwith this card?");
  assert.equal(await page.locator(".thought").count(), total, "talk never creates cards");
  await page.getByLabel("Message Minerva").fill("Name one risk.");
  await button("Send").click();
  await page.getByRole("dialog").getByRole("alert").waitFor();
  assert.match(await page.getByRole("dialog").getByRole("alert").innerText(), /Stream test failure/);
  await button("Retry").click();
  await button("Replying…").waitFor({ state: "hidden" });
  assert.deepEqual(talkInputs[3], talkInputs[4], "stream failure retry excludes partial assistant output");
  assert.equal(talkInputs[4].messages.length, 5);
  await page.screenshot({ path: `${artifacts}/talk.png` });
  await close();
  await page.unroute("**/api/talk");

  // Contextual planner failure preserves prepared moves; Retry returns three live choices.
  let moveAttempts = 0;
  let retryMoves = false;
  const mockMoves = { moves: [
    { title: "Share the quiet hours", question: "Who needs this space before lunch?", preview: "Open the hall to morning repair lessons." },
    { title: "Reverse the counter", question: "Could guests teach the cooks?", preview: "Residents host a rotating cooking class." },
    { title: "Borrow the kitchen", question: "Could equipment circulate?", preview: "Lend small kitchen tools from the food hall." },
  ] };
  await page.route("**/api/moves", async (route) => {
    moveAttempts++;
    evidence.movesInput = route.request().postDataJSON();
    // Strict Mode may abort the first effect's request. Keep failing until
    // the panel has rendered the error and the user explicitly retries.
    if (!retryMoves) await route.fulfill({ status: 500, json: { error: "Moves test failure" } });
    else if (live) await route.continue();
    else await route.fulfill({ json: mockMoves });
  });
  await selectCatalogue(page, "A food hall", true);
  await page.locator(".selection-bar").getByRole("button", { name: "Wander", exact: true }).click();
  await page.getByRole("dialog").getByRole("alert").waitFor();
  assert.match(await page.getByRole("dialog").getByRole("alert").innerText(), /Moves test failure/);
  assert.ok(await button("Try Explore the quiet hours").isVisible(), "prepared move remains usable");
  const movesResponse = page.waitForResponse((r) => r.url().endsWith("/api/moves") && r.status() === 200, { timeout: 90000 });
  const failedMoveAttempts = moveAttempts;
  retryMoves = true;
  await button("Retry").click();
  evidence.moves = await (await movesResponse).json();
  await page.locator(".move-choice").nth(2).waitFor();
  assert.equal(evidence.moves.moves.length, 3);
  assert.equal(moveAttempts, failedMoveAttempts + 1);
  const chosenMove = evidence.moves.moves[0];
  await page.screenshot({ path: `${artifacts}/moves.png` });
  let moveCardAttempts = 0;
  await page.route("**/api/wander", async (route) => {
    moveCardAttempts++;
    assert.equal(route.request().postDataJSON().intent, "move");
    assert.deepEqual(route.request().postDataJSON().move, chosenMove);
    if (moveCardAttempts === 1) await route.fulfill({ status: 500, json: { error: "Move card test failure" } });
    else await route.fulfill({ json: { cards: [card("Morning repair table")] } });
  });
  await button(`Try ${chosenMove.title}`).click();
  await page.getByRole("dialog").getByRole("alert").waitFor();
  const moveCamera = await transform(), moveSelection = (await storedSave()).selected;
  await button("Retry card").click();
  total++;
  await page.waitForFunction((count) => document.querySelectorAll(".thought").length === count, total);
  await assertGenerationVisible(moveCamera, moveSelection);
  await inspectFromIndex("Morning repair table");
  await page.getByRole("tab", { name: /^Connections/ }).click();
  assert.match(await page.locator(".card-pane-relation").innerText(), /derived from revision 1/i);
  assert.ok((await page.locator(".card-pane-relation").innerText()).includes(chosenMove.title));
  assert.equal(moveCardAttempts, 2);
  await close();
  await page.unroute("**/api/moves");
  await page.unroute("**/api/wander");
  await writeFile(`${artifacts}/talk-moves.json`, JSON.stringify(evidence, null, 2));

  // Capture the actual Blob passed to the browser, without a model or export route.
  await page.evaluate(() => {
    window.downloads = [];
    const create = URL.createObjectURL.bind(URL);
    URL.createObjectURL = (blob) => {
      if (window.failDownload) { window.failDownload = false; throw new Error("Download fixture failure"); }
      window.downloads.push(blob.text());
      return create(blob);
    };
  });
  await inspectFromIndex("Morning repair table");
  await page.getByRole("dialog").getByText("Provenance", { exact: true }).click();
  const provenance = page.getByRole("dialog").locator("details").filter({ has: page.getByText("Provenance", { exact: true }) });
  assert.ok((await provenance.innerText()).includes(chosenMove.title));
  assert.ok((await provenance.innerText()).includes("feature:wander"));
  await button("More card actions").click();
  await page.evaluate(() => { window.failDownload = true; });
  await button("Download Markdown").click();
  await page.getByRole("dialog").getByRole("alert").waitFor();
  const downloadedCard = page.waitForEvent("download");
  await button("Retry download").click();
  assert.equal((await downloadedCard).suggestedFilename(), "morning-repair-table.md");
  const cardMarkdown = await page.evaluate(() => window.downloads[0]);
  for (const value of ["# Morning repair table", "## Summary", "Morning repair table summary", "## Body",
    "Morning repair table concrete draft.", "## Contribution",
    "## Inheritance", "## Provenance", "feature:wander", "## Relationships", "incoming / derivation", chosenMove.title, "Contribution:"]) assert.ok(cardMarkdown.includes(value), value);
  assert.doesNotMatch(cardMarkdown, /## Decision|## Evidence/, "exports omit retired decision and evidence labels");
  await close();
  await page.getByRole("button", { name: /^Thoughts / }).click();
  await page.getByPlaceholder("Search titles").fill("Morning repair table");
  const downloadedAtlas = page.waitForEvent("download");
  await page.locator(".catalogue-menu > summary").click();
  await button("Download all cards").click();
  assert.equal((await downloadedAtlas).suggestedFilename(), "minerva-atlas.md");
  const atlasMarkdown = await page.evaluate(() => window.downloads[1]);
  assert.equal((atlasMarkdown.match(/^## /gm) || []).length, total, "export ignores index filter and includes every generated card");
  assert.ok(atlasMarkdown.includes("## A food hall"));
  assert.ok(atlasMarkdown.includes("## Morning repair table"));
  assert.ok(atlasMarkdown.includes("### Summary"));
  for (const contribution of evidence.weave.contributions) assert.ok(atlasMarkdown.includes(contribution));
  await writeFile(`${artifacts}/outputs.json`, JSON.stringify({ card: cardMarkdown, atlas: atlasMarkdown }, null, 2));
  await close();

  // All perspectives share cards and selection; only themes may call the network.
  let themeRequests = 0, failThemes = false;
  const themeInputs = [];
  await page.route("**/api/themes", async route => {
    themeRequests++;
    const input = route.request().postDataJSON(); themeInputs.push(input);
    if (failThemes) return route.fulfill({ status: 500, json: { error: "Themes fixture failure" } });
    const groups = input.existingGroups.length ? [{ name: input.existingGroups[0], reason: "Cards explore shared uses of the mall.", memberIds: input.cards.map(c => c.id) }] : [
      { name: "Shared activity", reason: "Cards explore shared uses of the mall.", memberIds: input.cards.filter(c => c.id !== "tools").map(c => c.id) },
      { name: "Tools and learning", reason: "Practical skills and equipment.", memberIds: input.cards.filter(c => c.id === "tools").map(c => c.id) },
    ];
    return route.fulfill({ json: { groups } });
  });
  const cardIds = () => page.locator(".react-flow__node:has(.thought)").evaluateAll(elements => elements.map(e => e.dataset.id).sort());
  const chosenIds = () => page.locator(".react-flow__node:has(.thought.chosen)").evaluateAll(elements => elements.map(e => e.dataset.id).sort());
  await clearSelection(); await selectFromIndex("A food hall"); await selectFromIndex("A shared tool library");
  const beforeIds = await cardIds(), beforeChosen = await chosenIds();
  assert.ok(beforeChosen.length);
  const requests = [];
  const track = request => { if (new URL(request.url()).pathname.startsWith("/api/")) requests.push(request.url()); };
  page.on("request", track);
  await button("Compare").click();
  const comparison = await page.locator(".comparison-grid").innerText();
  const cameras = new Map();
  const lineagePositions = await page.locator(".react-flow__node:has(.thought)").evaluateAll(elements => elements.map(e => e.style.transform));
  for (const view of ["Evolution", "Lineage", "Constellation", "Evolution", "Constellation", "Lineage"]) {
    const start = requests.length;
    await button(view).click(); await settle();
    if (view === "Constellation" && await button("Find themes").count()) await button("Find themes").click();
    if (view === "Constellation") await page.getByText(/\d+ ideas · \d+ themes/).waitFor({ timeout: 90000 });
    await settle();
    assert.equal(await page.locator(".comparison-grid").innerText(), comparison);
    if (cameras.has(view)) assert.equal(await transform(), cameras.get(view), `${view} remembers its camera`);
    cameras.set(view, await transform());
    if (view === "Lineage") assert.deepEqual(await page.locator(".react-flow__node:has(.thought)").evaluateAll(elements => elements.map(e => e.style.transform)), lineagePositions);
    if (view === "Constellation") {
      const headingsInFrame = await page.locator(".react-flow__node").evaluateAll(elements => elements.length > 0 && elements.every(e => {
        const r = e.getBoundingClientRect(), field = document.querySelector(".react-flow").getBoundingClientRect();
        return r.left >= field.left && r.right <= field.right && r.top >= field.top && r.bottom <= field.bottom &&
          r.left >= 0 && r.top >= 0 && r.right <= innerWidth && r.bottom <= innerHeight;
      }));
      if (!headingsInFrame) {
        await page.screenshot({ path: `${artifacts}/fit-failure.png` });
        console.log(await page.locator(".react-flow__node").evaluateAll(elements => ({ field: document.querySelector(".react-flow").getBoundingClientRect().toJSON(), nodes: elements.map(e => ({ id: e.dataset.id, style: e.getAttribute("style"), rect: e.getBoundingClientRect().toJSON() })) })));
      }
      assert.ok(headingsInFrame, "the whole tall group column, including every card and heading, fits on first Constellation entry without Fit");
    }
    assert.deepEqual(await cardIds(), beforeIds);
    assert.deepEqual(await chosenIds(), beforeChosen);
    if (view !== "Constellation") assert.deepEqual(requests.slice(start), [], `${view} must not call application APIs`);
  }
  assert.equal(themeRequests, 1);
  await close();
  await button("Constellation").click(); await settle();
  const previousGrouping = await page.locator(".theme-heading").allTextContents();
  failThemes = true;
  await page.getByRole("region", { name: "Theme grouping" }).getByRole("button", {name: "Clear selection", exact: true}).click();
  await button("Regroup").click();
  await button("Preview themes").click();
  await page.getByRole("region", { name: "Regroup all ideas" }).getByRole("alert").waitFor();
  assert.deepEqual(await page.locator(".theme-heading").allTextContents(), previousGrouping);
  assert.ok(await page.getByRole("region", { name: "Regroup all ideas" }).getByRole("button", { name: "Retry", exact: true }).isVisible());
  failThemes = false;
  await page.getByRole("region", { name: "Regroup all ideas" }).getByRole("button", { name: "Retry", exact: true }).click(); await settle();
  assert.equal(themeRequests, 3);
  assert.deepEqual(await page.locator(".theme-heading").allTextContents(), previousGrouping);
  await page.getByRole("button", { name: /^Apply to .* ideas$/ }).click();
  assert.equal(await page.locator(".react-flow__edge").count(), 1, "only the cross-group association remains");
  assert.equal(await page.locator(".react-flow__edge.derivation,.react-flow__edge.recombination").count(), 0);
  await button("Lineage").click();
  await inspectFromIndex("Morning repair table");
  await button("More card actions").click(); await page.getByRole("dialog").getByRole("button", { name: "Edit", exact: true }).click();
  await page.getByRole("dialog").getByRole("textbox", { name: /^Body/ }).fill("Edited theme content"); await button("Save changes").click();
  await close();
  await button("Constellation").click(); await settle();
  assert.equal(themeRequests, 4);
  assert.equal(themeInputs[3].cards.length, 1, "only edited cards are submitted");
  assert.ok(themeInputs[3].existingGroups.length);
  page.off("request", track);
  await page.screenshot({ path: `${artifacts}/constellation.png` });
  await writeFile(`${artifacts}/perspectives.json`, JSON.stringify({ themeRequests, themeInputs, beforeIds, beforeChosen }, null, 2));
  await settle();
  await button("Evolution").click(); await inspectFromIndex("Morning repair table"); await focusInspected(page); await settle();
  const evolutionCard = page.locator('.react-flow__node').filter({ has: page.getByRole("button", { name: "Morning repair table", exact: true }) });
  await evolutionCard.locator(".card-grip").focus(); await page.keyboard.press("ArrowRight");
  await button("Constellation").click(); await settle();
  const groupedSave = await storedSave();
  assert.ok(groupedSave.themeCache.time.includes(String(new Date().getFullYear())), "group timestamp includes the date");
  assert.ok(Object.keys(groupedSave.positions.Evolution).length, "a moved Evolution position is saved");
  await page.reload(); await page.locator(".thought").first().waitFor(); await settle();
  const restoredGroups = await storedSave();
  for (const field of ["themeCache", "positions", "cameras", "selected", "perspective"]) assert.deepEqual(restoredGroups[field], groupedSave[field], `${field} survives a Constellation reload`);
  assert.equal(themeRequests, 4, "restoring grouping does not call the model");
  await page.unroute("**/api/themes");
  await writeFile(`${artifacts}/wander-weave.json`, JSON.stringify(evidence, null, 2));
  await resetFixture();
  await fit();
  assert.equal(await page.locator(".thought").count(), 6, "reset restores fixture cards");
  assert.equal(await page.locator(".react-flow__edge").count(), 7, "reset restores fixture edges");
  await button("Talk to Minerva").click();
  assert.equal(await page.locator(".talk-transcript section").count(), 0, "reset clears conversation");
  await close();
  await button("Read as text").click();
  assert.equal(await page.locator(".reader-contents button").count(), 6);
  await close();

  // C12/C11: use the durable API and worker, retaining behavioral guarantees.
  await resetFixture();
  await verifyExpedition(page, base, artifacts);
  await close(); await resetFixture(); await settle(); await fit();

  console.log("Atlas: backup and recovery");
  // C01/C14: one versioned backup carries the complete browser atlas.
  await page.route("**/api/wander", route => route.fulfill({ json: mocked.wander }));
  await selectFromIndex("A shared tool library"); await button("Wander").click(); await button("Explore freely").click();
  await page.waitForFunction(() => document.querySelectorAll(".thought").length === 8);
  await inspectFromIndex("Repair apprenticeships");
  await button("More card actions").click(); await page.getByRole("dialog").getByRole("button", { name: "Edit", exact: true }).click();
  await page.getByRole("dialog").getByRole("textbox", { name: /^Title/ }).fill("Durable repair apprenticeships"); await button("Save changes").click();
  await close();
  await inspectFromIndex("Durable repair apprenticeships"); await focusInspected(page); await settle();
  const durableNode = page.locator('.react-flow__node').filter({ has: page.getByRole("button", { name: "Durable repair apprenticeships", exact: true }) });
  const durableId = await durableNode.getAttribute("data-id");
  const positionBefore = await durableNode.getAttribute("style");
  await durableNode.locator(".card-grip").focus(); await page.keyboard.press("ArrowRight"); await page.keyboard.press("ArrowDown");
  assert.notEqual(await durableNode.getAttribute("style"), positionBefore, "generated card moves");
  await clearSelection(); await selectFromIndex("Durable repair apprenticeships");
  const backupRun = await startExpedition(page, base, "Preserve this expedition");
  const backupRunView = await waitForRun(page, base, backupRun.id, v => v.run.status === 'completed');
  const expPanel = page.getByRole("dialog", { name: "Expedition", exact: true });
  for (const candidate of backupRunView.items.slice(0, 2)) {
    await expPanel.getByRole("button", { name: candidate.snapshot.title, exact: true }).click();
    await expPanel.getByRole("button", { name: "Inspect on atlas", exact: true }).click();
    await page.getByRole("dialog", { name: candidate.snapshot.title, exact: true }).waitFor();
    await close(); await button("Expedition panel").click();
  }
  await close();
  await page.route("**/api/talk", route => route.fulfill({ contentType: "application/x-ndjson", body: JSON.stringify({ text: "Durable mocked reply." }) + "\n" + JSON.stringify({ done: true }) + "\n" }));
  await button("Talk to Minerva").click(); await page.getByRole("textbox", { name: "Message Minerva" }).fill("Remember this Talk turn.");
  await button("Send").click(); await page.getByText("Durable mocked reply.", { exact: true }).waitFor(); await close();
  await settle();
  const beforeReload = await storedSave();
  assert.equal(beforeReload.thoughts.length, 10);
  assert.equal(beforeReload.messages.length, 2);
  assert.ok(beforeReload.thoughts.find(c => c.id === durableId).provenance);
  assert.equal(beforeReload.thoughts.filter(c => c.revisions.some(r => r.experiment)).length, 2, "Materialized evidence is in the browser backup");
  await page.reload(); await page.locator(".thought").first().waitFor(); await settle();
  const restored = await storedSave();
  for (const field of ["thoughts", "relationships", "positions", "selected", "messages", "expeditions", "activeExpedition", "cameras"]) assert.deepEqual(restored[field], beforeReload[field], `${field} survives reload`);
  await button("Talk to Minerva").click(); await page.getByText("Durable mocked reply.", { exact: true }).waitFor(); await close();
  await button("Expedition panel").click(); await expPanel.getByRole("button", { name: "Preserve this expedition", exact: true }).click();
  await expPanel.getByLabel("Challenge this reading", { exact: true }).waitFor();
  assert.equal(await page.getByText('Reading may exclude recent or unassessed revisions.', { exact: true }).count(), 0);
  await close();
  const backupDownload = page.waitForEvent("download").catch(() => null);
  try { await openAtlasMenu(); await button("Export atlas").click({ timeout: 5000 }); }
  catch (error) { await page.screenshot({ path: `${artifacts}/export-failure.png` }); throw error; }
  assert.equal(await page.locator('.atlas-menu-options [role="alert"]').count(), 0, await page.locator('.atlas-menu-options').innerText());
  const backup = await backupDownload; assert.ok(backup, "JSON backup download starts"); assert.equal(backup.suggestedFilename(), "minerva-atlas.json");
  const backupBytes = await readFile(await backup.path()); const backupState = JSON.parse(backupBytes);
  await resetFixture(); assert.equal(await page.locator(".thought").count(), 6);
  const upload = async buffer => { await openAtlasMenu(); await page.getByLabel("Import atlas file", { exact: true }).setInputFiles({ name: "atlas.json", mimeType: "application/json", buffer }); };
  await upload(backupBytes); await button("Replace").click(); await button("Confirm Replace").click();
  await page.waitForFunction(() => document.querySelectorAll(".thought").length === 10); await settle();
  const replacedSave = await storedSave();
  for (const field of ["thoughts", "relationships", "positions", "cameras", "messages", "expeditions", "selected", "activeExpedition"]) assert.deepEqual(replacedSave[field], backupState[field], `Replace restores ${field}`);
  await upload(backupBytes); await button("Merge").click(); await settle();
  assert.equal(await page.locator(".thought").count(), 10, "Merge does not duplicate unchanged revision histories");
  await page.getByText("Merge complete: 0 added, 0 updated, 10 unchanged. Divergent histories are retained separately.", { exact: true }).waitFor();
  assert.deepEqual((await storedSave()).relationships, backupState.relationships, "Merge skips duplicate edges");
  assert.deepEqual((await storedSave()).expeditions, backupState.expeditions, "Merge skips duplicate expedition history");
  const uniqueImport = structuredClone(backupState);
  const incomingCard = uniqueImport.thoughts.find(c => c.id === durableId);
  incomingCard.title = "Imported distinct repair card"; incomingCard.revisions.at(-1).title = incomingCard.title;
  await upload(Buffer.from(JSON.stringify(uniqueImport))); await button("Merge").click();
  await page.waitForFunction(() => document.querySelectorAll(".thought").length === 11); await settle();
  await page.getByText("Merge complete: 1 added, 0 updated, 9 unchanged. Divergent histories are retained separately.", { exact: true }).waitFor();
  const mergedSave = await storedSave();
  const importedCard = mergedSave.thoughts.find(c => c.title === "Imported distinct repair card");
  assert.notEqual(importedCard.id, durableId, "Merge retains divergent history with a separate id");
  assert.ok(mergedSave.relationships.some(e => e.from === importedCard.id || e.to === importedCard.id), "Merge remaps edge endpoints");
  assert.deepEqual(mergedSave.messages, backupState.messages, "Merge keeps the local conversation");
  const beforeBad = await storedSave();
  await upload(Buffer.from(JSON.stringify({ ...backupState, relationships: [{ ...backupState.relationships[0], to: "missing-card" }] })));
  await page.getByRole("alert").filter({ hasText: "Invalid atlas file" }).waitFor();
  assert.deepEqual(await storedSave(), beforeBad, "invalid references change nothing");
  const invalidId = structuredClone(backupState); invalidId.thoughts[0].id = 'broken"selector';
  await upload(Buffer.from(JSON.stringify(invalidId))); await page.getByRole("alert").filter({ hasText: "Invalid atlas file" }).waitFor();
  assert.deepEqual(await storedSave(), beforeBad, "invalid card ids change nothing");
  await upload(Buffer.from('{"version": 1, nope'));
  await page.getByRole("alert").filter({ hasText: "Invalid atlas file" }).waitFor();
  assert.deepEqual(await storedSave(), beforeBad, "malformed JSON changes nothing");
  // Corrupt only after closing the page so its pagehide flush cannot overwrite the test input.
  const storagePage = await page.context().newPage(); await storagePage.goto(`${base}/icon.png`);
  await page.goto("about:blank");
  const corrupt = { version: 0, broken: "keep this original" };
  await storagePage.evaluate(async broken => {
    // Freeze this document's pending writes before corrupting via a separate transaction.
    await new Promise(resolve => setTimeout(resolve, 500));
    await new Promise((resolve, reject) => {
      const open = indexedDB.open("minerva-atlas", 1); open.onsuccess = () => {
        const db = open.result, tx = db.transaction("saves", "readwrite"); tx.objectStore("saves").put(broken, "root-atlas");
        tx.oncomplete = () => { db.close(); resolve(); }; tx.onerror = () => reject(tx.error);
      };
    });
  }, corrupt);
  await page.goto(base); await page.locator(".thought").first().waitFor();
  await openAtlasMenu();
  await page.getByText(/The save could not be read.*recovery copy/).waitFor();
  assert.equal(await page.locator(".thought").count(), 6);
  const recoveries = await page.evaluate(() => new Promise(resolve => {
    const open = indexedDB.open("minerva-atlas", 1); open.onsuccess = () => {
      const db = open.result, store = db.transaction("saves").objectStore("saves"), req = store.getAll(), keys = store.getAllKeys();
      keys.onsuccess = () => { resolve(keys.result.map((key, i) => ({ key, value: req.result[i] }))); db.close(); };
    };
  }));
  assert.ok(recoveries.some(({ key, value }) => key.startsWith("root-atlas-recovery-") && JSON.stringify(value) === JSON.stringify(corrupt)), "broken save is preserved verbatim");
  await storagePage.close();
  await page.getByText(/^Recovery copies \(/).click();
  const recoveryList = page.locator(".atlas-menu-options details");
  const recoveryDownload = page.waitForEvent("download"); await recoveryList.getByRole("button", { name: "Export", exact: true }).first().click();
  assert.deepEqual(JSON.parse(await readFile(await (await recoveryDownload).path())), corrupt);
  while (await recoveryList.getByRole("button", { name: "Discard", exact: true }).count()) { await recoveryList.getByRole("button", { name: "Discard", exact: true }).first().click(); await settle(); }
  assert.equal(await recoveryList.count(), 0);

  // C02/C03: layout-only history, version migration and transitive folding.
  await settle();
  const fixtureV1 = structuredClone(await storedSave()); fixtureV1.version = 1;
  delete fixtureV1.sizes; delete fixtureV1.layoutHistory; delete fixtureV1.folds;
  await upload(Buffer.from(JSON.stringify(fixtureV1)));
  await button("Replace").click(); await button("Keep current atlas").click();
  assert.equal(await button("Confirm Replace").count(), 0);
  await button("Replace").click(); await button("Confirm Replace").click(); await settle();
  const migrated = await storedSave(); assert.equal(migrated.version, 3);
  assert.deepEqual(migrated.sizes, { Lineage: {}, Evolution: {}, Constellation: {} });
  assert.deepEqual(migrated.folds, []); assert.equal(migrated.layoutHistory.Lineage.undo.length, 0);
  await openAtlasMenu(); await button("Reset to fixture").click(); await button("Keep current atlas").click();
  assert.deepEqual((await storedSave()).thoughts, migrated.thoughts);
  await inspectFromIndex("Repair, then stay for supper"); await focusInspected(page); await settle();
  // Close connections so it cannot cover the resize handle.
  await button("Close focused connections").click();
  const repairNode = page.locator('.react-flow__node[data-id="repair"]');
  const beforeResize = await storedSave();
  const edgeBeforeResize = await page.locator('[data-id="food-repair"] path.react-flow__edge-path').getAttribute("d");
  const handle = repairNode.locator(".react-flow__resize-control.bottom.right.handle");
  const handleBounds = await handle.boundingBox(); assert.ok(handleBounds);
  await page.mouse.move(handleBounds.x + handleBounds.width / 2, handleBounds.y + handleBounds.height / 2);
  await page.mouse.down(); await page.mouse.move(handleBounds.x + 95, handleBounds.y + 75, { steps: 12 }); await page.mouse.up(); await settle();
  const resized = await storedSave(); assert.ok(resized.sizes.Lineage.repair.width > 350);
  assert.notEqual(await page.locator('[data-id="food-repair"] path.react-flow__edge-path').getAttribute("d"), edgeBeforeResize);
  await assertAttached();
  await page.locator(".layout-menu summary").click(); assert.equal(await button("Undo").isEnabled(), true);
  await button("Undo").click(); await settle(); assert.deepEqual((await storedSave()).sizes, beforeResize.sizes);
  assert.equal(await button("Redo").isEnabled(), true); await button("Redo").click(); await settle();
  assert.deepEqual((await storedSave()).sizes, resized.sizes);
  await page.reload(); await page.locator(".thought").first().waitFor(); await settle();
  assert.deepEqual((await storedSave()).sizes, resized.sizes); await assertAttached();
  await page.locator(".layout-menu summary").click(); assert.equal(await button("Undo").isEnabled(), true);
  await page.screenshot({ path: `${artifacts}/resized-card.png` });
  const lineageHistory = (await storedSave()).layoutHistory.Lineage;
  await button("Evolution").click(); await settle();
  assert.equal(await button("Undo").isDisabled(), true);
  assert.equal(await repairNode.evaluate(n => n.offsetWidth), 290);
  await button("Arrange grid").click(); await settle(); assert.equal(await button("Undo").isEnabled(), true);
  const arranged = (await storedSave()).positions.Evolution;
  await button("Undo").click(); await settle(); assert.notDeepEqual((await storedSave()).positions.Evolution, arranged);
  assert.equal(await button("Redo").isEnabled(), true); await button("Redo").click(); await settle();
  assert.deepEqual((await storedSave()).positions.Evolution, arranged);
  await button("Lineage").click(); await settle();
  assert.deepEqual((await storedSave()).layoutHistory.Lineage, lineageHistory);
  assert.deepEqual((await storedSave()).sizes.Lineage, resized.sizes.Lineage);
  const beforeMove = (await storedSave()).positions.Lineage.repair;
  await repairNode.locator(".card-grip").focus(); await page.keyboard.press("ArrowRight"); await settle();
  assert.deepEqual((await storedSave()).positions.Lineage.repair, { ...beforeMove, x: beforeMove.x + 25 });
  assert.equal(await button("Undo").isEnabled(), true);
  await cameraKey("Control+z"); await settle(); assert.deepEqual((await storedSave()).positions.Lineage.repair, beforeMove);
  assert.equal(await button("Redo").isEnabled(), true);
  await cameraKey("Control+Shift+z"); await settle(); assert.equal((await storedSave()).positions.Lineage.repair.x, beforeMove.x + 25);
  await repairNode.locator(".card-grip").focus();
  for (let i = 0; i < 55; i++) await page.keyboard.press("ArrowRight");
  await settle(); assert.equal((await storedSave()).layoutHistory.Lineage.undo.length, 50);
  await page.reload(); await page.locator(".thought").first().waitFor(); await settle();
  assert.equal((await storedSave()).layoutHistory.Lineage.undo.length, 50);
  await inspectFromIndex("Repair, then stay for supper"); await button("More card actions").click(); await page.getByRole("dialog").getByRole("button", { name: "Edit", exact: true }).click();
  await page.getByRole("dialog").getByRole("textbox", { name: /^Title/ }).fill("Edited layout card"); await button("Save changes").click(); await settle();
  assert.ok(Object.values((await storedSave()).layoutHistory).every(h => !h.undo.length && !h.redo.length));
  await close();

  // A three-descendant chain plus context and association distractions.
  const foldedFixture = structuredClone(migrated);
  foldedFixture.relationships = [
    { ...foldedFixture.relationships.find(e => e.id === "food-repair") },
    { ...foldedFixture.relationships.find(e => e.id === "tools-repair") },
    { ...foldedFixture.relationships[0], id: "repair-rotation", from: "repair", to: "rotation", kind: "derivation" },
    { ...foldedFixture.relationships[0], id: "rotation-retail", from: "rotation", to: "retail", kind: "derivation" },
    { ...foldedFixture.relationships[0], id: "food-brief-context", from: "food", to: "brief", kind: "context" },
    { ...foldedFixture.relationships[0], id: "food-tools-association", from: "food", to: "tools", kind: "association" },
  ];
  // Precomputed themes keep this navigation-only case entirely offline.
  foldedFixture.themeCache = { groups: [{ name: "Prepared", reason: "Navigation fixture", memberIds: foldedFixture.thoughts.map(c => c.id) }], hashes: Object.fromEntries(foldedFixture.thoughts.map(c => [c.id, createHash("sha256").update(JSON.stringify([c.title, c.body])).digest("hex")])), time: "9/9/2026, 12:00:00 PM" };
  await upload(Buffer.from(JSON.stringify(foldedFixture))); await button("Replace").click(); await button("Confirm Replace").click(); await settle();
  let navigationCalls = 0;
  await page.route("**/api/**", route => { navigationCalls++; return route.abort(); });
  await inspectFromIndex("A food hall");
  await focusInspected(page);
  const foldNavigation = page.getByRole("region", { name: "Focused card connections" });
  await foldNavigation.locator(".focus-connections > summary").click();
  await foldNavigation.getByRole("button", { name: "Show descendants", exact: true }).click();
  assert.deepEqual((await page.locator(".react-flow__node.chain-highlighted").evaluateAll(nodes => nodes.map(n => n.dataset.id))).sort(), ["food", "repair", "rotation", "retail"].sort());
  assert.deepEqual(await page.getByRole("list", { name: "descendants chain" }).getByRole("button").allTextContents(), ["Repair, then stay for supper", "A shopfront for six weeks", "Independent retail shops"]);
  await foldNavigation.getByRole("button", { name: "Clear", exact: true }).click();
  await foldNavigation.getByRole("button", { name: "Hide descendants", exact: true }).click(); await settle();
  const foldedPositions = (await storedSave()).positions;
  const assertFolded = async () => {
    assert.equal(await page.locator('.react-flow__node[data-id="food"] .fold-marker').textContent(), "+3 folded");
    for (const id of ["repair", "rotation", "retail"]) assert.equal(await page.locator(`.react-flow__node[data-id="${id}"]`).count(), 0);
    for (const id of ["food-repair", "tools-repair", "repair-rotation", "rotation-retail"]) assert.equal(await page.locator(`.react-flow__edge[data-id="${id}"]`).count(), 0);
  };
  await assertFolded();
  await page.screenshot({ path: `${artifacts}/folded-chain.png` });
  await page.reload(); await page.locator(".thought").first().waitFor(); await settle(); await assertFolded();
  await openAtlasMenu(); const foldDownload = page.waitForEvent("download"); await button("Export atlas").click();
  const foldBytes = await readFile(await (await foldDownload).path()); assert.deepEqual(JSON.parse(foldBytes).folds, ["food"]);
  await resetFixture(); await upload(foldBytes); await button("Replace").click(); await button("Confirm Replace").click(); await settle(); await assertFolded();
  for (const perspective of ["Evolution", "Constellation", "Lineage"]) { await button(perspective).click(); await settle(); await assertFolded(); }
  await page.getByRole("button", { name: /^Thoughts / }).click();
  await page.getByLabel("Find a thought").fill("Repair, then stay for supper");
  const foldedRow = page.locator(".catalogue-entry"); assert.match(await foldedRow.innerText(), /folded under A food hall/);
  await foldedRow.getByRole("checkbox").check();
  assert.equal(await foldedRow.getByRole("checkbox").isChecked(), true);
  await foldedRow.getByRole("button", { name: "Unfold", exact: true }).click(); await close(); await settle();
  assert.equal(await page.locator(".thought").count(), 6); assert.deepEqual((await storedSave()).positions, foldedPositions);
  assert.equal(navigationCalls, 0, "focus, fold, unfold and navigation make no model calls");
  await page.unroute("**/api/**");

  await page.unroute("**/api/wander"); await page.unroute("**/api/expedition"); await page.unroute("**/api/reading"); await page.unroute("**/api/talk");
  await resetFixture(); await fit();

  // IB04: short desktop overview preserves labels and connections; the index provides full-size navigation.
  await page.setViewportSize({ width: 1280, height: 600 });
  await fit();
  const targets = page.locator(".overview-target");
  // Fit can retain full cards when compact geometry fits the viewport.
  for (let step = 0; step < 4 && !await targets.count(); step++) { await cameraKey("-"); await settle(); }
  assert.ok((await targets.count()) > 0);
  for (const target of await targets.all()) {
    const b = await target.boundingBox();
    assert.ok(b.width >= 10 && b.height >= 10, "overview dots have a visible surface; the index supplies full-size navigation targets");
  }
  await page.screenshot({ path: `${artifacts}/short-desktop.png` });
  const overviewCard = page.locator('[data-id="food"] .overview-target');
  assert.equal(
    await overviewCard.innerText(),
    "Food hall",
    "overview keeps the title without lineage notation",
  );
  const overviewRect = await overviewCard.boundingBox();
  const overviewCamera = await transform();
  const overviewPosition = await node.evaluate((e) => e.style.transform);
  const overviewEdge = await edge.getAttribute("d");
  await page.mouse.move(overviewRect.x + 30, overviewRect.y + 20);
  await page.mouse.down();
  await page.mouse.move(overviewRect.x + 90, overviewRect.y + 45, { steps: 8 });
  await page.waitForTimeout(100);
  const dragSurface = await page
    .locator('[data-id="food"] .thought')
    .evaluate((e) => ({
      background: getComputedStyle(e).backgroundColor,
      shadow: getComputedStyle(e).boxShadow,
      outline: getComputedStyle(e).outlineStyle,
    }));
  assert.equal(
    dragSurface.background,
    "rgba(0, 0, 0, 0)",
    "overview layout container stays transparent while dragging",
  );
  assert.equal(
    dragSurface.shadow,
    "none",
    "overview drag has no ghost rectangular shadow",
  );
  assert.equal(
    dragSurface.outline,
    "none",
    "overview drag has no hidden rectangular outline",
  );
  await page.screenshot({ path: `${artifacts}/overview-drag.png` });

  await page.mouse.up();
  await settle();
  assert.notEqual(
    await node.evaluate((e) => e.style.transform),
    overviewPosition,
    "overview card is draggable",
  );
  assert.notEqual(
    await edge.getAttribute("d"),
    overviewEdge,
    "overview edges follow movement",
  );
  assert.equal(
    await transform(),
    overviewCamera,
    "overview drag does not focus or pan",
  );
  assert.ok(await overviewCard.isVisible(), "drag does not switch to detail");
  await overviewCard.focus();
  const beforeArrow = await node.evaluate((e) => e.style.transform);
  await page.keyboard.press("ArrowRight");
  assert.notEqual(
    await node.evaluate((e) => e.style.transform),
    beforeArrow,
    "overview arrow-key movement works",
  );

  const beforeOverviewOpen = await transform();
  await page.locator('[data-id="food"] .overview-target').click();
  await page.getByRole("dialog").waitFor();
  assert.equal(
    await transform(),
    beforeOverviewOpen,
    "single click opens overview card without zooming",
  );
  await close();
  await page.locator('[data-id="food"] .overview-target').dblclick();
  await settle();
  assert.equal(
    await transform(),
    beforeOverviewOpen,
    "double click selects overview card without moving the camera",
  );
  assert.ok(await page.locator('[data-id="food"] .thought.chosen').isVisible(), "double click selects the card");
  assert.equal(await page.locator('[data-id="food-repair"]').evaluate(e => Number(getComputedStyle(e).opacity)), 1, "selection highlights outgoing relationships, not just parents");
  assert.equal(
    await page.getByRole("dialog").count(),
    0,
    "double click does not leave inspection open",
  );
  await page.locator('[data-id="food"] .overview-target').dblclick();
  assert.equal(await page.locator('[data-id="food"] .thought.chosen').count(), 0, "double click again deselects the card");
  assert.equal(await page.getByRole("region", { name: "Focused card connections" }).count(), 0, "deselecting the last card clears stale relationship focus");
  await page.locator('[data-id="food"] .overview-target').focus();
  await page.keyboard.press("Enter");
  assert.equal(await page.getByRole("dialog").count(), 1);
  await close();

  await page.setViewportSize({ width: 1440, height: 900 });
  assert.equal(await button("Denser study").count(), 0);
  assert.equal(await button("Mall demo").count(), 0);

  // IB02/03/04: Chromium CDP touch simulation, including contacts on a title and action.
  const touch = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  const mobile = await touch.newPage();
  mobile.on("pageerror", (e) => errors.push(e.message));
  await mobile.goto(base);
  await mobile.locator(".overview-target").first().waitFor();
  await mobile.waitForTimeout(350);
  await cameraKey("0", mobile);
  await mobile.waitForTimeout(350);
  await mobile.screenshot({ path: `${artifacts}/narrow-overview.png` });
  const markerCamera = await mobile
    .locator(".react-flow__viewport")
    .getAttribute("style");
  await mobile.locator('[data-id="repair"] .overview-target').tap();
  await mobile.getByRole("dialog").waitFor();
  assert.equal(
    await mobile.locator(".react-flow__viewport").getAttribute("style"),
    markerCamera,
    "single compact tap opens without zooming",
  );
  await mobile.getByRole("button", { name: "Close panel", exact: true }).tap();
  await selectCatalogue(mobile, "Repair, then stay for supper");
  await mobile.locator('[data-id="repair"] .overview-target').focus();
  const markerHighlight = await mobile
    .locator('[data-id="repair"]')
    .evaluate((node) => {
      const card = node.querySelector(".thought"),
        marker = node.querySelector(".overview-target");
      return {
        wrapperFocusable: node.hasAttribute("tabindex"),
        parentOutline: getComputedStyle(card).outlineStyle,
        radius: getComputedStyle(marker).borderRadius,
        shadow: getComputedStyle(marker).boxShadow,
      };
    });
  assert.equal(
    markerHighlight.wrapperFocusable,
    false,
    "invisible node wrapper has no focus box",
  );
  assert.equal(
    markerHighlight.parentOutline,
    "none",
    "selected marker has no rectangular parent outline",
  );
  assert.equal(markerHighlight.radius, "50%");
  assert.notEqual(
    markerHighlight.shadow,
    "none",
    "selection is shown on the circular marker",
  );
  await mobile.screenshot({ path: `${artifacts}/compact-selection.png` });
  await mobile
    .getByRole("button", { name: "Clear selection", exact: true })
    .click();
  const cdp = await touch.newCDPSession(mobile);
  const compactNode = mobile.locator('[data-id="food"]');
  const compactTarget = mobile.locator('[data-id="food"] .overview-target');
  const compactRect = await compactTarget.boundingBox();
  const compactCamera = await mobile
    .locator(".react-flow__viewport")
    .getAttribute("style");
  const compactPosition = await compactNode.evaluate((e) => e.style.transform);
  const tx = compactRect.x + compactRect.width / 2,
    ty = compactRect.y + compactRect.height / 2;
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: tx, y: ty, id: 1 }],
  });
  for (let i = 1; i <= 5; i++)
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: tx + i * 5, y: ty + i * 4, id: 1 }],
    });
  const compactDragSurface = await mobile
    .locator('[data-id="food"] .thought')
    .evaluate((e) => ({
      background: getComputedStyle(e).backgroundColor,
      shadow: getComputedStyle(e).boxShadow,
      outline: getComputedStyle(e).outlineStyle,
    }));
  assert.equal(compactDragSurface.background, "rgba(0, 0, 0, 0)");
  assert.equal(
    compactDragSurface.shadow,
    "none",
    "compact drag has no rectangular ghost shadow",
  );
  assert.equal(compactDragSurface.outline, "none");
  await mobile.screenshot({ path: `${artifacts}/compact-drag.png` });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await mobile.waitForTimeout(350);
  assert.notEqual(
    await compactNode.evaluate((e) => e.style.transform),
    compactPosition,
    "compact marker moves with touch",
  );
  assert.equal(
    await mobile.locator(".react-flow__viewport").getAttribute("style"),
    compactCamera,
    "compact drag does not zoom or pan",
  );
  assert.ok(await compactTarget.isVisible(), "touch drag does not focus");
  const pinchRect = await compactTarget.boundingBox();
  const px = pinchRect.x + pinchRect.width / 2,
    py = pinchRect.y + pinchRect.height / 2;
  const compactBeforePinch = await compactNode.evaluate(
    (e) => e.style.transform,
  );
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: px, y: py, id: 1 }],
  });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [
      { x: px, y: py, id: 1 },
      { x: px + 50, y: py + 50, id: 2 },
    ],
  });
  for (let i = 1; i <= 5; i++)
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [
        { x: px - i * 2, y: py - i * 2, id: 1 },
        { x: px + 50 + i * 2, y: py + 50 + i * 2, id: 2 },
      ],
    });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await mobile.waitForTimeout(350);
  assert.equal(
    await compactNode.evaluate((e) => e.style.transform),
    compactBeforePinch,
    "pinch beginning on a draggable marker does not move it",
  );
  assert.notEqual(
    await mobile.locator(".react-flow__viewport").getAttribute("style"),
    compactCamera,
    "marker pinch zooms",
  );

  await mobile.getByRole("button", { name: /^Thoughts / }).click();
  await focusFromIndex(mobile, "A food hall");
  await mobile.waitForTimeout(350);

  const mobileTransform = () =>
    mobile.locator(".react-flow__viewport").getAttribute("style");
  const titleBox = await mobile
    .locator('[data-id="food"] .card-title')
    .boundingBox();
  const actionBox = await mobile
    .locator('[data-id="food"] .card-top .select-card')
    .first()
    .boundingBox();
  const nodeBeforePinch = await mobile
    .locator('[data-id="food"]')
    .evaluate((e) => e.style.transform);
  const prePinch = await mobileTransform();
  const x = titleBox.x + 65;
  const y1 = titleBox.y + 10;
  const y2 = actionBox.y + actionBox.height / 2;
  const x2 = actionBox.x + actionBox.width / 2;
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x, y: y1, id: 1 }],
  });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [
      { x, y: y1, id: 1 },
      { x: x2, y: y2, id: 2 },
    ],
  });
  for (let i = 1; i <= 5; i++)
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [
        { x: x - i * 4, y: y1 - i * 4, id: 1 },
        { x: x2 + i * 4, y: y2 + i * 4, id: 2 },
      ],
    });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await mobile.waitForTimeout(350);
  assert.notEqual(
    await mobileTransform(),
    prePinch,
    "pinch across card/control zooms",
  );
  assert.equal(
    await mobile.locator('[data-id="food"]').evaluate((e) => e.style.transform),
    nodeBeforePinch,
    "pinch must not move a card",
  );
  assert.equal(
    await mobile.getByRole("dialog").count(),
    0,
    "pinch must not activate controls",
  );
  await cameraKey("0", mobile);
  await mobile.waitForTimeout(350);
  await cameraKey("+", mobile);
  await mobile.waitForTimeout(350);
  await mobile
    .getByRole("button", { name: /^Thoughts / })
    .evaluate((e) => e.click());
  await focusFromIndex(mobile, "A food hall");
  await mobile.waitForTimeout(350);
  await mobile.route("**/api/moves", (route) => route.fulfill({ status: 500, json: { error: "Offline test" } }));
  await mobile.route("**/api/wander", (route) => route.fulfill({ json: { cards: [card("Quiet morning table")] } }));
  await mobile.getByRole("button", { name: "A food hall", exact: true }).tap();
  await mobile.getByRole("dialog").waitFor();
  assert.equal(await mobile.getByRole("dialog").count(), 1);
  await mobile.getByRole("button", { name: "Close panel", exact: true }).tap();
  await selectCatalogue(mobile, "A food hall", true);
  await mobile.locator(".selection-bar").getByRole("button", { name: "Wander", exact: true }).tap();
  await mobile
    .getByRole("button", { name: "Try Explore the quiet hours", exact: true })
    .tap();
  await mobile.waitForFunction(() => document.querySelectorAll(".thought").length === 7);
  await mobile.waitForTimeout(350);
  assert.ok(parseInt(await mobile.getByLabel("Zoom level").textContent(), 10) >= 73);
  assert.ok(await mobile.locator(".thought.chosen .select-card").isVisible());
  await mobile.screenshot({ path: `${artifacts}/narrow-move.png` });
  await page.reload();
  await page.locator(".thought").first().waitFor();
  await inspectFromIndex("Repair, then stay for supper");
  const positionsBeforeFocus = await page.locator(".react-flow__node").evaluateAll(es => es.map(e => e.style.transform));
  await focusInspected(page);
  await settle();
  assert.ok(parseInt(await page.getByLabel("Zoom level").textContent(), 10) >= 100, "focus keeps one card readable");
  const navigation = page.getByRole("region", { name: "Focused card connections" });
  await navigation.locator(".focus-connections > summary").click();
  assert.equal(await navigation.locator(".relative-link").count(), 2, "both recombination parents are navigable");
  await navigation.getByRole("button", { name: /^Highlight only/ }).first().click();
  assert.equal(await page.locator(".react-flow__edge-path").evaluateAll(es => es.filter(e => Number(e.style.opacity) > .5).length), 1, "Trace emphasizes only one branch");
  await navigation.locator(".relative-link").first().click();
  await settle();
  assert.ok(parseInt(await page.getByLabel("Zoom level").textContent(), 10) >= 100, "following a relative retains readable zoom");
  assert.deepEqual(await page.locator(".react-flow__node").evaluateAll(es => es.map(e => e.style.transform)), positionsBeforeFocus, "focus navigation never rearranges cards");
  await page.screenshot({ path: `${artifacts}/focus-connections.png` });

  }
  // Voice runs on a separate page so the existing atlas replay stays deterministic.
  async function verifyVoice(real = false) {
    const voicePage = await browser.newPage();
    voicePage.on("pageerror", (e) => errors.push(e.message));
    await voicePage.addInitScript(() => {
      window.voiceStats = { microphones: 0, stoppedTracks: 0, playbackStarts: 0, playbackStops: 0 };
      const get = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
      navigator.mediaDevices.getUserMedia = async (...args) => {
        window.voiceStats.microphones++;
        if (window.denyMicrophone) { window.denyMicrophone = false; throw new DOMException("Microphone denied", "NotAllowedError"); }
        const stream = await get(...args);
        window.latestVoiceStream = stream;
        for (const track of stream.getTracks()) {
          const stop = track.stop.bind(track);
          track.stop = () => { window.voiceStats.stoppedTracks++; stop(); };
        }
        return stream;
      };
      const createProcessor = AudioContext.prototype.createScriptProcessor;
      AudioContext.prototype.createScriptProcessor = function (...args) {
        const processor = createProcessor.apply(this, args);
        let handler;
        Object.defineProperty(processor, "onaudioprocess", { get: () => handler, set: value => { handler = value; } });
        processor.addEventListener("audioprocess", event => { if (!window.dropCapturedAudio) handler?.(event); });
        return processor;
      };
      const create = AudioContext.prototype.createBufferSource;
      AudioContext.prototype.createBufferSource = function () {
        const source = create.call(this);
        const start = source.start.bind(source), stop = source.stop.bind(source);
        source.start = (...args) => { window.voiceStats.playbackStarts++; start(...args); };
        source.stop = (...args) => { window.voiceStats.playbackStops++; stop(...args); };
        return source;
      };
    });
    if (real && process.env.MINERVA_VOICE_TOKEN_URL) {
      await voicePage.route("**/api/voice", async route => {
        const response = await route.fetch({ url: process.env.MINERVA_VOICE_TOKEN_URL });
        await route.fulfill({ response });
      });
    }
    let tokenCalls = 0;
    const events = [];
    let voiceSocket;
    if (!real) {
      await voicePage.route("**/api/voice", async (route) => {
        tokenCalls++;
        if (tokenCalls === 2) await new Promise((resolve) => setTimeout(resolve, 1200));
        return route.fulfill(tokenCalls === 1 ? { status: 503, json: { error: "Voice fixture failure" } } :
          { json: { token: "mock-token", url: "wss://voice.test/realtime-model", tools: [] } });
      });
      await voicePage.routeWebSocket("wss://voice.test/realtime-model", (socket) => {
        voiceSocket = socket;
        let closed = false;
        socket.onClose(() => { closed = true; });
        const send = (event) => { if (!closed) socket.send(JSON.stringify({ ...event, raw: {} })); };
        socket.onMessage((message) => {
          const event = JSON.parse(String(message));
          events.push(event.type === "input-audio-append" ? { type: event.type } : event);
          if (event.type === "session-update") send({ type: "session-updated" });
          if (event.type === "input-audio-commit") {
            send({ type: "audio-committed", itemId: "user-voice" });
            send({ type: "input-transcription-completed", itemId: "user-voice", transcript: "Could the mall host a repair library?" });
          }
          if (event.type === "response-create") {
            send({ type: "response-created", responseId: "reply" });
            send({ type: "audio-transcript-delta", itemId: "reply", responseId: "reply", delta: "Try a repair library" });
            // Four seconds of PCM silence exercises the SDK's real playback queue.
            send({ type: "audio-delta", itemId: "reply", responseId: "reply", delta: Buffer.alloc(24000 * 2 * 4).toString("base64") });
            setTimeout(() => {
              send({ type: "audio-transcript-done", itemId: "reply", responseId: "reply", transcript: "Try a repair library with shared tools." });
              send({ type: "response-done", responseId: "reply", status: "completed" });
            }, 1200);
          }
        });
      });
    }
    await voicePage.goto(base);
    const vb = (name) => voicePage.getByRole("button", { name, exact: true });
    await vb("Talk to Minerva").click();
    assert.equal(await voicePage.evaluate(() => window.voiceStats.microphones), 0, "opening Talk does not request microphone");
    assert.equal(tokenCalls, 0, "opening Talk does not mint a token");
    if (!real) {
      await voicePage.evaluate(() => { window.denyMicrophone = true; });
      await vb("Hold to talk").focus();
      await voicePage.keyboard.down("Space");
      await voicePage.getByRole("dialog").getByRole("alert").waitFor();
      await voicePage.keyboard.up("Space");
      assert.equal(await voicePage.getByRole("dialog").getByRole("alert").innerText(), "Allow microphone access in your browser’s site settings, then hold Retry to speak.");
      assert.equal(tokenCalls, 0, "denied permission never mints a token");
      await vb("Retry").focus();
      await voicePage.keyboard.down("Space");
      await voicePage.getByRole("dialog").getByRole("alert").waitFor();
      await voicePage.keyboard.up("Space");
      assert.equal(tokenCalls, 1);
    }
    await vb(real ? "Hold to talk" : "Retry").focus();
    await voicePage.keyboard.down("Space");
    await voicePage.getByText("Listening… release to send.", { exact: true }).waitFor({ timeout: 60000 });
    if (real) await voicePage.waitForTimeout(7000);
    else {
      const deadline = Date.now() + 10000;
      while (!events.some(event => event.type === "input-audio-append") && Date.now() < deadline) await voicePage.waitForTimeout(100);
      assert.ok(events.some(event => event.type === "input-audio-append"), "microphone must deliver audio before releasing the test press");
      await voicePage.waitForTimeout(300);
    }
    await voicePage.keyboard.up("Space");
    await voicePage.waitForFunction(() => document.querySelector(".talk-transcript")?.textContent.includes("You") || document.querySelector(".voice-control [role=alert]"), undefined, { timeout: 60000 });
    assert.equal(await voicePage.locator(".voice-control [role=alert]").count(), 0, await voicePage.locator(".voice-control").innerText());
    await voicePage.waitForFunction(() => window.voiceStats.playbackStarts > 0, undefined, { timeout: 60000 });
    if (!real) {
      await voicePage.getByText("Try a repair library", { exact: true }).waitFor();
      assert.ok(events.some((event) => event.type === "input-audio-append"));
      assert.equal(events.filter((event) => event.type === "input-audio-commit").length, 1);
      const config = events.find((event) => event.type === "session-update").config;
      assert.equal(config.turnDetection, null);
      assert.ok(config.instructions.includes("A shared tool library"), "voice receives the full canvas with no selection");
      assert.ok(config.instructions.includes('"selectedIds":[]'));
      assert.deepEqual(config.providerOptions.gateway.tags, ["feature:voice"]);
      // A fresh press must stop queued output immediately, including a late reply.
      await vb("Hold to talk").focus();
      await voicePage.keyboard.down("Space");
      await voicePage.waitForFunction(() => window.voiceStats.playbackStops > 0);
      await voicePage.keyboard.up("Space");
      await voicePage.waitForTimeout(1400);
      assert.equal(await voicePage.getByText("Try a repair library with shared tools.", { exact: true }).count(), 0);
      // Complete a new exchange, then prove typed Talk receives its transcript.
      const hold = await vb("Hold to talk").boundingBox();
      await voicePage.mouse.move(hold.x + hold.width / 2, hold.y + hold.height / 2);
      await voicePage.mouse.down();
      await voicePage.getByText("Listening… release to send.", { exact: true }).waitFor();
      await voicePage.waitForTimeout(600);
      await voicePage.mouse.up();
    }
    await voicePage.waitForFunction(() => document.querySelector("#voice-status")?.textContent === "", undefined, { timeout: 60000 });
    const transcript = await voicePage.locator(".talk-transcript").innerText();
    const stats = await voicePage.evaluate(() => window.voiceStats);
    assert.ok(transcript.includes("You") && transcript.includes("Minerva"));
    assert.ok(stats.stoppedTracks > 0);
    await writeFile(artifacts + (real ? "/voice-live.json" : "/voice-mock.json"), JSON.stringify({ input: real ? voiceInput : "mock transcript", transcript, stats, model: "openai/gpt-realtime-2" }, null, 2));
    await voicePage.screenshot({ path: artifacts + (real ? "/voice-live.png" : "/voice-mock.png") });
    if (!real) {
      let typedInput;
      await voicePage.route("**/api/talk", (route) => {
        typedInput = route.request().postDataJSON();
        return route.fulfill({ contentType: "application/x-ndjson", body: JSON.stringify({ text: "A typed follow-up." }) + "\n" + JSON.stringify({ done: true }) + "\n" });
      });
      await voicePage.getByLabel("Message Minerva").fill("What equipment first?");
      await vb("Send").click();
      await voicePage.getByText("A typed follow-up.", { exact: true }).waitFor();
      assert.ok(typedInput.messages.some((message) => message.content === "Could the mall host a repair library?"));
      assert.ok(typedInput.messages.some((message) => message.content === "Try a repair library with shared tools."));
      await vb("Start voice mode").click();
      await vb("End voice mode").waitFor();
      await voicePage.getByText("Listening…", { exact: true }).waitFor();
      assert.equal(events.filter(e => e.type === "session-update").at(-1).config.turnDetection.type, "server-vad");
      const committedBefore = events.filter(e => e.type === "input-audio-commit").length;
      const emit = event => voiceSocket.send(JSON.stringify({ ...event, raw: {} }));
      for (let i = 0; i < 2; i++) {
        emit({ type: "speech-started", audioStartMs: i * 1000 });
        emit({ type: "audio-committed", itemId: `handsfree-user-${i}` });
        emit({ type: "input-transcription-completed", itemId: `handsfree-user-${i}`, transcript: `Voice question ${i}` });
        emit({ type: "speech-stopped", audioEndMs: i * 1000 + 500 });
        emit({ type: "response-created", responseId: `handsfree-${i}` });
        emit({ type: "audio-transcript-delta", itemId: `handsfree-${i}`, responseId: `handsfree-${i}`, delta: `Voice answer ${i}` });
        emit({ type: "audio-transcript-done", itemId: `handsfree-${i}`, responseId: `handsfree-${i}`, transcript: `Voice answer ${i}` });
        emit({ type: "response-done", responseId: `handsfree-${i}`, status: "completed" });
        await voicePage.getByText(`Voice answer ${i}`, { exact: true }).waitFor();
      }
      // Final transcript snapshots must not append text or replay audio.
      const playbackBeforeSnapshots = await voicePage.evaluate(() => window.voiceStats.playbackStarts);
      const messagesBeforeSnapshots = await voicePage.locator(".talk-transcript section").count();
      for (let repeat = 0; repeat < 3; repeat++) emit({ type: "audio-transcript-done", itemId: "handsfree-1", responseId: "handsfree-1", transcript: "Voice answer 1" });
      emit({ type: "input-transcription-completed", itemId: "empty-turn", transcript: "   " });
      emit({ type: "response-created", responseId: "segmented" });
      emit({ type: "audio-transcript-delta", itemId: "segment-a", responseId: "segmented", delta: "First segment." });
      emit({ type: "audio-transcript-done", itemId: "segment-a", responseId: "segmented", transcript: "First segment." });
      emit({ type: "audio-transcript-delta", itemId: "segment-b", responseId: "segmented", delta: "Second segment." });
      emit({ type: "audio-transcript-done", itemId: "segment-b", responseId: "segmented", transcript: "Second segment." });
      emit({ type: "response-done", responseId: "segmented", status: "completed" });
      await voicePage.getByText("Second segment.", { exact: true }).waitFor();
      const segmented = voicePage.locator(".talk-message-assistant").last();
      assert.equal(await segmented.locator(".body-copy p").count(), 2, "separate speech items have separate paragraphs");
      assert.equal(await voicePage.locator(".talk-transcript section").count(), messagesBeforeSnapshots + 1, "blank input and repeated final events add no phantom turns");
      assert.equal(await voicePage.getByText("Voice answer 1", { exact: true }).count(), 1);
      assert.equal(await voicePage.evaluate(() => window.voiceStats.playbackStarts), playbackBeforeSnapshots, "transcript snapshots never schedule audio playback");
      const stopsBeforeInterrupt = await voicePage.evaluate(() => window.voiceStats.playbackStops);
      emit({ type: "audio-delta", itemId: "handsfree-1", responseId: "handsfree-1", delta: Buffer.alloc(24000 * 2 * 4).toString("base64") });
      await voicePage.getByText("Minerva is speaking…", { exact: true }).waitFor();
      const tracksBeforeNavigation = await voicePage.evaluate(() => window.voiceStats.stoppedTracks);
      await voicePage.locator('[data-id="food"] .card-title').click();
      await voicePage.locator("#minerva-talk").waitFor({ state: "hidden" });
      await voicePage.waitForTimeout(100);
      const focusedConfig = events.filter(event => event.type === "session-update").at(-1).config;
      assert.ok(focusedConfig.instructions.includes('"focusedId":"food"'), "active voice receives the inspected card as the referent for this one");
      assert.ok(focusedConfig.instructions.includes('"selectedIds":[]'), "inspection focus is independent of multi-selection");
      assert.ok(focusedConfig.instructions.includes('"id":"food"'), "updated focus includes the card content");
      assert.equal(focusedConfig.turnDetection, undefined, "context updates preserve the existing voice configuration");
      await voicePage.locator('[data-id="food"] .select-card').click();
      await voicePage.waitForTimeout(100);
      assert.ok(events.filter(event => event.type === "session-update").at(-1).config.instructions.includes('"selectedIds":["food"]'), "selection changes reach the active voice session");
      await voicePage.locator('[data-id="food"] .select-card').click();
      await voicePage.waitForTimeout(100);
      assert.ok(events.filter(event => event.type === "session-update").at(-1).config.instructions.includes('"focusedId":null'), "deselecting clears the voice referent");
      assert.equal(await voicePage.locator(".voice-control").count(), 1, "card inspection retains the voice session");
      await voicePage.waitForTimeout(300);
      assert.equal(await voicePage.evaluate(() => window.voiceStats.playbackStops), stopsBeforeInterrupt, "card interaction preserves queued audio");
      assert.equal(await voicePage.evaluate(() => window.voiceStats.stoppedTracks), tracksBeforeNavigation, "card interaction preserves microphone capture");
      emit({ type: "audio-transcript-delta", itemId: "canvas-reply", responseId: "canvas-reply", delta: "Voice continues while inspecting the canvas." });
      emit({ type: "audio-transcript-done", itemId: "canvas-reply", responseId: "canvas-reply", transcript: "Voice continues while inspecting the canvas." });
      await vb("Close panel").click();
      await vb("Talk to Minerva").click();
      await voicePage.getByText("Voice continues while inspecting the canvas.", { exact: true }).waitFor();
      assert.ok(await vb("End voice mode").isVisible(), "reopening Talk retains active voice controls");
      emit({ type: "speech-started", audioStartMs: 3000 });
      emit({ type: "response-done", responseId: "handsfree-1", status: "cancelled" });
      await voicePage.waitForFunction(previous => window.voiceStats.playbackStops > previous, stopsBeforeInterrupt);
      assert.ok(await vb("End voice mode").isVisible(), "interruption keeps voice mode open");
      assert.equal(events.filter(e => e.type === "input-audio-commit").length, committedBefore, "hands-free relies on automatic turns");
      await vb("Mute microphone").click();
      await vb("Unmute microphone").waitFor();
      assert.equal(await voicePage.evaluate(() => window.latestVoiceStream.getAudioTracks()[0].enabled), false);
      await voicePage.getByText("Microphone muted", { exact: true }).waitFor();
      await voicePage.screenshot({ path: artifacts + "/composer-voice.png" });
      await voicePage.setViewportSize({ width: 390, height: 844 });
      assert.equal(await voicePage.locator(".talk-panel").evaluate(el => el.scrollWidth <= el.clientWidth), true);
      await voicePage.screenshot({ path: artifacts + "/composer-voice-mobile.png" });
      await vb("Unmute microphone").click();
      assert.equal(await voicePage.evaluate(() => window.latestVoiceStream.getAudioTracks()[0].enabled), true);
      const tracksBeforeEnd = await voicePage.evaluate(() => window.voiceStats.stoppedTracks);
      await vb("End voice mode").click();
      assert.ok(await voicePage.evaluate(() => window.voiceStats.stoppedTracks) > tracksBeforeEnd);
      assert.ok(await voicePage.getByLabel("Message Minerva").isEnabled());
      await voicePage.screenshot({ path: artifacts + "/composer-typing.png" });
      await vb("Start voice mode").click();
      await voicePage.getByText("Listening…", { exact: true }).waitFor();
      const beforeDismiss = await voicePage.evaluate(() => ({ ...window.voiceStats }));
      for (const dismissal of ["close", "escape"]) {
        if (dismissal === "close") await vb("Close panel").click();
        else { await vb("Unmute microphone").focus(); await voicePage.keyboard.press("Escape"); }
        await voicePage.locator("#minerva-talk").waitFor({ state: "hidden" });
        assert.equal(await voicePage.locator(".voice-control").count(), 1, `${dismissal} preserves the voice component`);
        emit({ type: "audio-transcript-delta", itemId: `hidden-${dismissal}`, responseId: `hidden-${dismissal}`, delta: `Reply after ${dismissal}.` });
        emit({ type: "audio-transcript-done", itemId: `hidden-${dismissal}`, responseId: `hidden-${dismissal}`, transcript: `Reply after ${dismissal}.` });
        await voicePage.waitForFunction(text => document.querySelector(".talk-transcript")?.textContent.includes(text), `Reply after ${dismissal}.`);
        assert.deepEqual(await voicePage.evaluate(() => ({ ...window.voiceStats })), beforeDismiss, `${dismissal} preserves microphone and playback without reconnecting`);
        await vb("Talk to Minerva").click();
        await voicePage.locator("#minerva-talk").waitFor({ state: "visible" });
        assert.ok((await voicePage.locator(".talk-transcript").innerText()).includes(`Reply after ${dismissal}.`));
        assert.ok(await vb("End voice mode").isVisible());
        if (dismissal === "close") await vb("Mute microphone").click();
        assert.ok(await vb("Unmute microphone").isVisible(), "muting survives reopening");
      }
      await vb("End voice mode").click();
      assert.ok(await voicePage.evaluate(() => window.voiceStats.stoppedTracks) > beforeDismiss.stoppedTracks, "only explicit End stops the microphone");
      assert.ok(await voicePage.getByLabel("Message Minerva").isEnabled());
      await vb("Close panel").click();
      assert.equal(await voicePage.locator(".voice-control").count(), 0);
      await vb("Talk to Minerva").click();
      await voicePage.evaluate(() => { window.dropCapturedAudio = true; });
      const requestsBeforeEmpty = events.filter(event => event.type === "response-create" || event.type === "input-audio-commit").length;
      await vb("Hold to talk").focus(); await voicePage.keyboard.down("Space");
      await voicePage.getByText("Listening… release to send.", { exact: true }).waitFor();
      await voicePage.waitForTimeout(500); await voicePage.keyboard.up("Space");
      await voicePage.getByText("No microphone audio arrived. Please try again.", { exact: true }).waitFor();
      assert.equal(events.filter(event => event.type === "response-create" || event.type === "input-audio-commit").length, requestsBeforeEmpty, "missing audio must not request a model reply");
      await voicePage.evaluate(() => { window.dropCapturedAudio = false; });
      await voicePage.reload();
      await vb("Talk to Minerva").click();
      assert.ok(await voicePage.locator(".talk-transcript section").count() > 0, "voice transcript survives reload");
      assert.equal(await voicePage.evaluate(() => window.voiceStats.microphones), 0);
    }
    if (real) {
      const repliesBefore = await voicePage.locator(".talk-message-assistant").count();
      await vb("Start voice mode").click();
      await voicePage.waitForFunction(count => document.querySelectorAll(".talk-message-assistant").length > count && document.querySelectorAll(".talk-message-assistant")[count].textContent.length > 20, repliesBefore, { timeout: 90000 });
      await voicePage.screenshot({ path: artifacts + "/voice-mode-live.png" });
      await writeFile(artifacts + "/voice-mode-live.json", JSON.stringify({ transcript: await voicePage.locator(".talk-transcript").innerText(), stats: await voicePage.evaluate(() => window.voiceStats) }, null, 2));
      await vb("End voice mode").click();
    }
    await voicePage.close();
  }
  const markdownPage = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const markdownReply = "## A clearer direction\n\nTry **repair and supper**, with *shared learning*.\n\n- Borrow tools\n- Share a meal\n\n> Start with one evening.\n\n[Reference](https://example.com) and `one evening`.\n\n```text\nrepair -> supper\n```\n\n| Idea | Benefit |\n| --- | --- |\n| Repair | Learning |\n\n<script>window.markdownUnsafe = true</script>\n\n[Unsafe](javascript:alert(1))\n\n" + "A readable paragraph with enough detail to test scrolling.\n\n".repeat(20);
  await markdownPage.route("**/api/talk", route => route.fulfill({ contentType: "application/x-ndjson", body: JSON.stringify({ text: markdownReply }) + "\n" + JSON.stringify({ done: true }) + "\n" }));
  await markdownPage.goto(base);
  const launcher = markdownPage.getByRole("button", { name: "Talk to Minerva", exact: true });
  await launcher.waitFor();
  await launcher.locator("img").evaluate(img => img.decode());
  assert.equal(await markdownPage.locator(".field-tools").getByRole("button", { name: "Talk to Minerva" }).count(), 0);
  const launcherBox = await launcher.boundingBox();
  assert.equal(launcherBox.width, 64);
  assert.equal(launcherBox.x + launcherBox.width, 1280 - 24);
  await launcher.focus();
  assert.equal(await markdownPage.locator(".minerva-launcher-label").evaluate(el => getComputedStyle(el).opacity), "1");
  await markdownPage.screenshot({ path: `${artifacts}/minerva-launcher-desktop.png` });
  await launcher.press("Enter");
  await markdownPage.getByLabel("Message Minerva").press("Escape");
  assert.equal(await launcher.evaluate(el => document.activeElement === el), true, "closing Talk restores launcher focus");
  await markdownPage.setViewportSize({ width: 390, height: 844 });
  await markdownPage.screenshot({ path: `${artifacts}/minerva-launcher-mobile.png` });
  await markdownPage.setViewportSize({ width: 1280, height: 900 });
  await markdownPage.getByRole("button", { name: "Talk to Minerva", exact: true }).click();
  assert.equal(await markdownPage.getByText(/Using all .*canvas cards|Conversation resets on reload/).count(), 0);
  await markdownPage.getByLabel("Message Minerva").fill("Make this **readable**.");
  await markdownPage.getByLabel("Message Minerva").press("Enter");
  await markdownPage.getByRole("heading", { name: "A clearer direction" }).waitFor();
  assert.ok((await markdownPage.locator(".talk-message-assistant").innerText()).length < markdownReply.length / 2, "a buffered response appears progressively instead of all at once");
  await markdownPage.getByRole("button", { name: "Replying…", exact: true }).waitFor({ state: "hidden" });
  const rendered = markdownPage.locator(".talk-message-assistant .talk-markdown");
  assert.equal(await rendered.locator("strong").innerText(), "repair and supper");
  assert.equal(await rendered.locator("ul li").count(), 2);
  assert.equal(await rendered.locator("blockquote").innerText(), "Start with one evening.");
  assert.equal(await rendered.locator("pre code").innerText(), "repair -> supper\n");
  assert.equal(await rendered.locator("table th").count(), 2);
  assert.equal(await rendered.getByRole("link", { name: "Reference", exact: true }).getAttribute("href"), "https://example.com");
  assert.equal(await rendered.locator('a[href^="javascript:"]').count(), 0);
  assert.equal(await markdownPage.evaluate(() => window.markdownUnsafe), undefined);
  await markdownPage.locator(".talk-transcript").evaluate(el => { el.scrollTop = 0; });
  await markdownPage.getByRole("button", { name: "Latest message" }).waitFor();
  await markdownPage.screenshot({ path: `${artifacts}/talk-markdown.png` });
  await markdownPage.getByRole("button", { name: "Latest message" }).click();
  await markdownPage.setViewportSize({ width: 390, height: 844 });
  await markdownPage.locator(".talk-transcript").evaluate(el => { el.scrollTop = 0; });
  assert.equal(await markdownPage.locator(".talk-panel").evaluate(el => el.scrollWidth <= el.clientWidth), true, "Markdown keeps the narrow panel within its width");
  await markdownPage.screenshot({ path: `${artifacts}/talk-markdown-mobile.png` });
  await markdownPage.close();
  await verifyVoice();
  if (liveVoice) await verifyVoice(true);

  assert.deepEqual(errors, []);
  console.log(
    JSON.stringify(
      {
        browser: browser.version(),
        result:
          process.env.MINERVA_VOICE_ONLY === "1" ? "Focused voice replay passed" :
          "C02/C03 resize, layout history, transitive focus/folds and v1 migration; recovery, merge counts and in-page confirmations; C01/C14 persistence/backup, tall-group fit, cancelled step, IB01–IB06, Markdown and voice passed with mouse/keyboard and simulated CDP touch; not a screen-reader or physical microphone review",
        demo: "6 cards / 7 edges",
        viewports: ["1440x900", "1280x600", "390x844"],
        artifacts,
      },
      null,
      2,
    ),
  );
} catch (error) {
  await page.screenshot({ path: `${artifacts}/failure.png` }).catch(() => {});
  await writeFile(`${artifacts}/failure.txt`, await page.locator("body").innerText()).catch(() => {});
  throw error;
} finally {
  await browser.close();
  streamServer.close();
}
