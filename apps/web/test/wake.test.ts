import { describe, expect, it, vi } from "vitest";
import { Waker } from "../src/lib/wake";

const ok = () => new Response("{}", { status: 200 });
const clock = () => {
  let t = 1_000_000;
  return { now: () => t, sleep: async (ms: number) => { t += ms; } };
};

describe("Waker", () => {
  it("answers at once when the server is awake, then skips the check while the answer is fresh", async () => {
    const c = clock();
    const fetchImpl = vi.fn(async () => ok());
    const w = new Waker({ fetchImpl: fetchImpl as never, ...c });
    expect(await w.ensure()).toBe(true);
    expect(await w.ensure()).toBe(true);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(w.getState()).toBe("awake");
  });

  it("keeps checking while the server starts, then succeeds", async () => {
    const c = clock();
    let calls = 0;
    const fetchImpl = vi.fn(async () => (++calls < 4 ? new Response("starting", { status: 503 }) : ok()));
    const w = new Waker({ fetchImpl: fetchImpl as never, ...c });
    const states: string[] = [];
    w.subscribe(() => states.push(w.getState()));
    expect(await w.ensure()).toBe(true);
    expect(calls).toBe(4);
    expect(states).toEqual(["waking", "awake"]);
  });

  it("shares one wake-up between callers that arrive together", async () => {
    const c = clock();
    const fetchImpl = vi.fn(async () => ok());
    const w = new Waker({ fetchImpl: fetchImpl as never, ...c });
    const results = await Promise.all([w.ensure(), w.ensure(), w.ensure()]);
    expect(results).toEqual([true, true, true]);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("gives up after maxMs and reports failure, and can be tried again", async () => {
    const c = clock();
    let up = false;
    const fetchImpl = vi.fn(async () => (up ? ok() : new Response("down", { status: 503 })));
    const w = new Waker({ fetchImpl: fetchImpl as never, ...c, pollMs: 3000, maxMs: 9000 });
    expect(await w.ensure()).toBe(false);
    expect(w.getState()).toBe("failed");
    up = true;
    expect(await w.ensure()).toBe(true);
    expect(w.getState()).toBe("awake");
  });

  it("checks again after the fresh window passes (the server may have gone back to sleep)", async () => {
    const c = clock();
    const fetchImpl = vi.fn(async () => ok());
    const w = new Waker({ fetchImpl: fetchImpl as never, ...c, freshMs: 60_000 });
    await w.ensure();
    await c.sleep(61_000);
    await w.ensure();
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });
});
