import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("gallery: control behavior, accessible states and visual contracts", async ({ page }, testInfo) => {
  await page.goto("/dev/ui");
  await expect(page.getByRole("heading", {name:"Minerva UI reference"})).toBeVisible();
  const primary = page.getByRole("button", {name:"Primary action", exact:true});
  const secondary = page.getByRole("button", {name:"Secondary action", exact:true});
  const touch = testInfo.project.name === "touch";
  for (const control of [primary, secondary]) {
    await expect(control).toHaveCSS("font-size", "16px");
    await expect(control).toHaveCSS("border-radius", "5px");
    expect((await control.boundingBox())!.height).toBeGreaterThanOrEqual(touch ? 44 : 36);
  }
  await expect(page.getByRole("button", {name:"Working…"})).toBeDisabled();
  await expect(page.getByRole("button", {name:"Working…"})).toHaveAttribute("aria-busy", "true");
  const toggle = page.getByRole("button", {name:"Toggle selection"});
  await toggle.click(); await expect(toggle).toHaveAttribute("aria-pressed", "true");
  const focus = page.getByRole("button", {name:"Focus", exact:true});
  await focus.focus(); await expect(page.getByRole("tooltip")).toHaveText("Focus");
  await focus.press("Escape"); await expect(page.getByRole("tooltip")).toHaveCount(0);
  await page.getByLabel("Title", {exact:true}).fill("Test idea");
  await page.getByRole("button", {name:"Cancel", exact:true}).click();
  await expect(page.getByRole("status")).toHaveText("Cancel did not submit");
  await page.getByRole("button", {name:"Submit", exact:true}).click();
  await expect(page.getByRole("status")).toHaveText("Form submitted");
  await page.getByRole("radio", {name:"2", exact:true}).focus();
  await page.keyboard.press("ArrowRight"); await expect(page.getByRole("radio", {name:"3", exact:true})).toBeChecked();
  await page.getByText("Details", {exact:true}).press("Enter");
  await expect(page.getByText("Native keyboard disclosure", {exact:false})).toBeVisible();
  const accessibility = await new AxeBuilder({page}).include(".ui-gallery").analyze();
  expect(accessibility.violations).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  // Portable visual regression baseline: computed styles avoid OS font-rasterization noise.
  const visual = await page.locator(".ui-gallery .ui-button, .ui-gallery .ui-input, .ui-gallery .ui-summary").evaluateAll(elements => elements.map(el => {
    const css = getComputedStyle(el);
    return {tag:el.tagName,variant:el.getAttribute("data-variant"),label:el.getAttribute("aria-label"),
      font:css.font,fontSize:css.fontSize,color:css.color,background:css.backgroundColor,
      border:css.border,borderRadius:css.borderRadius,padding:css.padding,minHeight:css.minHeight,
      display:css.display,disabled:el.hasAttribute("disabled")};
  }));
  expect(JSON.stringify(visual, null, 2)).toMatchSnapshot("gallery-visual-contract.json");
  await page.screenshot({path:testInfo.outputPath("gallery.png"),fullPage:true});
});

