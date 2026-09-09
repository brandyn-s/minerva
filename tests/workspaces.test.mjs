import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import ts from "typescript";

function load(path) {
  const code = ts.transpileModule(readFileSync(new URL(path, import.meta.url), "utf8"),
    { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const exports = {};
  new Function("exports", code)(exports);
  return exports;
}
const { parseCommand, applyWorkspaceCommand } = load("../features/workspaces/domain.ts");
const { permitsWorkspaceRequest } = load("../features/workspaces/request-policy.ts");
const create = { commandId: "b1fbc284-f533-40d3-a78d-97f2efb85a76", actor: "local-user",
  workspaceId: "b2fbc284-f533-40d3-a78d-97f2efb85a76", operation: "create-workspace",
  name: "Repair", brief: "A meal alongside repair", constraints: "Low-risk items" };

test("workspace writes create new revisions without modifying the prior snapshot", () => {
  const first = applyWorkspaceCommand(parseCommand(create));
  const revised = applyWorkspaceCommand(parseCommand({ ...create, operation: "revise-workspace",
    expectedRevision: 1, brief: "Staffed repair" }), first);
  assert.equal(first.brief, create.brief);
  assert.equal(revised.revision, 2);
  assert.equal(revised.id, first.id);
  assert.equal(revised.brief, "Staffed repair");
  assert.throws(() => applyWorkspaceCommand({ ...create, operation: "revise-workspace", expectedRevision: 1 }, revised), /changed/);
  assert.throws(() => applyWorkspaceCommand(create, first), /already exists/);
});
test("workspace command parsing rejects malformed identity, bounds and unexpected authority", () => {
  for (const invalid of [null, [], { ...create, actor: "admin" }, { ...create, workspaceId: "x" },
    { ...create, name: " " }, { ...create, brief: "x".repeat(20001) }, { ...create, extra: true },
    { ...create, operation: "revise-workspace", expectedRevision: 0 }])
    assert.throws(() => parseCommand(invalid));
});
test("request protection rejects foreign origins, DNS rebinding and same-site sibling origins", () => {
  const origins = ["http://127.0.0.1:3000", "https://minerva.example"];
  const request = (headers, method = "POST") => new Request("http://127.0.0.1:3000/internal/workspaces",
    { method, headers: { host: "127.0.0.1:3000", ...headers } });
  assert.equal(permitsWorkspaceRequest(request({ origin: origins[0], "sec-fetch-site": "same-origin" }), origins), true);
  assert.equal(permitsWorkspaceRequest(request({}, "GET"), origins), true);
  for (const headers of [{}, { origin: "null" }, { origin: "https://evil.example" },
    { origin: origins[0], host: "evil.example", "x-forwarded-host": "127.0.0.1:3000" },
    { origin: origins[1] }, { origin: origins[0], "sec-fetch-site": "same-site" },
    { origin: origins[0], "sec-fetch-site": "cross-site" }])
    assert.equal(permitsWorkspaceRequest(request(headers), origins), false);
  assert.equal(permitsWorkspaceRequest(request({ origin: "https://evil.example" }, "GET"), origins), false);
  assert.equal(permitsWorkspaceRequest(request({}, "GET"), []), false);
});
