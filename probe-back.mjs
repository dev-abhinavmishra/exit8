import { chromium } from "playwright";
const browser = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader-webgl", "--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await page.goto("http://localhost:5199/?e2e=1&seed=audit.back.1", { waitUntil: "networkidle" });
await page.click("text=BEGIN SHIFT");
await page.waitForFunction(() => window.__nightaudit?.loop() === 1, null, { timeout: 30000 });
const na = (expr) => page.evaluate(`window.__nightaudit.${expr}`);
await page.waitForTimeout(5600);
// inside the north vestibule, looking north at the sign's back + cap
await na("teleport(0, 1.7, 1.2, Math.PI)");
await page.waitForTimeout(400);
await page.screenshot({ path: "/tmp/sign-back.png" });
await browser.close();
console.log("done");
