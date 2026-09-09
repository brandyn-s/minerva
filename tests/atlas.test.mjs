import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import ts from "typescript";

// Load domain and fixture TypeScript without a second test runner or a build artifact.
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
const { relationshipsFor } = load("../features/atlas/domain.ts");

test("mall roots share context; recombination retains exactly both source revisions", () => {
  const { thoughts, relationships } = mallFixture();
  assert.equal(thoughts.length, 6);
  for (const id of ["retail", "food", "tools"]) {
    const incoming = relationshipsFor(id, relationships).filter(
      (e) => e.direction === "incoming",
    );
    assert.deepEqual(
      incoming.filter((e) => e.kind !== "association").map((e) => e.kind),
      ["context"],
    );
  }
  const parents = relationshipsFor("repair", relationships);
  assert.deepEqual(
    parents.map((e) => [e.otherId, e.kind, e.sourceRevision]),
    [
      ["food", "recombination", 1],
      ["tools", "recombination", 1],
    ],
  );
  assert.ok(parents.every((e) => e.contribution));
  assert.equal(
    thoughts.find((t) => t.id === "repair").decision,
    "unkept draft",
  );
  assert.equal(thoughts.find((t) => t.id === "repair").evidence, "unknown");
  assert.equal(thoughts.find((t) => t.id === "rotation").decision, "kept");
  assert.equal(thoughts.find((t) => t.id === "rotation").evidence, "unknown");
});
test("association is navigable from both ends without becoming parentage", () => {
  const { relationships } = mallFixture();
  const outgoing = relationshipsFor("rotation", relationships).find(
    (e) => e.kind === "association",
  );
  const incoming = relationshipsFor("tools", relationships).find(
    (e) => e.kind === "association",
  );
  assert.equal(outgoing.otherId, "tools");
  assert.equal(outgoing.direction, "outgoing");
  assert.equal(incoming.otherId, "rotation");
  assert.equal(incoming.direction, "incoming");
  assert.equal(incoming.id, outgoing.id);
});
test("both scenes have unique references, positions, and acyclic inheritance", () => {
  for (const dense of [false, true]) {
    const fixture = mallFixture(dense);
    const ids = new Set(fixture.thoughts.map((t) => t.id));
    assert.equal(ids.size, dense ? 30 : 6);
    assert.equal(
      new Set(fixture.relationships.map((e) => e.id)).size,
      dense ? 31 : 7,
    );
    for (const id of ids) assert.ok(fixture.positions[id]);
    for (const edge of fixture.relationships) {
      assert.ok(ids.has(edge.from));
      assert.ok(ids.has(edge.to));
    }
    const visit = (id, ancestors = new Set()) => {
      assert.ok(!ancestors.has(id), `cycle at ${id}`);
      const next = new Set([...ancestors, id]);
      fixture.relationships
        .filter(
          (e) =>
            e.from === id && ["derivation", "recombination"].includes(e.kind),
        )
        .forEach((e) => visit(e.to, next));
    };
    for (const id of ids) visit(id);
  }
});
