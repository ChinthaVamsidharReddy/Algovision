/**
 * Real-browser check of the story view (production build; stub API running).
 *   node e2e/story.mjs http://localhost:3100 [screenshot-dir]
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
const axePath = require.resolve("axe-core/axe.min.js");
async function axeCheck(page, name) {
  if (!(await page.evaluate(() => typeof window.axe)).startsWith("object")) await page.addScriptTag({ path: axePath });
  for (const theme of ["light", "dark"]) {
    await page.evaluate((t) => { document.documentElement.dataset.theme = t; }, theme);
    const r = await page.evaluate(async () => (await window.axe.run(document, { runOnly: ["wcag2a", "wcag2aa"] })).violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).slice(0, 3).join(" ; ")}`));
    check(`${name} (${theme}) has no accessibility or contrast violations`, r.length === 0, r.join(" | "));
  }
  await page.evaluate(() => { document.documentElement.dataset.theme = "light"; });
}

const CASES = [
  { id: "find-duplicate-floyd", query: "", final: /repeated number is 2/ },
  { id: "two-sum-sorted", query: "", final: /exactly 10/ },
  { id: "is-palindrome-string", query: "", final: /perfect mirror/i },
];
const browser = await chromium.launch();
for (const [label, viewport] of [["desktop", { width: 1280, height: 900 }], ["phone", { width: 375, height: 800 }]]) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 1, reducedMotion: "reduce" });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && !/Failed to load resource|\/api\//.test(m.text()) && errors.push(m.text()));
  for (const c of CASES) {
    await page.goto(`${base}/algorithms/${c.id}`, { waitUntil: "load" });
    await page.getByTestId("story").waitFor({ timeout: 15000 });
    const tag = `${label} ${c.id}`;
    check(`${tag}: story is shown with its situation`, (await page.getByTestId("story-hook").innerText()).length > 60);

    // walk every step with the keyboard; the narration must change and never leak a bad value
    const total = Number((await page.getByRole("heading", { name: /^Step 1 of \d+$/ }).innerText()).match(/of (\d+)/)[1]);
    let bad = [];
    let overlapIssues = [];
    const seen = new Set();
    for (let i = 0; i < total; i++) {
      const says = await page.getByTestId("story-says").innerText();
      seen.add(says);
      if (/undefined|NaN|null|\[object/.test(says)) bad.push(`${i}: ${says}`);
      // actors standing on different cells must not cover each other
      const boxes = await page.locator('[data-testid^="actor-"]').evaluateAll((els) => els.map((e) => ({ at: e.dataset.at, r: e.getBoundingClientRect() })));
      for (let a = 0; a < boxes.length; a++) for (let b = a + 1; b < boxes.length; b++) {
        if (boxes[a].at !== boxes[b].at) {
          const x = Math.min(boxes[a].r.right, boxes[b].r.right) - Math.max(boxes[a].r.left, boxes[b].r.left);
          if (x > 6) overlapIssues.push(`step ${i}: ${x.toFixed(0)}px`);
        }
      }
      if (shots && i === Math.min(5, total - 2)) await page.screenshot({ path: `${shots}/${label}-${c.id}-mid.png`, fullPage: false });
      if (i < total - 1) await page.keyboard.press("ArrowRight");
    }
    check(`${tag}: ${total} steps, no bad values in the narration`, bad.length === 0, bad.slice(0, 2).join(" | "));
    check(`${tag}: narration changes along the run`, seen.size >= Math.min(4, total), `${seen.size} different lines`);
    check(`${tag}: actors on different cells never overlap`, overlapIssues.length === 0, overlapIssues.slice(0, 3).join(" | "));
    check(`${tag}: the last step shows the result and the moral`, c.final.test(await page.getByTestId("story-banner").innerText()) && (await page.getByTestId("story-moral").count()) === 1, await page.getByTestId("story-banner").innerText());
    if (shots) await page.screenshot({ path: `${shots}/${label}-${c.id}-end.png`, fullPage: false });
    const pageScroll = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    check(`${tag}: no sideways scrolling of the page`, !pageScroll);
    if (label === "phone") {
      const fit = await page.getByTestId("story-scroll").evaluate((el) => ({ scale: Number(el.dataset.scale), sideways: el.scrollWidth > el.clientWidth + 1 }));
      check(`${tag}: the scene shrinks to fit the phone, so both characters stay in view`, fit.scale < 1 && !fit.sideways, JSON.stringify(fit));
    }
    await axeCheck(page, tag);
    // the standard visualization is still there
    check(`${tag}: the normal visualization is still shown`, (await page.getByTestId("state-text").count()) === 1);
  }
  // hide and show, remembered across a reload
  await page.goto(`${base}/algorithms/two-sum-sorted`, { waitUntil: "load" });
  await page.getByRole("button", { name: "Hide the story" }).click();
  check(`${label}: hiding the story hides the scene`, !(await page.getByTestId("story-says").isVisible()));
  await page.reload({ waitUntil: "load" });
  await page.getByTestId("story").waitFor();
  await page.waitForTimeout(300);
  check(`${label}: the choice is remembered after a reload`, !(await page.getByTestId("story-says").isVisible()));
  await page.getByRole("button", { name: "Show the story" }).click();
  check(`${label}: showing it again works`, await page.getByTestId("story-says").isVisible());
  check(`${label}: no page errors`, errors.length === 0, errors.join(" | "));
  await ctx.close();
}
await browser.close();
console.log(failed === 0 ? "\nALL PASSED" : `\n${failed} FAILED`);
process.exit(failed === 0 ? 0 : 1);
