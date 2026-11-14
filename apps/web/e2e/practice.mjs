/**
 * Real-browser check of the in-browser code practice (milestone 12) on a production build, with real Web Workers and real Pyodide.
 *   node e2e/practice.mjs http://localhost:3100 [--quick]
 * Python: the reference solution of every algorithm (or the practice-wrappers version where an algorithm has a practice override)
 * is typed into the editor and run, so every test list, the prelude classes and the in-place rules are exercised for real.
 * JavaScript: a handful of hand-written solutions plus the failure modes (syntax error, thrown error, infinite loop, wrong answer).
 */
import { createRequire } from "node:module";
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const base = process.argv[2] ?? "http://localhost:3100";
const quick = process.argv.includes("--quick");
const root = join(dirname(fileURLToPath(import.meta.url)), "../../../packages/algorithms");
let failed = 0;
const check = (name, ok, detail = "") => {
  if (!ok) failed++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  - " + detail : ""}`);
};

const ids = readdirSync(join(root, "content")).filter((d) => { try { readFileSync(join(root, "content", d, "algorithm.json")); return true; } catch { return false; } }).sort();
const wrappers = readFileSync(join(root, "test/practice-wrappers.py"), "utf8");
const overridden = (id) => "practice" in JSON.parse(readFileSync(join(root, "content", id, "algorithm.json"), "utf8"));
const pythonFor = (id) => (overridden(id) ? wrappers : readFileSync(join(root, "content", id, "solution.py"), "utf8"));

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1200, height: 900 } });
const page = await ctx.newPage();
const problems = [];
page.on("pageerror", (e) => problems.push(String(e)));
page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource|\/api\/v1\//.test(m.text())) problems.push(m.text()); });

async function open(id) { await page.goto(`${base}/practice/${id}`, { waitUntil: "load" }); await page.locator("#code-editor").waitFor(); }
async function runCode(lang, code, timeout = 90000) {
  await page.getByRole("button", { name: lang === "python" ? "Python" : "JavaScript", exact: true }).click();
  await page.locator("#code-editor").fill(code);
  await page.getByRole("button", { name: "Run tests" }).click();
  await page.getByRole("button", { name: "Run tests" }).waitFor({ timeout });
  const summary = (await page.getByTestId("practice-summary").innerText()).trim();
  const rows = await page.locator("tbody tr").allInnerTexts();
  return { summary, rows, total: rows.length };
}
const allPass = (r) => new RegExp(`^${r.total} of ${r.total} tests passed`).test(r.summary) && r.total >= 5;

// ---- JavaScript
await open("binary-search");
let r = await runCode("javascript", `function binarySearch(values, target) {
  let lo = 0, hi = values.length - 1;
  while (lo <= hi) { const mid = (lo + hi) >> 1; if (values[mid] === target) return mid; if (values[mid] < target) lo = mid + 1; else hi = mid - 1; }
  return -1;
}`);
check("JS: correct binary search passes every test", allPass(r), r.summary);
r = await runCode("javascript", `function binarySearch(values, target) { return values.indexOf(target) + 1; }`);
check("JS: wrong answer is reported as a failure with expected and got", /tests passed/.test(r.summary) && !allPass(r) && r.rows.some((x) => /Wrong answer/.test(x)), r.summary);
r = await runCode("javascript", `function binarySearch(values, target) { throw new Error("boom"); }`);
check("JS: a thrown error is shown per test", r.rows.every((x) => /Error/.test(x) && /boom/.test(x)), r.rows[0]);
r = await runCode("javascript", `function binarySearch(values, target) { return ; `);
check("JS: a syntax error is reported before any test runs", /could not be loaded/.test(r.summary) && (await page.getByTestId("practice-alert").innerText()).length > 10);
r = await runCode("javascript", `const x = 1;`);
check("JS: no function defined is reported", /could not be loaded/.test(r.summary) && /binarySearch/.test(await page.getByTestId("practice-alert").innerText()));
const t0 = Date.now();
r = await runCode("javascript", `function binarySearch(values, target) { while (true) {} }`);
check("JS: an infinite loop is stopped and reported as timed out", r.rows[0] && /Timed out/.test(r.rows[0]) && r.rows.slice(1).every((x) => /Not run/.test(x)), `${Date.now() - t0} ms`);
r = await runCode("javascript", `function binarySearch(values, target) { console.log("hi", target); return values.indexOf(target); }`);
check("JS: recovers after a timeout and captures console output", allPass(r) && (await page.getByText("Console output").isVisible()), r.summary);
r = await runCode("javascript", `function binarySearch(values, target) { return typeof fetch === "undefined" && typeof XMLHttpRequest === "undefined" ? values.indexOf(target) : -999; }`);
check("JS: network APIs are not available to learner code", allPass(r), r.summary);

