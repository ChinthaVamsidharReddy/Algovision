import type { Metadata } from "next";
import Link from "next/link";
import { SolvedMark } from "@/components/practice/solved-badge";
import { catalogCards, groupCards } from "@/lib/catalog-cards";

export const metadata: Metadata = { title: "Practice", description: "Write each algorithm yourself in JavaScript or Python and run it against test cases in your browser." };

export default function PracticeIndex() {
  const groups = groupCards(catalogCards());
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Practice</h1>
        <p className="max-w-3xl text-muted">Write the algorithm yourself, then run it against the same test cases the platform checks its own solutions with. Everything runs in your browser in JavaScript or Python, and your code never leaves it.</p>
      </div>
      {groups.map((g) => (
        <section key={g.categoryId} aria-labelledby={`cat-${g.categoryId}`} className="space-y-2">
          <h2 id={`cat-${g.categoryId}`} className="text-xl font-semibold">{g.categoryName}</h2>
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {g.cards.map((c) => (
              <li key={c.id}>
                <Link href={`/practice/${c.id}`} className="flex min-h-11 flex-col justify-center rounded-lg border border-border px-3 py-2 hover:bg-surface-2">
                  <span className="font-medium">{c.title}<SolvedMark id={c.id} /></span>
                  <span className="text-xs capitalize text-muted">{c.difficulty}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
