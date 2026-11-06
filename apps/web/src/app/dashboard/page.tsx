import type { Metadata } from "next";
import { Dashboard } from "@/components/dashboard/dashboard";
import { catalogCards } from "@/lib/catalog-cards";

export const metadata: Metadata = { title: "My learning", robots: { index: false } };

export default function Page() {
  return <Dashboard cards={catalogCards()} />;
}
