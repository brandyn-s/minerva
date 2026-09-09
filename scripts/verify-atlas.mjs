import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const browser = await chromium.launch({
  executablePath: process.env.MINERVA_CHROMIUM || undefined,
});
const artifacts = process.env.MINERVA_ARTIFACTS || "/tmp/minerva-evidence";
await mkdir(artifacts, { recursive: true });
const errors = [];
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on("pageerror", (e) => errors.push(e.message));
const base = process.env.MINERVA_URL || "http://127.0.0.1:3000";
const button = (name) => page.getByRole("button", { name, exact: true });
const transform = () =>
  page.locator(".react-flow__viewport").getAttribute("style");
const settle = () => page.waitForTimeout(350);
const fit = async () => {
  await button("Fit").click();
  await settle();
};
const close = async () => {
  await button("Close panel").click();
};
async function inspectFromIndex(title) {
  await page.getByRole("button", { name: /^Thoughts / }).click();
  const row = page
    .locator(".reference-list section")
    .filter({ has: page.getByRole("heading", { name: title, exact: true }) });
  await row.getByRole("button", { name: "Inspect", exact: true }).click();
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
      if (surface.classList.contains("compact-target")) {
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
try {
  await page.goto(base);
  await page.locator(".thought").first().waitFor();
  await settle();
  await fit();
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
  for (let i = 0; i < 15; i++) await button("Zoom out").click();
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
  await button("Fit").focus();
  await page.keyboard.press("Enter");
  await settle();
  await button("Zoom in").focus();
  const oldZoom = await transform();
  await page.keyboard.press("Space");
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
  await button("Fit").focus();
  await page.locator('[data-id="food"] .card-grip').focus();
  assert.equal(
    await topCard(),
    "food",
    "keyboard focus should surface a covered card",
  );
  await inspectFromIndex("Independent retail shops");
  await close();
  assert.equal(
    await topCard(),
    "retail",
    "index inspection should surface a covered card",
  );
  // Restore the original prepared positions before the existing source journeys.
  await page.reload();
  await page.locator(".thought").first().waitFor();
  await settle();
  await fit();

  // IB05: both parents, reverse descendants, semantic endpoints, decision vs evidence.
  await button("Repair, then stay for supper").click();
  await page.getByRole("dialog").waitFor();
  const dialog = page.getByRole("dialog");
  assert.match(await dialog.innerText(), /unkept draft/);
  assert.match(await dialog.innerText(), /Evidence: unknown/);
  assert.equal(await dialog.locator(".relationship-list li").count(), 2);
  await dialog
    .getByRole("button", { name: "A food hall ←", exact: true })
    .click();
  assert.match(await dialog.innerText(), /outgoing \/ recombination/i);
  await dialog
    .getByRole("button", {
      name: "Repair, then stay for supper →",
      exact: true,
    })
    .click();
  await dialog
    .getByRole("button", { name: "A shared tool library ←", exact: true })
    .click();
  await dialog
    .getByRole("button", { name: "A shopfront for six weeks ←", exact: true })
    .click();
  assert.match(await dialog.innerText(), /Evidence: unknown/);
  assert.match(await dialog.innerText(), /kept/);
  await dialog
    .getByRole("button", { name: "A shared tool library →", exact: true })
    .click();
  const textSelection = await dialog.locator(".body-copy").evaluate((e) => {
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
  await button("Weave · preview").click();
  assert.equal(await page.locator(".source-preview").count(), 2);
  await button("Preview a shared occasion →").click();
  assert.match(
    await page.locator(".prepared-result").innerText(),
    /independent operators/i,
  );
  await page.screenshot({ path: `${artifacts}/comparison-move.png` });
  await close();
  assert.equal(await transform(), selectedCamera);
  await button("Clear selection").click();
  await button("Read as text").click();
  assert.equal(await page.locator(".reference-list section").count(), 6);
  await close();

  // IB04: short desktop overview has real 44px targets, with working detail one activation away.
  await page.setViewportSize({ width: 1280, height: 600 });
  await fit();
  const targets = page.locator(".overview-target");
  assert.ok((await targets.count()) > 0);
  for (const target of await targets.all()) {
    const b = await target.boundingBox();
    assert.ok(b.width >= 44 && b.height >= 44);
  }
  await page.screenshot({ path: `${artifacts}/short-desktop.png` });
  const overviewCard = page.locator('[data-id="food"] .overview-target');
  assert.equal(
    await overviewCard.innerText(),
    "A food hall",
    "overview shows only the title",
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
  assert.notEqual(
    await transform(),
    beforeOverviewOpen,
    "double click focuses overview card",
  );
  assert.equal(
    await page.getByRole("dialog").count(),
    0,
    "double click does not leave inspection open",
  );
  await button("A food hall").focus();
  await page.keyboard.press("Enter");
  assert.equal(await page.getByRole("dialog").count(), 1);
  await close();

  await page.setViewportSize({ width: 1440, height: 900 });
  await button("Denser study").click();
  await settle();
  await fit();
  assert.equal(await page.locator(".thought-group").count(), 3);
  for (const group of await page.locator(".thought-group button").all())
    assert.ok(await group.isVisible());
  assert.equal(
    await page.locator(".react-flow__edge").count(),
    10,
    "seven original relationships plus three grouped derivation paths remain visible",
  );
  await page.locator(".thought-group button").last().click();
  assert.equal(await page.locator(".reference-list section").count(), 8);
  await close();
  for (let i = 0; i < 6; i++) await button("Zoom in").click();
  await settle();
  assert.equal(await page.locator(".thought-group").count(), 3,
    "zooming in keeps dense variations grouped");
  assert.equal(await page.locator(".react-flow__edge").count(), 10,
    "zooming in must not restore the dense web of variation edges");
  await fit();
  await inspectFromIndex("beginner session · tools");
  assert.match(
    await page.getByRole("dialog").innerText(),
    /incoming \/ derivation/i,
  );
  await close();
  await page.screenshot({ path: `${artifacts}/dense.png` });

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
  await mobile.getByRole("button", { name: "Fit", exact: true }).click();
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
  await mobile
    .getByRole("button", { name: "Select for comparison", exact: true })
    .tap();
  await mobile.getByRole("button", { name: "Close panel", exact: true }).tap();
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
  const tx = compactRect.x + 24,
    ty = compactRect.y + 24;
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
  const px = pinchRect.x + 24,
    py = pinchRect.y + 24;
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
  const row = mobile.locator(".reference-list section").filter({
    has: mobile.getByRole("heading", { name: "A food hall", exact: true }),
  });
  await row.getByRole("button", { name: "Focus ↗", exact: true }).click();
  await mobile.waitForTimeout(350);

  const mobileTransform = () =>
    mobile.locator(".react-flow__viewport").getAttribute("style");
  const titleBox = await mobile
    .locator('[data-id="food"] .card-title')
    .boundingBox();
  const actionBox = await mobile
    .locator('[data-id="food"] .card-actions button')
    .first()
    .boundingBox();
  const nodeBeforePinch = await mobile
    .locator('[data-id="food"]')
    .evaluate((e) => e.style.transform);
  const prePinch = await mobileTransform();
  const x = titleBox.x + 65;
  const y1 = titleBox.y + 10;
  const y2 = actionBox.y + 15;
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x, y: y1, id: 1 }],
  });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [
      { x, y: y1, id: 1 },
      { x: x + 30, y: y2, id: 2 },
    ],
  });
  for (let i = 1; i <= 5; i++)
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [
        { x: x - i * 4, y: y1 - i * 4, id: 1 },
        { x: x + 30 + i * 4, y: y2 + i * 4, id: 2 },
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
  await mobile.getByRole("button", { name: "Fit", exact: true }).focus();
  await mobile.keyboard.press("Enter");
  await mobile.waitForTimeout(350);
  await mobile.getByRole("button", { name: "Zoom in", exact: true }).focus();
  await mobile.keyboard.press("Space");
  await mobile.waitForTimeout(350);
  await mobile
    .getByRole("button", { name: /^Thoughts / })
    .evaluate((e) => e.click());
  await mobile
    .locator(".reference-list section")
    .filter({
      has: mobile.getByRole("heading", { name: "A food hall", exact: true }),
    })
    .getByRole("button", { name: "Focus ↗", exact: true })
    .click();
  await mobile.waitForTimeout(350);
  await mobile.getByRole("button", { name: "A food hall", exact: true }).tap();
  await mobile.getByRole("dialog").waitFor();
  assert.equal(await mobile.getByRole("dialog").count(), 1);
  await mobile
    .getByRole("button", { name: "Consider a move", exact: true })
    .tap();
  await mobile
    .getByRole("button", { name: "Explore the quiet hours →", exact: true })
    .tap();
  assert.ok(await mobile.locator(".prepared-result").isVisible());
  await mobile.screenshot({ path: `${artifacts}/narrow-move.png` });
  assert.deepEqual(errors, []);
  console.log(
    JSON.stringify(
      {
        browser: browser.version(),
        result:
          "IB01–IB06 passed with mouse/keyboard and simulated CDP touch; programmatic click is simulated assistive activation, not a screen-reader review",
        demo: "6 cards / 7 edges",
        dense: "30 cards / 31 edges",
        viewports: ["1440x900", "1280x600", "390x844"],
        artifacts,
      },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
}
