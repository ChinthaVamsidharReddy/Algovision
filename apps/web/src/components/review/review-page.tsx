"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { CatalogCard } from "@/lib/catalog-cards";
import { localDay } from "@/lib/activity-log";
import { solvedMarks } from "@/lib/practice/storage";
import { dueCards, grade, nextDue, readReview, syncReview, writeReview, type ReviewStore, type Seed } from "@/lib/review";
import { useLearning } from "../learning/learning-provider";

/** Today's spaced-repetition review: recall first, then reveal, then say whether you remembered. Works signed out too. */
export function ReviewPage({ cards }: { cards: CatalogCard[] }) {
  const learning = useLearning();
  const byId = useMemo(() => new Map(cards.map((c) => [c.id, c])), [cards]);
  const [store, setStore] = useState<ReviewStore | null>(null);
  const [queue, setQueue] = useState<string[]>([]);
  const [shown, setShown] = useState(false);
  const [reviewed, setReviewed] = useState(0);
  const day = useMemo(() => localDay(new Date()), []);

  // Seeds: finished algorithms (signed in) and solved practice problems (this browser).
  const seeds = useMemo<Seed[]>(() => {
    const out = new Map<string, Seed>();
    for (const m of solvedMarks(cards.map((c) => c.id))) out.set(m.id, { id: m.id, date: m.date });
    for (const p of learning.progress.values()) {
      if (p.status === "COMPLETED" && byId.has(p.algorithmSlug)) {
        out.set(p.algorithmSlug, { id: p.algorithmSlug, date: p.completedAt ? localDay(new Date(p.completedAt)) : null });
      }
    }
    return [...out.values()];
  }, [cards, byId, learning.progress]);

  // Build the queue once the progress has loaded (a signed-in learner's list arrives after the first render).
  const ready = learning.status !== "loading";
  useEffect(() => {
    if (!ready) return;
    const synced = syncReview(readReview(), seeds, day);
    writeReview(synced);
    setStore(synced);
    setQueue(dueCards(synced, day).filter((id) => byId.has(id)));
    setShown(false);
  }, [ready, seeds, day, byId]);

  if (!store) {
    return (
      <div role="status" aria-live="polite" className="space-y-3">
        <div className="h-8 w-1/3 animate-pulse rounded-lg bg-surface-2" />
        <div className="h-40 animate-pulse rounded-xl bg-surface-2" />
        <span className="sr-only">Loading your review list…</span>
      </div>
    );
  }

  const current = queue[0] ? byId.get(queue[0]) : undefined;
  const total = Object.keys(store.items).length;
  const upcoming = nextDue(store, day);

  const answer = (remembered: boolean) => {
    if (!current) return;
    const next = grade(store, current.id, remembered, day);
    writeReview(next);
    setStore(next);
    setQueue((q) => q.slice(1));
    setReviewed((n) => n + 1);
    setShown(false);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Review</h1>
        <p className="text-muted">
          Algorithms fade unless you revisit them. Each one you finish or solve comes back after 1, 3, 7, 14, 30 and then 60 days. Try to recall it before you look.
        </p>
      </div>

      {current ? (
        <section aria-labelledby="card-title" className="space-y-4 rounded-xl border border-border bg-surface p-6" data-testid="review-card">
          <p className="text-sm text-muted" aria-live="polite" data-testid="review-remaining">
            {queue.length} left today &middot; {current.categoryName}
          </p>
          <h2 id="card-title" className="text-2xl font-bold">
            {current.title}
          </h2>
          {!shown ? (
            <>
              <p>In your own words: how does it work, and what are its time and space complexity?</p>
              <button type="button" onClick={() => setShown(true)} className="min-h-11 rounded-lg bg-accent px-5 font-semibold text-accent-fg hover:opacity-90">
                Show the answer
              </button>
            </>
          ) : (
            <>
              <p>{current.summary}</p>
              <p className="text-sm">
                <strong>Time:</strong> {current.time} &middot; <strong>Space:</strong> {current.space}
              </p>
              <p>
                <Link href={`/algorithms/${current.id}`} className="font-medium text-accent underline">
                  Open it to refresh your memory
                </Link>
              </p>
              <div className="flex flex-wrap gap-3 pt-1">
                <button type="button" onClick={() => answer(true)} className="min-h-11 rounded-lg bg-accent px-5 font-semibold text-accent-fg hover:opacity-90">
                  I remembered it
                </button>
                <button type="button" onClick={() => answer(false)} className="min-h-11 rounded-lg border border-border px-5 font-semibold hover:bg-surface-2">
                  I forgot, ask me again tomorrow
                </button>
              </div>
            </>
          )}
        </section>
      ) : (
        <section className="space-y-2 rounded-xl border border-border bg-surface p-6" data-testid="review-empty">
          <h2 className="text-xl font-bold">{total === 0 ? "Nothing to review yet" : reviewed > 0 ? "All done for today" : "Nothing is due today"}</h2>
          {total === 0 ? (
            <p className="text-muted">
              Finish an algorithm (signed in) or solve its practice problem and it will appear here a day later. You can also add one from its page.{" "}
              <Link href="/algorithms" className="font-medium text-accent underline">
                Browse algorithms
              </Link>
            </p>
          ) : (
            <p className="text-muted" data-testid="review-summary">
              {reviewed > 0 ? `You reviewed ${reviewed} today. ` : ""}
              {upcoming ? `Your next review is on ${upcoming}.` : "Nothing else is scheduled."} {total} {total === 1 ? "algorithm is" : "algorithms are"} in your schedule.
            </p>
          )}
        </section>
      )}
    </div>
  );
}