await open("bubble-sort");
r = await runCode("javascript", `function bubbleSort(values) { values.sort((a, b) => a - b); }`);
check("JS: sorting in place without returning passes", allPass(r), r.summary);
await open("remove-duplicates-sorted");
r = await runCode("javascript", `function removeDuplicates(values) { let k = 0; for (let i = 0; i < values.length; i++) if (i === 0 || values[i] !== values[i - 1]) values[k++] = values[i]; return k; }`);
check("JS: returning the new length k is checked against the first k values", allPass(r), r.summary);
await open("linked-list-reverse");
r = await runCode("javascript", `function reverseList(head) { let prev = null; while (head) { const n = head.next; head.next = prev; prev = head; head = n; } return prev; }`);
check("JS: linked list reversal using ListNode", allPass(r), r.summary);
await open("tree-height");
r = await runCode("javascript", `function treeHeight(root) { return root ? 1 + Math.max(treeHeight(root.left), treeHeight(root.right)) : 0; }`);
check("JS: tree height using TreeNode", allPass(r), r.summary);
await open("fibonacci-dp");
r = await runCode("javascript", `function fib(n) { let a = 0, b = 1; for (let i = 0; i < n; i++) [a, b] = [b, a + b]; return a; }`);
check("JS: fibonacci passes", allPass(r), r.summary);

// ---- Drafts and solved marks survive a reload
await open("binary-search");
await page.getByRole("button", { name: "JavaScript", exact: true }).click();
await page.locator("#code-editor").fill("// my draft\nfunction binarySearch(v, t) { return values.indexOf(t); }");
await page.reload({ waitUntil: "load" });
await page.getByRole("button", { name: "JavaScript", exact: true }).click();
check("draft is restored after reload", (await page.locator("#code-editor").inputValue()).includes("// my draft"));
await open("fibonacci-dp");
check("solved mark shows on the problem page", await page.getByText("✓ Solved").first().isVisible());
await page.goto(`${base}/practice`, { waitUntil: "load" });
check("practice index lists every algorithm", (await page.locator('main a[href^="/practice/"]').count()) === ids.length, String(await page.locator('main a[href^="/practice/"]').count()));
check("practice index marks solved problems", await page.getByText("✓ Solved").first().waitFor({ timeout: 5000 }).then(() => true, () => false));

// ---- Python
await open("binary-search");
const tp = Date.now();
r = await runCode("python", `def binary_search(values, target):\n    while True:\n        pass\n`, 120000);
check("Python: an infinite loop is stopped and reported as timed out", r.rows[0] && /Timed out/.test(r.rows[0]), `${Date.now() - tp} ms`);
r = await runCode("python", pythonFor("binary-search"));
check("Python: runs again after a timeout", allPass(r), r.summary);
r = await runCode("python", `def binary_search(values, target):\n    return 1 / 0\n`);
check("Python: a runtime error shows the exception", r.rows.every((x) => /ZeroDivisionError/.test(x)), r.rows[0]);
r = await runCode("python", `def binary_search(values, target)\n    return 0\n`);
check("Python: a syntax error is reported", /could not be loaded/.test(r.summary));

const list = quick ? ids.filter((_, i) => i % 12 === 0) : ids;
const bad = [];
for (const id of list) {
  await open(id);
  const res = await runCode("python", pythonFor(id), 120000);
  if (!allPass(res)) bad.push(`${id}: ${res.summary} ${res.rows.find((x) => !/Passed/.test(x)) ?? ""}`.slice(0, 220));
}
check(`Python: reference solutions pass all tests for ${list.length} algorithms`, bad.length === 0, bad.slice(0, 6).join(" | "));

// ---- Layout on a phone
const phone = await browser.newContext({ viewport: { width: 375, height: 800 } });
const pp = await phone.newPage();
for (const path of ["/practice", "/practice/binary-search", "/practice/linked-list-reverse"]) {
  await pp.goto(base + path, { waitUntil: "load" });
  if (path !== "/practice") { await pp.getByRole("button", { name: "JavaScript", exact: true }).click(); await pp.locator("#code-editor").fill("function binarySearch(v,t){return v.indexOf(t)}"); await pp.getByRole("button", { name: "Run tests" }).click(); await pp.locator("tbody tr").first().waitFor(); }
  const over = await pp.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  check(`phone: ${path} has no sideways page scroll`, over <= 0, `${over}px`);
}

check("no console or page errors", problems.length === 0, problems.slice(0, 3).join(" | "));
await browser.close();
console.log(failed ? `\n${failed} FAILED` : "\nall practice checks passed");
process.exit(failed ? 1 : 0);
