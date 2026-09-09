import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
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
  execFileSync("/usr/bin/say", ["-o", "/tmp/minerva-voice-input.aiff", voiceInput]);
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
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
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
try {
  if (process.env.MINERVA_VOICE_ONLY !== "1") {
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
  // MINERVA_LIVE=1 opts into two expedition steps and one reading; voice requires VOICE_ONLY too.
  const live = process.env.MINERVA_LIVE_TALK_MOVES === "1";
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
      else await route.fulfill({ json: mocked[feature] });
    });
    await button(label).click();
    const progress = page.locator(".generation-progress");
    await progress.waitFor();
    assert.match(await progress.innerText(), feature === "wander" ? /Wander is generating new cards/ : /Weave is combining your cards/);
    assert.equal(await button(feature === "wander" ? "Wandering…" : "Weaving…").isDisabled(), true);
    const actionSpinner = button(feature === "wander" ? "Wandering…" : "Weaving…").locator(".generation-spinner");
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
    await button("Clear selection").click();
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
    release();
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
    assert.equal(await progress.count(), 0, "progress clears on success");
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
  await inspectFromIndex("A food hall");
  await button("Consider a move").click();
  await page.getByRole("dialog").getByRole("alert").waitFor();
  assert.match(await page.getByRole("dialog").getByRole("alert").innerText(), /Moves test failure/);
  assert.ok(await button("Try Explore the quiet hours →").isVisible(), "prepared move remains usable");
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
  assert.ok((await page.getByRole("region", { name: "Inheritance", exact: true }).innerText()).includes(chosenMove.title));
  assert.ok((await page.getByRole("region", { name: "Provenance", exact: true }).innerText()).includes("feature:wander"));
  await page.evaluate(() => { window.failDownload = true; });
  await button("Download").click();
  await page.getByRole("dialog").getByRole("alert").waitFor();
  const downloadedCard = page.waitForEvent("download");
  await button("Retry").click();
  assert.equal((await downloadedCard).suggestedFilename(), "morning-repair-table.md");
  const cardMarkdown = await page.evaluate(() => window.downloads[0]);
  for (const value of ["# Morning repair table", "## Summary", "Morning repair table summary", "## Body",
    "Morning repair table concrete draft.", "## Decision", "unkept draft", "## Evidence", "unknown",
    "## Inheritance", "## Provenance", "feature:wander", "## Relationships", "incoming / derivation", chosenMove.title, "Contribution:"]) assert.ok(cardMarkdown.includes(value), value);
  await close();
  await page.getByRole("button", { name: /^Thoughts / }).click();
  await page.getByPlaceholder("Search titles").fill("Morning repair table");
  const downloadedAtlas = page.waitForEvent("download");
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
  const beforeIds = await cardIds(), beforeChosen = await chosenIds();
  assert.ok(beforeChosen.length);
  const requests = [];
  const track = request => requests.push(request.url());
  page.on("request", track);
  await button("Compare").click();
  const comparison = await page.locator(".comparison-grid").innerText();
  const cameras = new Map();
  const lineagePositions = await page.locator(".react-flow__node:has(.thought)").evaluateAll(elements => elements.map(e => e.style.transform));
  for (const view of ["Evolution", "Lineage", "Constellation", "Evolution", "Constellation", "Lineage"]) {
    const start = requests.length;
    await button(view).click(); await settle();
    if (view === "Constellation") await page.getByText(/Grouped into themes by Minerva · grouped at/).waitFor({ timeout: 90000 });
    await settle();
    assert.equal(await page.locator(".comparison-grid").innerText(), comparison);
    if (cameras.has(view)) assert.equal(await transform(), cameras.get(view), `${view} remembers its camera`);
    cameras.set(view, await transform());
    if (view === "Lineage") assert.deepEqual(await page.locator(".react-flow__node:has(.thought)").evaluateAll(elements => elements.map(e => e.style.transform)), lineagePositions);
    if (view === "Constellation") {
      const headingsInFrame = await page.locator(".theme-heading").evaluateAll(elements => elements.length > 0 && elements.every(e => {
        const r = e.getBoundingClientRect(), field = document.querySelector(".react-flow").getBoundingClientRect();
        return r.left >= field.left && r.right <= field.right && r.top >= field.top && r.bottom <= field.bottom &&
          r.left >= 0 && r.top >= 0 && r.right <= innerWidth && r.bottom <= innerHeight;
      }));
      assert.ok(headingsInFrame, "every theme heading must be in the viewport on first Constellation entry, without pressing Fit");
    }
    assert.deepEqual(await cardIds(), beforeIds);
    assert.deepEqual(await chosenIds(), beforeChosen);
    if (view !== "Constellation") assert.deepEqual(requests.slice(start), [], `${view} must not request the network`);
  }
  assert.equal(themeRequests, 1);
  await close();
  await button("Constellation").click(); await settle();
  const previousGrouping = await page.locator(".theme-heading").allTextContents();
  failThemes = true;
  await button("Regroup").click();
  await page.getByRole("region", { name: "Theme grouping" }).getByRole("alert").waitFor();
  assert.deepEqual(await page.locator(".theme-heading").allTextContents(), previousGrouping);
  assert.ok(await page.getByRole("region", { name: "Theme grouping" }).getByRole("button", { name: "Retry", exact: true }).isVisible());
  failThemes = false;
  await page.getByRole("region", { name: "Theme grouping" }).getByRole("button", { name: "Retry", exact: true }).click(); await settle();
  assert.equal(themeRequests, 3);
  assert.equal(await page.locator(".react-flow__edge").count(), 1, "only the cross-group association remains");
  assert.equal(await page.locator(".react-flow__edge.derivation,.react-flow__edge.recombination").count(), 0);
  await button("Lineage").click();
  await inspectFromIndex("Morning repair table");
  await page.getByText("Edit prepared text", { exact: true }).click();
  await page.getByRole("dialog").locator("details textarea").fill("Edited theme content");
  await close();
  await button("Constellation").click(); await settle();
  assert.equal(themeRequests, 4);
  assert.equal(themeInputs[3].cards.length, 1, "only edited cards are submitted");
  assert.ok(themeInputs[3].existingGroups.length);
  page.off("request", track);
  await page.screenshot({ path: `${artifacts}/constellation.png` });
  await writeFile(`${artifacts}/perspectives.json`, JSON.stringify({ themeRequests, themeInputs, beforeIds, beforeChosen }, null, 2));
  await page.unroute("**/api/themes");
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

  // C12/C11: in-memory expedition lifecycle and navigable interpretations.
  const expeditionEvidence = [];
  const frozenGoal = "  Find a testable evening repair service for the mall.  ";
  const expPanel = page.getByRole("dialog", { name: "Expedition", exact: true });
  const readingFixture = {
    groups: [{ mechanism: "Shared repair sessions", steps: [1, 2] }],
    changes: [{ step: 2, why: "The second step adds a timed booking mechanism." }],
    observations: [{ kind: "observation", text: "Both cards describe staffed sessions.", steps: [1, 2] }],
    hypotheses: [{ kind: "hypothesis", text: "Bookings may reduce idle staff time.", steps: [2] }],
    experiments: [{ text: "Invite six residents to a one-hour repair table.", steps: [1] }, { text: "Offer two booking windows and measure attendance.", steps: [2] }],
    coverage: { text: "No pricing, accessibility or weekend schedule was tried.", steps: [1, 2] },
  };
  for (const condition of ["budget", "claim", "stagnation", "stop", ...(process.env.MINERVA_LIVE === "1" ? ["live"] : [])]) {
    await page.reload(); await page.locator(".thought").first().waitFor();
    await selectFromIndex("A shared tool library");
    const calls = [], outputs = [];
    let releaseStop;
    const held = new Promise(resolve => { releaseStop = resolve; });
    await page.route("**/api/expedition", async route => {
      const input = route.request().postDataJSON(); calls.push(input);
      if (condition === "stop" && input.step === 2) await held;
      if (condition === "live") {
        const response = await route.fetch({ timeout: 90000 });
        const output = await response.json();
        outputs.push(output);
        await writeFile(`${artifacts}/expedition-live.json`, JSON.stringify({ calls, outputs }, null, 2));
        assert.equal(response.status(), 200, JSON.stringify(output));
        return route.fulfill({ response, json: output });
      }
      const title = condition === "stagnation" ? ["", "Evening repair table", "Evening repair table!", "Evening repair table."][input.step] : `Expedition ${condition} card ${input.step}`;
      const output = { card: { ...card(title), summary: condition === "stagnation" ? "A staffed repair table in the mall." : `${title} summary` },
        rationale: `Rationale for step ${input.step}`, reached: condition === "claim", reason: condition === "claim" ? "This draft describes the requested service." : "Further exploration remains." };
      outputs.push(output);
      await route.fulfill({ json: output }).catch(() => {});
    });
    await button("Expedition").click();
    const goal = condition === "live" ? "Develop two distinct, connected drafts toward a testable evening repair service, first defining a session format and then a booking experiment." : frozenGoal;
    await page.getByLabel("Goal in one sentence").fill(goal);
    await page.getByLabel("Step budget", { exact: true }).selectOption(condition === "stagnation" ? "5" : "2");
    await button("Start expedition").click();
    assert.equal(await page.getByLabel("Goal in one sentence").count(), 0, "goal cannot be edited after start");
    if (condition === "stop") {
      await page.waitForFunction(() => document.querySelector(".expedition-steps")?.children.length === 1);
      while (calls.length < 2) await page.waitForTimeout(25);
      await button("Close panel").click();
      await button("Clear selection").click();
      await button("Expedition panel").click();
      await button("Stop").click(); releaseStop(); await settle();
    }
    await page.locator(".expedition-stop").waitFor({ timeout: 180000 });
    const count = condition === "claim" || condition === "stop" ? 1 : condition === "stagnation" ? 3 : 2;
    assert.equal(calls.length, condition === "stop" ? 2 : count, "one request per step, no retries or extra steps");
    assert.equal(await page.locator(".expedition-steps > li").count(), count);
    assert.equal(await page.locator(".thought").count(), 6 + count, "all completed work remains on atlas");
    assert.equal(await page.locator(".react-flow__edge").count(), 7 + count, "each step has one derivation edge");
    assert.equal(await page.locator(".expedition-goal").textContent(), goal, "frozen goal is unchanged at the end");
    const stopReason = await page.locator(".expedition-stop").innerText();
    assert.match(stopReason, condition === "claim" ? /Model claims/ : condition === "stop" ? /Stopped by you/ : condition === "stagnation" ? /Stagnation/ : /Step budget reached|Model claims/);
    for (let i = 0; i < calls.length; i++) {
      assert.equal(calls[i].goal, goal);
      assert.equal(calls[i].step, i + 1);
      assert.equal(calls[i].cards.length, i);
      assert.equal(calls[i].frontier.title, i ? outputs[i - 1].card.title : "A shared tool library");
    }
    if (condition === "budget" || condition === "live") {
      let readingCalls = 0;
      await page.route("**/api/reading", async route => {
        readingCalls++;
        const input = route.request().postDataJSON();
        assert.equal(input.goal, goal);
        assert.deepEqual(input.cards.map(c => c.step), [1, 2]);
        if (condition === "live") {
          const response = await route.fetch({ timeout: 90000 });
          const output = await response.json();
          await writeFile(`${artifacts}/reading-live.json`, JSON.stringify({ input, output }, null, 2));
          assert.equal(response.status(), 200, JSON.stringify(output));
          return route.fulfill({ response, json: output });
        }
        return route.fulfill({ json: readingFixture });
      });
      await button("What this expedition suggests").click();
      const reading = page.getByRole("region", { name: "What this expedition suggests" });
      await reading.waitFor({ timeout: 90000 });
      assert.equal(readingCalls, 1);
      assert.ok(await reading.getByText("observation", { exact: true }).count());
      assert.ok(await reading.getByText("hypothesis", { exact: true }).count());
      const beforeChallenge = await page.locator(".thought").allTextContents();
      await reading.getByRole("button", { name: "Challenge group 1" }).click();
      await page.getByRole("region", { name: "User notes" }).getByText(/User note: I disagree/).waitFor();
      assert.equal(readingCalls, 1, "Challenge never calls the model");
      assert.deepEqual(await page.locator(".thought").allTextContents(), beforeChallenge);
      for (const link of await reading.locator(".expedition-links button").all()) {
        await link.click();
        const step = Number((await link.innerText()).match(/Step (\d+)/)[1]);
        assert.equal(await page.getByRole("region", { name: "Focused card connections" }).locator(".focus-heading strong").innerText(), outputs[step - 1].card.title, "every reading reference focuses its actual card");
        const id = calls[1].cards[0].id;
        if (step === 1) {
          const rect = await page.locator(`[data-id="${id}"]`).boundingBox();
          assert.ok(rect.x >= 0 && rect.y >= 0, "reading link focuses the actual card");
        }
      }
      await button("Close panel").click();
      await inspectFromIndex(outputs[0].card.title);
      await page.getByText("Edit prepared text", { exact: true }).click();
      await page.getByRole("dialog").locator("details textarea").fill("Edited expedition card after the reading.");
      await close(); await button("Expedition panel").click();
      await expPanel.getByText(/Stale reading/).waitFor();
      if (condition === "budget") {
        await button("Re-read").click();
        await page.getByText(/Stale reading/).waitFor({ state: "hidden" });
        assert.equal(readingCalls, 2);
        assert.ok(await page.getByRole("region", { name: "User notes" }).isVisible(), "re-reading preserves user notes");
      }
      await page.screenshot({ path: `${artifacts}/expedition-${condition}.png` });
      await page.unroute("**/api/reading");
    }
    expeditionEvidence.push({ condition, calls, outputs, stopReason });
    await page.unroute("**/api/expedition");
  }
  await writeFile(`${artifacts}/expedition-replay.json`, JSON.stringify(expeditionEvidence, null, 2));
  await page.reload(); await page.locator(".thought").first().waitFor(); await settle(); await fit();

  // IB04: short desktop overview preserves labels and connections; the index provides full-size navigation.
  await page.setViewportSize({ width: 1280, height: 600 });
  await fit();
  const targets = page.locator(".overview-target");
  assert.ok((await targets.count()) > 0);
  for (const target of await targets.all()) {
    const b = await target.boundingBox();
    assert.ok(b.width >= 10 && b.height >= 10, "overview dots have a visible surface; the index supplies full-size navigation targets");
  }
  await page.screenshot({ path: `${artifacts}/short-desktop.png` });
  const overviewCard = page.locator('[data-id="food"] .overview-target');
  assert.equal(
    await overviewCard.innerText(),
    "B\nFood hall",
    "overview shows an identifier and short label",
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
  await page.reload();
  await page.locator(".thought").first().waitFor();
  await inspectFromIndex("Repair, then stay for supper");
  const positionsBeforeFocus = await page.locator(".react-flow__node").evaluateAll(es => es.map(e => e.style.transform));
  await button("Focus on atlas ↗").click();
  await settle();
  assert.ok(parseInt(await page.getByLabel("Zoom level").textContent(), 10) >= 100, "focus keeps one card readable");
  const navigation = page.getByRole("region", { name: "Focused card connections" });
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
        for (const track of stream.getTracks()) {
          const stop = track.stop.bind(track);
          track.stop = () => { window.voiceStats.stoppedTracks++; stop(); };
        }
        return stream;
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
    let tokenCalls = 0;
    const events = [];
    if (!real) {
      await voicePage.route("**/api/voice", async (route) => {
        tokenCalls++;
        if (tokenCalls === 2) await new Promise((resolve) => setTimeout(resolve, 1200));
        return route.fulfill(tokenCalls === 1 ? { status: 503, json: { error: "Voice fixture failure" } } :
          { json: { token: "mock-token", url: "wss://voice.test/realtime-model", tools: [] } });
      });
      await voicePage.routeWebSocket("wss://voice.test/realtime-model", (socket) => {
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
    await voicePage.waitForTimeout(real ? 7000 : 600);
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
      assert.ok(config.instructions.includes("Selected IDs: []"));
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
    await voicePage.getByText("Hold to speak, release to send.", { exact: true }).waitFor({ timeout: 60000 });
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
      await vb("Hold to talk").focus();
      await voicePage.keyboard.down("Space");
      await voicePage.getByText("Listening… release to send.", { exact: true }).waitFor();
      await vb("Close panel").click();
      await voicePage.keyboard.up("Space");
      assert.equal(await voicePage.locator(".voice-control").count(), 0);
      await voicePage.reload();
      await vb("Talk to Minerva").click();
      assert.equal(await voicePage.locator(".talk-transcript section").count(), 0);
      assert.equal(await voicePage.evaluate(() => window.voiceStats.microphones), 0);
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
  await markdownPage.getByRole("button", { name: "Latest message ↓" }).waitFor();
  await markdownPage.screenshot({ path: `${artifacts}/talk-markdown.png` });
  await markdownPage.getByRole("button", { name: "Latest message ↓" }).click();
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
          "IB01–IB06, Markdown outputs and voice passed with mouse/keyboard and simulated CDP touch; not a screen-reader or physical microphone review",
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
