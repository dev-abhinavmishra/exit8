import "../ui/styles.css";
import { App, parseUrl } from "./app";

async function main(): Promise<void> {
  const host = document.getElementById("app");
  const splash = document.getElementById("boot-splash");
  const bar = document.getElementById("boot-bar");
  if (!host) throw new Error("missing #app host");

  const canvas = document.createElement("canvas");
  canvas.id = "render";
  canvas.setAttribute("aria-label", "NIGHT AUDIT — Inspection Loop 7");
  host.appendChild(canvas);
  const uiHost = document.createElement("div");
  uiHost.id = "ui";
  host.appendChild(uiHost);

  const params = parseUrl(location.search);
  const app = new App(canvas, uiHost, params);
  const setProgress = (p: number) => {
    if (bar) bar.style.width = `${Math.round(p * 100)}%`;
  };
  setProgress(0.25);
  try {
    await app.boot();
    setProgress(1);
    if (params.debug) app.setDebug(true);
    splash?.classList.add("done");
    setTimeout(() => splash?.remove(), 600);
  } catch (e) {
    if (splash) {
      splash.innerHTML = `<div class="mark">BOOT FAULT</div><div class="sub" style="text-transform:none;letter-spacing:0.04em">${String(
        e instanceof Error ? e.message : e,
      )}</div>`;
      splash.classList.remove("done");
    }
    throw e;
  }
}

void main();
