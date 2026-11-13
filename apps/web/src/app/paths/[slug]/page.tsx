import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PATHS } from "@algovision/algorithms";
import { PathView } from "@/components/paths/path-view";
import { pathData } from "@/lib/learning-data";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;
export const generateStaticParams = () => PATHS.map((p) => ({ slug: p.id }));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const path = PATHS.find((p) => p.id === slug);
  return path ? { title: path.title, description: path.summary } : {};
}

export default async function PathPage({ params }: Props) {
  const { slug } = await params;
  const path = pathData().find((p) => p.id === slug);
  if (!path) notFound();
  return (
    <div className="space-y-5">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">Learning path &middot; {path.level.toLowerCase()}</p>
        <h1 className="text-3xl font-bold tracking-tight">{path.title}</h1>
        <p className="max-w-3xl text-muted">{path.summary}</p>
      </header>
      <PathView path={path} />
    </div>
  );
}
