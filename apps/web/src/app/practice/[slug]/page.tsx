import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAlgorithm, listAlgorithms, practiceFunctionName, practiceInputLines, practiceReturnLine, previewValue, starterCode, type PracticeLanguage } from "@algovision/algorithms";
import { practiceData } from "@algovision/algorithms/codepractice-data";
import { PracticeWorkbench } from "@/components/practice/practice-workbench";

type Props = { params: Promise<{ slug: string }> };
export const dynamicParams = false;
export function generateStaticParams() {
  return listAlgorithms().map(({ id }) => ({ slug: id }));
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const entry = getAlgorithm(slug);
  return entry ? { title: `Practice: ${entry.content.meta.title}`, description: `Write ${entry.content.meta.title} in JavaScript or Python and run it against test cases in your browser.` } : {};
}

export default async function PracticePage({ params }: Props) {
  const { slug } = await params;
  const entry = getAlgorithm(slug);
  const data = practiceData[slug];
  if (!entry || !data) notFound();
  const meta = entry.content.meta;
  const langs: PracticeLanguage[] = ["javascript", "python"];
  const fns = Object.fromEntries(langs.map((l) => [l, practiceFunctionName(data, l)])) as Record<PracticeLanguage, string>;
  const starters = Object.fromEntries(langs.map((l) => [l, starterCode(meta, data, l)])) as Record<PracticeLanguage, string>;
  const example = data.vectors[0]!;
  return (
    <div className="space-y-6">
      <nav aria-label="Breadcrumb" className="text-sm text-muted">
        <Link href="/practice" className="hover:underline">Practice</Link> / <Link href={`/algorithms/${slug}`} className="hover:underline">{meta.title}</Link>
      </nav>
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">{meta.title}</h1>
        <p className="max-w-3xl text-muted">{meta.summary}</p>
      </header>
      <section aria-labelledby="task-h" className="space-y-2 rounded-xl border border-border p-4">
        <h2 id="task-h" className="text-lg font-semibold">The task</h2>
        <p className="text-sm">
          Write a function named <code className="rounded bg-surface-2 px-1 font-mono">{fns.python}</code> in Python, or <code className="rounded bg-surface-2 px-1 font-mono">{fns.javascript}</code> in JavaScript.
        </p>
        <ul className="list-disc space-y-1 pl-5 text-sm">
          {practiceInputLines(meta).map((l) => <li key={l}>{l}</li>)}
          <li>Returns {practiceReturnLine(meta)}.</li>
          <li>Target: time {meta.complexity.time}, space {meta.complexity.space}.</li>
          {data.note && <li>{data.note}</li>}
        </ul>
        <p className="text-sm">
          Example <span className="font-mono text-xs">({example.name})</span>: input <code className="font-mono text-xs">{previewValue(example.args.length === 1 ? example.args[0] : example.args)}</code> returns <code className="font-mono text-xs">{previewValue(example.expected)}</code>.
        </p>
        <p className="text-xs text-muted">Your code runs in a Web Worker in this browser and never leaves it. This is for practice, not a secure sandbox.</p>
      </section>
      <PracticeWorkbench id={slug} title={meta.title} adapter={data.adapter} fns={fns} starters={starters} vectors={data.vectors} />
    </div>
  );
}
