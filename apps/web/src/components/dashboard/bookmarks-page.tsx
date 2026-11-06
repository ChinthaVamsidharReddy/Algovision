"use client";

import Link from "next/link";
import type { CatalogCard } from "@/lib/catalog-cards";
import { AlgorithmCard } from "../catalog/algorithm-card";
import { RequireAuth } from "../auth/require-auth";
import { useLearning, useLearningClient } from "../learning/learning-provider";

export function BookmarksPage({ cards }: { cards: CatalogCard[] }) {
  return (
    <RequireAuth returnTo="/bookmarks" what="your bookmarks">
      <Inner cards={cards} />
    </RequireAuth>
  );
}

function Inner({ cards }: { cards: CatalogCard[] }) {
  const learning = useLearning();
  const client = useLearningClient();
  if (learning.status === "idle" || learning.status === "loading") {
    return (
      <div role="status" aria-live="polite" className="space-y-3">
        <div className="h-8 w-1/3 animate-pulse rounded-lg bg-surface-2" />
        <div className="h-32 animate-pulse rounded-xl bg-surface-2" />
        <span className="sr-only">Loading your bookmarks…</span>
      </div>
    );
  }
  if (learning.status === "error") {
    return (
      <div role="alert" className="mx-auto max-w-md space-y-3 rounded-xl border border-danger bg-surface p-6 text-center">
        <p className="font-semibold text-danger">Could not load your bookmarks</p>
        <p>{learning.error}</p>
        <button type="button" onClick={() => void client?.load()} className="min-h-11 rounded-lg bg-accent px-5 font-semibold text-accent-fg">
          Try again
        </button>
      </div>
    );
  }
  const saved = cards.filter((c) => learning.bookmarks.has(c.id));
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Bookmarks</h1>
      {learning.actionError && (
        <p role="alert" className="text-sm font-medium text-danger">
          {learning.actionError}
        </p>
      )}
      {saved.length === 0 ? (
        <div className="space-y-2 rounded-xl border border-border bg-surface p-5">
          <p className="font-semibold">No bookmarks yet.</p>
          <p className="text-muted">Use the Bookmark button on any algorithm to save it here.</p>
          <Link href="/algorithms" className="inline-flex min-h-11 items-center rounded-lg bg-accent px-5 font-semibold text-accent-fg hover:opacity-90">
            Browse algorithms
          </Link>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {saved.map((c) => (
            <AlgorithmCard key={c.id} card={c} returnTo="/bookmarks" />
          ))}
        </ul>
      )}
    </div>
  );
}
