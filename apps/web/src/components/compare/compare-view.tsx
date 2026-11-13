"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import type { CompareRow } from "@/lib/learning-data";
import { COMPARE_SUGGESTIONS } from "@/lib/learning-data";

type Row = { label: string; get: (r: CompareRow) => string };
const ROWS: Row[] = [
  { label: "Topic", get: (r) => r.categoryName },
  { label: "Level", get: (r) => r.difficulty },
  { label: "Time", get: (r) => r.time },
  { label: "Space", get: (r) => r.space },
  { label: "Steps in its example", get: (r) => String(r.exampleSteps) },
  { label: "Example input", get: (r) => r.exampleInput },
  { label: "What it does", get: (r) => r.summary },
];

export function CompareView({ rows }: { rows: readonly CompareRow[] }) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const byId = useMemo(() => new Map(rows.map((r) => [r.id, r])), [rows]);
  const a = byId.get(params.get("a") ?? "") ?? null;
  const b = byId.get(params.get("b") ?? "") ?? null;

  const set = (key: "a" | "b", value: string) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value); else next.delete(key);
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  };
  const groups = useMemo(() => {
    const map = new Map<string, CompareRow[]>();
    for (const r of rows) map.set(r.categoryName, [...(map.get(r.categoryName) ?? []), r]);
    return [...map];
  }, [rows]);

  const select = (key: "a" | "b", label: string, value: CompareRow | null) => (
    <div className="min-w-0 space-y-1">
      <label htmlFor={`cmp-${key}`} className="text-sm font-medium">{label}</label>
      <select id={`cmp-${key}`} value={value?.id ?? ""} onChange={(e) => set(key, e.target.value)} className="min-h-11 w-full max-w-full rounded-lg border border-border bg-surface px-3">
        <option value="">Choose an algorithm…</option>
        {groups.map(([name, list]) => (
          <optgroup key={name} label={name}>
            {list.map((r) => <option key={r.id} value={r.id}>{r.title}</option>)}
          </optgroup>
        ))}
      </select>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2">
        {select("a", "First algorithm", a)}
        {select("b", "Second algorithm", b)}
      </div>

      {a && b ? (
        <div className="relative overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[34rem] text-left text-sm">
            <caption className="sr-only">Side-by-side comparison of {a.title} and {b.title}</caption>
            <thead className="bg-surface-2">
              <tr>
                <td className="px-3 py-2" />
                <th scope="col" className="px-3 py-2 text-base font-semibold"><Link href={`/algorithms/${a.id}`} className="hover:underline">{a.title}</Link></th>
                <th scope="col" className="px-3 py-2 text-base font-semibold"><Link href={`/algorithms/${b.id}`} className="hover:underline">{b.title}</Link></th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r) => {
                const x = r.get(a), y = r.get(b);
                const differs = x !== y && (r.label === "Time" || r.label === "Space" || r.label === "Steps in its example");
                return (
                  <tr key={r.label} className="border-t border-border align-top">
                    <th scope="row" className="px-3 py-2 font-medium">{r.label}</th>
                    <td className={`px-3 py-2 ${r.label === "Time" || r.label === "Space" ? "font-mono" : ""}`}>{x}</td>
                    <td className={`px-3 py-2 ${r.label === "Time" || r.label === "Space" ? "font-mono" : ""}`}>
                      {y}
                      {differs && <span className="sr-only"> (different from {a.title})</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <section aria-labelledby="ideas" className="space-y-3">
          <h2 id="ideas" className="text-lg font-semibold">{a || b ? "Choose a second algorithm" : "Good pairs to start with"}</h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {COMPARE_SUGGESTIONS.map((s) => (
              <li key={s.a + s.b}>
                <Link href={`/compare?a=${s.a}&b=${s.b}`} className="block rounded-xl border border-border bg-surface p-4 hover:border-accent">
                  <span className="font-semibold">{byId.get(s.a)?.title} vs {byId.get(s.b)?.title}</span>
                  <span className="block text-sm text-muted">{s.why}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
