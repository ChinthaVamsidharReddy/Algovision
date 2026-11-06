import { describe, expect, it, vi } from "vitest";
import { ApiError } from "../src/lib/api";
import { LearningClient, type ProgressEntry } from "../src/lib/learning-client";
import { summarize } from "../src/lib/progress";

type Req = (path: string, options?: { method?: string; body?: unknown }) => Promise<unknown>;
const entry = (slug: string, status: "IN_PROGRESS" | "COMPLETED", last = "2026-01-02T00:00:00Z"): ProgressEntry => ({
  algorithmSlug: slug, status, lastLanguage: "java", firstViewedAt: "2026-01-01T00:00:00Z", lastViewedAt: last, completedAt: status === "COMPLETED" ? last : null,
});
function make(handler: Req) {
  const request = vi.fn(handler);
  return { request, client: new LearningClient({ request: request as never }, () => Date.parse("2026-02-01T00:00:00Z")) };
}
const loader: Req = async (path) => {
  if (path === "/api/v1/me/progress") return { progress: [entry("bubble-sort", "COMPLETED"), entry("linear-search", "IN_PROGRESS")] };
  if (path === "/api/v1/me/bookmarks") return { bookmarks: [{ algorithmSlug: "binary-search", name: "Binary Search", createdAt: "x" }] };
  return undefined;
};
const fail = (status = 500) => new ApiError("Boom", status, { code: "X" }, false);

describe("LearningClient", () => {
  it("loads progress and bookmarks", async () => {
    const { client } = make(loader);
    await client.load();
    const s = client.getState();
    expect(s.status).toBe("ready");
    expect(s.progress.get("bubble-sort")?.status).toBe("COMPLETED");
    expect(s.bookmarks.has("binary-search")).toBe(true);
  });

  it("reports a load failure and can retry", async () => {
    let ok = false;
    const { client } = make(async (p, o) => (ok ? loader(p, o) : Promise.reject(fail())));
    await client.load();
    expect(client.getState()).toMatchObject({ status: "error", error: "Boom" });
    ok = true;
    await client.load();
    expect(client.getState().status).toBe("ready");
  });

  it("view() records once per slug and creates an in-progress entry", async () => {
    const { client, request } = make(loader);
    await client.load();
    await client.view("selection-sort", "python");
    await client.view("selection-sort", "python");
    const calls = request.mock.calls.filter((c) => String(c[0]).endsWith("/view"));
    expect(calls).toHaveLength(1);
    expect(calls[0]![1]).toEqual({ method: "POST", body: { language: "python" } });
    expect(client.getState().progress.get("selection-sort")?.status).toBe("IN_PROGRESS");
  });

  it("a failed view is silent and is retried next time", async () => {
    let n = 0;
    const { client } = make(async (p, o) => (p.endsWith("/view") && n++ === 0 ? Promise.reject(fail()) : loader(p, o)));
    await client.view("selection-sort", null);
    expect(client.getState().actionError).toBeNull();
    await client.view("selection-sort", null);
    expect(client.getState().progress.has("selection-sort")).toBe(true);
  });

  it("complete() updates immediately and keeps the first completion", async () => {
    let release: () => void = () => {};
    const gate = new Promise<void>((r) => (release = r));
    const { client, request } = make(async (p, o) => (p.endsWith("/complete") ? gate : loader(p, o)));
    await client.load();
    const done = client.complete("linear-search", "c");
    expect(client.getState().progress.get("linear-search")?.status).toBe("COMPLETED");
    expect(client.getState().pending.has("linear-search")).toBe(true);
    release();
    await done;
    expect(client.getState().pending.size).toBe(0);
    await client.complete("linear-search", "c");
    expect(request.mock.calls.filter((c) => String(c[0]).endsWith("/complete"))).toHaveLength(1);
  });

  it("a failed complete rolls back and explains why", async () => {
    const { client } = make(async (p, o) => (p.endsWith("/complete") ? Promise.reject(fail(503)) : loader(p, o)));
    await client.load();
    await client.complete("linear-search", "c");
    const s = client.getState();
    expect(s.progress.get("linear-search")?.status).toBe("IN_PROGRESS");
    expect(s.actionError).toBe("Boom");
    expect(s.pending.size).toBe(0);
  });

  it("a failed first-time complete removes the optimistic entry", async () => {
    const { client } = make(async (p, o) => (p.endsWith("/complete") ? Promise.reject(fail()) : loader(p, o)));
    await client.load();
    await client.complete("stack-push-pop", null);
    expect(client.getState().progress.has("stack-push-pop")).toBe(false);
  });

  it("toggleBookmark adds with PUT and removes with DELETE, optimistically", async () => {
    const { client, request } = make(loader);
    await client.load();
    await client.toggleBookmark("bubble-sort");
    expect(client.getState().bookmarks.has("bubble-sort")).toBe(true);
    await client.toggleBookmark("binary-search");
    expect(client.getState().bookmarks.has("binary-search")).toBe(false);
    const writes = request.mock.calls.filter((c) => c[1]).map((c) => `${(c[1] as { method: string }).method} ${c[0]}`);
    expect(writes).toEqual(["PUT /api/v1/me/bookmarks/bubble-sort", "DELETE /api/v1/me/bookmarks/binary-search"]);
  });

  it("a failed bookmark change rolls back", async () => {
    const { client } = make(async (p, o) => (o?.method ? Promise.reject(fail()) : loader(p, o)));
    await client.load();
    await client.toggleBookmark("bubble-sort");
    expect(client.getState().bookmarks.has("bubble-sort")).toBe(false);
    expect(client.getState().actionError).toBe("Boom");
    client.clearActionError();
    expect(client.getState().actionError).toBeNull();
  });

  it("ignores a second click while the first is still saving", async () => {
    let release: () => void = () => {};
    const gate = new Promise<void>((r) => (release = r));
    const { client, request } = make(async (p, o) => (o?.method ? gate : loader(p, o)));
    await client.load();
    const first = client.toggleBookmark("bubble-sort");
    await client.toggleBookmark("bubble-sort");
    release();
    await first;
    expect(request.mock.calls.filter((c) => c[1])).toHaveLength(1);
  });

  it("reset() clears state and discards late replies from the previous user", async () => {
    let release: (v: unknown) => void = () => {};
    const gate = new Promise((r) => (release = r));
    const { client } = make(async () => gate);
    const loading = client.load();
    client.reset();
    release({ progress: [entry("bubble-sort", "COMPLETED")], bookmarks: [] });
    await loading;
    expect(client.getState().status).toBe("idle");
    expect(client.getState().progress.size).toBe(0);
  });
});

