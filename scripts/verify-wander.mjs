import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const artifacts = process.env.MINERVA_ARTIFACTS || "/tmp/minerva-wander-focused";
await mkdir(artifacts, { recursive: true });
const browser = await chromium.launch();
const moves = { moves: [
  { title: "Share the quiet hours", question: "Who could join?", preview: "Host a morning repair table." },
  { title: "Learn over supper", question: "What could neighbors teach?", preview: "Pair a repair lesson with a meal." },
  { title: "Borrow the table", question: "Could the service travel?", preview: "Take a repair table to neighbors." },
] };
try {
  for (const width of [1399, 390]) {
    const page = await browser.newPage({ viewport: { width, height: width === 390 ? 844 : 1124 }, hasTouch: width === 390 });
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    let suggestionsReady = false;
    await page.route("**/api/moves", async route => {
      if (suggestionsReady) return route.fulfill({ json: moves });
      await new Promise(resolve => setTimeout(resolve, 400));
      return route.fulfill({ status: 500, json: { error: "Suggestions temporarily unavailable." } });
    });
    let input;
    await page.route("**/api/wander", route => {
      input = route.request().postDataJSON();
      const titles = input.intent === "move" ? ["Morning repair table"] : ["Repair lessons", "Supper club"];
      return route.fulfill({ json: { cards: titles.map(title => ({ title, summary: `${title} proposal.`, body: `${title} is a speculative neighborhood service.` })) } });
    });
    await page.goto(process.env.MINERVA_URL || "http://127.0.0.1:3187");
    const button = name => page.getByRole("button", { name, exact: true });
    await page.locator(".thought").first().waitFor();
    await page.getByRole("button", { name: /^Thoughts / }).click();
    const row = page.locator(".catalogue-entry").filter({ has: page.getByText("Repair, then stay for supper", { exact: true }) });
    await row.getByRole("checkbox").check();
    await button("Close panel").click();
    const toolbar = page.locator(".selection-bar");
    const clear = toolbar.getByRole("button", { name: "Clear selection", exact: true });
    await toolbar.getByRole("button", { name: "Wander", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "Wander", exact: true });
    await dialog.getByRole("status").waitFor();
    await dialog.getByRole("alert").waitFor();
    assert.equal(await dialog.locator(".move-choice").count(), 1, "prepared move survives a suggestion failure");
    suggestionsReady = true;
    await dialog.getByRole("button", { name: "Retry", exact: true }).click();
    await dialog.locator(".move-choice").nth(2).waitFor();
    assert.equal(input, undefined, "opening Wander does not generate a card");
    assert.equal(await dialog.evaluate(el => el.scrollWidth <= el.clientWidth), true);
    const header = dialog.locator(".ui-panel-header");
    const before = await header.boundingBox();
    assert.ok(await dialog.getByRole("button", { name: "Close panel", exact: true }).evaluate(el => {
      const r = el.getBoundingClientRect();
      return el.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2));
    }), "close control is not covered by the mobile menu");
    await dialog.locator(".wander-content").evaluate(el => { el.scrollTop = el.scrollHeight; });
    assert.equal((await header.boundingBox()).y, before.y, "close header stays in place while suggestions scroll");
    await dialog.locator(".wander-content").evaluate(el => { el.scrollTop = 0; });
    await button("Hide suggestions").click();
    assert.equal(await dialog.locator(".move-choice").first().isVisible(), false);
    await button("Show suggestions").click();
    await page.screenshot({ path: `${artifacts}/suggestions-${width}.png` });
    await dialog.getByRole("button", { name: "Try Share the quiet hours", exact: true }).click();
    await page.waitForFunction(() => document.querySelectorAll(".thought").length === 7);
    assert.equal(input.id, "repair");
    assert.equal(input.intent, "move");
    assert.deepEqual(input.move, moves.moves[0]);
    await toolbar.getByRole("button", { name: "Wander", exact: true }).click();
    await dialog.getByRole("button", { name: "Explore freely", exact: true }).click();
    await page.waitForFunction(() => document.querySelectorAll(".thought").length === 9);
    assert.equal(input.intent, "wander");
    assert.equal(input.move, undefined);

    await clear.click();
    assert.equal(await toolbar.count(), 0);
    assert.equal(await page.locator(".thought.chosen").count(), 0);
    assert.deepEqual(errors, []);
    await page.close();
    console.log(`Wander flow passed at ${width}px: suggestions, free exploration, selection, close target, no page errors.`);
  }
} finally { await browser.close(); }
