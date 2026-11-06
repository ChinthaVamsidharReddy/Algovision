"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useAuth, useAuthClient } from "./auth-provider";

/** Renders children for signed-in users; guests get a sign-in prompt that returns them here afterwards. */
export function RequireAuth({ children, returnTo, what }: { children: ReactNode; returnTo: string; what: string }) {
  const auth = useAuth();
  const client = useAuthClient();
  if (auth.status === "loading") {
    return (
      <div role="status" aria-live="polite" className="space-y-3">
        <div className="h-8 w-1/3 animate-pulse rounded-lg bg-surface-2" />
        <div className="h-32 animate-pulse rounded-xl bg-surface-2" />
        <span className="sr-only">Loading your account…</span>
      </div>
    );
  }
  if (auth.status === "anonymous") {
    return (
      <div className="mx-auto max-w-md space-y-4 rounded-xl border border-border bg-surface p-6 text-center">
        <h1 className="text-2xl font-bold">Sign in to see {what}</h1>
        {auth.restoreFailed ? (
          <>
            <p role="alert" className="text-danger">We could not reach the server to restore your session.</p>
            <button type="button" onClick={() => void client.retryRestore()} className="min-h-11 rounded-lg bg-accent px-5 font-semibold text-accent-fg">
              Try again
            </button>
          </>
        ) : (
          <p className="text-muted">Your progress and bookmarks are saved to your account.</p>
        )}
        <div className="flex justify-center gap-3">
          <Link href={`/login?next=${encodeURIComponent(returnTo)}`} className="min-h-11 rounded-lg bg-accent px-5 py-2.5 font-semibold text-accent-fg hover:opacity-90">
            Sign in
          </Link>
          <Link href={`/register?next=${encodeURIComponent(returnTo)}`} className="min-h-11 rounded-lg border border-border px-5 py-2.5 font-semibold hover:bg-surface-2">
            Create account
          </Link>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}
