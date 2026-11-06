"use client";

import Link from "next/link";
import type { CatalogCard } from "@/lib/catalog-cards";
import { BookmarkButton } from "../learning/bookmark-button";
import { useLearning } from "../learning/learning-provider";

/** One algorithm in a list: link, summary, complexity, progress badge and bookmark. */
export function AlgorithmCard({ card, returnTo }: { card: CatalogCard; returnTo: string }) {
  const learning = useLearning();
  const status = learning.progress.get(card.id)?.status;
  return (
    <li className="flex h-full flex-col rounded-xl border border-border bg-surface p-5 hover:border-accent">
      <p className="mb-2 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted">
        <span>{card.categoryName}</span>
        <span aria-hidden="true">&middot;</span>
        <span>{card.difficulty}</span>
        {status === "COMPLETED" && <span className="rounded bg-surface-2 px-1.5 text-success">✓ Completed</span>}
        {status === "IN_PROGRESS" && <span className="rounded bg-surface-2 px-1.5">In progress</span>}
      </p>
      <h3 className="mb-2 text-lg font-semibold">
        <Link href={`/algorithms/${card.id}`} className="hover:underline">
          {card.title}
        </Link>
      </h3>
      <p className="mb-3 flex-1 text-muted">{card.summary}</p>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm">
          Time <strong>{card.time}</strong> &middot; Space <strong>{card.space}</strong>
        </p>
        <BookmarkButton slug={card.id} title={card.title} returnTo={returnTo} compact />
      </div>
    </li>
  );
}
