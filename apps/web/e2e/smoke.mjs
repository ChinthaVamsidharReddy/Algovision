/**
 * Real-browser smoke + low-end-device check. Run against a production server:
 *   pnpm build && (pnpm start -p 3100 &) && node e2e/smoke.mjs http://localhost:3100 [outDir]
 * Needs Playwright with Chromium (preinstalled in the dev container; install separately elsewhere).
 */
import { createRequire } from "node:module";
import { mkdirSync, readdirSync } from "node:fs";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const base = process.argv[2] ?? "http://localhost:3100";
const out = process.argv[3] ?? "e2e-output";
mkdirSync(out, { recursive: true });

const results = [];
const check = (name, ok, detail = "") => {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  - " + detail : ""}`);
};

const browser = await chromium.launch();
async function session(opts, fn) {
  const ctx = await browser.newContext(opts);
  const page = await ctx.newPage();
  const problems = [];
  page.on("pageerror", (e) => problems.push(`pageerror: ${e.message}`));
  page.on("console", (m) => {
    // The footer status probe is expected to fail when no backend runs.
    if (m.type() === "error" && !/\/api\/v1\/health|Failed to load resource|500|502|503|504/.test(m.text())) problems.push(`console: ${m.text()}`);
  });
  await fn(page, problems);
  await ctx.close();
}

// 1. Desktop, light + dark: full walk-through.
await session({ viewport: { width: 1360, height: 900 } }, async (page, problems) => {
  await page.goto(`${base}/algorithms/linked-list-insert-head`);
  await page.getByRole("heading", { name: "Step 1 of 5" }).waitFor();
  await page.screenshot({ path: `${out}/desktop-step1.png`, fullPage: true });
  for (let i = 2; i <= 5; i++) {
    await page.getByRole("button", { name: /Next/ }).click();
    await page.getByRole("heading", { name: `Step ${i} of 5` }).waitFor();
    if (i === 3) await page.screenshot({ path: `${out}/desktop-step3.png`, fullPage: true });
  }
  const finalText = await page.getByTestId("state-text").textContent();
  check("desktop: final list is head → 1 → 3 → 5 → 8", finalText === "head → 1 → 3 → 5 → 8 → null", finalText ?? "");
  for (const lang of ["Python", "C++", "C", "Java"]) {
    await page.getByRole("tab", { name: lang, exact: true }).click();
    const active = await page.locator('[data-active="true"]').count();
    check(`desktop: ${lang} highlights a line at the last step`, active >= 1, `${active} line(s)`);
  }
  await page.getByRole("button", { name: "Reset", exact: true }).click();
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await page.getByRole("button", { name: "Replay" }).waitFor({ timeout: 8000 });
  check("desktop: autoplay reaches the end", true);

  await page.getByRole("button", { name: /theme/ }).click();
  await page.screenshot({ path: `${out}/desktop-theme-toggled.png`, fullPage: true });
  const theme = await page.evaluate(() => document.documentElement.dataset.theme);
  check("desktop: theme toggle sets data-theme", theme === "dark" || theme === "light", String(theme));
  await page.reload();
  const persisted = await page.evaluate(() => document.documentElement.dataset.theme);
  check("desktop: theme persists across reload", persisted === theme, String(persisted));
  check("desktop: no page or console errors", problems.length === 0, problems.join(" | "));
});

// 2. Dark scheme preference + reduced motion.
await session({ viewport: { width: 1360, height: 900 }, colorScheme: "dark", reducedMotion: "reduce" }, async (page) => {
  await page.goto(`${base}/algorithms/linked-list-insert-head?step=3`);
  await page.getByRole("heading", { name: "Step 3 of 5" }).waitFor();
  await page.screenshot({ path: `${out}/desktop-dark-step3.png`, fullPage: true });
  const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  check("dark scheme: body uses the dark background", bg === "rgb(11, 15, 23)", bg);
  const dur = await page.evaluate(() => getComputedStyle(document.querySelector(".viz-node")).transitionDuration);
  check("reduced motion: node transitions are off", /^0s/.test(dur), dur);
});

