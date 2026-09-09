import assert from "node:assert/strict";
import { readFile, readdir, access } from "node:fs/promises";
import { dirname, extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const root = fileURLToPath(new URL("../", import.meta.url));
const read = (path) => readFile(resolve(root, path), "utf8");
const capabilityIds = Array.from({ length: 15 }, (_, i) => `C${String(i + 1).padStart(2, "0")}`);

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

test("Vercel installs and builds with the declared npm version", async () => {
  const manifest = JSON.parse(await read("package.json"));
  const config = JSON.parse(await read("vercel.json"));
  const lock = JSON.parse(await read("package-lock.json"));
  assert.equal(manifest.packageManager, `npm@${manifest.engines.npm}`);
  assert.equal(config.installCommand, `npx --yes ${manifest.packageManager} ci`);
  assert.equal(config.buildCommand, `npx --yes ${manifest.packageManager} run build`);
  assert.deepEqual(lock.packages[""].engines, manifest.engines);
});
