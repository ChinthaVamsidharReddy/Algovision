import { listGroups } from "@algovision/algorithms";

/** Everything the list, search and dashboard pages need - small and serialisable, without the lesson content. */
export interface CatalogCard {
  readonly id: string;
  readonly title: string;
  readonly summary: string;
  readonly difficulty: "beginner" | "intermediate" | "advanced";
  readonly categoryId: string;
  readonly categoryName: string;
  readonly topicName: string;
  readonly time: string;
  readonly space: string;
  readonly stateKind: string;
  /** Extra words people search for: category keywords plus the data-structure and difficulty words. */
  readonly keywords: readonly string[];
}

const STRUCTURE_WORDS: Record<string, string[]> = {
  linkedList: ["linked list", "data structure", "pointer"],
  array: ["array", "data structure"],
  stack: ["stack", "data structure", "lifo"],
  queue: ["queue", "data structure", "fifo"],
  tree: ["tree", "binary tree", "data structure", "recursion"],
  graph: ["graph", "vertex", "edge", "network", "data structure"],
  grid: ["grid", "matrix", "table", "2d", "dp table", "data structure"],
};

export function catalogCards(): CatalogCard[] {
  return listGroups().flatMap(({ category, algorithms }) =>
    algorithms.map(({ id, content }): CatalogCard => {
      const m = content.meta;
      return {
        id,
        title: m.title,
        summary: m.summary,
        difficulty: m.difficulty as CatalogCard["difficulty"],
        categoryId: category.id,
        categoryName: category.name,
        topicName: category.topic.name,
        time: m.complexity.time,
        space: m.complexity.space,
        stateKind: m.stateKind,
        keywords: [...category.keywords, ...(STRUCTURE_WORDS[m.stateKind] ?? []), m.difficulty, "algorithm", "dsa"],
      };
    }),
  );
}

export function groupCards(cards: readonly CatalogCard[]): { categoryId: string; categoryName: string; topicName: string; cards: CatalogCard[] }[] {
  const out: { categoryId: string; categoryName: string; topicName: string; cards: CatalogCard[] }[] = [];
  for (const card of cards) {
    let group = out.find((g) => g.categoryId === card.categoryId);
    if (!group) out.push((group = { categoryId: card.categoryId, categoryName: card.categoryName, topicName: card.topicName, cards: [] }));
    group.cards.push(card);
  }
  return out;
}
