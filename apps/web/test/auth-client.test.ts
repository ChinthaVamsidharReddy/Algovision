import { describe, expect, it, vi } from "vitest";
import { AuthClient, safeNext } from "../src/lib/auth-client";
import { ApiError } from "../src/lib/api";

const USER = { id: "u1", email: "ada@example.com", fullName: "Ada", roles: ["ROLE_STUDENT"] };
const json = (status: number, body?: unknown) => new Response(body === undefined ? null : JSON.stringify(body), { status });
const session = (token: string, expiresInMs = 900_000, now = 1_000_000) =>
  json(200, { user: USER, accessToken: token, accessTokenExpiresAt: new Date(now + expiresInMs).toISOString() });

function memoryStorage(initial: Record<string, string> = {}) {
  const data = { ...initial };
  return {
    getItem: (k: string) => data[k] ?? null,
    setItem: (k: string, v: string) => void (data[k] = v),
    removeItem: (k: string) => void delete data[k],
    data,
  };
}
const noLocks = { request: (_n: string, cb: () => Promise<unknown>) => cb() } as never;
const url = (call: unknown[]) => String(call[0]);
const header = (call: unknown[], name: string) => new Headers((call[1] as RequestInit).headers).get(name);

function make(fetchImpl: typeof fetch, storage = memoryStorage(), now = () => 1_000_000) {
  return { client: new AuthClient({ fetchImpl, storage, now, locks: noLocks }), storage };
}

describe("AuthClient", () => {
  it("makes no request on load when there is no saved-session hint", async () => {
    const f = vi.fn();
    const { client } = make(f as never);
    await client.init();
    expect(f).not.toHaveBeenCalled();
    expect(client.getState()).toEqual({ status: "anonymous" });
  });

  it("restores a session from the refresh cookie when the hint exists", async () => {
    const f = vi.fn().mockResolvedValue(session("t1"));
    const { client } = make(f as never, memoryStorage({ "av-session": "1" }));
    await client.init();
    expect(url(f.mock.calls[0]!)).toBe("/api/v1/auth/refresh");
    expect(header(f.mock.calls[0]!, "X-AlgoVision-Client")).toBe("web");
    expect(client.getState()).toEqual({ status: "authenticated", user: USER });
  });

  it("clears the hint when the saved session is no longer valid (401)", async () => {
    const f = vi.fn().mockResolvedValue(json(401, { code: "TOKEN_INVALID", detail: "no" }));
    const { client, storage } = make(f as never, memoryStorage({ "av-session": "1" }));
    await client.init();
    expect(client.getState()).toEqual({ status: "anonymous" });
    expect(storage.data["av-session"]).toBeUndefined();
  });

  it("keeps the hint and flags restoreFailed when the server is unreachable", async () => {
    const f = vi.fn().mockRejectedValue(new TypeError("down"));
    const { client, storage } = make(f as never, memoryStorage({ "av-session": "1" }));
    await client.init();
    expect(client.getState()).toEqual({ status: "anonymous", restoreFailed: true });
    expect(storage.data["av-session"]).toBe("1");
    f.mockResolvedValue(session("t2"));
    await client.retryRestore();
    expect(client.getState().status).toBe("authenticated");
  }, 20_000);

  it("login stores the token in memory only and sets the hint", async () => {
    const f = vi.fn().mockResolvedValue(session("secret-token"));
    const { client, storage } = make(f as never);
    await client.login("ada@example.com", "pw");
    expect(JSON.stringify(storage.data)).not.toContain("secret-token");
    expect(storage.data["av-session"]).toBe("1");
    expect(JSON.parse((f.mock.calls[0]![1] as RequestInit).body as string)).toEqual({ email: "ada@example.com", password: "pw" });
  });

  it("surfaces field errors from a failed registration and stays anonymous", async () => {
    const f = vi.fn().mockResolvedValue(json(400, { code: "INVALID_INPUT", detail: "Please fix", errors: [{ field: "password", message: "Too short" }] }));
    const { client } = make(f as never);
    const err = (await client.register("a@b.co", "x", "A").catch((e: unknown) => e)) as ApiError;
    expect(err.problem?.errors?.[0]).toEqual({ field: "password", message: "Too short" });
    expect(client.getState().status).toBe("loading");
  });

  it("request() sends the bearer token and refreshes first when the token is about to expire", async () => {
    let now = 1_000_000;
    const f = vi.fn().mockResolvedValueOnce(session("t1", 60_000)).mockResolvedValueOnce(session("t2", 900_000, now + 45_000)).mockResolvedValueOnce(json(200, { ok: true }));
    const { client } = make(f as never, memoryStorage(), () => now);
    await client.login("a@b.co", "pw");
    now += 45_000; // within the 30 s margin of expiry
    await client.request("/api/v1/me/progress");
    expect(url(f.mock.calls[1]!)).toBe("/api/v1/auth/refresh");
    expect(header(f.mock.calls[2]!, "Authorization")).toBe("Bearer t2");
  });

  it("on a 401 it refreshes once and retries the call once", async () => {
    const f = vi
      .fn()
      .mockResolvedValueOnce(session("t1"))
      .mockResolvedValueOnce(json(401, { code: "TOKEN_INVALID" }))
      .mockResolvedValueOnce(session("t2"))
      .mockResolvedValueOnce(json(200, { ok: 1 }));
    const { client } = make(f as never);
    await client.login("a@b.co", "pw");
    expect(await client.request("/api/v1/me/progress")).toEqual({ ok: 1 });
    expect(f).toHaveBeenCalledTimes(4);
    expect(header(f.mock.calls[3]!, "Authorization")).toBe("Bearer t2");
  });

  it("a 401 after a failed refresh ends the session", async () => {
    const f = vi
      .fn()
      .mockResolvedValueOnce(session("t1"))
      .mockResolvedValueOnce(json(401, { code: "TOKEN_INVALID" }))
      .mockResolvedValueOnce(json(401, { code: "TOKEN_REUSED" }));
    const { client } = make(f as never);
    await client.login("a@b.co", "pw");
    await expect(client.request("/api/v1/me/progress")).rejects.toBeInstanceOf(ApiError);
    expect(client.getState()).toEqual({ status: "anonymous" });
  });

  it("concurrent expired requests share ONE refresh (rotation would otherwise look like token theft)", async () => {
    let now = 1_000_000;
    let release: (r: Response) => void = () => {};
    const refreshing = new Promise<Response>((r) => (release = r));
    const f = vi.fn(async (input: RequestInfo | URL) => {
      const u = String(input);
      if (u.endsWith("/login")) return session("t1", 40_000);
      if (u.endsWith("/refresh")) return refreshing;
      return json(200, { ok: 1 });
    });
    const { client } = make(f as never, memoryStorage(), () => now);
    await client.login("a@b.co", "pw");
    now += 20_000;
    const calls = [client.request("/a"), client.request("/b"), client.request("/c")];
    await Promise.resolve();
    release(session("t2", 900_000, now));
    await Promise.all(calls);
    expect(f.mock.calls.filter((c) => String(c[0]).endsWith("/refresh"))).toHaveLength(1);
  });

  it("request() without a session fails with 401 and sends nothing", async () => {
    const f = vi.fn();
    const { client } = make(f as never);
    await client.init();
    await expect(client.request("/api/v1/me/progress")).rejects.toMatchObject({ status: 401 });
    expect(f).not.toHaveBeenCalled();
  });

  it("logout clears local state even when the server is unreachable", async () => {
    const f = vi.fn().mockResolvedValueOnce(session("t1")).mockRejectedValue(new TypeError("down"));
    const { client, storage } = make(f as never);
    await client.login("a@b.co", "pw");
    await client.logout();
    expect(client.getState()).toEqual({ status: "anonymous" });
    expect(storage.data["av-session"]).toBeUndefined();
  });

  it("resetPassword ends the local session (the server revoked every session)", async () => {
    const f = vi.fn().mockResolvedValueOnce(session("t1")).mockResolvedValueOnce(json(204));
    const { client } = make(f as never);
    await client.login("a@b.co", "pw");
    await client.resetPassword("tok", "new-password-1");
    expect(client.getState()).toEqual({ status: "anonymous" });
  });

  it("notifies subscribers on every state change", async () => {
    const f = vi.fn().mockResolvedValue(session("t1"));
    const { client } = make(f as never);
    const seen: string[] = [];
    client.subscribe(() => seen.push(client.getState().status));
    await client.login("a@b.co", "pw");
    await client.logout().catch(() => {});
    expect(seen[0]).toBe("authenticated");
    expect(seen.at(-1)).toBe("anonymous");
  });
});

