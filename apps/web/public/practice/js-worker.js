/* Runs learner JavaScript off the page's main thread so an infinite loop can be stopped by terminating this worker.
 * It has no access to the page, cookies or storage. Network APIs are switched off as a best-effort guard; this is a convenience
 * for the learner's own browser, not a security boundary against code they choose to run themselves. */
"use strict";

class ListNode {
  constructor(val = 0, next = null) { this.val = val; this.next = next; }
}
class TreeNode {
  constructor(val = 0, left = null, right = null) { this.val = val; this.left = left; this.right = right; }
}

const LIMIT = 100000;
const buildList = (values) => { let head = null; for (let i = values.length - 1; i >= 0; i--) head = new ListNode(values[i], head); return head; };
const buildTree = (values) => {
  let root = null;
  for (const v of values) {
    const node = new TreeNode(v);
    if (root === null) { root = node; continue; }
    let cur = root;
    for (;;) {
      if (v < cur.val) { if (cur.left === null) { cur.left = node; break; } cur = cur.left; }
      else { if (cur.right === null) { cur.right = node; break; } cur = cur.right; }
    }
  }
  return root;
};
const prepare = (adapter, args) => {
  const out = args.slice();
  if (adapter === "list" && out.length) out[0] = buildList(out[0]);
  else if (adapter === "tree" && out.length) out[0] = buildTree(out[0]);
  return out;
};
const valuesOf = (adapter, node) => {
  const out = [];
  if (adapter === "list") {
    while (node) { out.push(node.val); node = node.next; if (out.length > LIMIT) throw new Error("The list you returned is too long or loops back on itself."); }
    return out;
  }
  const stack = [];
  while (stack.length || node) {
    while (node) { stack.push(node); node = node.left; if (stack.length > LIMIT) throw new Error("The tree you returned is too deep or loops back on itself."); }
    node = stack.pop();
    out.push(node.val);
    node = node.right;
    if (out.length > LIMIT) throw new Error("The tree you returned is too big or loops back on itself.");
  }
  return out;
};
const isNode = (v) => v instanceof ListNode || v instanceof TreeNode;
const outcome = (adapter, wantList, returned, args) => {
  if (typeof returned === "boolean") return returned ? 1 : 0;
  if (adapter && wantList && (returned === null || returned === undefined || isNode(returned))) return valuesOf(adapter, returned);
  if (wantList && !adapter && args.length && Array.isArray(args[0])) {
    if (returned === undefined || returned === null) return args[0];
    if (Number.isInteger(returned) && returned >= 0 && returned <= args[0].length) return args[0].slice(0, returned);
  }
  return returned;
};

let logs = [];
const capture = (...parts) => {
  const line = parts.map((p) => { try { return typeof p === "string" ? p : JSON.stringify(p); } catch { return String(p); } }).join(" ");
  if (logs.join("\n").length < 2000) logs.push(line);
};
for (const name of ["log", "info", "warn", "error", "debug"]) console[name] = capture;

for (const name of ["fetch", "XMLHttpRequest", "WebSocket", "EventSource", "importScripts", "indexedDB", "caches", "BroadcastChannel"]) {
  try { Object.defineProperty(self, name, { value: undefined, configurable: false, writable: false }); } catch { /* already locked */ }
}

self.onmessage = (event) => {
  const msg = event.data;
  if (msg.type !== "run") return;
  let fn;
  try {
    fn = new Function("ListNode", "TreeNode", msg.source + "\n;return typeof " + msg.fn + " === 'function' ? " + msg.fn + " : undefined;")(ListNode, TreeNode);
    if (typeof fn !== "function") throw new ReferenceError("Define a function named " + msg.fn + " (found nothing with that name).");
  } catch (error) {
    self.postMessage({ type: "setup-error", message: String(error && error.message ? error.message : error), name: error && error.name ? error.name : "Error" });
    return;
  }
  self.postMessage({ type: "ready" });
  msg.cases.forEach((c, i) => {
    self.postMessage({ type: "start", i });
    logs = [];
    const started = performance.now();
    try {
      const args = prepare(msg.adapter, JSON.parse(JSON.stringify(c.args)));
      const returned = fn(...args);
      const value = outcome(msg.adapter, msg.wantList, returned, args);
      let safe;
      try { safe = JSON.parse(JSON.stringify(value === undefined ? null : value)); } catch { throw new TypeError("Your function returned something that cannot be compared. Return a number or a list of numbers."); }
      self.postMessage({ type: "result", i, ok: true, value: safe, returnedNothing: value === undefined, stdout: logs.join("\n"), ms: performance.now() - started });
    } catch (error) {
      self.postMessage({ type: "result", i, ok: false, message: (error && error.name ? error.name + ": " : "") + (error && error.message ? error.message : String(error)), stdout: logs.join("\n"), ms: performance.now() - started });
    }
  });
  self.postMessage({ type: "done" });
};
self.postMessage({ type: "loaded" });
