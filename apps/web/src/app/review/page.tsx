import type { Metadata } from "next";
import { ReviewPage } from "@/components/review/review-page";
import { catalogCards } from "@/lib/catalog-cards";

export const metadata: Metadata = { title: "Review", description: "Spaced-repetition review of the algorithms you have learned." };

export default function Page() {
  return <ReviewPage cards={catalogCards()} />;
}
