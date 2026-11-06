"use client";

import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import type { CatalogCard } from "@/lib/catalog-cards";
import { groupCards } from "@/lib/catalog-cards";
import { summarize } from "@/lib/progress";
import { searchCards } from "@/lib/search";
import { useAuth } from "../auth/auth-provider";
import { useLearning } from "../learning/learning-provider";
import { ProgressBar } from "../learning/progress-bar";
import { AlgorithmCard } from "./algorithm-card";

const LEVELS = ["all", "beginner", "intermediate", "advanced"] as const;

export function CatalogBrowser({ cards, initialQuery = "", title, autoFocus = false }: { cards: CatalogCard[]; initialQuery?: string; title: string; autoFocus?: boolean }) {
  const pathname = usePathname();
  const auth = useAuth();
  const learning = useLearning();
  const [query, setQuery] = useState(initialQuery);
  const [level, setLevel] = useState<(typeof LEVELS)[number]>("all");
  const [category, setCategory] = useState("all");

  const categories = useMemo(() => groupCards(cards).map((g) => ({ id: g.categoryId, name: g.categoryName })), [cards]);
  const levels = useMemo(() => new Set(cards.map((c) => c.difficulty)), [cards]);
  const filtered = useMemo(() => cards.filter((c) => (level === "all" || c.difficulty === level) && (category === "all" || c.categoryId === category)), [cards, level, category]);
  const searching = query.trim().length > 0;
  const results = useMemo(() => (searching ? searchCards(query, filtered).map((r) => r.card) : []), [searching, query, filtered]);
  const groups = useMemo(() => groupCards(filtered), [filtered]);

  const summary = useMemo(
    () =>
      auth.status === "authenticated" && learning.status === "ready"
        ? summarize(groupCards(cards).map((g) => ({ id: g.categoryId, name: g.categoryName, ids: g.cards.map((c) => c.id) })), learning.progress)
        : null,
    [auth.status, learning.status, learning.progress, cards],
  );

  const returnTo = pathname;
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <p className="max-w-2xl text-muted">Every algorithm ships with verified Java, Python, C++ and C implementations.</p>
      </div>

      {summary && <ProgressBar label="Your progress" done={summary.overall.done} total={summary.overall.total} percent={summary.overall.percent} />}

      <div className="space-y-3">
        <div role="search" className="space-y-1">
          <label htmlFor="catalog-q" className="block text-sm font-semibold">
            Search algorithms, data structures and techniques
          </label>
          <input
            id="catalog-q"
            type="search"
            value={query}
            autoFocus={autoFocus}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Try: two pointers, stack, sorting, binary tree…"
            autoComplete="off"
            className="min-h-11 w-full max-w-xl rounded-lg border border-border bg-bg px-3"
          />
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2" role="group" aria-label="Filters">
          <fieldset className="flex flex-wrap items-center gap-2">
            <legend className="sr-only">Difficulty</legend>
            {LEVELS.filter((l) => l === "all" || levels.has(l)).map((l) => (
              <button key={l} type="button" aria-pressed={level === l} onClick={() => setLevel(l)} className={`min-h-9 rounded-full border px-3 text-sm font-medium capitalize ${level === l ? "border-accent bg-surface-2 text-accent" : "border-border hover:bg-surface-2"}`}>
                {l}
              </button>
            ))}
          </fieldset>
          <label className="flex items-center gap-2 text-sm font-medium">
            Topic
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="min-h-9 rounded-lg border border-border bg-bg px-2">
              <option value="all">All topics</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <p role="status" aria-live="polite" className="text-sm text-muted">
        {searching ? `${results.length} ${results.length === 1 ? "result" : "results"} for “${query.trim()}”` : `${filtered.length} ${filtered.length === 1 ? "algorithm" : "algorithms"}`}
      </p>

      {searching ? (
        results.length > 0 ? (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((c) => (
              <AlgorithmCard key={c.id} card={c} returnTo={returnTo} />
            ))}
          </ul>
        ) : (
          <div className="space-y-2 rounded-xl border border-border bg-surface p-5">
            <p className="font-semibold">Nothing matches “{query.trim()}”.</p>
            <p className="text-muted">Try a topic such as sorting, searching, arrays, two pointers, sliding window, linked list, stack, queue or tree.</p>
            <button type="button" onClick={() => { setQuery(""); setLevel("all"); setCategory("all"); }} className="min-h-11 rounded-lg border border-border px-4 font-semibold hover:bg-surface-2">
              Clear search and filters
            </button>
          </div>
        )
      ) : groups.length > 0 ? (
        groups.map((g) => (
          <section key={g.categoryId} aria-labelledby={`cat-${g.categoryId}`} className="space-y-3">
            <h2 id={`cat-${g.categoryId}`} className="text-xl font-bold">
              {g.categoryName}
            </h2>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {g.cards.map((c) => (
                <AlgorithmCard key={c.id} card={c} returnTo={returnTo} />
              ))}
            </ul>
          </section>
        ))
      ) : (
        <p className="rounded-xl border border-border bg-surface p-5 text-muted">No algorithms match these filters.</p>
      )}
    </div>
  );
}
