import { defineConfig, devices } from "@playwright/test";

// e2e runs the production build's WebGL2 path (headless Chromium has no
// WebGPU). Port 4177 avoids the stale-preview trap on 4173 used elsewhere.
export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60_000,
  retries: process.env.CI ? 2 : 1,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:4177",
    headless: true,
    launchOptions: {
      args: [
        "--use-gl=angle",
        "--use-angle=swiftshader",
        "--enable-unsafe-swiftshader",
        "--disable-gpu-sandbox",
      ],
    },
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run build && npm run preview -- --port 4177 --strictPort",
    url: "http://localhost:4177",
    reuseExistingServer: false,
    timeout: 240_000,
  },
});
