import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PracticeVector } from "@algovision/algorithms";
import { CASE_TIMEOUT_MS, gradeCase, runTests, stopAllRuntimes } from "../src/lib/practice/runner";
import { markSolved, readDraft, solvedIds, writeDraft } from "../src/lib/practice/storage";
import { PracticeWorkbench } from "../src/components/practice/practice-workbench";

/** A stand-in Web Worker that answers like the real worker script does, driven by a per-test handler. */
class FakeWorker {
  static instances: FakeWorker[] = [];
  static behaviour: (w: FakeWorker, msg: { cases: { name: string; args: unknown[] }[] }) => void = () => undefined;
  static loadFails = false;
  listeners = new Set<(e: MessageEvent) => void>();
  terminated = false;
  constructor(public url: string) {
    FakeWorker.instances.push(this);
    queueMicrotask(() => (FakeWorker.loadFails ? this.emit({ type: "load-error", message: "no network" }) : this.emit({ type: "loaded" })));
  }
  addEventListener(type: string, fn: (e: MessageEvent) => void) { if (type === "message") this.listeners.add(fn); }
  removeEventListener(type: string, fn: (e: MessageEvent) => void) { if (type === "message") this.listeners.delete(fn); }
  emit(data: unknown) { for (const l of [...this.listeners]) l({ data } as MessageEvent); }
  postMessage(msg: { cases: { name: string; args: unknown[] }[] }) { FakeWorker.behaviour(this, msg); }
  terminate() { this.terminated = true; }
}

const vectors: PracticeVector[] = [
  { name: "a", args: [[1, 2], 2], expected: 1 },
  { name: "b", args: [[3], 3], expected: 0 },
  { name: "c", args: [[], 1], expected: -1 },
];

beforeEach(() => {
  FakeWorker.instances = [];
  FakeWorker.loadFails = false;
  FakeWorker.behaviour = (w, msg) => msg.cases.forEach((_, i) => { w.emit({ type: "start", i }); w.emit({ type: "result", i, ok: true, value: vectors[i]!.expected, ms: 1 }); w.emit({ type: i === msg.cases.length - 1 ? "done" : "noop" }); });
  vi.stubGlobal("Worker", FakeWorker);
});
afterEach(() => { stopAllRuntimes(); vi.unstubAllGlobals(); vi.useRealTimers(); window.localStorage.clear(); });

describe("practice runner", () => {
  it("grades answers: booleans count as 0/1, lists and numbers are compared strictly", () => {
    const v = vectors[0]!;
    expect(gradeCase(v, { ok: true, value: 1 }).status).toBe("pass");
    expect(gradeCase(v, { ok: true, value: true }).status).toBe("pass");
    expect(gradeCase(v, { ok: true, value: 2 }).status).toBe("fail");
    expect(gradeCase(v, { ok: true, value: [1] }).status).toBe("fail");
    expect(gradeCase(v, { ok: false, message: "boom" })).toMatchObject({ status: "error", message: "boom" });
  });

  it("runs every test and reports each result", async () => {
    const seen: number[] = [];
    const { end, outcomes } = await runTests({ language: "javascript", source: "x", fn: "f", vectors }, { onCase: (i) => seen.push(i) });
    expect(end.kind).toBe("finished");
    expect(outcomes.map((o) => o.status)).toEqual(["pass", "pass", "pass"]);
    expect(seen).toEqual([0, 1, 2]);
  });

  it("reuses the worker between runs and uses the right script per language", async () => {
    await runTests({ language: "javascript", source: "x", fn: "f", vectors });
    await runTests({ language: "javascript", source: "x", fn: "f", vectors });
    await runTests({ language: "python", source: "x", fn: "f", vectors });
    expect(FakeWorker.instances.map((w) => w.url)).toEqual(["/practice/js-worker.js", "/practice/py-worker.js"]);
  });

  it("reports a setup error without running tests", async () => {
    FakeWorker.behaviour = (w) => w.emit({ type: "setup-error", message: "SyntaxError: nope" });
    const { end, outcomes } = await runTests({ language: "javascript", source: "x", fn: "f", vectors });
    expect(end).toEqual({ kind: "setup-error", message: "SyntaxError: nope" });
    expect(outcomes.every((o) => o.status === "skipped")).toBe(true);
  });

  it("reports a load failure, drops the broken worker and lets the next run start a fresh one", async () => {
    FakeWorker.loadFails = true;
    const first = await runTests({ language: "python", source: "x", fn: "f", vectors });
    expect(first.end).toEqual({ kind: "load-failed", message: "no network" });
    expect(FakeWorker.instances[0]!.terminated).toBe(true);
    FakeWorker.loadFails = false;
    const second = await runTests({ language: "python", source: "x", fn: "f", vectors });
    expect(second.end.kind).toBe("finished");
    expect(FakeWorker.instances).toHaveLength(2);
  });

  it("times out a test that never answers, terminates the worker and marks the rest as not run", async () => {
    FakeWorker.behaviour = (w) => w.emit({ type: "start", i: 1 });
    vi.useFakeTimers();
    const p = runTests({ language: "javascript", source: "x", fn: "f", vectors });
    await vi.advanceTimersByTimeAsync(CASE_TIMEOUT_MS.javascript + 10);
    const { end, outcomes } = await p;
    expect(end.kind).toBe("finished");
    expect(outcomes.map((o) => o.status)).toEqual(["skipped", "timeout", "skipped"]);
    expect(FakeWorker.instances[0]!.terminated).toBe(true);
  });

  it("stops when aborted", async () => {
    FakeWorker.behaviour = () => undefined;
    const c = new AbortController();
    const p = runTests({ language: "javascript", source: "x", fn: "f", vectors }, {}, c.signal);
    await Promise.resolve();
    await Promise.resolve();
    c.abort();
    expect((await p).end.kind).toBe("stopped");
  });
});

