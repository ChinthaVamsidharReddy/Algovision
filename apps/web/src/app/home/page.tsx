import type { Metadata } from "next";
import Link from "next/link";
import { catalogCards, groupCards } from "@/lib/catalog-cards";
import { HomeGreeting } from "@/components/home/home-greeting";
import { MiniVisual } from "@/components/home/mini-visual";
import "../landing.css";

export const metadata: Metadata = { title: "Home" };

const quick = [
  { href: "/algorithms", icon: "📚", title: "Browse algorithms", body: "The whole catalog, grouped by topic." },
  { href: "/paths", icon: "🧭", title: "Learning paths", body: "An ordered route with quizzes and certificates." },
  { href: "/practice", icon: "✍️", title: "Practice", body: "Write code and run it in your browser." },
  { href: "/review", icon: "🔁", title: "Daily review", body: "Revisit what you are about to forget." },
  { href: "/compare", icon: "⚖️", title: "Compare", body: "Two algorithms, side by side." },
  { href: "/cheatsheet", icon: "🗒️", title: "Cheat sheet", body: "Everything on one printable page." },
];

const starters = ["linear-search", "bubble-sort", "binary-search", "linked-list-reverse", "stack-push-pop", "bfs-traversal", "dijkstra", "climbing-stairs"];

const topicEmoji: Record<string, string> = {
  arrays: "🧱", "two-pointers": "👉👈", "sliding-window": "🪟", "linked-list": "🔗", searching: "🔎", sorting: "📊", "stacks-and-queues": "🥞", hashing: "#️⃣",
  trees: "🌳", heaps: "⛰️", recursion: "🪆", "dynamic-programming": "🧩", graphs: "🕸️", backtracking: "🧭", greedy: "🍀", math: "➗", "bit-manipulation": "🔢", strings: "🔤",
};

const levelLabel = { beginner: "Beginner", intermediate: "Intermediate", advanced: "Advanced" } as const;

export default function HomePage() {
  const cards = catalogCards();
  const byId = new Map(cards.map((c) => [c.id, c]));
  const featured = starters.map((id) => byId.get(id)).filter((c) => c !== undefined);
  const topics = groupCards(cards);
  return (
    <div className="space-y-14 pb-6">
      <section aria-label="Welcome" className="lp-bleed space-y-8 pb-4 pt-4">
        <div className="lp-dots" aria-hidden="true" />
        <HomeGreeting />
        <ul aria-label="Quick links" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {quick.map((q, i) => (
            <li key={q.href} className="lp-fade-up" style={{ ["--d" as string]: `${i * 70}ms` }}>
              <Link href={q.href} className="lp-card flex h-full items-center gap-4 rounded-2xl border border-border bg-surface p-4">
                <span aria-hidden="true" className="lp-icon grid size-12 shrink-0 place-items-center rounded-xl bg-surface-2 text-2xl">
                  {q.icon}
                </span>
                <span>
                  <span className="block font-bold">{q.title}</span>
                  <span className="block text-sm text-muted">{q.body}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="start" className="space-y-5">
        <div className="lp-reveal flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 id="start" className="text-2xl font-extrabold tracking-tight sm:text-3xl">
              Start here
            </h2>
            <p className="text-muted">Friendly first algorithms, each with a visual run and an everyday story.</p>
          </div>
          <Link href="/algorithms" className="font-semibold text-accent hover:underline">
            See all {cards.length} →
          </Link>
        </div>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((c) => (
            <li key={c.id} className="lp-reveal">
              <Link href={`/algorithms/${c.id}`} className="lp-card flex h-full flex-col gap-3 rounded-2xl border border-border bg-surface p-4">
                <div className="rounded-xl bg-surface-2 p-2">
                  <MiniVisual kind={c.stateKind} />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold">{c.title}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-muted">{c.summary}</p>
                </div>
                <p className="flex items-center justify-between text-xs font-medium text-muted">
                  <span className="rounded-full bg-surface-2 px-2.5 py-1">{levelLabel[c.difficulty]}</span>
                  <span>Time {c.time}</span>
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="topics" className="space-y-5">
        <div className="lp-reveal">
          <h2 id="topics" className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            Explore by topic
          </h2>
          <p className="text-muted">{topics.length} topics, from arrays to graphs.</p>
        </div>
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          {topics.map((t) => (
            <li key={t.categoryId} className="lp-reveal">
              <Link href={`/algorithms#cat-${t.categoryId}`} className="lp-card flex h-full flex-col items-start gap-2 rounded-2xl border border-border bg-surface p-4">
                <span aria-hidden="true" className="lp-icon text-3xl">
                  {topicEmoji[t.categoryId] ?? "✨"}
                </span>
                <span className="font-bold leading-tight">{t.categoryName}</span>
                <span className="text-xs text-muted">
                  {t.cards.length} {t.cards.length === 1 ? "algorithm" : "algorithms"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="habit" className="lp-reveal relative overflow-hidden rounded-3xl border border-border bg-surface p-6 sm:p-10">
        <div className="lp-blob -right-8 -top-8 size-44 bg-brand-2" aria-hidden="true" />
        <div className="max-w-2xl space-y-3">
          <h2 id="habit" className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            Ten minutes a day beats ten hours before the interview
          </h2>
          <p className="text-muted">Do your daily review, solve one practice problem, and keep your streak alive. Small, steady and remembered.</p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link href="/review" className="lp-cta inline-flex min-h-11 items-center rounded-xl px-5 font-semibold text-white">
              Start today&apos;s review
            </Link>
            <Link href="/practice" className="inline-flex min-h-11 items-center rounded-xl border border-border bg-bg px-5 font-semibold hover:border-accent hover:text-accent">
              Open practice
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
