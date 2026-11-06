import type { Metadata } from "next";
import { BookmarksPage } from "@/components/dashboard/bookmarks-page";
import { catalogCards } from "@/lib/catalog-cards";

export const metadata: Metadata = { title: "Bookmarks", robots: { index: false } };

export default function Page() {
  return <BookmarksPage cards={catalogCards()} />;
}
