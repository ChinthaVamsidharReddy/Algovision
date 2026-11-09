"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { waker } from "@/lib/wake";

/** How long the server may take before the banner appears, so a normal fast reply shows nothing. */
const SHOW_AFTER_MS = 2500;
const READY_FOR_MS = 4000;

/**
 * Starts waking the API as soon as the site opens (free hosting sleeps when idle) and explains the wait if it is long.
 * It never blocks the page: visualizations do not need the server.
 */
export function WakeBanner() {
  const state = useSyncExternalStore(waker.subscribe, waker.getState, () => "idle" as const);
  const [slow, setSlow] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void waker.ensure();
  }, []);

  useEffect(() => {
    if (state !== "waking") return;
    const t = setTimeout(() => setSlow(true), SHOW_AFTER_MS);
    return () => clearTimeout(t);
  }, [state]);

  useEffect(() => {
    if (state !== "awake" || !slow) return;
    setReady(true);
    const t = setTimeout(() => {
      setReady(false);
      setSlow(false);
    }, READY_FOR_MS);
    return () => clearTimeout(t);
  }, [state, slow]);

  if (state === "failed") {
    return (
      <div role="alert" className="border-b border-border bg-surface-2 px-4 py-2 text-center text-sm">
        The server did not answer. Visualizations still work; sign-in and saved progress need the server.{" "}
        <button type="button" className="font-medium text-accent underline" onClick={() => void waker.ensure()}>
          Try again
        </button>
      </div>
    );
  }
  if (state === "waking" && slow) {
    return (
      <div role="status" className="border-b border-border bg-surface-2 px-4 py-2 text-center text-sm">
        <span aria-hidden="true" className="mr-2 inline-block size-2.5 animate-pulse rounded-full bg-muted" />
        The server is waking up (free hosting sleeps when idle). Visualizations work now; sign-in and saved progress will be ready in about a minute.
      </div>
    );
  }
  if (ready) {
    return (
      <div role="status" className="border-b border-border bg-surface-2 px-4 py-2 text-center text-sm">
        <span aria-hidden="true" className="mr-2 inline-block size-2.5 rounded-full bg-success" />
        The server is ready.
      </div>
    );
  }
  return null;
}
