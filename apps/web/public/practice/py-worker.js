/* Runs learner Python (Pyodide, served from this site) off the main thread so an infinite loop can be stopped by terminating
 * this worker. Same caveats as js-worker.js: no page access, network switched off as a best effort, not a security boundary. */
"use strict";

importScripts("/pyodide/pyodide.js");

let pyodide = null;
let logs = [];
const note = (line) => { if (logs.join("\n").length < 2000) logs.push(line); };

async function boot() {
  pyodide = await loadPyodide({ indexURL: "/pyodide/" });
  pyodide.setStdout({ batched: note });
  pyodide.setStderr({ batched: note });
  const prelude = await (await fetch("/practice/prelude.py")).text();
  pyodide.runPython(prelude);
  // Network off for learner code (Python's `js` module reaches these globals at call time).
  for (const name of ["fetch", "XMLHttpRequest", "WebSocket", "EventSource", "importScripts", "indexedDB", "caches", "BroadcastChannel"]) {
    try { Object.defineProperty(self, name, { value: undefined, configurable: false, writable: false }); } catch { /* already locked */ }
  }
}

const trimError = (text) => {
  const lines = String(text).trim().split("\n").filter((l) => !/^\s*File "(\/lib\/python|<exec>)/.test(l) && !l.includes("pyodide/"));
  return lines.slice(-4).join("\n");
};

const ready = boot().then(
  () => self.postMessage({ type: "loaded" }),
  (error) => self.postMessage({ type: "load-error", message: String(error && error.message ? error.message : error) }),
);

self.onmessage = async (event) => {
  const msg = event.data;
  if (msg.type !== "run") return;
  await ready;
  if (!pyodide) return;
  let fn;
  try {
    pyodide.globals.set("_av_source", msg.source);
    pyodide.globals.set("_av_fn_name", msg.fn);
    fn = pyodide.runPython("_av_define(_av_source, _av_fn_name)");
  } catch (error) {
    self.postMessage({ type: "setup-error", message: trimError(error && error.message ? error.message : error) });
    return;
  }
  self.postMessage({ type: "ready" });
  const call = pyodide.globals.get("_av_call");
  for (let i = 0; i < msg.cases.length; i++) {
    self.postMessage({ type: "start", i });
    logs = [];
    const started = performance.now();
    try {
      const json = call(fn, JSON.stringify(msg.cases[i].args), msg.adapter || null, !!msg.wantList);
      self.postMessage({ type: "result", i, ok: true, value: JSON.parse(json), stdout: logs.join("\n"), ms: performance.now() - started });
    } catch (error) {
      self.postMessage({ type: "result", i, ok: false, message: trimError(error && error.message ? error.message : error), stdout: logs.join("\n"), ms: performance.now() - started });
    }
  }
  self.postMessage({ type: "done" });
};
