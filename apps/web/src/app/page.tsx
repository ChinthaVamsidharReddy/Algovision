import Link from "next/link";
import { brand } from "../../brand.config";

const steps = [
  { title: "Watch it run", body: "Every step of the algorithm is drawn as it happens: nodes appear, pointers move, links change." },
  { title: "Read the code", body: "The matching line lights up in Java, Python, C++ or C. Switch language without losing your place." },
  { title: "Understand why", body: "Each step explains what changed and why, with live variable values beside it." },
];

export default function HomePage() {
  return (
    <div className="space-y-16 py-6">
      <section className="max-w-3xl space-y-5">
        <p className="text-sm font-semibold uppercase tracking-widest text-muted">Visual DSA learning</p>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{brand.tagline}</h1>
        <p className="text-lg text-muted">{brand.description}</p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Link
            href="/algorithms/linked-list-insert-head"
            className="inline-flex min-h-11 items-center rounded-lg bg-accent px-5 font-semibold text-accent-fg hover:opacity-90"
          >
            Try Linked List insertion
          </Link>
          <Link href="/algorithms" className="inline-flex min-h-11 items-center rounded-lg border border-border px-5 font-semibold hover:bg-surface-2">
            Browse algorithms
          </Link>
        </div>
      </section>

      <section aria-labelledby="how" className="space-y-6">
        <h2 id="how" className="text-2xl font-bold">
          How it works
        </h2>
        <ol className="grid gap-4 sm:grid-cols-3">
          {steps.map((s, i) => (
            <li key={s.title} className="rounded-xl border border-border bg-surface p-5">
              <span className="mb-3 inline-grid size-8 place-items-center rounded-full bg-surface-2 text-sm font-bold">{i + 1}</span>
              <h3 className="mb-1 text-lg font-semibold">{s.title}</h3>
              <p className="text-muted">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
