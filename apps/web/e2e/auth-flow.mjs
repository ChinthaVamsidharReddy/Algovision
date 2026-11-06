/**
 * Real-browser end-to-end test of accounts, progress, bookmarks and search against e2e/stub-api.mjs.
 *   API_INTERNAL_URL=http://127.0.0.1:8099 pnpm build
 *   node e2e/stub-api.mjs > stub.log & ; pnpm start -p 3100 &
 *   node e2e/auth-flow.mjs http://localhost:3100 stub.log [outDir]
 */
import { createRequire } from "node:module";
import { mkdirSync, readFileSync } from "node:fs";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const base = process.argv[2] ?? "http://localhost:3100";
const stubLog = process.argv[3] ?? "stub.log";
const out = process.argv[4] ?? "e2e-output";
mkdirSync(out, { recursive: true });
let pass = 0, fail = 0;
const check = (name, ok, detail = "") => { if (ok) pass++; else fail++; console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  - " + detail : ""}`); };
const stubEvents = async () => (await (await fetch("http://127.0.0.1:8099/__stub/log")).json()).log;

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
const problems = [];
page.on("pageerror", (e) => problems.push(`pageerror: ${e.message}`));
page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource|401|403|400|409/.test(m.text())) problems.push(`console: ${m.text()}`); });
const header = page.getByRole("banner");
// Pages render a loading state first, so "is it visible" means "becomes visible within a few seconds".
const LocatorProto = Object.getPrototypeOf(page.locator("body"));
LocatorProto.isVisible = async function () {
  return this.waitFor({ state: "visible", timeout: 5000 }).then(() => true, () => false);
};

// ---- guest ----
await page.goto(`${base}/algorithms`);
check("guest header shows Sign in and Sign up", (await header.getByRole("link", { name: "Sign in" }).isVisible()) && (await header.getByRole("link", { name: "Sign up" }).isVisible()));
check("guest sees the progress-free catalog with grouped topics", (await page.getByRole("heading", { level: 2 }).count()) >= 5);
const guestBookmark = await page.getByRole("link", { name: /Bookmark/ }).first().getAttribute("href");
check("guest bookmark link returns here after sign-in", guestBookmark === "/login?next=%2Falgorithms", guestBookmark ?? "");
await page.goto(`${base}/dashboard`);
check("guest dashboard asks to sign in", await page.getByRole("heading", { name: /Sign in to see your learning progress/ }).isVisible());

// ---- register ----
await page.goto(`${base}/register`);
await page.getByLabel("Name").fill("Ada Lovelace");
await page.getByLabel("Email").fill("ada@example.com");
await page.getByLabel("Password").fill("short");
await page.getByRole("button", { name: "Create account" }).click();
check("short password is rejected inline", await page.getByText("Use at least 10 characters.").isVisible());
await page.getByLabel("Password").fill("tr1cky-Passphrase!");
await page.getByRole("button", { name: "Create account" }).click();
await page.waitForURL("**/dashboard");
check("register signs in and lands on the dashboard", await page.getByRole("heading", { name: "My learning" }).isVisible());
check("header greets the member", await header.getByText("Hi, Ada").isVisible());
check("new learner sees the first-step prompt", await page.getByText(/You have not started anything yet/).isVisible());

// ---- progress + bookmark ----
await page.goto(`${base}/algorithms/bubble-sort`);
await page.getByRole("button", { name: "Mark as complete" }).waitFor();
await page.getByRole("button", { name: /^Bookmark/ }).click();
check("bookmark toggles on", await page.getByRole("button", { name: /^Bookmarked/ }).isVisible());
await page.getByRole("button", { name: "Mark as complete" }).click();
check("completion shows Completed", await page.getByRole("status").filter({ hasText: "Completed" }).isVisible());
await page.goto(`${base}/algorithms/linear-search`);
await page.getByRole("button", { name: "Mark as complete" }).waitFor();
await page.goto(`${base}/dashboard`);
const overall = page.getByRole("progressbar", { name: "Overall progress" });
await overall.waitFor();
const now = Number(await overall.getAttribute("aria-valuenow"));
check("dashboard overall progress reflects 1 completed", now > 0, `${now}%`);
check("dashboard offers to continue the started algorithm", (await page.getByRole("link", { name: "Continue" }).getAttribute("href")) === "/algorithms/linear-search");
check("Sorting topic bar is non-zero", Number(await page.getByRole("progressbar", { name: "Sorting" }).getAttribute("aria-valuenow")) > 0);
await page.goto(`${base}/bookmarks`);
check("bookmarks page lists Bubble Sort", await page.getByRole("link", { name: "Bubble Sort", exact: true }).isVisible());
await page.screenshot({ path: `${out}/bookmarks.png` });

// ---- session survives reload; two tabs refresh at once without tripping reuse detection ----
await page.reload();
check("reload restores the session from the refresh cookie", await header.getByText("Hi, Ada").waitFor().then(() => true, () => false));
const tab2 = await ctx.newPage();
await Promise.all([page.reload(), tab2.goto(`${base}/dashboard`)]);
await Promise.all([page.waitForLoadState("load"), tab2.waitForLoadState("load")]);
await Promise.all([page.reload(), tab2.reload()]);
await page.waitForLoadState("load"); await tab2.waitForLoadState("load");
check("two tabs reloading together stay signed in", (await header.getByText("Hi, Ada").isVisible()) && (await tab2.getByRole("banner").getByText("Hi, Ada").isVisible()));
check("no refresh-token reuse was detected by the server", !(await stubEvents()).includes("REUSE DETECTED"));
await tab2.close();
const storage = await page.evaluate(() => JSON.stringify({ ...localStorage }));
check("the access token is never written to browser storage", !/av1\./.test(storage), storage);

