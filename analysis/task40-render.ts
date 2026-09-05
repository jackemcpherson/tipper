/** Verify the standalone report in an isolated Chrome preview after browser bootstrap failed. */
import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";

const directory = process.argv[2];
assert(directory, "Usage: bun analysis/task40-render.ts <isolated Chrome preview directory>");
const port = readFileSync(`${directory}/cdp/DevToolsActivePort`, "utf8").split("\n")[0];
const pages = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()) as {
  type: string;
  webSocketDebuggerUrl: string;
}[];
const page = pages.find((p) => p.type === "page");
assert(page);
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise<void>((resolve) => ws.addEventListener("open", () => resolve(), { once: true }));
let next = 0;
const pending = new Map<
  number,
  { resolve: (value: Record<string, unknown>) => void; reject: (error: Error) => void }
>();
ws.addEventListener("message", (event) => {
  const response = JSON.parse(String(event.data)) as {
    id: number;
    result?: Record<string, unknown>;
    error?: { message: string };
  };
  const callback = pending.get(response.id);
  if (!callback) return;
  pending.delete(response.id);
  if (response.error) callback.reject(new Error(response.error.message));
  else callback.resolve(response.result ?? {});
});
function send(method: string, params: Record<string, unknown> = {}) {
  return new Promise<Record<string, unknown>>((resolve, reject) => {
    const id = ++next;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
}
await send("Page.enable");
await send("Page.navigate", {
  url: "file:///Users/jackmcpherson/Projects/tipper/docs/task-40-report.html",
});
await send("Runtime.evaluate", {
  expression:
    "new Promise(r => document.readyState === 'complete' ? r(true) : window.addEventListener('load', () => r(true), {once:true}))",
  awaitPromise: true,
});
const checks = await send("Runtime.evaluate", {
  expression:
    "JSON.stringify({title:document.title,svg:document.querySelectorAll('svg').length,candidates:document.querySelectorAll('details.candidate').length,external:document.querySelectorAll('script,link,img').length})",
  returnByValue: true,
});
const value = (checks.result as { value: string }).value;
const counts = JSON.parse(value) as { svg: number; candidates: number; external: number };
assert.equal(counts.svg, 132);
assert.equal(counts.candidates, 66);
assert.equal(counts.external, 0);
for (const theme of ["light", "dark"]) {
  await send("Emulation.setEmulatedMedia", {
    features: [{ name: "prefers-color-scheme", value: theme }],
  });
  await send("Emulation.setDeviceMetricsOverride", {
    width: 1200,
    height: 1150,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await send("Runtime.evaluate", {
    expression:
      "document.getElementById('t40-od').open=true; document.getElementById('t40-od').scrollIntoView(); new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>r(true))))",
    awaitPromise: true,
  });
  const screenshot = await send("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: false,
  });
  assert(typeof screenshot.data === "string");
  writeFileSync(`${directory}/verified-${theme}.png`, Buffer.from(screenshot.data, "base64"));
}
await send("Emulation.setDeviceMetricsOverride", {
  width: 390,
  height: 844,
  deviceScaleFactor: 1,
  mobile: true,
});
await send("Runtime.evaluate", {
  expression:
    "window.scrollTo(0,0); new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>r(true))))",
  awaitPromise: true,
});
const mobile = await send("Page.captureScreenshot", {
  format: "png",
  captureBeyondViewport: false,
});
assert(typeof mobile.data === "string");
writeFileSync(`${directory}/verified-mobile.png`, Buffer.from(mobile.data, "base64"));
ws.close();
console.log(JSON.stringify(counts));
