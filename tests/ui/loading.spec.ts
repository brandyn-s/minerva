import { test, expect, type Page } from "@playwright/test";

async function selectFoodHall(page: Page) {
  await page.getByRole("button", { name: /^Thoughts / }).click();
  const row = page.locator(".catalogue-entry").filter({ has: page.getByText("A food hall", { exact: true }) });
  await row.getByRole("checkbox").check();
  await row.locator(".catalogue-disclosure").click();
  await row.getByRole("button", { name: "Show in atlas", exact: true }).click();
}

test("shared waiting graphics support motion preferences and narrow screens", async ({ page }, info) => {
  await page.goto("/dev/ui");
  const banner = page.getByRole("region", { name: "Loading graphics" }).getByRole("status").first();
  await expect(banner).toHaveCSS("background-color", "rgb(39, 63, 50)");
  await expect(banner).toHaveCSS("color", "rgb(241, 233, 214)");
  await expect(banner.locator(".ui-spinner")).toHaveCSS("animation-name", "none");
  await expect(page.getByRole("button", { name: "Working…" }).locator(".ui-spinner")).toHaveCSS("animation-name", "none");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(banner.locator(".ui-spinner")).toHaveCSS("animation-name", "ui-loading-spin");
  expect(await banner.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
  await banner.screenshot({ path: info.outputPath("loading-banner.png") });
});

test("Wander uses the shared graphic for suggestions and generation, clearing after errors", async ({ page }, info) => {
  await page.route("**/api/**", route => route.fulfill({ status: 503, json: { error: "Offline verification" } }));
  let finishMoves!: () => void, finishWander!: () => void;
  const moves = new Promise<void>(resolve => { finishMoves = resolve; });
  const wander = new Promise<void>(resolve => { finishWander = resolve; });
  await page.route("**/api/moves", async route => { await moves; await route.fulfill({ status: 503, json: { error: "Suggestions unavailable" } }); });
  await page.route("**/api/wander", async route => { await wander; await route.fulfill({ status: 503, json: { error: "Generation unavailable" } }); });
  await page.goto("/");
  await selectFoodHall(page);
  await page.locator(".selection-bar").getByRole("button", { name: "Wander", exact: true }).click();
  await expect(page.locator(".ui-loading-status").filter({ hasText: "Finding tailored next steps" })).toBeVisible();
  finishMoves();
  await expect(page.getByRole("alert").filter({ hasText: "Suggestions unavailable" })).toBeVisible();
  await expect(page.locator(".ui-loading-status").filter({ hasText: "Finding tailored next steps" })).toHaveCount(0);
  await page.getByRole("button", { name: "Explore freely", exact: true }).click();
  const banner = page.locator(".generation-progress-stack .ui-loading-status");
  await expect(banner).toContainText("Wander is generating new cards");
  await expect(banner.locator(".ui-spinner")).toBeVisible();
  await expect(page.locator(".wander-content")).toHaveCount(0);
  await expect(banner).toBeVisible();
  await page.screenshot({ path: info.outputPath("wander-background.png") });
  finishWander();
  await expect(banner).toHaveCount(0);
});

test("Develop clears its waiting graphic when stopped", async ({ page }) => {
  await page.route("**/api/**", route => route.fulfill({ status: 503, json: { error: "Offline verification" } }));
  let finish!: () => void;
  const pending = new Promise<void>(resolve => { finish = resolve; });
  await page.route("**/api/develop", async route => { await pending; await route.fulfill({ status: 503, json: { error: "Offline verification" } }).catch(() => {}); });
  await page.goto("/"); await selectFoodHall(page);
  await page.getByRole("button", { name: "Open card", exact: true }).click();
  await page.getByRole("button", { name: "Develop", exact: true }).last().click();
  await page.getByLabel("Intent", { exact: true }).fill("Make it easier to test");
  await page.getByRole("button", { name: "Start development", exact: true }).click();
  await expect(page.locator(".develop-panel .ui-loading-status")).toContainText("Developing step 1 of 1");
  await page.getByRole("button", { name: "Stop", exact: true }).click();
  await expect(page.locator(".develop-panel .ui-loading-status")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Start development", exact: true })).toBeEnabled();
  finish();
});

test("Talk keeps a waiting banner until the reply has completed", async ({ page }, info) => {
  await page.route("**/api/**", route => route.fulfill({ status: 503, json: { error: "Offline verification" } }));
  let finish!: () => void;
  const pending = new Promise<void>(resolve => { finish = resolve; });
  await page.route("**/api/talk", async route => { await pending; await route.fulfill({ contentType: "application/x-ndjson", body: JSON.stringify({ text: "A completed test reply." }) + "\n" + JSON.stringify({ done: true }) + "\n" }); });
  await page.goto("/");
  await page.getByRole("button", { name: "Talk to Minerva", exact: true }).click();
  await page.getByRole("textbox", { name: "Message Minerva", exact: true }).fill("Consider a small trial");
  await page.getByRole("button", { name: "Send", exact: true }).click();
  const banner = page.locator(".talk-panel .ui-loading-status");
  await expect(banner).toContainText("Minerva is thinking");
  await expect(page.getByRole("button", { name: "Replying…", exact: true })).toHaveAttribute("aria-busy", "true");
  expect(await banner.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath("talk-waiting.png") });
  finish();
  await expect(banner).toHaveCount(0);
  await expect(page.getByText("A completed test reply.", { exact: true })).toBeVisible();
});

test("Constellation and Regroup share the same waiting feedback", async ({ page }, info) => {
  await page.route("**/api/**", route => route.fulfill({ status: 503, json: { error: "Offline verification" } }));
  let finish!: () => void;
  let pending = new Promise<void>(resolve => { finish = resolve; });
  await page.route("**/api/themes", async route => {
    const input = route.request().postDataJSON();
    await pending;
    await route.fulfill({ json: { groups: [{ name: "Shared resources", reason: "Shared infrastructure", memberIds: input.cards.map((c: { id: string }) => c.id) }] } });
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Constellation", exact: true }).click();
  await page.getByRole("button", { name: "Find themes", exact: true }).click();
  const grouping = page.getByRole("region", { name: "Theme grouping" });
  await expect(grouping.locator(".ui-loading-status")).toContainText("Finding themes");
  await page.screenshot({ path: info.outputPath("constellation-waiting.png") });
  finish();
  await expect(grouping.locator(".ui-loading-status")).toHaveCount(0);
  await expect(grouping.getByRole("alert")).toHaveCount(0);
  await page.getByRole("button", { name: "Regroup", exact: true }).click();
  pending = new Promise<void>(resolve => { finish = resolve; });
  await page.getByRole("button", { name: "Preview themes", exact: true }).click();
  await expect(page.locator(".regroup-panel .ui-loading-status")).toContainText("Finding themes for 6 ideas");
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  finish();
  await expect(page.locator(".regroup-panel")).toHaveCount(0);
});

test("Weave retains the graphic when its panel is closed and clears it on failure", async ({ page }, info) => {
  await page.route("**/api/**", route => route.fulfill({ status: 503, json: { error: "Offline verification" } }));
  let finish!: () => void;
  const pending = new Promise<void>(resolve => { finish = resolve; });
  await page.route("**/api/weave", async route => { await pending; await route.fulfill({ status: 503, json: { error: "Weave unavailable" } }); });
  await page.goto("/"); await selectFoodHall(page);
  await page.getByRole("button", { name: /^Thoughts / }).click();
  await page.locator(".catalogue-entry").filter({ has: page.getByText("A shared tool library", { exact: true }) }).getByRole("checkbox").check();
  await page.getByRole("button", { name: "Close panel", exact: true }).click();
  await page.locator(".selection-bar").getByRole("button", { name: "Weave", exact: true }).click();
  const panel = page.getByRole("dialog", { name: "Prepare Weave", exact: true });
  await page.getByLabel("Carry forward · A food hall", { exact: true }).fill("Shared meals");
  await page.getByLabel("Carry forward · A shared tool library", { exact: true }).fill("Shared tools");
  await panel.getByRole("button", { name: "Weave contributions", exact: true }).click();
  await expect(panel.locator(".ui-loading-status")).toBeVisible();
  await panel.getByRole("button", { name: "Close panel", exact: true }).click();
  const banner = page.locator(".generation-progress-stack .ui-loading-status");
  await expect(banner).toContainText("Weave is combining your cards");
  await expect.poll(async () => {
    const graphic = (await banner.boundingBox())!, dock = (await page.locator(".selection-bar").boundingBox())!;
    return dock.y + dock.height <= graphic.y - 8;
  }).toBe(true);
  const graphic = (await banner.boundingBox())!, talk = (await page.getByRole("button", { name: "Talk to Minerva", exact: true }).boundingBox())!;
  expect(graphic.x + graphic.width).toBeLessThanOrEqual(talk.x);
  await page.screenshot({ path: info.outputPath("weave-background.png") });
  await banner.getByRole("button", { name: "View Weave" }).click();
  await expect(panel).toBeVisible();
  finish();
  await expect(panel.locator(".ui-loading-status")).toHaveCount(0);
  await expect(panel.getByRole("alert")).toContainText("Weave unavailable");
});
