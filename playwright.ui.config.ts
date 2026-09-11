import { defineConfig } from "@playwright/test";
const port = Number(process.env.MINERVA_UI_PORT ?? 3077);
export default defineConfig({
  snapshotPathTemplate: "{testDir}/snapshots/{projectName}/{arg}{ext}",
  testDir: "./tests/ui", testMatch: "*.spec.ts", fullyParallel: false, workers: 1,
  reporter: "list", outputDir: "test-results/ui",
  use: { baseURL: `http://127.0.0.1:${port}`, browserName: "chromium", reducedMotion: "reduce", trace: "retain-on-failure" },
  projects: [
    { name: "desktop", use: { viewport: { width: 1280, height: 800 } } },
    { name: "touch", use: { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true } },
  ],
  webServer: { command: `npm run dev -- --port ${port}`, url: `http://127.0.0.1:${port}/dev/ui`, reuseExistingServer: !process.env.CI, timeout: 120000 },
});