// 3. Mobile: no horizontal page scroll, controls reachable, long list scrolls inside its own container.
await session({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true }, async (page) => {
  await page.goto(`${base}/algorithms/linked-list-insert-head?values=1,2,3,4,5,6,7,8,9,10,11,12,13,14,15&value=0`);
  await page.getByRole("heading", { name: "Step 1 of 5" }).waitFor();
  await page.screenshot({ path: `${out}/mobile-long-list.png`, fullPage: true });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  check("mobile 375px: no horizontal page scroll with a 15-node list", overflow <= 0, `overflow ${overflow}px`);
  const inner = await page.getByTestId("viz-scroll").evaluate((el) => el.scrollWidth > el.clientWidth);
  check("mobile: wide list scrolls inside the visualization container", inner);
  const small = await page.getByRole("button", { name: /Next/ }).boundingBox();
  check("mobile: Next button is at least 44px tall", small.height >= 44, `${small.height}px`);
  await page.getByRole("button", { name: /Next/ }).tap();
  await page.getByRole("heading", { name: "Step 2 of 5" }).waitFor();
  check("mobile: tap advances", true);
});

// 4. Low-end device: 6x CPU throttle, lite profile; measure step latency over a 15-node list.
// 5b. Every other published algorithm (waves A-G): renders, plays to the last step, readable on mobile, no errors.
{
  const known = new Set(["linear-search", "binary-search", "bubble-sort", "stack-push-pop", "queue-enqueue-dequeue", "binary-tree-inorder", "selection-sort", "insertion-sort", "linked-list-insert-tail", "find-maximum", "prefix-sum", "insert-at-index", "delete-at-index", "two-sum-sorted", "reverse-in-place", "remove-duplicates-sorted", "max-sum-subarray-k", "smallest-subarray-sum", "linked-list-insert-head"]);
  const slugs = readdirSync(new URL("../../../packages/algorithms/content", import.meta.url)).filter((x) => !known.has(x));
  check("content lists the additional algorithms", slugs.length >= 50, String(slugs.length));
  for (const slug of slugs) {
    await session({ viewport: { width: 375, height: 800 }, isMobile: true }, async (page, problems) => {
      await page.goto(`${base}/algorithms/${slug}`);
      await page.getByRole("heading", { name: /^Step 1 of/ }).waitFor();
      await page.keyboard.press("End");
      const state = (await page.getByTestId("state-text").textContent()) ?? "";
      check(`${slug}: final state text is present`, state.trim().length > 0, state);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      check(`${slug}: no horizontal page overflow at 375px`, !overflow);
      check(`${slug}: no page or console errors`, problems.length === 0, problems.join(" | "));
    });
  }
}
await session({ viewport: { width: 412, height: 800 }, isMobile: true }, async (page) => {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 6 });
  const t0 = Date.now();
  await page.goto(`${base}/algorithms/linked-list-insert-head?limits=lite&values=1,2,3,4,5,6,7,8&value=0`);
  await page.getByRole("heading", { name: "Step 1 of 5" }).waitFor();
  const load = Date.now() - t0;
  // Measure inside the page: click -> DOM updated -> next frame painted. Playwright round trips
  // are excluded because under CPU throttling they dominate and say nothing about the app.
  const lat = await page.evaluate(async () => {
    const next = [...document.querySelectorAll("button")].find((b) => /Next/.test(b.textContent ?? ""));
    const heading = document.getElementById("explain-heading");
    const out = [];
    for (let i = 0; i < 4; i++) {
      const before = heading.textContent;
      const t0 = performance.now();
      next.click();
      await new Promise((resolve) => {
        const check = () => (heading.textContent !== before ? requestAnimationFrame(() => resolve()) : requestAnimationFrame(check));
        check();
      });
      out.push(Math.round(performance.now() - t0));
      await new Promise((r) => setTimeout(r, 50));
    }
    return out;
  });
  const worst = Math.max(...lat);
  check("6x CPU throttle: page interactive under 5s", load < 5000, `${load}ms`);
  check("6x CPU throttle: step latency under 200ms (INP good threshold) (lite, 8 nodes, in-page click to paint)", worst < 200, `worst ${worst}ms [${lat.join(", ")}]`);
});

