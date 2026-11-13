import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getAlgorithm, listAlgorithms } from "@algovision/algorithms";
import { Workspace, WorkspaceSkeleton } from "@/components/workspace/workspace";
import { AlgorithmExtras } from "@/components/learning/algorithm-extras";
import { extrasFor } from "@/lib/learning-data";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return listAlgorithms().map(({ id }) => ({ slug: id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const entry = getAlgorithm(slug);
  return entry ? { title: entry.content.meta.title, description: entry.content.meta.summary } : {};
}

export default async function AlgorithmPage({ params }: Props) {
  const { slug } = await params;
  if (!getAlgorithm(slug)) notFound();
  return (
    <>
      <Suspense fallback={<WorkspaceSkeleton />}>
        <Workspace algorithmId={slug} />
      </Suspense>
      <AlgorithmExtras id={slug} extras={extrasFor(slug)} />
    </>
  );
}
