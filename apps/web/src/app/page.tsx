import { STORIES, CHAIN_STORIES, TREE_STORIES, GRAPH_STORIES, GRID_STORIES, PILE_STORIES, TRIE_STORIES } from "@/lib/stories";
import { catalogCards } from "@/lib/catalog-cards";
import { FinalCta, Features, Hero, HowItWorks, Marquee, Stats, StoryTeaser } from "@/components/landing/landing-sections";
import "./landing.css";

export default function LandingPage() {
  const cards = catalogCards();
  const stories = STORIES.length + CHAIN_STORIES.length + TREE_STORIES.length + GRAPH_STORIES.length + GRID_STORIES.length + PILE_STORIES.length + TRIE_STORIES.length;
  return (
    <div className="space-y-20 pb-6">
      <Hero />
      <Marquee />
      <Stats algorithms={cards.length} categories={new Set(cards.map((c) => c.categoryId)).size} stories={stories} />
      <HowItWorks />
      <StoryTeaser />
      <Features />
      <FinalCta />
    </div>
  );
}
