/**
 * Real-browser check of level, streak, badges and certificates (needs the stub API started with STUB_ALL_SLUGS=1).
 *   node e2e/engagement.mjs http://localhost:3100
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
const browser = await chromium.launch();
/** Runs axe (including colour contrast) on the current page in the light and the dark theme. */
async function axeCheck(page, name) {
  if (!(await page.evaluate(() => typeof window.axe)).startsWith("object")) await page.addScriptTag({ path: axePath });
  for (const theme of ["light", "dark"]) {
    await page.evaluate((t) => { document.documentElement.dataset.theme = t; }, theme);
    const r = await page.evaluate(async () => (await window.axe.run(document, { runOnly: ["wcag2a", "wcag2aa"] })).violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).slice(0, 3).join(" ; ")}`));
    check(`${name} (${theme} theme) has no accessibility or contrast violations`, r.length === 0, r.join(" | "));
  }
}
for (const [label, viewport] of [["desktop", { width: 1200, height: 900 }], ["phone", { width: 375, height: 800 }]]) {
  const ctx = await browser.newContext({ viewport });
  const page = await ctx.newPage();
  const problems = [];
  page.on("pageerror", (e) => problems.push(String(e)));
  page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) problems.push(m.text()); });
  const overflow = () => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  const email = `grace-${label}-${Date.now()}@example.com`;

  await page.goto(`${base}/register`);
  await page.getByLabel("Name").fill("Grace Hopper");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("tr1cky-Passphrase!");
  await page.getByRole("button", { name: /create account|register|sign up/i }).click();
  await page.getByRole("heading", { name: "My learning" }).waitFor();

  check(`${label}: a new learner starts at level 1 with no streak`, /Level 1/.test(await page.getByTestId("level").innerText()) && /^0 days/.test(await page.getByTestId("streak").innerText()));
  check(`${label}: dashboard has no sideways scroll`, (await overflow()) <= 0, `${await overflow()}px`);

  // Locked certificate before the path is done.
  await page.goto(`${base}/paths/strings/certificate`);
  await page.getByTestId("certificate-locked").waitFor();
  check(`${label}: certificate is locked until the path is complete`, await page.getByRole("heading", { name: "Certificate not earned yet" }).isVisible());

  // Complete the first step through the real button, then the rest of the path through the API the button uses.
  await page.goto(`${base}/paths/strings`);
  const steps = await page.locator("ol > li a.font-semibold").evaluateAll((as) => as.map((a) => a.getAttribute("href").split("/").pop()));
  await page.goto(`${base}/algorithms/${steps[0]}`);
  await page.getByRole("button", { name: "Mark as complete" }).waitFor({ timeout: 15000 }).catch(async () => console.log("buttons:", await page.getByRole("button").allInnerTexts(), page.url()));
  await page.getByRole("button", { name: "Mark as complete" }).click();
  await page.getByRole("status").filter({ hasText: "Completed" }).waitFor({ timeout: 15000 });
  const token = await page.evaluate(async () => (await (await fetch("/api/v1/auth/refresh", { method: "POST", credentials: "include", headers: { "X-AlgoVision-Client": "web" } })).json()).accessToken);
  for (const slug of steps.slice(1)) {
    const status = await page.evaluate(async ([s, t]) => (await fetch(`/api/v1/algorithms/${s}/complete`, { method: "POST", headers: { Authorization: `Bearer ${t}`, "Content-Type": "application/json", "X-AlgoVision-Client": "web" }, body: "{}" })).status, [slug, token]);
    if (status !== 204) check(`${label}: completing ${slug}`, false, String(status));
  }

  await page.goto(`${base}/dashboard`);
  await page.getByTestId("engagement").waitFor();
  const xp = await page.getByTestId("xp").innerText();
  const expected = steps.length * 5 + steps.length * 20 + 100;
  check(`${label}: XP adds up (${expected})`, xp.startsWith(`${expected} XP`), xp);
  check(`${label}: today counts as a one-day streak`, /^1 day/.test(await page.getByTestId("streak").innerText()));
  check(`${label}: badges are earned`, (await page.getByTestId("badges-earned").locator("li").count()) >= 3);
  check(`${label}: the certificate is listed`, await page.getByRole("link", { name: /Strings/ }).first().isVisible());
  check(`${label}: dashboard still has no sideways scroll`, (await overflow()) <= 0, `${await overflow()}px`);
  await page.getByText("Badges still to earn").click();
  await axeCheck(page, `${label}: dashboard`);

  await page.goto(`${base}/paths/strings/certificate`);
  await page.getByTestId("certificate").waitFor();
  check(`${label}: certificate shows the learner's name`, (await page.getByTestId("certificate-name").innerText()) === "Grace Hopper");
  check(`${label}: certificate shows a date`, /20\d\d/.test(await page.getByTestId("certificate-date").innerText()));
  check(`${label}: certificate has no sideways scroll`, (await overflow()) <= 0, `${await overflow()}px`);
  await axeCheck(page, `${label}: certificate`);
  await page.emulateMedia({ media: "print" });
  check(`${label}: print view hides the buttons`, !(await page.getByRole("button", { name: /Print/ }).isVisible()));
  await page.emulateMedia({ media: "screen" });
  check(`${label}: no page or console errors`, problems.length === 0, problems.join(" | "));
  await ctx.close();
}
await browser.close();
console.log(failed === 0 ? "all engagement checks passed" : `${failed} engagement check(s) FAILED`);
process.exit(failed === 0 ? 0 : 1);
