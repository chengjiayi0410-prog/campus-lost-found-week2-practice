import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    setupFiles: ["./tests/setup.js"],
    fileParallelism: false,
    testTimeout: 15_000,
    hookTimeout: 30_000,
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/**/*.js"],
      exclude: ["src/server.js"],
      thresholds: {
        lines: 55,
        functions: 55,
        branches: 45,
        statements: 55
      }
    }
  }
});
