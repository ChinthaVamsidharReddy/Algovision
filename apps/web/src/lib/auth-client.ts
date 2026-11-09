import { ApiError, apiJson, type JsonOptions } from "./api";
import { wakeBackend } from "./wake";

export interface User {
  readonly id: string;
  readonly email: string;
  readonly fullName: string;
  readonly roles: readonly string[];
}

interface SessionResponse {
  readonly user: User;
  readonly accessToken: string;
  readonly accessTokenExpiresAt: string;
}

export type AuthState =
  | { readonly status: "loading" }
  /** `restoreFailed` is true when a saved session could not be checked because the server was unreachable. */
  | { readonly status: "anonymous"; readonly restoreFailed?: boolean }
  | { readonly status: "authenticated"; readonly user: User };

/** The refresh cookie is httpOnly, so scripts cannot see it. This flag only says "try restoring a session". */
const HINT_KEY = "av-session";
/** Refresh slightly early so a request never leaves with a token that expires in flight. */
const EXPIRY_MARGIN_MS = 30_000;

export interface AuthClientDeps {
  readonly fetchImpl?: typeof fetch;
  readonly now?: () => number;
  /** Serialises refreshes across tabs: the refresh token rotates, so two tabs refreshing at once look like theft. */
  readonly locks?: Pick<LockManager, "request"> | null;
  readonly storage?: Pick<Storage, "getItem" | "setItem" | "removeItem"> | null;
  /** Waits for a sleeping server before a request that must not be retried. Defaults to the real wake-up; off when a fake fetch is injected. */
  readonly wake?: (() => Promise<boolean>) | null;
}

type Listener = () => void;

/**
 * Holds the access token in memory only (never in storage), restores the session from the refresh cookie, refreshes
 * before expiry and once on a 401, and exposes the account calls. Framework-free so it can be tested without React.
 */
export class AuthClient {
  private state: AuthState = { status: "loading" };
  private token: string | null = null;
  private expiresAt = 0;
  private inflight: Promise<boolean> | null = null;
  private readonly listeners = new Set<Listener>();
  private readonly fetchImpl: typeof fetch | undefined;
  private readonly now: () => number;
  private readonly locks: Pick<LockManager, "request"> | null;
  private readonly storage: Pick<Storage, "getItem" | "setItem" | "removeItem"> | null;
  private readonly wake: (() => Promise<boolean>) | null;

  constructor(deps: AuthClientDeps = {}) {
    this.fetchImpl = deps.fetchImpl;
    this.wake = deps.wake !== undefined ? deps.wake : deps.fetchImpl ? null : wakeBackend;
    this.now = deps.now ?? Date.now;
    this.locks = deps.locks !== undefined ? deps.locks : typeof navigator !== "undefined" && "locks" in navigator ? navigator.locks : null;
    this.storage = deps.storage !== undefined ? deps.storage : safeLocalStorage();
  }

  getState = (): AuthState => this.state;

  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  private set(state: AuthState) {
    this.state = state;
    this.listeners.forEach((l) => l());
  }

  private hint(value: boolean) {
    try {
      if (value) this.storage?.setItem(HINT_KEY, "1");
      else this.storage?.removeItem(HINT_KEY);
    } catch {
      /* storage blocked: the session still works for this page view */
    }
  }

  private hasHint(): boolean {
    try {
      return this.storage?.getItem(HINT_KEY) === "1";
    } catch {
      return false;
    }
  }

  private accept(session: SessionResponse) {
    this.token = session.accessToken;
    this.expiresAt = Date.parse(session.accessTokenExpiresAt);
    this.hint(true);
    this.set({ status: "authenticated", user: session.user });
  }

  private clear(restoreFailed = false) {
    this.token = null;
    this.expiresAt = 0;
    this.hint(false);
    this.set(restoreFailed ? { status: "anonymous", restoreFailed: true } : { status: "anonymous" });
  }

  /** Called once on page load. Without the hint there is nothing to restore, so no request (and no console noise). */
  async init(): Promise<void> {
    if (this.state.status !== "loading") return;
    if (!this.hasHint()) {
      this.set({ status: "anonymous" });
      return;
    }
    await this.awake();
    await this.refresh(true);
  }

