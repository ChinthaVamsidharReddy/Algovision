// Visits every algorithm, steps through the whole trace and fails if any two pieces of text inside the
// visualization overlap on screen. Usage: node e2e/text-overlap.mjs <baseUrl> [maxWidthPx]
import { createRequire } from "node:module";
import { readdirSync } from "node:fs";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const base = process.argv[2] ?? "http://localhost:3100";
const width = Number(process.argv[3] ?? 1100);
const ids = readdirSync(new URL("../../../packages/algorithms/content", import.meta.url)).filter((d) => !d.startsWith("."));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width, height: 1400 }, reducedMotion: "reduce" });
let checked = 0;
const failures = [];

const scan = () =>
  page.evaluate(() => {
    const svg = document.querySelector('[data-testid="viz-scroll"] svg');
    if (!svg) return { found: false, hits: [] };
    const boxes = [...svg.querySelectorAll("text")]
      .map((t) => ({ t: t.textContent?.trim() ?? "", r: t.getBoundingClientRect() }))
      .filter((b) => b.t && b.r.width > 0);
    const hits = [];
    for (let i = 0; i < boxes.length; i++)
      for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i].r, b = boxes[j].r;
        const ox = Math.min(a.right, b.right) - Math.max(a.left, b.left);
        const oy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
        // ignore sub-pixel touching; a real overlap is at least 2px in both directions
        if (ox > 2 && oy > 2) hits.push(`"${boxes[i].t}" over "${boxes[j].t}"`);
      }
    return { found: true, hits };
  });

for (const id of ids) {
  await page.goto(`${base}/algorithms/${id}`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('[data-testid="viz-scroll"] svg', { timeout: 20000 });
  const total = await page.evaluate(() => Number(document.body.innerText.match(/Step \d+ of (\d+)/)?.[1] ?? 0));
  const seen = new Set();
  for (let i = 0; i < Math.max(total, 1) + 1; i++) {
    const { found, hits } = await scan();
    if (!found) { failures.push(`${id}: no visualization found`); break; }
    checked++;
    for (const h of hits) if (!seen.has(h)) { seen.add(h); failures.push(`${id} step ${i + 1}: ${h}`); }
    const next = page.getByRole("button", { name: /Next/ });
    if (await next.isDisabled()) break;
    await next.click();
  }
}
await browser.close();
console.log(`${ids.length} algorithms, ${checked} steps scanned at ${width}px`);
for (const f of failures.slice(0, 60)) console.log("OVERLAP", f);
console.log(failures.length === 0 ? "no overlapping text" : `${failures.length} overlap(s)`);
process.exit(failures.length === 0 ? 0 : 1);
