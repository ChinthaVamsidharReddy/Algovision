/**
 * Real-browser check of the 3D story scenes (production build; stub API running).
 *   node e2e/scene3d.mjs http://localhost:3100 [screenshot-dir]
 */
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const base = process.argv[2] ?? "http://localhost:3100";
const shots = process.argv[3];
let failed = 0;
const check = (name, ok, detail = "") => {
  if (!ok) failed++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  - " + detail : ""}`);
};
const browser = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });

for (const [device, viewport] of [["desktop", { width: 1280, height: 900 }], ["phone", { width: 390, height: 800 }]]) {
  const ctx = await browser.newContext({ viewport });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && !/Failed to load resource|\/api\//.test(m.text()) && errors.push(m.text()));
  await page.goto(`${base}/algorithms/queue-enqueue-dequeue`, { waitUntil: "load" });
  const canvas = page.getByTestId("scene3d-canvas");
  await canvas.waitFor({ timeout: 20000 });
  check(`${device}: the 3D scene appears with a switch back to the classic view`, (await page.getByTestId("story-view-toggle").innerText()) === "Classic view");
  const total = Number((await page.getByRole("heading", { name: /^Step 1 of \d+$/ }).innerText()).match(/of (\d+)/)[1]);
  const pics = [];
  let wrongPeople = 0;
  for (let i = 0; i < total; i++) {
    await page.waitForTimeout(i === 0 ? 600 : 900);
    const people = Number(await canvas.getAttribute("data-people"));
    const waiting = Number((await page.getByTestId("story-board").innerText()).match(/(\d+)\s*$/)?.[1] ?? NaN);
    if (!Number.isNaN(waiting) && waiting !== people) wrongPeople++;
    const png = await canvas.screenshot();
    pics.push(png);
    if (shots && (i === 2 || i === total - 1)) await page.screenshot({ path: `${shots}/scene3d-${device}-step${i}.png` });
    if (i < total - 1) await page.keyboard.press("ArrowRight");
  }
  check(`${device}: the number of people standing matches the people waiting at every step`, wrongPeople === 0, `${wrongPeople} steps differ`);
  check(`${device}: the scene is really drawn (not blank)`, pics.every((p) => p.length > 6000), pics.map((p) => p.length).join(","));
  const distinct = new Set(pics.map((p) => p.toString("base64"))).size;
  check(`${device}: the picture changes as the queue changes`, distinct >= Math.min(4, total), `${distinct} different pictures in ${total} steps`);
  check(`${device}: no sideways scrolling of the page`, !(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)));

  // classic view and the remembered choice
  await page.getByTestId("story-view-toggle").click();
  await page.getByTestId("story-node").first().waitFor({ timeout: 5000 }).catch(() => {});
  check(`${device}: the classic view is still available`, (await page.getByTestId("scene3d-canvas").count()) === 0 && (await page.getByTestId("story-view-toggle").innerText()) === "3D view");
  await page.reload({ waitUntil: "load" });
  await page.getByTestId("story").waitFor();
  await page.waitForTimeout(500);
  check(`${device}: the classic choice is remembered`, (await page.getByTestId("scene3d-canvas").count()) === 0);
  await page.getByTestId("story-view-toggle").click();
  await page.getByTestId("scene3d-canvas").waitFor({ timeout: 10000 });
  check(`${device}: switching back to 3D works`, true);

  // the stack story has no 3D scene yet and keeps its classic one
  await page.goto(`${base}/algorithms/stack-push-pop`, { waitUntil: "load" });
  await page.getByTestId("story").waitFor();
  check(`${device}: stories without a 3D scene are unchanged`, (await page.getByTestId("scene3d-canvas").count()) === 0 && (await page.getByTestId("story-view-toggle").count()) === 0);
  check(`${device}: no page errors`, errors.length === 0, errors.join(" | "));
  await ctx.close();
}

// reduced motion: figures snap into place, the scene is still drawn
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: "reduce" });
  const page = await ctx.newPage();
  await page.goto(`${base}/algorithms/queue-enqueue-dequeue`, { waitUntil: "load" });
  await page.getByTestId("scene3d-canvas").waitFor({ timeout: 20000 });
  await page.waitForTimeout(500);
  const a = await page.getByTestId("scene3d-canvas").screenshot();
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(150);
  const b = await page.getByTestId("scene3d-canvas").screenshot();
  check("reduced motion: the picture updates at once", a.length > 6000 && !a.equals(b));
  await ctx.close();
}
await browser.close();
console.log(failed === 0 ? "\nALL PASSED" : `\n${failed} FAILED`);
process.exit(failed === 0 ? 0 : 1);