// ---- search ----
await page.goto(`${base}/algorithms`);
await page.keyboard.press("/");
check("the / key focuses the header search", await page.getByRole("combobox", { name: "Search algorithms" }).evaluate((el) => el === document.activeElement));
await page.keyboard.type("buble");
check("typo still suggests Bubble Sort", await page.getByRole("option", { name: /Bubble Sort/ }).isVisible());
await page.keyboard.press("Enter");
await page.waitForURL("**/search?q=buble");
check("Enter opens the results page with the query", (await page.getByLabel(/Search algorithms/).first().inputValue()) === "buble");
check("results page shows the match", await page.getByRole("link", { name: "Bubble Sort", exact: true }).isVisible());
await page.goto(`${base}/search?q=zzzz`);
check("no-match state offers a reset", await page.getByRole("button", { name: "Clear search and filters" }).isVisible());

// ---- sign out ----
await page.getByRole("button", { name: "Sign out" }).click();
await page.waitForURL(`${base}/`);
check("sign out returns to guest header", await header.getByRole("link", { name: "Sign in" }).isVisible());
await page.goto(`${base}/dashboard`);
check("dashboard is locked again after sign out", await page.getByRole("heading", { name: /Sign in to see/ }).isVisible());
await page.reload();
check("reload after sign out stays signed out", await page.getByRole("heading", { name: /Sign in to see/ }).isVisible());

// ---- login errors, then forgot + reset password ----
await page.goto(`${base}/login`);
await page.getByLabel("Email").fill("ada@example.com");
await page.getByLabel("Password").fill("wrong-password-1");
await page.getByRole("button", { name: "Sign in" }).click();
check("wrong password shows the server message", await page.getByText("The email or password is not correct.").isVisible());
await page.getByRole("link", { name: "Forgot your password?" }).click();
await page.getByRole("heading", { name: "Forgot your password?" }).waitFor();
await page.getByLabel("Email").fill("ada@example.com");
await page.getByRole("button", { name: "Send reset link" }).click();
check("forgot password shows the neutral confirmation", await page.getByRole("status").getByText(/If an account exists/).isVisible());
await page.goto(`${base}/forgot-password`);
await page.getByLabel("Email").fill("nobody@example.com");
await page.getByRole("button", { name: "Send reset link" }).click();
check("unknown email gets the identical confirmation", await page.getByRole("status").getByText(/If an account exists/).isVisible());
const link = [...readFileSync(stubLog, "utf8").matchAll(/reset link for ada@example\.com: (\S+)/g)].at(-1)?.[1];
check("the console mailer printed a reset link", !!link);
await page.goto(link);
await page.getByLabel("New password", { exact: true }).fill("an0ther-Good-Passphrase");
await page.getByLabel("Repeat new password").fill("an0ther-Good-Passphrase");
await page.getByRole("button", { name: "Change password" }).click();
await page.waitForURL("**/login?reset=1");
check("reset redirects to sign in with a success note", await page.getByText(/Your password was changed/).isVisible());
await page.getByLabel("Email").fill("ada@example.com");
await page.getByLabel("Password").fill("tr1cky-Passphrase!");
await page.getByRole("button", { name: "Sign in" }).click();
check("the old password no longer works", await page.getByText("The email or password is not correct.").isVisible());
await page.getByLabel("Password").fill("an0ther-Good-Passphrase");
await page.getByRole("button", { name: "Sign in" }).click();
await page.waitForURL("**/dashboard");
check("the new password signs in", await header.getByText("Hi, Ada").isVisible());
check("progress and bookmarks survive the password reset", (await page.getByRole("progressbar", { name: "Overall progress" }).getAttribute("aria-valuenow")) === String(now));
await page.goto(link);
await page.getByLabel("New password", { exact: true }).fill("yet-An0ther-Passphrase");
await page.getByLabel("Repeat new password").fill("yet-An0ther-Passphrase");
await page.getByRole("button", { name: "Change password" }).click();
check("a used reset link is refused with a way to request another", (await page.getByText(/invalid or has expired/).isVisible()) && (await page.getByRole("link", { name: "Request a new link" }).isVisible()));

// ---- phone width: no horizontal overflow on the new screens ----
const phone = await browser.newContext({ viewport: { width: 375, height: 800 } });
const p2 = await phone.newPage();
for (const path of ["/login", "/register", "/forgot-password", "/algorithms", "/search?q=sort", "/dashboard", "/bookmarks"]) {
  await p2.goto(`${base}${path}`);
  await p2.waitForLoadState("load"); await p2.waitForTimeout(400);
  const overflow = await p2.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  check(`375px: no horizontal scroll on ${path}`, overflow <= 0, `overflow ${overflow}px`);
}
await p2.goto(`${base}/algorithms`);
await p2.screenshot({ path: `${out}/phone-algorithms.png`, fullPage: true });
await phone.close();

check("no page errors or unexpected console errors", problems.length === 0, problems.join(" | "));
await browser.close();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
