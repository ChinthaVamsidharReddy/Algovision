import type { Metadata } from "next";
import { Suspense } from "react";
import { SearchPage } from "@/components/catalog/search-page";
import { catalogCards } from "@/lib/catalog-cards";

export const metadata: Metadata = { title: "Search" };

export default function Page() {
  return (
    <Suspense fallback={<p role="status" className="text-muted">Loading…</p>}>
      <SearchPage cards={catalogCards()} />
    </Suspense>
  );
}
