"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

type Status = { kind: "checking" } | { kind: "waking"; attempt: number } | { kind: "online" } | { kind: "offline" };

/** Shows loading, retry (cold start) and error states for the API. The visualizer itself never depends on it. */
export function BackendStatus() {
  const [status, setStatus] = useState<Status>({ kind: "checking" });
  const [round, setRound] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setStatus({ kind: "checking" });
    apiFetch("/api/v1/health", { cache: "no-store" }, {
      signal: controller.signal,
      retries: 3,
      onRetry: (attempt) => setStatus({ kind: "waking", attempt }),
    })
      .then(() => setStatus({ kind: "online" }))
      .catch(() => {
        if (!controller.signal.aborted) setStatus({ kind: "offline" });
      });
    return () => controller.abort();
  }, [round]);

  const text =
    status.kind === "checking"
      ? "Checking server…"
      : status.kind === "waking"
        ? `Server is waking up (try ${status.attempt + 1})…`
        : status.kind === "online"
          ? "Server online"
          : "Server unreachable";

  return (
    <p role="status" className="flex items-center gap-2">
      <span
        aria-hidden="true"
        className={`inline-block size-2.5 rounded-full ${
          status.kind === "online" ? "bg-success" : status.kind === "offline" ? "bg-danger" : "bg-muted"
        }`}
      />
      <span>{text}</span>
      {status.kind === "offline" && (
        <button type="button" onClick={() => setRound((r) => r + 1)} className="rounded px-2 py-1 font-medium text-accent underline">
          Retry
        </button>
      )}
      {status.kind === "offline" && <span className="hidden sm:inline">- visualizations still work offline.</span>}
    </p>
  );
}
