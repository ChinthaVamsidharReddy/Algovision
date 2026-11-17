import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PATHS } from "@algovision/algorithms";
import { Certificate } from "@/components/paths/certificate";
import { pathData } from "@/lib/learning-data";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;
export const generateStaticParams = () => PATHS.map((p) => ({ slug: p.id }));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const path = PATHS.find((p) => p.id === slug);
  return { title: path ? `Certificate: ${path.title}` : "Certificate", robots: { index: false } };
}

export default async function CertificatePage({ params }: Props) {
  const { slug } = await params;
  const path = pathData().find((p) => p.id === slug);
  if (!path) notFound();
  return <Certificate path={path} />;
}