test("atlas: shared controls survive panel navigation without provider calls", async ({page}, testInfo) => {
  const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  // No paid/model requests in normalization verification.
  await page.route("**/api/**", route => route.fulfill({status:503,contentType:"application/json",body:JSON.stringify({error:"Offline UI verification"})}));
  await page.goto("/");
  const headerStyle = async (locator: ReturnType<typeof page.getByRole>) => locator.evaluate(el => {
    const style = getComputedStyle(el);
    return [style.font, style.padding, style.border, style.borderRadius, style.boxShadow, style.backgroundColor, style.color];
  });
  const guide = page.getByRole("button", {name:"Guide",exact:true});
  const menu = page.locator(".atlas-menu > summary");
  const inactive = await headerStyle(page.getByRole("button", {name:"Evolution",exact:true}));
  const active = await headerStyle(page.getByRole("button", {name:"Lineage",exact:true}));
  await expect(guide).toHaveAttribute("aria-expanded", "false");
  expect(await headerStyle(guide)).toEqual(inactive);
  expect(await headerStyle(menu)).toEqual(inactive);
  await guide.click();
  expect(await headerStyle(guide)).toEqual(active);
  await guide.click();
  await expect(guide).toHaveAttribute("aria-expanded", "false");
  await menu.click();
  expect(await headerStyle(menu)).toEqual(active);
  await menu.press("Escape");
  await expect(page.locator(".atlas-menu")).not.toHaveAttribute("open");

  await page.getByRole("button",{name:"Thoughts 6",exact:true}).click();
  const browse = page.getByRole("dialog",{name:"Thought index"});
  await browse.getByRole("searchbox").fill("food");
  await expect(browse.getByRole("checkbox")).toHaveCount(1);
  await browse.getByRole("checkbox").check();
  await browse.getByRole("button",{name:/A food hall proposal/i}).click();
  await expect(browse.getByRole("button",{name:"Show in atlas"})).toBeVisible();
  await page.screenshot({path:testInfo.outputPath("browse.png")});
  await browse.getByRole("button",{name:"Close panel",exact:true}).click();
  await page.getByRole("button",{name:"Expedition panel",exact:true}).click();
  const expedition=page.getByRole("dialog",{name:"Expedition",exact:true});
  await expect(expedition.getByText("Starting material: A food hall. Independent roots see only the brief.")).toBeVisible();
  await expedition.getByLabel("Exploration goal",{exact:true}).fill("Explore shared kitchens");
  await expedition.getByLabel("Maximum calls, including assessments",{exact:true}).fill("12");
  await expect(expedition.getByLabel("Execution",{exact:true})).toHaveValue("fixture");
  // Offline configuration must prevent starting work; connected runs have a separate replay.
  await expect(expedition.getByRole("button",{name:"Start expedition"})).toBeDisabled();
  await page.screenshot({path:testInfo.outputPath("expedition.png")});
  await expedition.getByRole("button",{name:"Close panel",exact:true}).click();
  await page.getByRole("button",{name:"Read as text",exact:true}).click();
  const reader=page.getByRole("dialog",{name:"Prepared study as text"});
  await reader.getByRole("navigation",{name:"Ideas",exact:true}).getByRole("button",{name:"A food hall",exact:true}).click();
  await expect(reader.getByRole("heading",{name:"A food hall",exact:true})).toBeVisible();
  await expect(reader.locator(".reader-contents button").first()).toHaveCSS("display", "block");
  await expect(reader.locator(".reader-contents button[aria-current]")).toHaveCSS("border-left-color", "rgb(65, 121, 117)");
  await page.screenshot({path:testInfo.outputPath("reader.png")});
  expect(await reader.evaluate(el=>el.scrollWidth<=el.clientWidth)).toBe(true);
  await reader.getByRole("button",{name:"Close panel",exact:true}).click();
  await page.getByLabel("Layout",{exact:true}).click();
  await page.getByRole("button",{name:"Arrange grid",exact:true}).click();
  await page.getByRole("button",{name:"Undo",exact:true}).click();
  await expect(page.getByRole("button",{name:"Redo",exact:true})).toBeEnabled();
  await page.getByRole("button",{name:"Close panel",exact:true}).click();
  await page.getByRole("button",{name:"Talk to Minerva",exact:true}).click();
  await expect(page.getByRole("textbox",{name:"Message Minerva",exact:true})).toBeVisible();
  await expect(page.getByRole("textbox",{name:"Message Minerva",exact:true})).toHaveCSS("border-top-width", "0px");
  await expect(page.getByRole("button",{name:"Hold to talk",exact:true})).toHaveCSS("border-radius", "50%");
  await page.screenshot({path:testInfo.outputPath("talk.png")});
  expect(errors).toEqual([]);
});
