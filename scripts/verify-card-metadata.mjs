import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";
import { chromium } from "playwright";

const exports = {};
new Function("exports", ts.transpileModule(readFileSync(new URL("../features/atlas/fixture.ts", import.meta.url), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText)(exports);
const fixture = exports.mallFixture();
const legacy = {
  version: 1, thoughts: fixture.thoughts.map(card => ({ ...card, decision: "kept", evidence: "supported" })),
  relationships: fixture.relationships, positions: { Lineage: fixture.positions, Evolution: {}, Constellation: {} },
  cameras: {}, perspective: "Lineage", selected: [], active: "repair", focusedId: null,
  messages: [], expeditions: [], activeExpedition: null,
};
legacy.thoughts.find(card => card.id === "repair").provenance = { feature: "wander", tag: "legacy provenance", sourceTitles: ["A food hall"] };
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  const base = process.env.MINERVA_URL || "http://127.0.0.1:3000";
  await page.goto(`${base}/robots.txt`);
  await page.evaluate(async save => {
    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open("minerva-atlas", 1);
      request.onupgradeneeded = () => request.result.createObjectStore("saves");
      request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
    });
    await new Promise((resolve, reject) => {
      const tx = db.transaction("saves", "readwrite"); tx.objectStore("saves").put(save, "root-atlas");
      tx.oncomplete = resolve; tx.onerror = () => reject(tx.error);
    });
    db.close();
  }, legacy);
  await page.goto(base);
  await page.locator(".thought").first().waitFor();
  await page.getByRole("button", { name: /^Thoughts / }).click();
  const row = page.locator(".catalogue-entry").filter({ has: page.getByText("Repair, then stay for supper", { exact: true }) });
  assert.doesNotMatch(await row.innerText(), /kept|supported/);
  await row.locator(".catalogue-disclosure").click();
  await row.getByRole("button", { name: "Show in atlas", exact: true }).click();
  await page.getByRole("button", { name: "Open card", exact: true }).click();
  const dialog = page.getByRole("dialog");
  assert.doesNotMatch(await dialog.innerText(), /Evidence:|Your decision|Kept example/);
  assert.match(await dialog.innerText(), /legacy provenance/);
  const downloadEvent = page.waitForEvent("download");
  await dialog.getByRole("button", { name: "Download", exact: true }).click();
  const download = await downloadEvent;
  const markdown = readFileSync(await download.path(), "utf8");
  assert.doesNotMatch(markdown, /^## (Decision|Evidence)$/m);
  assert.match(markdown, /legacy provenance/);
  await page.waitForFunction(async () => {
    const db = await new Promise(resolve => { const r = indexedDB.open("minerva-atlas", 1); r.onsuccess = () => resolve(r.result); });
    const saved = await new Promise(resolve => { const r = db.transaction("saves").objectStore("saves").get("root-atlas"); r.onsuccess = () => resolve(r.result); });
    db.close();
    return saved?.thoughts.every(card => !("decision" in card) && !("evidence" in card));
  });
  assert.deepEqual(errors, []);
  console.log("Card metadata browser check passed: legacy restore, inspection, index, download, provenance, and clean save.");
} finally { await browser.close(); }
