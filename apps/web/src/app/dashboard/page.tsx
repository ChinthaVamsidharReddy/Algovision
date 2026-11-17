import type { Metadata } from "next";
import { Dashboard } from "@/components/dashboard/dashboard";
import { PATHS } from "@algovision/algorithms";
import { catalogCards } from "@/lib/catalog-cards";

export const metadata: Metadata = { title: "My learning", robots: { index: false } };

export default function Page() {
  return <Dashboard cards={catalogCards()} paths={PATHS.map((p) => ({ id: p.id, title: p.title, steps: p.steps }))} />;
}
