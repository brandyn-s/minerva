import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import ts from "typescript";
import { createRequire } from "node:module";
const requirePackage = createRequire(import.meta.url);
function load(path) {
  const url = new URL(path, import.meta.url);
  const code = ts.transpileModule(
    readFileSync(url, "utf8"),
    { compilerOptions: { module: ts.ModuleKind.CommonJS } },
  ).outputText;
  const exports = {};
  new Function("exports", "require", code)(exports, name => name.startsWith(".") ? load(new URL(`${name}.ts`, url)) : requirePackage(name));
  return exports;
}
const { mallFixture } = load("../features/atlas/fixture.ts");
const { cardEdit, reviseCard, revertCard, wordDiff, cardConnections } = load(
  "../features/atlas/card-revisions.ts",
);
test("saving and restoring preserve source revisions without retaining stale assessments", () => {
  const original = {
    ...mallFixture().thoughts[1],
    assessment: { goalFidelity: "Old assessment" },
    provenance: { feature: "Wander", tag: "test", sourceTitles: ["Brief"] },
  };
  const edit = {
    ...cardEdit(original),
    title: " Revised retail ",
    summary: "A smaller test",
    body: "New body",
    contribution: "New contribution",
  };
  const revised = reviseCard(original, edit);
  assert.equal(revised.revision, 2);
  assert.equal(revised.title, "Revised retail");
  assert.equal(revised.summary, edit.summary);
  assert.equal(revised.body, edit.body);
  assert.equal(revised.contribution, edit.contribution);
  assert.equal(revised.assessment, undefined);
  assert.deepEqual(revised.provenance, original.provenance);
  assert.equal(original.revision, 1);
  assert.equal(original.title, "Independent retail shops");
  const restored = reviseCard(revised, {
    ...cardEdit(original),
    revision: revised.revision,
  });
  assert.equal(restored.title, original.title);
  assert.equal(restored.revision, 3);
  assert.equal(restored.assessment, undefined);
  assert.throws(() => reviseCard(revised, edit), /changed while/);
  assert.throws(
    () => reviseCard(original, { ...cardEdit(original), title: "  " }),
    /title/,
  );
});
test("connections distinguish both parents, direct children, associations and shared context", () => {
  const { relationships } = mallFixture();
  const repair = cardConnections("repair", relationships);
  assert.deepEqual(
    repair.parents.map((e) => e.from),
    ["food", "tools"],
  );
  const retail = cardConnections("retail", relationships);
  assert.equal(retail.parents.length, 0);
  assert.ok(retail.context.some((e) => e.from === "brief"));
  assert.ok(retail.children.some((e) => e.to === "rotation"));
  const tools = cardConnections("tools", relationships);
  assert.ok(tools.related.some((e) => e.from === "rotation"));
  assert.ok(!tools.parents.some((e) => e.from === "rotation"));
});

test("history is append-only and revert creates a new revision", () => {
  const original = mallFixture().thoughts[1];
  const second = reviseCard(original, { ...cardEdit(original), title: "Small retail pilot", summary: "New summary" });
  const third = reviseCard(second, { ...cardEdit(second), body: "Test in winter" }, "branch step 1 of winter", { note: "Model claim", branch: { intent: "winter", step: 1, runId: "run" } });
  const fourth = revertCard(third, 1);
  assert.equal(fourth.revision, 4);
  assert.deepEqual(fourth.revisions.slice(0, 3), third.revisions);
  assert.equal(fourth.body, original.body);
  assert.equal(fourth.revisions[3].cause, "reverted to revision 1");
  assert.equal(fourth.revisions[2].note, "Model claim");
  assert.equal(original.revisions.length, 1);
});
test("word diffs preserve both texts including whitespace and repeated words", () => {
  for (const [before, after] of [["a small shop", "a warm shop"], ["a a b\n", "a b b\n"], ["", "new"], ["old", ""], ["same", "same"]]) {
    const diff = wordDiff(before, after);
    assert.equal(diff.filter(p => p.kind !== "added").map(p => p.text).join(""), before);
    assert.equal(diff.filter(p => p.kind !== "removed").map(p => p.text).join(""), after);
  }
  assert.deepEqual(wordDiff("small shop", "warm shop"), [{kind:"removed",text:"small"},{kind:"added",text:"warm"},{kind:"same",text:" shop"}]);
});

const { atlasSaveSchema, fixtureSave, mergeAtlas } = load("../features/atlas/local-state.ts");
test("v1/v2 migration retains current content and frozen edges; broken v3 history is rejected", () => {
  for (const version of [1, 2]) {
    const raw = fixtureSave(); raw.version = version; delete raw.intents;
    for (const card of raw.thoughts) { delete card.revisions; card.revision = 7; }
    if (version === 1) { delete raw.sizes; delete raw.layoutHistory; delete raw.folds; }
    const saved = atlasSaveSchema.parse(raw);
    assert.equal(saved.version, 3); assert.deepEqual(saved.intents, []);
    assert.deepEqual(saved.relationships, raw.relationships);
    for (const card of saved.thoughts) { assert.equal(card.revision, 1); assert.equal(card.revisions.length, 1); assert.equal(card.revisions[0].body, card.body); }
  }
  const bad = fixtureSave(); bad.thoughts[0].revisions = [];
  assert.equal(atlasSaveSchema.safeParse(bad).success, false);
});
test("Merge retains different histories even when current content matches", async () => {
  const current = fixtureSave(), incoming = fixtureSave();
  incoming.thoughts[0] = revertCard(reviseCard(incoming.thoughts[0], { ...cardEdit(incoming.thoughts[0]), body: "An earlier experiment" }), 1);
  incoming.intents = [{id:"intent",text:"Make this cheaper to pilot"}];
  const result = await mergeAtlas(current, incoming);
  assert.equal(result.added, 1); assert.equal(result.save.thoughts.length, 7);
  assert.equal(result.save.thoughts.find(c => c.revision === 3).revisions[1].body, "An earlier experiment");
  assert.equal(result.save.intents[0].text, incoming.intents[0].text);
  assert.equal((await mergeAtlas(result.save, incoming)).added, 0);
});