  /** Retry after a failed restore (server asleep or offline). */
  async retryRestore(): Promise<void> {
    this.set({ status: "loading" });
    await this.awake();
    await this.refresh(true);
  }

  private opts(extra: JsonOptions = {}): JsonOptions {
    return this.fetchImpl ? { fetchImpl: this.fetchImpl, ...extra } : extra;
  }

  /** Single-flight refresh. Resolves true when a fresh access token is held. */
  private refresh(initial = false): Promise<boolean> {
    if (this.inflight) return this.inflight;
    const run = async (): Promise<boolean> => {
      try {
        const session = await apiJson<SessionResponse>("/api/v1/auth/refresh", this.opts({ method: "POST", retries: initial ? 3 : 1 }));
        this.accept(session);
        return true;
      } catch (error) {
        if (error instanceof ApiError && error.transient) {
          // Could not reach the server: keep the hint so a later retry can still restore the session.
          this.token = null;
          this.set({ status: "anonymous", restoreFailed: true });
          return false;
        }
        this.clear();
        return false;
      }
    };
    const locked = this.locks ? () => this.locks!.request("av-refresh", run) : run;
    this.inflight = locked().finally(() => {
      this.inflight = null;
    });
    return this.inflight;
  }

  private async validToken(): Promise<string | null> {
    if (this.token && this.now() < this.expiresAt - EXPIRY_MARGIN_MS) return this.token;
    if (this.state.status === "anonymous" && !this.hasHint()) return null;
    return (await this.refresh()) ? this.token : null;
  }

  /** An authenticated JSON call. Refreshes first when the token is about to expire and retries once on a 401. */
  async request<T = undefined>(path: string, options: JsonOptions = {}): Promise<T> {
    let token = await this.validToken();
    if (!token) throw new ApiError("Sign in to continue.", 401, { code: "TOKEN_INVALID" }, false);
    try {
      return await apiJson<T>(path, this.opts({ ...options, token }));
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== 401) throw error;
      if (!(await this.refresh())) throw error;
      token = this.token;
      return await apiJson<T>(path, this.opts({ ...options, token }));
    }
  }

  /** Free hosting sleeps when idle and a write must not be retried, so wait for the server first. */
  private async awake(): Promise<void> {
    if (this.wake) await this.wake();
  }

  async login(email: string, password: string): Promise<void> {
    await this.awake();
    this.accept(await apiJson<SessionResponse>("/api/v1/auth/login", this.opts({ method: "POST", body: { email, password } })));
  }

  async register(email: string, password: string, fullName: string): Promise<void> {
    await this.awake();
    this.accept(await apiJson<SessionResponse>("/api/v1/auth/register", this.opts({ method: "POST", body: { email, password, fullName } })));
  }

  /** Always ends the local session, even if the server cannot be reached. */
  async logout(): Promise<void> {
    try {
      await apiJson("/api/v1/auth/logout", this.opts({ method: "POST", retries: 0 }));
    } catch {
      /* the cookie may outlive this call; it is httpOnly and expires on its own */
    } finally {
      this.clear();
    }
  }

  async forgotPassword(email: string): Promise<string> {
    await this.awake();
    const out = await apiJson<{ message: string }>("/api/v1/auth/forgot-password", this.opts({ method: "POST", body: { email } }));
    return out.message;
  }

  /** Resets the password; the server revokes every session, so the local one ends too. */
  async resetPassword(token: string, password: string): Promise<void> {
    await this.awake();
    await apiJson("/api/v1/auth/reset-password", this.opts({ method: "POST", body: { token, password } }));
    this.clear();
  }
}

function safeLocalStorage(): Storage | null {
  try {
    return typeof localStorage === "undefined" ? null : localStorage;
  } catch {
    return null;
  }
}

/** Only same-site relative paths are allowed after sign-in, so a crafted ?next= cannot send people elsewhere. */
export function safeNext(next: string | null | undefined, fallback = "/dashboard"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) return fallback;
  for (let i = 0; i < next.length; i++) if (next.charCodeAt(i) < 32) return fallback;
  return next;
}
