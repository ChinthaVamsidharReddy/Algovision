import type { Metadata } from "next";
import { Suspense } from "react";
import { CatalogBrowser } from "@/components/catalog/catalog-browser";
import { catalogCards } from "@/lib/catalog-cards";

export const metadata: Metadata = { title: "Algorithms" };

export default function AlgorithmsPage() {
  return (
    <Suspense fallback={<p role="status" className="text-muted">Loading…</p>}>
      <CatalogBrowser cards={catalogCards()} title="Algorithms" />
    </Suspense>
  );
}
