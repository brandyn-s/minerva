import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTypeScript,
  globalIgnores([
    ".next/**",
    "app/.well-known/workflow/**",
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
