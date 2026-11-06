"use client";

import { useSearchParams } from "next/navigation";
import type { CatalogCard } from "@/lib/catalog-cards";
import { CatalogBrowser } from "./catalog-browser";

export function SearchPage({ cards }: { cards: CatalogCard[] }) {
  const q = useSearchParams().get("q") ?? "";
  return <CatalogBrowser key={q} cards={cards} initialQuery={q.slice(0, 100)} title="Search" autoFocus />;
}
