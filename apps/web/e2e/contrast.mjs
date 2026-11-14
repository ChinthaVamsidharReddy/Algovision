// WCAG AA colour-contrast audit with axe-core, in light and dark themes, on desktop and phone widths.
// Usage: node e2e/contrast.mjs <baseUrl>
import { createRequire } from "node:module";
import { readdirSync } from "node:fs";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const axeSource = require("node:fs").readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");
const base = process.argv[2] ?? "http://localhost:3100";
const ids = readdirSync(new URL("../../../packages/algorithms/content", import.meta.url)).filter((d) => !d.startsWith("."));
// one algorithm per state kind + the main pages
const sample = ["linked-list-reverse", "bubble-sort", "valid-parentheses", "circular-queue", "binary-tree-preorder", "dijkstra", "climbing-stairs"].filter((i) => ids.includes(i));
const pages = ["/", "/algorithms", "/login", "/register", "/dashboard", "/bookmarks", "/search?q=sort", "/paths", "/paths/foundations", "/compare", "/compare?a=bubble-sort&b=merge-sort", "/cheatsheet", "/practice", "/practice/binary-search", "/practice/linked-list-reverse", ...sample.map((i) => `/algorithms/${i}`)];
const browser = await chromium.launch();
const failures = new Map();
let scans = 0;
for (const theme of ["light", "dark"]) {
  for (const [w, h] of [[1280, 900], [360, 640]]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, reducedMotion: "reduce", colorScheme: theme });
    const page = await ctx.newPage();
    await page.addInitScript((t) => { try { localStorage.setItem("av-theme", t); } catch { /* storage unavailable: the default theme applies */ } }, theme);
    for (const path of pages) {
      await page.goto(`${base}${path}`, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(900);
      await page.evaluate((t) => document.documentElement.setAttribute("data-theme", t), theme);
      await page.waitForTimeout(150);
      const steps = path.startsWith("/algorithms/") ? [0, 6] : [0];
      for (const n of steps) {
        for (let i = 0; i < n; i++) await page.getByRole("button", { name: /Next/ }).click().catch(() => {});
        await page.evaluate(axeSource);
        const res = await page.evaluate(async () => (await window.axe.run(document, { runOnly: ["color-contrast"] })).violations.flatMap((v) => v.nodes.map((n) => ({ html: n.html.slice(0, 110), msg: (n.any[0]?.message ?? "").slice(0, 150) }))));
        scans++;
        for (const r of res) failures.set(`${theme} ${w}px ${path}: ${r.html} -- ${r.msg}`, 1);
      }
    }
    await ctx.close();
  }
}
await browser.close();
console.log(`${scans} page states scanned`);
for (const f of [...failures.keys()].slice(0, 40)) console.log("LOW CONTRAST", f);
console.log(failures.size === 0 ? "no contrast violations" : `${failures.size} contrast violation(s)`);
process.exit(failures.size === 0 ? 0 : 1);
