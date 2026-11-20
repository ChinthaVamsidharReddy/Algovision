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
  { id: "binary-search", query: "", final: /Found 23 on book 6/ },
  { id: "dutch-national-flag", query: "", final: /all reds, then whites, then blues/ },
  { id: "container-with-most-water", query: "", final: /biggest pond holds 40/ },
  { id: "reverse-in-place", query: "", final: /shelf is reversed/ },
  { id: "linear-search", query: "", final: /Found 4 in locker 4/ },
  { id: "bubble-sort", query: "", final: /Sorted from shortest to tallest/ },
  { id: "selection-sort", query: "", final: /Sorted from shortest to tallest/ },
  { id: "insertion-sort", query: "", final: /The hand is sorted/ },
  { id: "move-zeroes", query: "", final: /All passengers at the front/ },
  { id: "remove-duplicates-sorted", query: "", final: /4 different values kept/ },
  { id: "two-sum-hash", query: "", final: /Places 1 and 2 make 9/ },
  { id: "kadane-max-subarray", query: "", final: /best streak earns 6/ },
  // stories told over a chain of nodes (linked lists)
  { id: "linked-list-reverse", query: "", final: /line is reversed/, chain: true },
  { id: "linked-list-find-middle", query: "", final: /middle coach holds/, chain: true },
  { id: "linked-list-remove-nth-from-end", query: "", final: /Removed the coach holding/, chain: true },
  { id: "linked-list-search", query: "", final: /Found \d+ in coach number|not in the list/, chain: true },
  { id: "linked-list-insert-head", query: "", final: /is now at the front/, chain: true },
  { id: "linked-list-delete-value", query: "", final: /Removed the coach holding|nothing removed/, chain: true },
  // stories told over a binary tree
  { id: "binary-tree-inorder", query: "", final: /guest book reads/, chain: true },
  { id: "binary-tree-preorder", query: "", final: /hellos went in this order/, chain: true },
  { id: "binary-tree-postorder", query: "", final: /rooms were locked in this order/, chain: true },
  { id: "bst-search", query: "", final: /Found house \d+|not in the village/, chain: true },
  { id: "bst-insert", query: "", final: /was built/, chain: true },
  { id: "tree-height", query: "", final: /generations? tall/, chain: true },
  // stories told over a graph
  { id: "bfs-traversal", query: "", final: /rumor reached people in this order/, chain: true },
  { id: "dfs-traversal", query: "", final: /rooms were explored in this order/, chain: true },
  { id: "bfs-shortest-path", query: "", final: /Fewest stops from/, chain: true },
  { id: "dijkstra", query: "", final: /Cheapest cost from/, chain: true },
  { id: "topological-sort-kahn", query: "", final: /A valid order|No valid order/, chain: true },
  // stories told over a grid
  { id: "min-path-sum", query: "", final: /cheapest trip costs \d+/, chain: true },
  { id: "longest-common-subsequence", query: "", final: /playlists share \d+ songs?/, chain: true },
  { id: "edit-distance", query: "", final: /takes \d+ edits?|already the same/, chain: true },
  { id: "number-of-islands", query: "", final: /\d+ islands? counted/, chain: true },
  { id: "max-area-of-island", query: "", final: /biggest island has \d+ squares?/, chain: true },
  { id: "rotting-oranges", query: "", final: /rotten after \d+ minutes?|can never rot|0 minutes/, chain: true },
  { id: "spiral-order", query: "", final: /Spiral order: /, chain: true },
  { id: "stack-push-pop", query: "", final: /Left in the stack|The stack is empty/, chain: true },
  { id: "queue-enqueue-dequeue", query: "", final: /Still in the queue|The queue is empty/, chain: true },
  { id: "valid-parentheses", query: "", final: /Balanced|Not balanced/, chain: true },
  { id: "evaluate-postfix", query: "", final: /The expression equals -?\d+/, chain: true },
  { id: "next-greater-element", query: "", final: /The next taller height for each person/, chain: true },
  { id: "stock-span", query: "", final: /The streak for each day/, chain: true },
  { id: "largest-rectangle-histogram", query: "", final: /The biggest rectangle has area \d+/, chain: true },
  { id: "sliding-window-maximum", query: "", final: /The tallest in each window|no full window/, chain: true },
  { id: "heap-sort", query: "", final: /Sorted from smallest to largest/ },
  { id: "min-heap-build-insert", query: "", final: /The finished chart, top desk first/, chain: true },
  { id: "heapify-bottom-up", query: "", final: /The finished chart, top desk first/, chain: true },
  { id: "kth-largest-element", query: "", final: /largest value is -?\d+/, chain: true },
  { id: "level-order-traversal", query: "", final: /Floor by floor: /, chain: true },
  { id: "count-leaves", query: "", final: /dead-end houses?/, chain: true },
  { id: "bst-find-min-max", query: "", final: /Smallest -?\d+, largest -?\d+/, chain: true },
  { id: "avl-tree-insert", query: "", final: /\d+ levels? tall/, chain: true },
].filter((c) => !process.env.ONLY || process.env.ONLY.split(",").includes(c.id));
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
      const boxes = await page.locator('[data-testid^="actor-"]').evaluateAll((els) => els.map((e) => ({ at: e.dataset.at ?? e.dataset.node, r: e.getBoundingClientRect() })));
      for (let a = 0; a < boxes.length; a++) for (let b = a + 1; b < boxes.length; b++) {
        if (boxes[a].at !== boxes[b].at) {
          const x = Math.min(boxes[a].r.right, boxes[b].r.right) - Math.max(boxes[a].r.left, boxes[b].r.left);
          // chains can have several rows (detached nodes sit above), so characters only collide when they overlap on both axes
          const y = Math.min(boxes[a].r.bottom, boxes[b].r.bottom) - Math.max(boxes[a].r.top, boxes[b].r.top);
          if (x > 6 && y > 6) overlapIssues.push(`step ${i}: ${x.toFixed(0)}x${y.toFixed(0)}px`);
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
    if (label === "phone" && c.chain) {
      const fit = await page.getByTestId("story-scroll").evaluate((el) => ({ scale: Number(el.dataset.scale), nodes: el.querySelectorAll('[data-testid="story-node"]').length, empty: /\bempty\b/.test(el.textContent ?? ""), focusable: el.tabIndex === 0 }));
      check(`${tag}: the chain scene scales down on the phone and stays reachable`, (fit.nodes > 0 || fit.empty) && fit.scale <= 1 && fit.focusable, JSON.stringify(fit));
    } else if (label === "phone") {
      const fit = await page.getByTestId("story-scroll").evaluate((el) => ({ scale: Number(el.dataset.scale), sideways: el.scrollWidth > el.clientWidth + 1, cells: el.querySelectorAll('[data-testid="story-cell"]').length, focusable: el.tabIndex === 0 }));
      // Up to 7 cells fit a 375px phone at a readable size; wider scenes scroll sideways in a keyboard-focusable area.
      check(`${tag}: the scene fits the phone (up to 7 cells) or scrolls in a focusable area`, fit.cells <= 7 ? fit.scale < 1 && !fit.sideways : fit.focusable, JSON.stringify(fit));
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
