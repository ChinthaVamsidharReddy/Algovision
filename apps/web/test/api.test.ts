import { describe, expect, it, vi } from "vitest";
import { ApiError, apiFetch, apiJson, backoffDelay } from "../src/lib/api";

const res = (status: number, body?: unknown, headers: Record<string, string> = {}) =>
  new Response(body === undefined ? null : JSON.stringify(body), { status, headers });
const noSleep = () => Promise.resolve();

describe("apiFetch", () => {
  it("returns a successful response without retrying", async () => {
    const f = vi.fn().mockResolvedValue(res(200, {}));
    await apiFetch("/x", {}, { fetchImpl: f, sleep: noSleep });
    expect(f).toHaveBeenCalledTimes(1);
  });

  it("retries 503 then succeeds (cold start) and reports each retry", async () => {
    const f = vi.fn().mockResolvedValueOnce(res(503)).mockResolvedValueOnce(res(502)).mockResolvedValueOnce(res(200, {}));
    const onRetry = vi.fn();
    await apiFetch("/x", {}, { fetchImpl: f, sleep: noSleep, onRetry, random: () => 0 });
    expect(f).toHaveBeenCalledTimes(3);
    expect(onRetry.mock.calls.map((c) => c[0])).toEqual([1, 2]);
  });

  it("retries network errors, then throws a transient ApiError", async () => {
    const f = vi.fn().mockRejectedValue(new TypeError("fetch failed"));
    const err = await apiFetch("/x", {}, { fetchImpl: f, sleep: noSleep }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).transient).toBe(true);
    expect(f).toHaveBeenCalledTimes(3);
  });

  it("does not retry 4xx and surfaces the problem detail", async () => {
    const f = vi.fn().mockResolvedValue(res(404, { title: "Not found", detail: "No such algorithm", status: 404 }));
    const err = (await apiFetch("/x", {}, { fetchImpl: f, sleep: noSleep }).catch((e: unknown) => e)) as ApiError;
    expect(f).toHaveBeenCalledTimes(1);
    expect(err.status).toBe(404);
    expect(err.message).toBe("No such algorithm");
    expect(err.transient).toBe(false);
  });

  it("never retries writes by default", async () => {
    const f = vi.fn().mockResolvedValue(res(503));
    await apiFetch("/x", { method: "POST" }, { fetchImpl: f, sleep: noSleep }).catch(() => undefined);
    expect(f).toHaveBeenCalledTimes(1);
  });

  it("honours Retry-After but caps it at maxDelayMs", async () => {
    const f = vi.fn().mockResolvedValueOnce(res(429, undefined, { "Retry-After": "120" })).mockResolvedValueOnce(res(200, {}));
    const sleep = vi.fn().mockResolvedValue(undefined);
    await apiFetch("/x", {}, { fetchImpl: f, sleep, maxDelayMs: 5000 });
    expect(sleep).toHaveBeenCalledWith(5000);
  });

  it("times out a hung request and retries", async () => {
    const hang = (_: unknown, init?: RequestInit) =>
      new Promise<Response>((_resolve, reject) => init?.signal?.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError"))));
    const f = vi.fn(hang).mockImplementationOnce(hang).mockResolvedValueOnce(res(200, {}));
    const r = await apiFetch("/x", {}, { fetchImpl: f as unknown as typeof fetch, sleep: noSleep, timeoutMs: 20, retries: 1 });
    expect(r.status).toBe(200);
    expect(f).toHaveBeenCalledTimes(2);
  });

  it("stops immediately when the caller aborts", async () => {
    const controller = new AbortController();
    controller.abort();
    const f = vi.fn();
    await expect(apiFetch("/x", {}, { fetchImpl: f, signal: controller.signal })).rejects.toBeInstanceOf(ApiError);
    expect(f).not.toHaveBeenCalled();
  });
});

describe("backoffDelay", () => {
  it("grows exponentially, stays within [exp/2, exp] and is capped", () => {
    expect(backoffDelay(0, 800, 8000, () => 0)).toBe(400);
    expect(backoffDelay(0, 800, 8000, () => 1)).toBe(800);
    expect(backoffDelay(2, 800, 8000, () => 1)).toBe(3200);
    expect(backoffDelay(10, 800, 8000, () => 1)).toBe(8000);
  });
});

describe("client header and apiJson", () => {
  it("adds X-AlgoVision-Client on writes but not on reads", async () => {
    const f = vi.fn().mockResolvedValue(res(204));
    await apiFetch("/x", { method: "POST" }, { fetchImpl: f, sleep: noSleep });
    await apiFetch("/x", {}, { fetchImpl: f, sleep: noSleep });
    expect(new Headers(f.mock.calls[0]![1].headers).get("X-AlgoVision-Client")).toBe("web");
    expect(new Headers(f.mock.calls[1]![1].headers).get("X-AlgoVision-Client")).toBeNull();
  });

  it("apiJson sends a JSON body and bearer token, and parses the reply", async () => {
    const f = vi.fn().mockResolvedValue(res(200, { ok: 1 }));
    const out = await apiJson<{ ok: number }>("/x", { method: "PUT", body: { a: 1 }, token: "t", fetchImpl: f });
    expect(out).toEqual({ ok: 1 });
    const init = f.mock.calls[0]![1];
    const h = new Headers(init.headers);
    expect(init.body).toBe('{"a":1}');
    expect(h.get("Content-Type")).toBe("application/json");
    expect(h.get("Authorization")).toBe("Bearer t");
    expect(h.get("X-AlgoVision-Client")).toBe("web");
  });

  it("apiJson returns undefined for 204 and throws ApiError with field errors for 400", async () => {
    expect(await apiJson("/x", { method: "DELETE", fetchImpl: vi.fn().mockResolvedValue(res(204)) })).toBeUndefined();
    const bad = vi.fn().mockResolvedValue(res(400, { detail: "bad", code: "INVALID_INPUT", errors: [{ field: "email", message: "no" }] }));
    const err = (await apiJson("/x", { method: "POST", body: {}, fetchImpl: bad }).catch((e: unknown) => e)) as ApiError;
    expect(err.status).toBe(400);
    expect(err.problem?.errors?.[0]?.field).toBe("email");
  });
});
