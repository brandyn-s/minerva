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
test("mall fixture has unique references, positions, and acyclic inheritance", () => {
  const fixture = mallFixture();
  const ids = new Set(fixture.thoughts.map((t) => t.id));
  assert.equal(ids.size, 6);
  assert.equal(
    new Set(fixture.relationships.map((e) => e.id)).size,
    7,
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
});

const { applyRegroup } = load("../features/atlas/regroup-layout.ts");
test("regroup 22 of 120 ideas preserves 98 memberships and positions without overlap", () => {
  const nodes = Array.from({length:120}, (_,i) => ({id:String(i), position:{x:0,y:160+i*480}}));
  const current = [{name:"Original", reason:"Existing",memberIds:nodes.map(n=>n.id)}];
  const ids = nodes.slice(0,22).map(n=>n.id);
  const incoming = [{name:"Original",reason:"Same name",memberIds:ids.slice(0,9)}, {name:"Fresh",reason:"New theme",memberIds:ids.slice(9)}];
  const snapshot = structuredClone(current);
  const result = applyRegroup(current,incoming,ids,nodes);
  assert.deepEqual(current,snapshot,"must not mutate cache needed by Undo");
  for(const node of nodes.slice(22)) {
    assert.deepEqual(result.layout[node.id],node.position);
    assert.ok(result.groups[0].memberIds.includes(node.id));
  }
  assert.equal(new Set(result.groups.flatMap(g=>g.memberIds)).size,120);
  assert.equal(new Set(Object.values(result.layout).map(p=>`${p.x},${p.y}`)).size,120);
});

test("regroup all replaces old slots instead of accumulating hidden themes", () => {
  const nodes = Array.from({length:120}, (_,i) => ({id:String(i),position:{x:50000,y:i*480}}));
  const ids = nodes.map(n=>n.id);
  const previous = Array.from({length:12}, (_,i)=>({name:`Old ${i}`,reason:"Old",memberIds:ids.slice(i*10,(i+1)*10)}));
  const proposal = [{name:"Fresh",reason:"New",memberIds:ids}];
  const result = applyRegroup(previous,proposal,ids,nodes);
  assert.equal(result.groups.length,1);
  assert.equal(result.layout['0'].x,0);
  assert.equal(result.layout['0'].y,160);
  assert.deepEqual(previous[0].memberIds,ids.slice(0,10));
});

test("selected regroup reuses vacated theme slots without moving others", () => {
  const current = [{name:"A",reason:"A",memberIds:['a']},{name:"B",reason:"B",memberIds:['b']}];
  const nodes = [{id:'a',position:{x:0,y:160}},{id:'b',position:{x:760,y:900}}];
  const result = applyRegroup(current,[{name:"C",reason:"C",memberIds:['a']}],['a'],nodes);
  assert.equal(result.groups.length,2);
  assert.equal(result.groups[0].name,'C');
  assert.deepEqual(result.layout.b,nodes[1].position);
});
