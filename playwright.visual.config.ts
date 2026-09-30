import { defineConfig } from "@playwright/test";

if (!process.env.HYDRA_VISUAL_CHROMIUM)
  throw new Error("Use npm run test:visual to prepare the pinned browser.");
export default defineConfig({
  testDir: "./tests/visual",
  snapshotPathTemplate: "{testDir}/baselines/{arg}{ext}",
  outputDir: "test-results-visual",
  timeout: 45_000,
  workers: 1,
  retries: 0,
  forbidOnly: !!process.env.CI,
  updateSnapshots: "none",
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-visual-report", open: "never" }],
  ],
  expect: {
    toHaveScreenshot: {
      animations: "disabled",
      caret: "hide",
      threshold: 0.15,
      maxDiffPixelRatio: 0.001,
      stylePath: "./tests/visual/screenshot.css",
    },
  },
  use: {
    browserName: "chromium",
    baseURL: "http://127.0.0.1:4175",
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 1,
    locale: "en-US",
    timezoneId: "UTC",
    reducedMotion: "reduce",
    launchOptions: {
      executablePath: process.env.HYDRA_VISUAL_CHROMIUM,
      args: [
        "--no-sandbox",
        "--disable-dev-shm-usage",
        "--font-render-hinting=none",
      ],
    },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command:
      "npx --no-install vite preview apps/showcase --host 127.0.0.1 --port 4175 --strictPort",
    url: "http://127.0.0.1:4175",
    reuseExistingServer: false,
  },
});
