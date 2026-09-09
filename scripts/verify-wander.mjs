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
    await page.route("**/api/moves", route => route.fulfill({ json: moves }));
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
    const row = page.locator(".reference-list section").filter({ has: page.getByRole("heading", { name: "Repair, then stay for supper", exact: true }) });
    await row.getByRole("button", { name: "Select", exact: true }).click();
    await button("Close panel").click();
    await page.getByRole("region", { name: "Focused card connections" }).getByRole("button", { name: "Focus card", exact: true }).click();
    await button("Close focused connections").click();
    await page.waitForTimeout(400);
    const toolbar = page.locator(".selection-bar");
    const select = page.locator('[data-id="repair"] .card-top .select-card');
    assert.equal(await select.getAttribute("aria-pressed"), "true");
    assert.equal(await page.locator(".card-actions").count(), 0);
    const bar = await toolbar.boundingBox();
    const clear = toolbar.getByRole("button", { name: "Clear selection", exact: true });
    const target = await clear.boundingBox();
    assert.ok(bar.x >= 0 && bar.x + bar.width <= width);
    assert.ok(target.width >= 44 && target.height >= 44);
    assert.ok(Math.abs(target.y - bar.y) < 2 && Math.abs(target.x + target.width - bar.x - bar.width) < 2);
    await page.screenshot({ path: `${artifacts}/toolbar-${width}.png` });
    await toolbar.getByRole("button", { name: "Wander", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "Wander", exact: true });
    await dialog.locator(".move-choice").nth(2).waitFor();
    assert.equal(input, undefined, "opening Wander does not generate a card");
    await page.screenshot({ path: `${artifacts}/suggestions-${width}.png` });
    await dialog.getByRole("button", { name: "Try Share the quiet hours →", exact: true }).click();
    await page.waitForFunction(() => document.querySelectorAll(".thought").length === 7);
    assert.equal(input.id, "repair");
    assert.equal(input.intent, "move");
    assert.deepEqual(input.move, moves.moves[0]);
    await toolbar.getByRole("button", { name: "Wander", exact: true }).click();
    await dialog.getByRole("button", { name: "Explore freely", exact: true }).click();
    await page.waitForFunction(() => document.querySelectorAll(".thought").length === 9);
    assert.equal(input.intent, "wander");
    assert.equal(input.move, undefined);
    assert.equal(await toolbar.getByRole("button", { name: "Wander", exact: true }).isDisabled(), true);
    await clear.click();
    assert.equal(await toolbar.count(), 0);
    assert.equal(await page.locator(".thought.chosen").count(), 0);
    assert.deepEqual(errors, []);
    await page.close();
    console.log(`Wander flow passed at ${width}px: suggestions, free exploration, selection, close target, no page errors.`);
  }
} finally { await browser.close(); }
