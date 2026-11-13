import type { Metadata } from "next";
import Link from "next/link";
import { PrintButton } from "@/components/print-button";
import { catalogCards, groupCards } from "@/lib/catalog-cards";

export const metadata: Metadata = { title: "Cheat sheet", description: "Time and space complexity of every algorithm, one page per topic, printable." };

export default function CheatSheetPage() {
  const groups = groupCards(catalogCards());
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Cheat sheet</h1>
        <p className="max-w-3xl text-muted">Every algorithm with its time and space cost, grouped by topic. Use it to revise before an interview, or print it.</p>
        <PrintButton />
      </div>
      {groups.map((g) => (
        <section key={g.categoryId} aria-labelledby={`cat-${g.categoryId}`} className="break-inside-avoid space-y-2">
          <h2 id={`cat-${g.categoryId}`} className="text-xl font-semibold">{g.categoryName}</h2>
          <div className="relative overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[32rem] text-left text-sm">
              <caption className="sr-only">{g.categoryName} algorithms with time and space complexity</caption>
              <thead className="bg-surface-2">
                <tr>
                  <th scope="col" className="px-3 py-2 font-semibold">Algorithm</th>
                  <th scope="col" className="px-3 py-2 font-semibold">Time</th>
                  <th scope="col" className="px-3 py-2 font-semibold">Space</th>
                  <th scope="col" className="px-3 py-2 font-semibold">Level</th>
                </tr>
              </thead>
              <tbody>
                {g.cards.map((c) => (
                  <tr key={c.id} className="border-t border-border align-top">
                    <th scope="row" className="px-3 py-2 font-medium">
                      <Link href={`/algorithms/${c.id}`} className="hover:underline">{c.title}</Link>
                      <span className="block text-xs font-normal text-muted print:hidden">{c.summary}</span>
                    </th>
                    <td className="px-3 py-2 font-mono">{c.time}</td>
                    <td className="px-3 py-2 font-mono">{c.space}</td>
                    <td className="px-3 py-2 capitalize">{c.difficulty}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  );
}
