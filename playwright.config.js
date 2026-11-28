import { defineConfig, devices } from "@playwright/test";

const frontendUrl = "http://127.0.0.1:5174";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 30_000,
  expect: {
    timeout: 7_000
  },
  retries: process.env.CI ? 2 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  globalSetup: "./server/tests/e2e/global-setup.js",
  globalTeardown: "./server/tests/e2e/global-teardown.js",
  use: {
    ...devices["Desktop Chrome"],
    baseURL: frontendUrl,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure"
  }
});
