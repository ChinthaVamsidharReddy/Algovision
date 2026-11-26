/**
 * Real-browser check of the AlgoMigo landing page, home page and footer (production build; stub API running).
 *   node e2e/brand.mjs http://localhost:3100 [screenshot-dir]
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
  // motion off, so no element is caught half-way through a fade (axe would measure its blended colour)
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.waitForTimeout(200);
  if (!(await page.evaluate(() => typeof window.axe)).startsWith("object")) await page.addScriptTag({ path: axePath });
  for (const theme of ["light", "dark"]) {
    await page.evaluate((t) => { document.documentElement.dataset.theme = t; }, theme);
    const r = await page.evaluate(async () => (await window.axe.run(document, { runOnly: ["wcag2a", "wcag2aa"] })).violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).slice(0, 3).join(" ; ")}`));
    check(`${name} (${theme}) has no accessibility or contrast violations`, r.length === 0, r.join(" | "));
  }
  await page.evaluate(() => { document.documentElement.dataset.theme = "light"; });
  await page.emulateMedia({ reducedMotion: "no-preference" });
}

const browser = await chromium.launch();
for (const [device, viewport] of [["desktop", { width: 1280, height: 900 }], ["phone", { width: 390, height: 800 }]]) {
  const ctx = await browser.newContext({ viewport });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));

  for (const path of ["/", "/home"]) {
    const tag = `${device} ${path}`;
    await page.goto(`${base}${path}`, { waitUntil: "load" });
    await page.waitForTimeout(1800);
    check(`${tag}: brand shown in the header`, (await page.locator("header").first().innerText()).includes("AlgoMigo"));
    check(`${tag}: no old name anywhere on the page`, !(await page.locator("body").innerText()).includes("AlgoVision"));
    check(`${tag}: title mentions AlgoMigo`, (await page.title()).includes("AlgoMigo"), await page.title());
    const sideways = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    check(`${tag}: no sideways scrolling`, !sideways);
    const h1 = await page.locator("h1").count();
    check(`${tag}: exactly one h1`, h1 === 1, String(h1));
    // scroll through so scroll-driven reveals run, then everything must be visible
    await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 400) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); } });
    await page.waitForTimeout(500);
    const hidden = await page.evaluate(() => [...document.querySelectorAll(".lp-reveal")].filter((e) => { const r = e.getBoundingClientRect(); return r.top < window.innerHeight && r.bottom > 0 && Number(getComputedStyle(e).opacity) < 0.99; }).length);
    check(`${tag}: revealed sections in view are fully visible`, hidden === 0, String(hidden));
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    const foot = page.getByRole("contentinfo");
    check(`${tag}: footer has copyright and country`, /© \d{4} AlgoMigo\. All rights reserved\./.test(await foot.innerText()) && /in India/.test(await foot.innerText()));
    check(`${tag}: footer social links open safely`, (await foot.locator('ul[aria-label="Social media"] a').evaluateAll((as) => as.every((a) => a.target === "_blank" && a.rel.includes("noopener")))));
    if (shots) {
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(300);
      await page.screenshot({ path: `${shots}/brand-${device}-${path === "/" ? "landing" : "home"}-top.png` });
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.screenshot({ path: `${shots}/brand-${device}-${path === "/" ? "landing" : "home"}-full.png`, fullPage: true });
      await page.emulateMedia({ reducedMotion: "no-preference" });
    }
    await axeCheck(page, tag);
  }

  // reduced motion switches the decoration off and keeps all content
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(`${base}/`, { waitUntil: "load" });
  const anim = await page.evaluate(() => [...document.querySelectorAll(".lp-word, .lp-bar, .lp-marquee-track, .lp-window")].filter((e) => getComputedStyle(e).animationName !== "none").length);
  check(`${device}: reduced motion turns the animations off`, anim === 0, String(anim));
  check(`${device}: reduced motion still shows the headline`, (await page.locator("h1").innerText()).includes("DSA"));
  await page.emulateMedia({ reducedMotion: "no-preference" });

  // navigation
  await page.goto(`${base}/`, { waitUntil: "load" });
  await page.getByRole("link", { name: /Start learning/ }).first().click();
  await page.waitForURL("**/home");
  check(`${device}: Start learning opens the home page`, page.url().endsWith("/home"));
  await page.getByRole("link", { name: /Browse algorithms/ }).first().click();
  await page.waitForURL("**/algorithms");
  check(`${device}: Browse algorithms opens the catalog`, page.url().endsWith("/algorithms"));
  await page.goto(`${base}/home`, { waitUntil: "load" });
  await page.locator('a[href^="/algorithms#cat-sorting"]').click();
  await page.waitForURL("**/algorithms#cat-sorting");
  await page.locator("#cat-sorting").waitFor({ timeout: 15000 });
  check(`${device}: a topic tile jumps to that topic`, (await page.locator("#cat-sorting").count()) === 1);
  await page.goto(`${base}/manifest.webmanifest`);
  check(`${device}: manifest uses the new name`, (await page.locator("body").innerText()).includes('"AlgoMigo"'));
  check(`${device}: no page errors`, errors.length === 0, errors.join(" | "));
  await ctx.close();
}
await browser.close();
console.log(failed === 0 ? "\nALL PASSED" : `\n${failed} FAILED`);
process.exit(failed === 0 ? 0 : 1);