describe("practice storage", () => {
  it("keeps drafts and solved marks, and tolerates blocked storage", () => {
    writeDraft("x", "python", "code");
    markSolved("x");
    expect(readDraft("x", "python")).toBe("code");
    expect(solvedIds(["x", "y"])).toEqual(new Set(["x"]));
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("blocked"); });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("blocked"); });
    expect(readDraft("x", "python")).toBeNull();
    expect(() => writeDraft("x", "python", "y")).not.toThrow();
    expect(() => markSolved("x")).not.toThrow();
    vi.restoreAllMocks();
  });
});

const props = {
  id: "demo",
  title: "Demo",
  fns: { javascript: "demoFn", python: "demo_fn" },
  starters: { javascript: "// js starter\nfunction demoFn(values, target) {}\n", python: "# py starter\ndef demo_fn(values, target):\n    pass\n" },
  vectors,
};

describe("practice workbench", () => {
  it("runs the tests, shows a summary and results table, and marks the problem solved", async () => {
    const user = userEvent.setup();
    render(<PracticeWorkbench {...props} />);
    await user.click(screen.getByRole("button", { name: "Run tests" }));
    await waitFor(() => expect(screen.getByTestId("practice-summary")).toHaveTextContent("3 of 3 tests passed."));
    expect(screen.getAllByText(/Passed/)).toHaveLength(3);
    expect(screen.getByText("✓ Solved")).toBeInTheDocument();
    expect(readDraft("demo", "solved")).toBe("1");
  });

  it("shows wrong answers and errors per test and does not mark solved", async () => {
    FakeWorker.behaviour = (w, msg) => { msg.cases.forEach((_, i) => { w.emit({ type: "start", i }); w.emit(i === 0 ? { type: "result", i, ok: true, value: 99 } : { type: "result", i, ok: false, message: "TypeError: bad" }); }); w.emit({ type: "done" }); };
    const user = userEvent.setup();
    render(<PracticeWorkbench {...props} />);
    await user.click(screen.getByRole("button", { name: "Run tests" }));
    await waitFor(() => expect(screen.getByTestId("practice-summary")).toHaveTextContent("0 of 3 tests passed."));
    expect(screen.getByText(/Wrong answer/)).toBeInTheDocument();
    expect(screen.getAllByText(/TypeError: bad/)).toHaveLength(2);
    expect(screen.queryByText("✓ Solved")).toBeNull();
  });

  it("offers a retry when the runtime cannot load", async () => {
    FakeWorker.loadFails = true;
    const user = userEvent.setup();
    render(<PracticeWorkbench {...props} />);
    await user.click(screen.getByRole("button", { name: "Run tests" }));
    expect(await screen.findByText("no network")).toBeInTheDocument();
    FakeWorker.loadFails = false;
    await user.click(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(screen.getByTestId("practice-summary")).toHaveTextContent("3 of 3 tests passed."));
  });

  it("keeps a separate draft per language, restores it, and resets to the starter", async () => {
    window.localStorage.setItem("algovision.code.demo.python", "saved python");
    const user = userEvent.setup();
    render(<PracticeWorkbench {...props} />);
    const editor = screen.getByLabelText(/Demo solution in/) as HTMLTextAreaElement;
    await waitFor(() => expect(editor.value).toBe("saved python"));
    await user.click(screen.getByRole("button", { name: "JavaScript" }));
    expect(editor.value).toContain("// js starter");
    await user.click(screen.getByRole("button", { name: "Python" }));
    await user.click(screen.getByRole("button", { name: "Reset code" }));
    expect(editor.value).toContain("# py starter");
  });

  it("Tab inserts spaces, and Escape then Tab leaves the editor", async () => {
    const user = userEvent.setup();
    render(<PracticeWorkbench {...props} />);
    const editor = screen.getByLabelText(/Demo solution in/) as HTMLTextAreaElement;
    await user.click(editor);
    await user.clear(editor);
    await user.keyboard("{Tab}x");
    expect(editor.value).toBe("    x");
    await user.keyboard("{Escape}{Tab}");
    expect(editor).not.toHaveFocus();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<PracticeWorkbench {...props} />);
    await act(async () => undefined);
    const r = await axe.run(container, { rules: { "color-contrast": { enabled: false } } });
    expect(r.violations.map((v) => v.id)).toEqual([]);
  });
});
