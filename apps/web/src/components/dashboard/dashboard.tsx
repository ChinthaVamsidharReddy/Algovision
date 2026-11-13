"use client";

import Link from "next/link";
import { useMemo } from "react";
import type { CatalogCard } from "@/lib/catalog-cards";
import { groupCards } from "@/lib/catalog-cards";
import { summarize } from "@/lib/progress";
import { RequireAuth } from "../auth/require-auth";
import { useAuth } from "../auth/auth-provider";
import { useLearning, useLearningClient } from "../learning/learning-provider";
import { ProgressBar } from "../learning/progress-bar";

export function Dashboard({ cards }: { cards: CatalogCard[] }) {
  return (
    <RequireAuth returnTo="/dashboard" what="your learning progress">
      <Inner cards={cards} />
    </RequireAuth>
  );
}

function Inner({ cards }: { cards: CatalogCard[] }) {
  const auth = useAuth();
  const learning = useLearning();
  const client = useLearningClient();
  const byId = useMemo(() => new Map(cards.map((c) => [c.id, c])), [cards]);
  const summary = useMemo(
    () => summarize(groupCards(cards).map((g) => ({ id: g.categoryId, name: g.categoryName, ids: g.cards.map((c) => c.id) })), learning.progress),
    [cards, learning.progress],
  );
  const name = auth.status === "authenticated" ? auth.user.fullName.split(" ")[0] : "";

  if (learning.status === "idle" || learning.status === "loading") {
    return (
      <div role="status" aria-live="polite" className="space-y-3">
        <div className="h-8 w-1/3 animate-pulse rounded-lg bg-surface-2" />
        <div className="h-40 animate-pulse rounded-xl bg-surface-2" />
        <span className="sr-only">Loading your progress…</span>
      </div>
    );
  }
  if (learning.status === "error") {
    return (
      <div role="alert" className="mx-auto max-w-md space-y-3 rounded-xl border border-danger bg-surface p-6 text-center">
        <p className="font-semibold text-danger">Could not load your progress</p>
        <p>{learning.error}</p>
        <button type="button" onClick={() => void client?.load()} className="min-h-11 rounded-lg bg-accent px-5 font-semibold text-accent-fg">
          Try again
        </button>
      </div>
    );
  }

  const resume = summary.resume ? byId.get(summary.resume.algorithmSlug) : null;
  const completed = [...learning.progress.values()]
    .filter((p) => p.status === "COMPLETED" && byId.has(p.algorithmSlug))
    .sort((a, b) => (b.completedAt ?? "").localeCompare(a.completedAt ?? ""));
  const nothingYet = learning.progress.size === 0;

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">My learning</h1>
        <p className="text-muted">{name ? `Welcome back, ${name}.` : "Welcome back."}</p>
      </div>

      <section aria-labelledby="overall" className="space-y-3 rounded-xl border border-border bg-surface p-5">
        <h2 id="overall" className="sr-only">
          Overall progress
        </h2>
        <ProgressBar label="Overall progress" done={summary.overall.done} total={summary.overall.total} percent={summary.overall.percent} />
        {nothingYet && (
          <p className="text-muted">
            You have not started anything yet.{" "}
            <Link href="/algorithms" className="font-medium text-accent underline">
              Pick your first algorithm
            </Link>
            , or follow a{" "}
            <Link href="/paths" className="font-medium text-accent underline">
              learning path
            </Link>
            .
          </p>
        )}
      </section>

      {resume && (
        <section aria-labelledby="resume" className="space-y-2 rounded-xl border border-border bg-surface p-5">
          <h2 id="resume" className="text-lg font-bold">
            Continue where you left off
          </h2>
          <p>
            <strong>{resume.title}</strong> <span className="text-muted">&middot; {resume.categoryName}</span>
          </p>
          <Link href={`/algorithms/${resume.id}`} className="inline-flex min-h-11 items-center rounded-lg bg-accent px-5 font-semibold text-accent-fg hover:opacity-90">
            Continue
          </Link>
        </section>
      )}

      <section aria-labelledby="by-topic" className="space-y-4">
        <h2 id="by-topic" className="text-xl font-bold">
          By topic
        </h2>
        {summary.byCategory.map((c) => (
          <ProgressBar key={c.id} label={c.name} done={c.tally.done} total={c.tally.total} percent={c.tally.percent} />
        ))}
      </section>

      {completed.length > 0 && (
        <section aria-labelledby="done" className="space-y-2">
          <h2 id="done" className="text-xl font-bold">
            Completed
          </h2>
          <ul className="space-y-1">
            {completed.map((p) => (
              <li key={p.algorithmSlug}>
                <span aria-hidden="true" className="text-success">
                  ✓{" "}
                </span>
                <Link href={`/algorithms/${p.algorithmSlug}`} className="font-medium hover:underline">
                  {byId.get(p.algorithmSlug)!.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
