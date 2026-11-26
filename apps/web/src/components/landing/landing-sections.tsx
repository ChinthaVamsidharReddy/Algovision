import Link from "next/link";
import { brand } from "../../../brand.config";
import { CountUp } from "./count-up";

const headline = ["Your", "friendly", "companion", "for", "mastering"];
const topics = ["Sorting", "Searching", "Graphs", "Recursion", "Dynamic programming"];
const bars = [38, 72, 54, 90, 46, 78, 62];
const codeLines = ["for (int i = 0; i < n; i++) {", "  if (a[i] > a[i + 1]) {", "    swap(a, i, i + 1);", "  }", "}"];
const captions = ["Compare 38 and 72", "72 is bigger, keep going", "Compare 54 and 90", "Mark the biggest so far", "Slide the pointer along", "One pass done", "Start the next pass"];

export function Hero() {
  return (
    <section aria-labelledby="hero-title" className="lp-bleed pb-10 pt-6 sm:pt-12">
      <div className="lp-dots" aria-hidden="true" />
      <div className="lp-blob -left-10 top-10 size-56 bg-accent" aria-hidden="true" style={{ animationDelay: "-3s" }} />
      <div className="lp-blob right-0 top-40 size-64 bg-brand-2" aria-hidden="true" style={{ animationDelay: "-8s" }} />
      <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-7">
          <p className="lp-fade-up inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-1.5 text-sm font-medium text-muted" style={{ ["--d" as string]: "0ms" }}>
            <span aria-hidden="true" className="lp-badge-dot size-2 rounded-full bg-success" />
            {brand.name} <span className="text-muted">({brand.pronunciation})</span>
          </p>
          <h1 id="hero-title" className="text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-6xl">
            <span className="sr-only">{brand.tagline}</span>
            <span aria-hidden="true">
              {headline.map((w, i) => (
                <span key={w} className="lp-word mr-[0.28em]" style={{ ["--i" as string]: i }}>
                  {w}
                </span>
              ))}
              <span className="lp-word lp-gradient-text" style={{ ["--i" as string]: headline.length }}>
                DSA.
              </span>
            </span>
          </h1>
          <div className="lp-fade-up max-w-xl space-y-2 text-lg text-muted sm:text-xl" style={{ ["--d" as string]: "700ms" }}>
            <p>Watch algorithms run, one step at a time. Read the code in four languages, and remember it through everyday stories.</p>
            <p aria-hidden="true" className="font-semibold text-fg">
              Try it on: <span className="lp-rotator">
                {topics.map((t, i) => (
                  <span key={t} className="lp-gradient-text" style={{ ["--i" as string]: i }}>
                    {t}
                  </span>
                ))}
              </span>
            </p>
          </div>
          <div className="lp-fade-up flex flex-wrap gap-3" style={{ ["--d" as string]: "900ms" }}>
            <Link href="/home" className="lp-cta inline-flex min-h-12 items-center gap-2 rounded-xl px-6 text-base font-semibold text-white">
              Start learning <span aria-hidden="true">→</span>
            </Link>
            <Link href="/algorithms/bubble-sort" className="inline-flex min-h-12 items-center rounded-xl border border-border bg-surface px-6 text-base font-semibold transition hover:-translate-y-0.5 hover:border-accent hover:text-accent">
              See a live demo
            </Link>
          </div>
          <p className="lp-fade-up text-sm text-muted" style={{ ["--d" as string]: "1100ms" }}>
            Free to use. No sign-up needed to start. Works offline once installed.
          </p>
        </div>

        <div className="lp-window mx-auto w-full max-w-lg rounded-2xl border border-border bg-surface shadow-[0_30px_70px_-30px_var(--accent)]" aria-hidden="true">
          <div className="flex items-center gap-1.5 border-b border-border px-4 py-3">
            <span className="size-3 rounded-full bg-danger opacity-80" />
            <span className="size-3 rounded-full bg-[var(--role-active-stroke)] opacity-80" />
            <span className="size-3 rounded-full bg-success opacity-80" />
            <span className="ml-3 text-xs font-medium text-muted">bubble-sort · step by step</span>
          </div>
          <div className="space-y-5 p-5">
            <div>
              <div className="lp-bars">
                {bars.map((h, i) => (
                  <div key={i} className="lp-bar" style={{ ["--h" as string]: `${h}%`, ["--i" as string]: i }} />
                ))}
              </div>
              <div className="mt-1 text-center text-brand-4">
                <div className="lp-pointer text-lg leading-none">▲</div>
              </div>
            </div>
            <p className="lp-caption rounded-lg bg-surface-2 px-3 py-2 text-sm font-medium">
              {captions.map((c, i) => (
                <span key={c} style={{ ["--i" as string]: i }}>
                  {c}
                </span>
              ))}
            </p>
            <div className="relative overflow-hidden rounded-lg bg-[var(--code-bg)] py-2 font-mono text-[13px]">
              <div className="lp-code-hl absolute inset-x-0 top-2 bg-[var(--code-active-bg)] shadow-[inset_4px_0_0_var(--code-active-bar)]" />
              {codeLines.map((l) => (
                <div key={l} className="relative h-7 whitespace-pre px-4 leading-7">
                  {l}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const chips = ["Java", "Python", "C++", "C", "Arrays", "Linked lists", "Trees", "Graphs", "Heaps", "Tries", "Dynamic programming", "Recursion", "Sorting", "Hashing", "Backtracking", "Greedy"];

export function Marquee() {
  const row = chips.map((c) => (
    <span key={c} className="whitespace-nowrap rounded-full border border-border bg-surface px-4 py-1.5 text-sm font-medium text-muted">
      {c}
    </span>
  ));
  return (
    <section aria-label="Topics and languages covered" className="lp-marquee py-2">
      <div className="lp-marquee-track">
        <div className="flex gap-3">{row}</div>
        <div className="flex gap-3" aria-hidden="true">
          {row}
        </div>
      </div>
    </section>
  );
}

export function Stats({ algorithms, categories, stories }: { algorithms: number; categories: number; stories: number }) {
  const items = [
    { n: algorithms, plus: true, label: "algorithms with a visual run" },
    { n: categories, plus: false, label: "topics, from arrays to graphs" },
    { n: stories, plus: true, label: "everyday stories" },
    { n: 4, plus: false, label: "languages beside every step" },
  ];
  return (
    <section aria-label="AlgoMigo in numbers" className="lp-reveal">
      <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {items.map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-surface p-5 text-center">
            <dd className="lp-gradient-text text-4xl font-extrabold tabular-nums sm:text-5xl">
              <CountUp to={s.n} />
              {s.plus ? "+" : ""}
            </dd>
            <dt className="mt-1 text-sm text-muted">{s.label}</dt>
          </div>
        ))}
      </dl>
    </section>
  );
}

const steps = [
  { icon: "👀", title: "Watch it run", body: "Every step is drawn as it happens: values swap, pointers move, nodes light up. Pause, step back, or jump to any moment." },
  { icon: "💻", title: "Read the code", body: "The matching line lights up in Java, Python, C++ or C. Switch language without losing your place." },
  { icon: "🧠", title: "Remember it", body: "A short everyday story retells the same run, so the idea sticks long after the code fades." },
];

export function HowItWorks() {
  return (
    <section aria-labelledby="how" className="space-y-8">
      <div className="lp-reveal mx-auto max-w-2xl text-center">
        <h2 id="how" className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          Three ways in, <span className="lp-gradient-text">one idea</span>
        </h2>
        <p className="mt-3 text-muted">Each algorithm is taught the same three ways at once, so you can use whichever one clicks for you.</p>
      </div>
      <ol className="grid gap-5 md:grid-cols-3">
        {steps.map((s, i) => (
          <li key={s.title} className="lp-reveal lp-card relative rounded-2xl border border-border bg-surface p-6">
            <span aria-hidden="true" className="lp-icon mb-4 grid size-12 place-items-center rounded-xl bg-surface-2 text-2xl">
              {s.icon}
            </span>
            <span aria-hidden="true" className="absolute right-5 top-4 text-5xl font-extrabold text-border">
              {i + 1}
            </span>
            <h3 className="mb-1 text-xl font-bold">{s.title}</h3>
            <p className="text-muted">{s.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function StoryTeaser() {
  return (
    <section aria-labelledby="stories" className="lp-reveal grid items-center gap-8 rounded-3xl border border-border bg-surface p-6 sm:p-10 lg:grid-cols-2">
      <div className="space-y-4">
        <p className="text-sm font-semibold uppercase tracking-widest text-brand-2">Story mode</p>
        <h2 id="stories" className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          Algorithms as stories you will not forget
        </h2>
        <p className="text-muted">
          The tortoise and the hare find a loop in a linked list. Kids in a line find a pair that adds up. Sticky notes on a pile show how recursion waits for its answer.
          Every story replays the real algorithm, step by step, in plain words.
        </p>
        <Link href="/algorithms/find-duplicate-floyd" className="inline-flex min-h-11 items-center gap-2 font-semibold text-accent hover:underline">
          Meet the tortoise and the hare <span aria-hidden="true">→</span>
        </Link>
      </div>
      <div aria-hidden="true" className="space-y-3 rounded-2xl bg-surface-2 p-5">
        <div className="relative h-12 rounded-full bg-bg">
          <span className="lp-track-hare absolute top-1 text-3xl">🐇</span>
        </div>
        <div className="relative h-12 rounded-full bg-bg">
          <span className="lp-track-tortoise absolute top-1 text-3xl">🐢</span>
        </div>
        <p className="text-center text-sm font-medium text-muted">One moves two steps, one moves one. They meet inside the loop.</p>
      </div>
    </section>
  );
}

const features = [
  { icon: "🎞️", title: "Step-by-step visualizer", body: "Play, pause, step back and forward, and see live variables beside the picture." },
  { icon: "☕", title: "Four languages, in sync", body: "Java, Python, C++ and C, each verified, with the running line highlighted." },
  { icon: "✍️", title: "Practice in the browser", body: "Write JavaScript or Python and run it against test cases, with nothing to install." },
  { icon: "🔁", title: "Daily review", body: "Spaced repetition brings back the algorithms you are about to forget." },
  { icon: "🧭", title: "Learning paths", body: "Follow an ordered route from the basics, check yourself with quizzes, and earn a certificate." },
  { icon: "⚖️", title: "Compare and cheat sheet", body: "Put algorithms side by side, or print a one-page summary of the whole catalog." },
  { icon: "📴", title: "Works offline", body: "Install it like an app. Pages you have opened keep working without a connection." },
  { icon: "🔥", title: "Streaks and badges", body: "Small rewards that follow your real progress, so showing up each day feels good." },
];

export function Features() {
  return (
    <section aria-labelledby="features" className="space-y-8">
      <div className="lp-reveal mx-auto max-w-2xl text-center">
        <h2 id="features" className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          Everything you need, <span className="lp-gradient-text">nothing you do not</span>
        </h2>
      </div>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((f) => (
          <li key={f.title} className="lp-reveal lp-card rounded-2xl border border-border bg-surface p-5">
            <span aria-hidden="true" className="lp-icon mb-3 grid size-11 place-items-center rounded-xl bg-surface-2 text-xl">
              {f.icon}
            </span>
            <h3 className="mb-1 font-bold">{f.title}</h3>
            <p className="text-sm text-muted">{f.body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function FinalCta() {
  return (
    <section aria-labelledby="cta" className="lp-reveal relative overflow-hidden rounded-3xl border border-border bg-surface px-6 py-14 text-center sm:px-12">
      <div className="lp-blob -left-10 -top-10 size-48 bg-accent" aria-hidden="true" />
      <div className="lp-blob -bottom-10 -right-10 size-52 bg-brand-3" aria-hidden="true" style={{ animationDelay: "-5s" }} />
      <h2 id="cta" className="mx-auto max-w-2xl text-3xl font-extrabold tracking-tight sm:text-5xl">
        Meet your new DSA <span className="lp-gradient-text">amigo</span>
      </h2>
      <p className="mx-auto mt-4 max-w-xl text-muted">Pick any algorithm and press play. In a minute you will see why it works.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/home" className="lp-cta inline-flex min-h-12 items-center gap-2 rounded-xl px-7 text-base font-semibold text-white">
          Start learning <span aria-hidden="true">→</span>
        </Link>
        <Link href="/algorithms" className="inline-flex min-h-12 items-center rounded-xl border border-border bg-bg px-7 text-base font-semibold transition hover:-translate-y-0.5 hover:border-accent hover:text-accent">
          Browse algorithms
        </Link>
      </div>
    </section>
  );
}
