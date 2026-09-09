// Seed-only invariants. These assert that this repository is still the empty
// template. Package 1 deletes this file when the application repository is
// generated; tests/seed-docs.test.mjs keeps the document-consistency checks.
import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const root = fileURLToPath(new URL("../", import.meta.url));
const read = (path) => readFile(resolve(root, path), "utf8");

test("the seed carries no application dependencies", async () => {
  const manifest = JSON.parse(await read("package.json"));
  for (const dependency of ["@xyflow/react", "drizzle-orm", "drizzle-kit", "@ai-sdk/gateway", "ai", "workflow"]) {
    assert.equal(manifest.dependencies[dependency], undefined, dependency);
    assert.equal(manifest.devDependencies[dependency], undefined, dependency);
  }
});

test("the seed carries no application files or obsolete scaffolding", async () => {
  for (const file of ["vercel.json", "docs/HANDOFF.md",
    "docs/product/CONTRACT.md", "docs/product/DECISIONS.md", "docs/vercel-facts.md"]) {
    await assert.rejects(access(resolve(root, file)), { code: "ENOENT" }, file);
  }
});

test("the seed records every capability as not started", async () => {
  const matrix = await read("docs/product/CAPABILITIES.md");
  const statuses = [...matrix.matchAll(/^\| C\d{2} \| [^|]+ \| ([^|]+) \|/gm)].map((m) => m[1].trim());
  assert.equal(statuses.length, 15);
  assert.ok(statuses.every((status) => status === "not started"), statuses.join(", "));
});
