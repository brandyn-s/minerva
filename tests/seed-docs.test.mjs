import assert from "node:assert/strict";
import { readFile, readdir, access } from "node:fs/promises";
import { dirname, extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const root = fileURLToPath(new URL("../", import.meta.url));
const read = (path) => readFile(resolve(root, path), "utf8");
const capabilityIds = Array.from({ length: 15 }, (_, i) => `C${String(i + 1).padStart(2, "0")}`);
const packageIds = Array.from({ length: 32 }, (_, i) => i + 1);
const milestoneIds = [1, 2, 3, 4, 5, 6];
const packagesIn = (source) => [...source.matchAll(/^### Prompt (\d+): ([^\n]+)\n\n```text\n([\s\S]*?)\n```/gm)];

async function markdownFiles(directory) {
  const files = [];
  for (const entry of await readdir(resolve(root, directory), { withFileTypes: true })) {
    const path = `${directory}/${entry.name}`;
    if (entry.isDirectory()) files.push(...await markdownFiles(path));
    else if (extname(path) === ".md") files.push(path);
  }
  return files;
}

async function documentFiles() {
  return ["AGENTS.md", "CLAUDE.md", "README.md", "SECURITY.md", ...await markdownFiles("docs")];
}

async function checkLocalReference(file, target) {
  const path = resolve(root, dirname(file), decodeURIComponent(target.split("#")[0]));
  assert(path.startsWith(root.endsWith(sep) ? root : root + sep),
    `${file}: reference escapes repo: ${target}`);
  await access(path).catch((error) => {
    throw new Error(`${file}: missing local reference ${target}`, { cause: error });
  });
}

test("packages are consecutive and contain the required task sections and references", async () => {
  const packages = packagesIn(await read("docs/build-prompts.md"));
  assert.deepEqual(packages.map((p) => Number(p[1])), packageIds);
  for (const [, number, , body] of packages) {
    const label = `Prompt ${number}`;
    for (const section of ["Required prerequisites", "Outcome", "Integration work",
      "Completion evidence", "Package complete when"]) {
      assert.equal([...body.matchAll(new RegExp(`^${section}:`, "gm"))].length, 1, label);
      assert.match(body, new RegExp("^" + section + ":\\s*\\S", "m"), label);
    }
    const references = body.match(/^Relevant references:\n((?:- .+\n)+)/m)?.[1];
    assert.ok(references, `${label}: missing references`);
    for (const line of references.trimEnd().split("\n")) {
      const target = line.match(/^- ([^\s]+\.md)(?:\s|$)/)?.[1];
      assert.ok(target, `${label}: invalid reference ${line}`);
      // Package launch instructions use paths relative to the repository root.
      await checkLocalReference("AGENTS.md", target);
    }
  }
});

test("milestones have ordered reviews and the required boundary sections", async () => {
  const source = await read("docs/build-prompts.md");
  const milestones = [...source.matchAll(/^## Milestone (\d):[^\n]+\n([\s\S]*?)(?=^## Milestone |(?![\s\S]))/gm)];
  assert.deepEqual(milestones.map((m) => Number(m[1])), milestoneIds);
  assert.deepEqual([...source.matchAll(/^### Fable review M(\d):/gm)].map((m) => Number(m[1])), milestoneIds);
  assert.equal([...source.matchAll(/^## Fable consultation:/gm)].length, 1);
  for (const [, number, body] of milestones) {
    for (const section of ["Entry", "Working demonstration", "Exit and review", "Still open"]) {
      assert.match(body, new RegExp("^\\*\\*" + section + ":\\*\\* .+", "m"), "M" + number);
    }
    assert.match(body, new RegExp("^### Fable review M" + number + ": [^\\n]+\\n\\n```text\\n\\S[\\s\\S]*?\\n```", "m"));
  }
});

test("SPEC and the evidence matrix have matching capability IDs", async () => {
  const spec = await read("docs/product/SPEC.md");
  const matrix = await read("docs/product/CAPABILITIES.md");
  assert.deepEqual([...spec.matchAll(/^### (C\d{2}):/gm)].map((m) => m[1]), capabilityIds);
  assert.deepEqual([...matrix.matchAll(/^\| (C\d{2}) \|/gm)].map((m) => m[1]), capabilityIds);
  assert.deepEqual([...spec.matchAll(/^\| (IB\d{2}) \|/gm)].map((m) => m[1]),
    ["IB01", "IB02", "IB03", "IB04", "IB05", "IB06"]);
});

test("documentation capability and interaction references resolve to SPEC", async () => {
  const spec = await read("docs/product/SPEC.md");
  const defined = new Set([
    ...[...spec.matchAll(/^### (C\d{2}):/gm)].map((m) => m[1]),
    ...[...spec.matchAll(/^\| (IB\d{2}) \|/gm)].map((m) => m[1]),
  ]);
  for (const file of await documentFiles()) {
    for (const [id] of (await read(file)).matchAll(/\b(?:C|IB)\d{2}\b/g)) {
      assert(defined.has(id), `${file}: unknown reference ${id}`);
    }
  }
});

test("local runtime scripts bind to loopback and Claude loads AGENTS", async () => {
  const manifest = JSON.parse(await read("package.json"));
  assert.equal(manifest.scripts.dev, "next dev --hostname 127.0.0.1");
  assert.equal(manifest.scripts.start, "next start --hostname 127.0.0.1");
  assert.match(await read("CLAUDE.md"), /^@AGENTS\.md/m);
});

test("repository documentation links resolve without external workspace paths", async () => {
  for (const file of await documentFiles()) {
    const prose = (await read(file)).replace(/```[\s\S]*?```/g, "");
    for (const match of prose.matchAll(/\[[^\]]+\]\(([^)\s]+)\)/g)) {
      const target = match[1];
      if (/^[a-z][a-z\d+.-]*:/i.test(target) || target.startsWith("#")) continue;
      await checkLocalReference(file, target);
    }
  }
});
