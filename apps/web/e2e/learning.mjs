/**
 * Real-browser check of the learning pages (paths, quiz, compare, cheat sheet, prerequisites) on a production build.
 *   node e2e/learning.mjs http://localhost:3100
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

const browser = await chromium.launch();
for (const [label, viewport] of [["desktop", { width: 1200, height: 900 }], ["phone", { width: 375, height: 800 }]]) {
  const ctx = await browser.newContext({ viewport });
  const page = await ctx.newPage();
  const problems = [];
  page.on("pageerror", (e) => problems.push(String(e)));
  page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource|\/api\/v1\//.test(m.text())) problems.push(m.text()); });
  const overflow = () => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

  await page.goto(`${base}/paths`, { waitUntil: "load" });
  check(`${label}: /paths lists the paths`, (await page.getByRole("heading", { level: 2 }).count()) >= 7);
  check(`${label}: /paths has no sideways scroll`, (await overflow()) <= 0, `${await overflow()}px`);

  await page.getByRole("link", { name: "Sorting and searching" }).first().click();
  await page.waitForURL(/\/paths\/sorting-and-searching/);
  check(`${label}: path page shows ordered steps`, (await page.locator("ol > li").count()) === 15);
  check(`${label}: path page offers a start link`, (await page.getByRole("link", { name: "Start this path" }).getAttribute("href")) === "/algorithms/bubble-sort");
  check(`${label}: path page has no sideways scroll`, (await overflow()) <= 0, `${await overflow()}px`);

  await page.goto(`${base}/algorithms/binary-search-first-occurrence`, { waitUntil: "load" });
  check(`${label}: algorithm page shows prerequisites`, await page.getByRole("heading", { name: "Learn this first" }).isVisible());
  check(`${label}: algorithm page shows practice links`, (await page.locator('a[href^="https://leetcode.com/problems/"]').count()) >= 1);
  const rel = await page.locator('a[href^="https://leetcode.com/problems/"]').first().getAttribute("rel");
  check(`${label}: practice links open safely`, rel === "noopener noreferrer");

  await page.getByRole("button", { name: "Start quiz" }).click();
  let answered = 0;
  for (let i = 0; i < 6; i++) {
    const radios = page.getByRole("radio");
    if ((await radios.count()) === 0) break;
    await radios.first().check();
    await page.getByRole("button", { name: "Check answer" }).click();
    answered++;
    const next = page.getByRole("button", { name: /Next question|See my score/ });
    await next.click();
  }
  check(`${label}: quiz can be answered to the end`, answered >= 2 && (await page.getByText(/You got \d of \d\./).isVisible()), `${answered} answered`);
  check(`${label}: quiz page has no sideways scroll`, (await overflow()) <= 0, `${await overflow()}px`);

  await page.goto(`${base}/compare?a=bubble-sort&b=merge-sort`, { waitUntil: "load" });
  const row = await page.getByRole("row", { name: /^Time/ }).innerText();
  check(`${label}: compare shows both complexities`, /n²|n\^2/.test(row) && /n log n/.test(row), row.replace(/\s+/g, " "));
  check(`${label}: compare has no sideways scroll of the page`, (await overflow()) <= 0, `${await overflow()}px`);
  await page.getByLabel("Second algorithm").selectOption("quick-sort");
  await page.waitForURL(/b=quick-sort/);
  check(`${label}: compare updates the address`, page.url().includes("a=bubble-sort") && page.url().includes("b=quick-sort"));

  await page.goto(`${base}/cheatsheet`, { waitUntil: "load" });
  check(`${label}: cheat sheet has a table per topic`, (await page.locator("table").count()) === 17, `${await page.locator("table").count()} tables`);
  check(`${label}: cheat sheet page has no sideways scroll`, (await overflow()) <= 0, `${await overflow()}px`);
  check(`${label}: no page or console errors`, problems.length === 0, problems.join(" | "));
  await ctx.close();
}
await browser.close();
console.log(failed === 0 ? "all learning checks passed" : `${failed} FAILED`);
process.exit(failed === 0 ? 1 - 1 : 1);
