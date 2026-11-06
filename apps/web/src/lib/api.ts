/** Problem Details (RFC 9457) as returned by the backend. */
export interface ProblemDetails {
  readonly type?: string;
  readonly title?: string;
  readonly status?: number;
  readonly detail?: string;
  readonly code?: string;
  /** Field-level validation messages, when the API sends them. */
  readonly errors?: readonly { readonly field: string; readonly message: string }[];
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number | null,
    readonly problem: ProblemDetails | null,
    /** true for network failures, timeouts and 5xx/429 after retries were exhausted */
    readonly transient: boolean,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export interface ApiFetchOptions {
  /** Extra attempts after the first. Default 2 for GET/HEAD, 0 otherwise (writes are never retried silently). */
  readonly retries?: number;
  readonly baseDelayMs?: number;
  readonly maxDelayMs?: number;
  readonly timeoutMs?: number;
  readonly onRetry?: (attempt: number, delayMs: number, reason: string) => void;
  readonly signal?: AbortSignal;
  /** Injectable for tests. */
  readonly fetchImpl?: typeof fetch;
  readonly sleep?: (ms: number) => Promise<void>;
  readonly random?: () => number;
}

export const CLIENT_HEADER = "X-AlgoVision-Client";
export const CLIENT_HEADER_VALUE = "web";
const RETRYABLE_STATUS = new Set([408, 425, 429, 500, 502, 503, 504]);
const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export function backoffDelay(attempt: number, base: number, max: number, random: () => number): number {
  const exp = Math.min(max, base * 2 ** attempt);
  return Math.round(exp / 2 + (random() * exp) / 2); // "equal jitter"
}

function retryAfterMs(response: Response): number | null {
  const raw = response.headers.get("Retry-After");
  if (!raw) return null;
  const seconds = Number(raw);
  return Number.isFinite(seconds) && seconds >= 0 ? seconds * 1000 : null;
}

async function readProblem(response: Response): Promise<ProblemDetails | null> {
  try {
    const body: unknown = await response.json();
    return body && typeof body === "object" ? (body as ProblemDetails) : null;
  } catch {
    return null;
  }
}

/**
 * fetch with timeout, bounded retries and exponential backoff. Built for free-tier cold starts,
 * where the first request after idle may take tens of seconds or return 502/503 while the service wakes.
 * Resolves with the response for 2xx/3xx; throws ApiError otherwise.
 */
export async function apiFetch(path: string, init: RequestInit = {}, options: ApiFetchOptions = {}): Promise<Response> {
  const method = (init.method ?? "GET").toUpperCase();
  const idempotent = method === "GET" || method === "HEAD";
  const retries = options.retries ?? (idempotent ? 2 : 0);
  const base = options.baseDelayMs ?? 800;
  const max = options.maxDelayMs ?? 8000;
  const timeoutMs = options.timeoutMs ?? 15000;
  const doFetch = options.fetchImpl ?? fetch;
  const sleep = options.sleep ?? defaultSleep;
  const random = options.random ?? Math.random;

  let lastError: ApiError | null = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    if (options.signal?.aborted) throw new ApiError("Request cancelled.", null, null, false);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const onAbort = () => controller.abort();
    const headers = new Headers(init.headers);
    // The API's CSRF defence requires this header on every state-changing request (OriginCheckFilter).
    if (!idempotent && !headers.has(CLIENT_HEADER)) headers.set(CLIENT_HEADER, CLIENT_HEADER_VALUE);
    options.signal?.addEventListener("abort", onAbort, { once: true });
    let delay: number | null = null;
    try {
      const response = await doFetch(path, { ...init, headers, signal: controller.signal });
      if (response.ok || (response.status >= 300 && response.status < 400)) return response;
      const problem = await readProblem(response);
      const retryable = RETRYABLE_STATUS.has(response.status);
      lastError = new ApiError(problem?.detail ?? problem?.title ?? `Request failed (${response.status}).`, response.status, problem, retryable);
      if (!retryable) throw lastError;
      delay = retryAfterMs(response);
    } catch (error) {
      if (error instanceof ApiError && !error.transient) throw error;
      if (options.signal?.aborted) throw new ApiError("Request cancelled.", null, null, false);
      if (!(error instanceof ApiError)) {
        lastError = new ApiError(
          controller.signal.aborted ? "The server took too long to respond." : "Could not reach the server.",
          null,
          null,
          true,
        );
      }
    } finally {
      clearTimeout(timer);
      options.signal?.removeEventListener("abort", onAbort);
    }
    if (attempt < retries) {
      const wait = Math.min(delay ?? backoffDelay(attempt, base, max, random), max);
      options.onRetry?.(attempt + 1, wait, lastError?.message ?? "");
      await sleep(wait);
    }
  }
  throw lastError ?? new ApiError("Request failed.", null, null, true);
}

export interface JsonOptions extends ApiFetchOptions {
  /** Sent as a JSON body (sets Content-Type). */
  readonly body?: unknown;
  readonly method?: "GET" | "POST" | "PUT" | "DELETE";
  /** Bearer access token, when the call needs one. */
  readonly token?: string | null;
}

/** apiFetch for JSON endpoints: sets headers, serialises the body, parses the response (undefined for 204). */
export async function apiJson<T = undefined>(path: string, options: JsonOptions = {}): Promise<T> {
  const { body, method = "GET", token, ...rest } = options;
  const headers = new Headers({ Accept: "application/json" });
  if (body !== undefined) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const response = await apiFetch(
    path,
    { method, headers, credentials: "same-origin", cache: "no-store", ...(body !== undefined ? { body: JSON.stringify(body) } : {}) },
    rest,
  );
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}
