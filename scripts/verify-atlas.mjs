import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
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
  assert.equal(await page.locator(".zoom-controls").isVisible(), false);
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
  await button("Clear selection").click();

  // Wander and Weave: injected failure on the source card, retry, lineage and reload reset.
  // MINERVA_LIVE=1 calls Talk and moves once each; MINERVA_LIVE_EXISTING=1 also opts into Wander/Weave.
  const live = process.env.MINERVA_LIVE === "1";
  const evidence = { mode: live ? "live Gateway" : "mocked responses", url: base, model: "anthropic/claude-sonnet-5" };
  const card = (title) => ({ title, summary: `${title} summary`, body: `${title} concrete draft.` });
  const mocked = {
    wander: { cards: [card("Repair apprenticeships"), card("Borrow a workshop")] },
    weave: { card: card("Cook and mend evenings"), contributions: ["Food brings people together.", "Tools enable shared repairs.", "Independent shops provide flexible storefronts."] },
  };
  async function assertGenerationVisible() {
    await settle();
    assert.ok(parseInt(await page.getByLabel("Zoom level").textContent(), 10) >= 73, "generation stays above overview zoom");
    assert.ok(await page.locator(".thought.chosen .select-card").first().isVisible(), "new card Select control is visible");
  }
  async function selectFromIndex(title) {
    await inspectFromIndex(title);
    await button("Select for comparison").click();
    await close();
  }
  let total = 6;
  for (const feature of ["wander", "weave"]) {
    if (feature === "wander") await selectFromIndex("A shared tool library");
    else {
      await button("Clear selection").click();
      await selectFromIndex("A food hall");
      await selectFromIndex("A shared tool library");
      assert.equal(await button("Weave").isEnabled(), true, "two parents remain supported");
      await selectFromIndex("Independent retail shops");
      assert.equal(await button("Weave").isEnabled(), true, "three parents can be woven");
    }
    const label = feature === "wander" ? "Wander" : "Weave";
    assert.equal(await button(feature === "wander" ? "Weave" : "Wander").isDisabled(), true);
    let attempts = 0;
    await page.route(`**/api/${feature}`, async (route) => {
      attempts++;
      evidence[`${feature}Input`] = route.request().postDataJSON();
      if (attempts === 1) await route.fulfill({ status: 500, json: { error: `${label} test failure` } });
      else if (live && process.env.MINERVA_LIVE_EXISTING === "1") await route.continue();
      else await route.fulfill({ json: mocked[feature] });
    });
    await button(label).click();
    const sourceId = feature === "wander" ? "tools" : "food";
    const sourceCard = page.locator(`[data-id="${sourceId}"] .thought`);
    await sourceCard.getByRole("alert").waitFor();
    assert.equal(await sourceCard.getByRole("alert").innerText(), `${label} test failure`);
    assert.equal(await page.locator(".thought").count(), total, "failure adds no cards");
    const responsePromise = page.waitForResponse((response) => response.url().endsWith(`/api/${feature}`) && response.status() === 200, { timeout: 90000 });
    await sourceCard.getByRole("button", { name: `Retry ${label}`, exact: true }).click();
    const response = await responsePromise;
    const output = await response.json();
    evidence[feature] = output;
    await writeFile(`${artifacts}/wander-weave.json`, JSON.stringify(evidence, null, 2));
    const cards = feature === "wander" ? output.cards : [output.card];
    assert.ok(feature === "wander" ? cards.length >= 2 && cards.length <= 3 : cards.length === 1);
    total += cards.length;
    await page.waitForFunction((count) => document.querySelectorAll(".thought").length === count, total);
    await settle();
    await assertGenerationVisible();
    assert.equal(attempts, 2, "only the explicit retry makes the next request");
    assert.equal(await page.locator(".react-flow__edge").count(), 7 + (feature === "wander" ? cards.length : evidence.wander.cards.length + 3));
    for (const result of cards) {
      assert.ok(result.title && result.summary && result.body);
      await inspectFromIndex(result.title);
      const inspection = page.getByRole("dialog");
      assert.equal(await inspection.locator(".body-copy").innerText(), result.body);
      const links = inspection.locator(".relationship-list li");
      assert.equal(await links.count(), feature === "wander" ? 1 : 3);
      assert.match(await links.first().innerText(), feature === "wander" ? /incoming \/ derivation/i : /incoming \/ recombination/i);
      if (feature === "weave") {
        assert.equal(evidence.weaveInput.length, 3);
        assert.equal(output.contributions.length, 3);
        for (const contribution of output.contributions) assert.ok((await links.allInnerTexts()).join(" ").includes(contribution));
      }
      await close();
    }
    await page.screenshot({ path: `${artifacts}/${feature}.png` });
    await page.unroute(`**/api/${feature}`);
  }
  // Typed conversation: failure, retry, streamed response, selected context and follow-up history.
  await button("Clear selection").click();
  await selectFromIndex("A shared tool library");
  let talkAttempts = 0;
  const talkInputs = [];
  await page.route("**/api/talk", async (route) => {
    talkAttempts++;
    talkInputs.push(route.request().postDataJSON());
    if (talkAttempts === 1) await route.fulfill({ status: 500, json: { error: "Talk test failure" } });
    else if (talkAttempts === 4) await route.fulfill({ contentType: "application/x-ndjson", body:
      JSON.stringify({ text: "Interrupted draft" }) + "\n" + JSON.stringify({ error: "Stream test failure" }) + "\n" });
    else if (live && talkAttempts === 2) await route.continue();
    else await route.continue({ url: mockStreamUrl });
  });
  await button("Talk to Minerva").click();
  await page.getByLabel("Message Minerva").fill("Suggest one concrete improvement to this selected idea in two sentences.");
  await button("Send").click();
  await page.getByRole("dialog").getByRole("alert").waitFor();
  assert.match(await page.getByRole("dialog").getByRole("alert").innerText(), /Talk test failure/);
  const talkResponse = page.waitForResponse((r) => r.url().endsWith("/api/talk") && r.status() === 200, { timeout: 90000 });
  await button("Retry").click();
  const replyResponse = await talkResponse;
  if (!live) {
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
  assert.equal(talkInputs[1].cards[0].title, "A shared tool library");
  for (const key of ["summary", "body", "relationships"]) assert.ok(talkInputs[1].cards[0][key].length);
  await close();
  await button("Clear selection").click();
  await selectFromIndex("A food hall");
  await button("Talk to Minerva").click();
  assert.ok((await page.locator(".talk-transcript").innerText()).includes(evidence.talk), "dismiss keeps conversation in memory");
  await page.getByLabel("Message Minerva").fill("How does that connect with this card?");
  await button("Send").click();
  await button("Replying…").waitFor({ state: "hidden" });
  assert.equal(talkInputs[2].messages.length, 3);
  assert.equal(talkInputs[2].messages[1].content, evidence.talk);
  assert.equal(talkInputs[2].cards[0].title, "A food hall");
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
  const mockMoves = { moves: [
    { title: "Share the quiet hours", question: "Who needs this space before lunch?", preview: "Open the hall to morning repair lessons." },
    { title: "Reverse the counter", question: "Could guests teach the cooks?", preview: "Residents host a rotating cooking class." },
    { title: "Borrow the kitchen", question: "Could equipment circulate?", preview: "Lend small kitchen tools from the food hall." },
  ] };
  await page.route("**/api/moves", async (route) => {
    moveAttempts++;
    evidence.movesInput = route.request().postDataJSON();
    if (moveAttempts === 1) await route.fulfill({ status: 500, json: { error: "Moves test failure" } });
    else if (live) await route.continue();
    else await route.fulfill({ json: mockMoves });
  });
  await inspectFromIndex("A food hall");
  await button("Consider a move").click();
  await page.getByRole("dialog").getByRole("alert").waitFor();
  assert.match(await page.getByRole("dialog").getByRole("alert").innerText(), /Moves test failure/);
  assert.ok(await button("Try Explore the quiet hours →").isVisible(), "prepared move remains usable");
  const movesResponse = page.waitForResponse((r) => r.url().endsWith("/api/moves") && r.status() === 200, { timeout: 90000 });
  await button("Retry").click();
  evidence.moves = await (await movesResponse).json();
  await page.locator(".move-choice").nth(2).waitFor();
  assert.equal(evidence.moves.moves.length, 3);
  assert.equal(moveAttempts, 2);
  const chosenMove = evidence.moves.moves[0];
  await page.screenshot({ path: `${artifacts}/moves.png` });
  let moveCardAttempts = 0;
  await page.route("**/api/wander", async (route) => {
    moveCardAttempts++;
    assert.deepEqual(route.request().postDataJSON().move, chosenMove);
    if (moveCardAttempts === 1) await route.fulfill({ status: 500, json: { error: "Move card test failure" } });
    else await route.fulfill({ json: { cards: [card("Morning repair table")] } });
  });
  await button(`Try ${chosenMove.title} →`).click();
  await page.getByRole("dialog").getByRole("alert").waitFor();
  await button("Retry card").click();
  total++;
  await page.waitForFunction((count) => document.querySelectorAll(".thought").length === count, total);
  await assertGenerationVisible();
  await inspectFromIndex("Morning repair table");
  assert.match(await page.locator(".relationship-list").innerText(), /incoming \/ derivation/i);
  assert.ok((await page.locator(".relationship-list").innerText()).includes(chosenMove.title));
  assert.equal(moveCardAttempts, 2);
  await close();
  await page.unroute("**/api/moves");
  await page.unroute("**/api/wander");
  await writeFile(`${artifacts}/talk-moves.json`, JSON.stringify(evidence, null, 2));

  await writeFile(`${artifacts}/wander-weave.json`, JSON.stringify(evidence, null, 2));
  await page.reload();
  await page.locator(".thought").first().waitFor();
  await settle();
  await fit();
  assert.equal(await page.locator(".thought").count(), 6, "reload resets generated cards");
  assert.equal(await page.locator(".react-flow__edge").count(), 7, "reload resets generated edges");
  await button("Talk to Minerva").click();
  assert.equal(await page.locator(".talk-transcript section").count(), 0, "reload clears conversation");
  await close();
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
  for (let i = 0; i < 6; i++) await cameraKey("+");
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
  await cameraKey("0", mobile);
  await mobile.waitForTimeout(350);
  await cameraKey("+", mobile);
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
  await mobile.route("**/api/moves", (route) => route.fulfill({ status: 500, json: { error: "Offline test" } }));
  await mobile.route("**/api/wander", (route) => route.fulfill({ json: { cards: [card("Quiet morning table")] } }));
  await mobile.getByRole("button", { name: "A food hall", exact: true }).tap();
  await mobile.getByRole("dialog").waitFor();
  assert.equal(await mobile.getByRole("dialog").count(), 1);
  await mobile
    .getByRole("button", { name: "Consider a move", exact: true })
    .tap();
  await mobile
    .getByRole("button", { name: "Try Explore the quiet hours →", exact: true })
    .tap();
  await mobile.waitForFunction(() => document.querySelectorAll(".thought").length === 7);
  await mobile.waitForTimeout(350);
  assert.ok(parseInt(await mobile.getByLabel("Zoom level").textContent(), 10) >= 73);
  assert.ok(await mobile.locator(".thought.chosen .select-card").isVisible());
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
  streamServer.close();
}
