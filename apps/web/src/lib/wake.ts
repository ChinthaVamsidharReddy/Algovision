import { apiFetch } from "./api";

export type WakeState = "idle" | "waking" | "awake" | "failed";

export interface WakerDeps {
  readonly fetchImpl?: typeof fetch;
  readonly sleep?: (ms: number) => Promise<void>;
  readonly now?: () => number;
  /** Pause between health checks while the server is starting. */
  readonly pollMs?: number;
  /** Give up after this long. Free hosting usually needs 30 to 60 seconds to start. */
  readonly maxMs?: number;
  /** After a successful check the server is treated as awake for this long (free hosting sleeps after ~15 idle minutes). */
  readonly freshMs?: number;
}

/**
 * Wakes a sleeping API. `ensure()` polls the health endpoint until it answers, so callers can wait for it before
 * sending something that must not be retried (sign-in, sign-up). Calls made while one wake-up is running share it.
 */
export class Waker {
  private state: WakeState = "idle";
  private pending: Promise<boolean> | null = null;
  private lastOk = -Infinity;
  private readonly listeners = new Set<() => void>();
  private readonly o: Required<Omit<WakerDeps, "fetchImpl">> & { fetchImpl: typeof fetch | undefined };

  constructor(deps: WakerDeps = {}) {
    this.o = {
      fetchImpl: deps.fetchImpl,
      sleep: deps.sleep ?? ((ms) => new Promise<void>((r) => setTimeout(r, ms))),
      now: deps.now ?? Date.now,
      pollMs: deps.pollMs ?? 3000,
      maxMs: deps.maxMs ?? 90_000,
      freshMs: deps.freshMs ?? 8 * 60_000,
    };
  }

  getState = (): WakeState => this.state;

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  private set(state: WakeState) {
    if (this.state === state) return;
    this.state = state;
    this.listeners.forEach((l) => l());
  }

  /** Resolves true once the server answers, false if it never does within `maxMs`. */
  ensure(): Promise<boolean> {
    if (this.o.now() - this.lastOk < this.o.freshMs) return Promise.resolve(true);
    if (this.pending) return this.pending;
    this.set("waking");
    this.pending = this.run().finally(() => {
      this.pending = null;
    });
    return this.pending;
  }

  /** Forget the last success, so the next `ensure()` checks again. */
  reset(): void {
    this.lastOk = -Infinity;
    if (this.state !== "waking") this.set("idle");
  }

  private async run(): Promise<boolean> {
    const started = this.o.now();
    for (;;) {
      try {
        await apiFetch("/api/v1/health", { cache: "no-store" }, { retries: 0, timeoutMs: 12_000, ...(this.o.fetchImpl ? { fetchImpl: this.o.fetchImpl } : {}) });
        this.lastOk = this.o.now();
        this.set("awake");
        return true;
      } catch {
        if (this.o.now() - started >= this.o.maxMs) {
          this.set("failed");
          return false;
        }
        await this.o.sleep(this.o.pollMs);
      }
    }
  }
}

/** The one instance the app shares. */
export const waker = new Waker();

/** Wait for the shared server wake-up. */
export const wakeBackend = (): Promise<boolean> => waker.ensure();
