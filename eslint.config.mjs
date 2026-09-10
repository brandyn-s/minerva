import { uiRules } from "./scripts/eslint/ui-rules.mjs";
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTypeScript,
  { files: ["features/**/*.{tsx,jsx}", "app/**/*.{tsx,jsx}"],
    plugins: { "minerva-ui": uiRules },
    rules: { "minerva-ui/shared-controls": "error" },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "evaluation-artifacts/**",
    "evidence/private/**",
    ".minerva/**",
    ".local/**",
    "test-results/**",
    "playwright-report/**",
  ]),
]);