describe("summarize", () => {
  const groups = [
    { id: "sorting", name: "Sorting", ids: ["bubble-sort", "selection-sort"] },
    { id: "searching", name: "Searching", ids: ["linear-search", "binary-search"] },
  ];
  it("counts completed against what exists and picks the latest unfinished to resume", () => {
    const progress = new Map<string, ProgressEntry>([
      ["bubble-sort", entry("bubble-sort", "COMPLETED")],
      ["linear-search", entry("linear-search", "IN_PROGRESS", "2026-01-05T00:00:00Z")],
      ["binary-search", entry("binary-search", "IN_PROGRESS", "2026-01-03T00:00:00Z")],
      ["removed-algo", entry("removed-algo", "COMPLETED")],
    ]);
    const s = summarize(groups, progress);
    expect(s.overall).toEqual({ done: 1, started: 2, total: 4, percent: 25 });
    expect(s.byCategory[0]!.tally.percent).toBe(50);
    expect(s.byCategory[1]!.tally).toMatchObject({ done: 0, started: 2 });
    expect(s.resume?.algorithmSlug).toBe("linear-search");
  });
  it("handles nothing started and an empty catalog without dividing by zero", () => {
    expect(summarize(groups, new Map()).overall.percent).toBe(0);
    expect(summarize(groups, new Map()).resume).toBeNull();
    expect(summarize([], new Map()).overall).toEqual({ done: 0, started: 0, total: 0, percent: 0 });
  });
});
