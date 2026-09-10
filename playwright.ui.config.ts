import { defineConfig } from "@playwright/test";
export default defineConfig({
  snapshotPathTemplate: "{testDir}/snapshots/{projectName}/{arg}{ext}",
  testDir: "./tests/ui", testMatch: "*.spec.ts", fullyParallel: false, workers: 1,
  reporter: "list", outputDir: "test-results/ui",
  use: { baseURL: "http://127.0.0.1:3077", browserName: "chromium", reducedMotion: "reduce", trace: "retain-on-failure" },
  projects: [
    { name: "desktop", use: { viewport: { width: 1280, height: 800 } } },
    { name: "touch", use: { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true } },
  ],
  webServer: { command: "npm run dev -- --port 3077", url: "http://127.0.0.1:3077/dev/ui", reuseExistingServer: !process.env.CI, timeout: 120000 },
});
