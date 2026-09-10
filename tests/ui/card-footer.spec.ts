import { test, expect } from "@playwright/test";

test("card footer keeps primary actions compact and secondary actions in a tooltip-free overflow", async ({ page }, testInfo) => {
  await page.goto("/");
  await page.getByRole("button", { name: /^(Open )?A shopfront for six weeks$/ }).click();
  const pane = page.getByRole("dialog");
  const actions = pane.locator(".card-pane-actions");
  await expect(actions.getByRole("button")).toHaveText(["Explore", "Develop", ""]);
  await expect(pane.getByRole("tab", { name: "History" })).toBeVisible();
  const more = actions.getByRole("button", { name: "More card actions" });
  await more.click();
  const menu = pane.getByRole("group", { name: "Card actions" });
  await expect(menu.getByRole("button")).toHaveText(["Edit", "Download Markdown"]);
  const bounds = await menu.boundingBox(), trigger = await more.boundingBox();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(page.viewportSize()!.width);
  expect(Math.abs(bounds!.x + bounds!.width - trigger!.x - trigger!.width)).toBeLessThan(2);
  expect(trigger!.y - bounds!.y - bounds!.height).toBeCloseTo(8, 0);
  for (const item of await menu.getByRole("button").all()) {
    await expect(item).toHaveCSS("justify-content", "flex-start");
    expect((await item.boundingBox())!.height).toBeGreaterThanOrEqual(testInfo.project.name === "touch" ? 44 : 36);
  }
  const download = menu.getByRole("button", { name: "Download Markdown" });
  await download.hover();
  await download.focus();
  await expect(page.getByRole("tooltip")).toHaveCount(0);
  const downloaded = page.waitForEvent("download");
  await download.click();
  expect((await downloaded).suggestedFilename()).toBe("a-shopfront-for-six-weeks.md");
  await more.press("Escape");
  await expect(menu).toHaveCount(0);
  await expect(more).toBeFocused();
  await more.click();
  await menu.getByRole("button", { name: "Edit", exact: true }).click();
  await pane.getByRole("textbox", { name: "Title", exact: true }).fill("Edited shopfront");
  await pane.getByRole("button", { name: "Save changes" }).click();
  await expect(pane.getByRole("heading", { name: "Edited shopfront" })).toBeVisible();
  await pane.getByRole("tab", { name: "History" }).click();
  await expect(pane.getByText("How this idea changed")).toBeVisible();
  await more.click();
  await page.screenshot({ path: testInfo.outputPath("card-footer.png") });
});
