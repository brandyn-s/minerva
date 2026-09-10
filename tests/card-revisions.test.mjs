import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import ts from "typescript";
function load(path) {
  const code = ts.transpileModule(
    readFileSync(new URL(path, import.meta.url), "utf8"),
    { compilerOptions: { module: ts.ModuleKind.CommonJS } },
  ).outputText;
  const exports = {};
  new Function("exports", code)(exports);
  return exports;
}
const { mallFixture } = load("../features/atlas/fixture.ts");
const { cardEdit, reviseCard, cardConnections } = load(
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
