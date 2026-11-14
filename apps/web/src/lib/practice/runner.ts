import { outputsEqual, type PracticeLanguage, type PracticeVector } from "@algovision/algorithms";

/** Everything needed to run one learner solution against a list of tests in a Web Worker. */
export interface RunRequest {
  readonly language: PracticeLanguage;
  readonly source: string;
  readonly fn: string;
  readonly adapter?: "list" | "tree";
  readonly vectors: readonly PracticeVector[];
}

export type CaseStatus = "pass" | "fail" | "error" | "timeout" | "skipped";
export interface CaseOutcome {
  readonly status: CaseStatus;
  readonly got?: unknown;
  /** Error text for `error`, or an explanation for `timeout`. */
  readonly message?: string;
  readonly stdout?: string;
  readonly ms?: number;
}

export type RunEnd =
  | { readonly kind: "finished" }
  /** The solution could not even be loaded (syntax error, or the function is not defined). */
  | { readonly kind: "setup-error"; readonly message: string }
  /** The runtime did not start (for example the Python files could not be downloaded). */
  | { readonly kind: "load-failed"; readonly message: string }
  | { readonly kind: "stopped" };

export interface RunHooks {
  /** Called once the runtime is starting up and again if loading takes a while, so the page can show it. */
  readonly onLoading?: () => void;
  readonly onCase?: (index: number, outcome: CaseOutcome) => void;
  readonly onCaseStart?: (index: number) => void;
}

/** A test that runs longer than this is treated as an infinite loop. Python gets longer because WebAssembly is slower. */
export const CASE_TIMEOUT_MS: Record<PracticeLanguage, number> = { javascript: 2000, python: 5000 };
export const LOAD_TIMEOUT_MS = 60000;

const WORKER_URL: Record<PracticeLanguage, string> = { javascript: "/practice/js-worker.js", python: "/practice/py-worker.js" };

interface Session {
  worker: Worker;
  /** Resolves when the worker script (and, for Python, the runtime) has loaded. */
  loaded: Promise<void>;
}
const sessions = new Map<PracticeLanguage, Session>();

function startSession(language: PracticeLanguage): Session {
  const worker = new Worker(WORKER_URL[language]);
  const loaded = new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Loading took too long. Check your connection and try again.")), LOAD_TIMEOUT_MS);
    const listener = (event: MessageEvent) => {
      const m = event.data as { type?: string; message?: string };
      if (m.type === "loaded") {
        clearTimeout(timer);
        worker.removeEventListener("message", listener);
        resolve();
      } else if (m.type === "load-error") {
        clearTimeout(timer);
        worker.removeEventListener("message", listener);
        reject(new Error(m.message ?? "The runtime could not be loaded."));
      }
    };
    worker.addEventListener("message", listener);
    worker.addEventListener("error", () => {
      clearTimeout(timer);
      reject(new Error("The runtime could not be loaded. Check your connection and try again."));
    });
  });
  const session = { worker, loaded };
  sessions.set(language, session);
  return session;
}

/** Stops a runtime (used after an infinite loop, a failed load, or when leaving the page). The next run starts a fresh one. */
export function stopRuntime(language: PracticeLanguage): void {
  const s = sessions.get(language);
  if (s) s.worker.terminate();
  sessions.delete(language);
}
export const stopAllRuntimes = (): void => (["javascript", "python"] as const).forEach(stopRuntime);

const skipped = (n: number): CaseOutcome[] => Array.from({ length: n }, () => ({ status: "skipped" }));

/** Grades one worker answer against the expected value. */
export function gradeCase(vector: PracticeVector, answer: { ok: boolean; value?: unknown; message?: string; stdout?: string; ms?: number }): CaseOutcome {
  const base = { ...(answer.stdout ? { stdout: answer.stdout } : {}), ...(answer.ms !== undefined ? { ms: answer.ms } : {}) };
  if (!answer.ok) return { status: "error", message: answer.message ?? "Your code raised an error.", ...base };
  return outputsEqual(vector.expected, answer.value) ? { status: "pass", got: answer.value, ...base } : { status: "fail", got: answer.value, ...base };
}

/**
 * Runs every test in order. Resolves with how the run ended and calls `onCase` as results arrive; a test that hangs terminates
 * the worker, is reported as a timeout, and the remaining tests are marked skipped.
 */
export async function runTests(request: RunRequest, hooks: RunHooks = {}, signal?: AbortSignal): Promise<{ end: RunEnd; outcomes: CaseOutcome[] }> {
  const outcomes = skipped(request.vectors.length);
  const language = request.language;
  let session = sessions.get(language);
  if (!session) {
    hooks.onLoading?.();
    session = startSession(language);
  }
  try {
    await session.loaded;
  } catch (error) {
    stopRuntime(language);
    return { end: { kind: "load-failed", message: error instanceof Error ? error.message : String(error) }, outcomes };
  }
  const { worker } = session;
  return new Promise((resolve) => {
    let current = -1;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let settled = false;
    const finish = (end: RunEnd) => {
      if (settled) return;
      settled = true;
      if (timer) clearTimeout(timer);
      worker.removeEventListener("message", onMessage);
      signal?.removeEventListener("abort", onAbort);
      resolve({ end, outcomes });
    };
    const arm = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        if (current >= 0) {
          outcomes[current] = { status: "timeout", message: `Stopped after ${CASE_TIMEOUT_MS[language] / 1000} seconds. Your code may contain an infinite loop.` };
          hooks.onCase?.(current, outcomes[current]!);
        }
        stopRuntime(language);
        finish({ kind: "finished" });
      }, CASE_TIMEOUT_MS[language]);
    };
    const onAbort = () => {
      stopRuntime(language);
      finish({ kind: "stopped" });
    };
    const onMessage = (event: MessageEvent) => {
      const m = event.data as { type: string; i?: number; ok?: boolean; value?: unknown; message?: string; stdout?: string; ms?: number };
      if (m.type === "setup-error") finish({ kind: "setup-error", message: m.message ?? "Your code could not be loaded." });
      else if (m.type === "start" && m.i !== undefined) {
        current = m.i;
        hooks.onCaseStart?.(m.i);
        arm();
      } else if (m.type === "result" && m.i !== undefined) {
        outcomes[m.i] = gradeCase(request.vectors[m.i]!, { ok: !!m.ok, value: m.value, message: m.message, stdout: m.stdout, ms: m.ms });
        hooks.onCase?.(m.i, outcomes[m.i]!);
        current = -1;
        if (timer) clearTimeout(timer);
      } else if (m.type === "done") finish({ kind: "finished" });
    };
    worker.addEventListener("message", onMessage);
    signal?.addEventListener("abort", onAbort);
    if (signal?.aborted) return onAbort();
    arm(); // covers the very first test starting
    worker.postMessage({ type: "run", source: request.source, fn: request.fn, adapter: request.adapter, wantList: Array.isArray(request.vectors[0]?.expected), cases: request.vectors.map((v) => ({ name: v.name, args: v.args })) });
  });
}
