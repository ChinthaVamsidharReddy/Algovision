/**
 * Real-browser check of the installable offline app, the review queue and notes (production build; stub API running).
 *   node e2e/offline.mjs http://localhost:3100
 */
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const base = process.argv[2] ?? "http://localhost:3100";
let failed = 0;
const check = (name, ok, detail = "") => {
  if (!ok) failed++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  - " + detail : ""}`);
};
const axePath = require.resolve("axe-core/axe.min.js");
async function axeCheck(page, name) {
  if (!(await page.evaluate(() => typeof window.axe)).startsWith("object")) await page.addScriptTag({ path: axePath });
  for (const theme of ["light", "dark"]) {
    await page.evaluate((t) => { document.documentElement.dataset.theme = t; }, theme);
    const r = await page.evaluate(async () => (await window.axe.run(document, { runOnly: ["wcag2a", "wcag2aa"] })).violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).slice(0, 3).join(" ; ")}`));
    check(`${name} (${theme}) has no accessibility or contrast violations`, r.length === 0, r.join(" | "));
  }
}

const browser = await chromium.launch();
const context = await browser.newContext({ serviceWorkers: "allow" });
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));

// ---- manifest and icons ----
const manifest = await (await context.request.get(`${base}/manifest.webmanifest`)).json();
check("manifest names the app and starts standalone", manifest.short_name === "AlgoVision" && manifest.display === "standalone", JSON.stringify(manifest.display));
check("manifest has 192, 512 and maskable icons", ["192x192", "512x512"].every((s) => manifest.icons.some((i) => i.sizes === s)) && manifest.icons.some((i) => i.purpose === "maskable"));
for (const i of manifest.icons) {
  const r = await context.request.get(new URL(i.src, base).href);
  check(`icon ${i.src} is served as a PNG`, r.ok() && (r.headers()["content-type"] ?? "").includes("image/png"));
}
const sw = await context.request.get(`${base}/sw.js`);
check("service worker is served as JavaScript and is never cached", sw.ok() && (sw.headers()["content-type"] ?? "").includes("javascript") && (sw.headers()["cache-control"] ?? "").includes("no-cache"), sw.headers()["cache-control"]);

// ---- service worker installs, and visited pages work offline ----
await page.goto(`${base}/algorithms/binary-search`, { waitUntil: "load" });
await page.waitForFunction(async () => (await navigator.serviceWorker.getRegistration())?.active?.state === "activated", null, { timeout: 20000 });
check("service worker is active", true);
await page.reload({ waitUntil: "load" }); // now controlled; this load is what gets cached for offline use
await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
await page.goto(`${base}/algorithms/linear-search`, { waitUntil: "load" });
await page.goto(`${base}/review`, { waitUntil: "load" });
await page.waitForTimeout(500);

await context.setOffline(true);
await page.goto(`${base}/algorithms/binary-search`, { waitUntil: "domcontentloaded" });
await page.getByRole("heading", { level: 1 }).first().waitFor({ timeout: 15000 });
check("a visited algorithm page opens offline", /binary search/i.test(await page.getByRole("heading", { level: 1 }).first().innerText()));
await page.getByRole("button", { name: /next step|step forward|next/i }).first().click({ timeout: 10000 }).catch(() => undefined);
check("the visualization still runs offline", (await page.locator("svg").count()) > 0);
await page.goto(`${base}/algorithms/merge-sort`, { waitUntil: "domcontentloaded" });
check("a page never opened shows the offline page", (await page.getByRole("heading", { name: "You are offline" }).count()) === 1);
await axeCheck(page, "offline page");
const apiOffline = await page.evaluate(() => fetch("/api/health").then(() => "ok", () => "failed"));
check("API calls are not served from the cache while offline", apiOffline === "failed", apiOffline);
await context.setOffline(false);

// ---- notes: saved in this browser and survive a reload ----
await page.goto(`${base}/algorithms/binary-search`, { waitUntil: "load" });
const note = page.getByLabel("Your private notes on this algorithm");
await note.fill("Mid is low + (high - low) / 2 to avoid overflow.");
await page.getByText("Saved in this browser.").waitFor({ timeout: 5000 });
await page.reload({ waitUntil: "load" });
const restored = await page
  .waitForFunction(() => document.getElementById("note-text")?.value.includes("avoid overflow"), null, { timeout: 5000 })
  .then(() => true, () => false);
check("a note survives a reload", restored);
await axeCheck(page, "algorithm page with notes");

// ---- review: add from the algorithm page, force it due, review it ----
await page.getByRole("checkbox", { name: /Remind me to review/ }).check();
await page.evaluate(() => {
  const s = JSON.parse(localStorage.getItem("algovision.review"));
  s.items["binary-search"].due = "2000-01-01";
  localStorage.setItem("algovision.review", JSON.stringify(s));
});
await page.goto(`${base}/review`, { waitUntil: "load" });
await page.getByTestId("review-card").waitFor({ timeout: 10000 });
check("the due algorithm is shown for review", (await page.getByRole("heading", { name: "Binary search" }).count()) === 1);
check("the answer is hidden until asked", (await page.getByText("Time:").count()) === 0);
await page.getByRole("button", { name: "Show the answer" }).click();
check("the answer shows time and space complexity", (await page.getByText("Time:").count()) === 1);
await axeCheck(page, "review card");
await page.getByRole("button", { name: "I remembered it" }).click();
await page.getByTestId("review-empty").waitFor();
const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("algovision.review")).items["binary-search"]);
check("remembering moves it to box 1", stored.box === 1 && stored.due > "2000-01-02", JSON.stringify(stored));
check("the summary says all done", /All done for today/.test(await page.getByTestId("review-empty").innerText()));

// ---- phone width: no horizontal scroll on the new page ----
await page.setViewportSize({ width: 375, height: 800 });
await page.goto(`${base}/review`, { waitUntil: "load" });
const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
check("review page has no horizontal scroll at 375px", !overflow);

check("no uncaught page errors", errors.length === 0, errors.join(" | "));
await browser.close();
console.log(failed === 0 ? "\nALL PASSED" : `\n${failed} FAILED`);
process.exit(failed === 0 ? 0 : 1);