describe("safeNext", () => {
  it("allows same-site paths only", () => {
    expect(safeNext("/algorithms/bubble-sort?step=3")).toBe("/algorithms/bubble-sort?step=3");
    for (const bad of ["https://evil.test", "//evil.test", "/\\evil.test", "javascript:alert(1)", "", null, undefined, "/ok\nbad"]) {
      expect(safeNext(bad as string)).toBe("/dashboard");
    }
    expect(safeNext("//x", "/home")).toBe("/home");
  });
});

describe("AuthClient waits for a sleeping server before writes", () => {
  it("calls the wake-up before login and register, and before the first session restore", async () => {
    const order: string[] = [];
    const f = vi.fn(async (url: string) => { order.push(`fetch ${url}`); return new Response(JSON.stringify({ user: { id: "u", email: "a@b.c", fullName: "A", roles: [] }, accessToken: "t", accessTokenExpiresAt: new Date(Date.now() + 900_000).toISOString() }), { status: 200 }); });
    const wake = vi.fn(async () => { order.push("wake"); return true; });
    const store = { getItem: () => "1", setItem: () => {}, removeItem: () => {} };
    const c = new AuthClient({ fetchImpl: f as never, wake, storage: store, locks: null });
    await c.init();
    expect(order.slice(0, 2)).toEqual(["wake", "fetch /api/v1/auth/refresh"]);
    order.length = 0;
    await c.login("a@b.c", "pw");
    expect(order).toEqual(["wake", "fetch /api/v1/auth/login"]);
    order.length = 0;
    await c.register("a@b.c", "pw", "A");
    expect(order).toEqual(["wake", "fetch /api/v1/auth/register"]);
  });
});
