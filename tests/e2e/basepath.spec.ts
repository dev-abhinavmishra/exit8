import { test, expect } from "@playwright/test";
import { createServer } from "node:http";
import { readFileSync, existsSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const MIME: Record<string, string> = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".mjs": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".wasm": "application/wasm",
  ".png": "image/png",
  ".map": "application/json",
};

// The bundle uses base "./" — it must boot when served from a sub-path,
// which is what static hosts like GH Pages project sites do.
test("production build boots from a non-root base path", async ({ page }) => {
  const dist = join(process.cwd(), "dist");
  expect(existsSync(join(dist, "index.html"))).toBe(true);
  const server = createServer((req, res) => {
    const url = new URL(req.url ?? "/", "http://x");
    let p = url.pathname;
    if (!p.startsWith("/sub/")) {
      res.writeHead(404).end("nope");
      return;
    }
    p = p.slice(4);
    if (p === "/" || p === "") p = "/index.html";
    const file = join(dist, p);
    if (!existsSync(file) || !statSync(file).isFile()) {
      res.writeHead(404).end("nf");
      return;
    }
    res.writeHead(200, { "content-type": MIME[extname(file)] ?? "application/octet-stream" });
    res.end(readFileSync(file));
  });
  await new Promise<void>((r) => server.listen(4188, r));
  try {
    await page.goto("http://localhost:4188/sub/?e2e=1&engine=webgl&seed=basepath");
    await page.waitForFunction(
      () => (window as unknown as { __nightaudit?: { ready?: boolean } }).__nightaudit?.ready === true,
      null,
      { timeout: 60_000 },
    );
    await expect(page.locator("text=BEGIN SHIFT")).toBeVisible();
  } finally {
    server.close();
  }
});
