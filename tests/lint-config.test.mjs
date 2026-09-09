import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { ESLint } from "eslint";

test("local review artifacts are ignored without excluding source or tests", async () => {
  const eslint = new ESLint({ cwd: fileURLToPath(new URL("../", import.meta.url)) });
  for (const path of [".local/probe.mjs", "test-results/probe.mjs", "playwright-report/probe.mjs"]) {
    assert.equal(await eslint.isPathIgnored(path), true, path);
  }
  for (const path of ["app/page.tsx", "tests/seed-docs.test.mjs", "tests/lint-config.test.mjs"]) {
    assert.equal(await eslint.isPathIgnored(path), false, path);
  }
  const [result] = await eslint.lintText("const = 1;", { filePath: "app/lint-probe.ts" });
  assert.equal(result.fatalErrorCount, 1);
});