// 5. Wave 1 array algorithms: render, walk to the end, no overflow on mobile, lite throttle latency.
for (const [slug, finalText] of [
  ["linear-search", /index 3|found/i],
  ["binary-search", /index 5|found/i],
  ["bubble-sort", /\[1, 2, 5, 6, 9\]/],
  ["stack-push-pop", /bottom → 3 ← top \(top is 3\)/],
  ["queue-enqueue-dequeue", /front → 8 ← rear \(front is 8\)/],
  ["binary-tree-inorder", /output: \[1, 3, 4, 5, 8\]/],
  ["selection-sort", /\[11, 12, 22, 25, 64\]/],
  ["insertion-sort", /\[5, 6, 11, 12, 13\]/],
  ["linked-list-insert-tail", /head → 3 → 5 → 8 → 1 → null/],
  ["find-maximum", /\[4, 9, 2, 11, 7\]/],
  ["prefix-sum", /\[3, 4, 8, 9, 14\]/],
  ["insert-at-index", /\[10, 20, 25, 30, 40\]/],
  ["delete-at-index", /\[10, 30, 40, 50\]/],
  ["two-sum-sorted", /\[1, 3, 4, 6, 8, 11\]/],
  ["reverse-in-place", /\[6, 5, 4, 3, 2, 1\]/],
  ["remove-duplicates-sorted", /\[1, 2, 3, 5, 2, 3, 5, 5\]/],
  ["max-sum-subarray-k", /\[2, 1, 5, 1, 3, 2\]/],
  ["smallest-subarray-sum", /\[2, 3, 1, 2, 4, 3\]/],
]) {
  await session({ viewport: { width: 375, height: 800 }, isMobile: true }, async (page, problems) => {
    await page.goto(`${base}/algorithms/${slug}`);
    await page.getByRole("heading", { name: /^Step 1 of/ }).waitFor();
    await page.keyboard.press("End");
    check(`${slug}: cells rendered at the last step`, (await page.locator("[data-cell-index], [data-node-id]").count()) > 0);
    const state = await page.getByTestId("state-text").textContent();
    check(`${slug}: final state text`, finalText.test(state ?? ""), state ?? "");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    check(`${slug}: no horizontal page overflow at 375px`, !overflow);
    await page.screenshot({ path: `${out}/${slug}-mobile.png`, fullPage: true });
    check(`${slug}: no page or console errors`, problems.length === 0, problems.join(" | "));
  });
}
await session({ viewport: { width: 412, height: 800 }, isMobile: true }, async (page) => {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 6 });
  await page.goto(`${base}/algorithms/bubble-sort?limits=lite&values=8,7,6,5,4,3,2,1`);
  await page.getByRole("heading", { name: /^Step 1 of/ }).waitFor();
  const lat = await page.evaluate(async () => {
    const next = [...document.querySelectorAll("button")].find((b) => /Next/.test(b.textContent ?? ""));
    const heading = document.getElementById("explain-heading");
    const out = [];
    for (let i = 0; i < 6; i++) {
      const before = heading.textContent;
      const t0 = performance.now();
      next.click();
      await new Promise((resolve) => {
        const check = () => (heading.textContent !== before ? requestAnimationFrame(() => resolve()) : requestAnimationFrame(check));
        check();
      });
      out.push(Math.round(performance.now() - t0));
      await new Promise((r) => setTimeout(r, 50));
    }
    return out;
  });
  check("bubble-sort 6x throttle: step latency under 200ms", Math.max(...lat) < 200, `worst ${Math.max(...lat)}ms [${lat.join(", ")}]`);
});

await browser.close();
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
