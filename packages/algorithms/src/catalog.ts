import catalogFile from "../catalog.json";
import { listAlgorithms, type RegisteredAlgorithm } from "./registry";

export interface CatalogTopic {
  readonly slug: string;
  readonly name: string;
  readonly difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  readonly summary: string;
  readonly objectives: readonly string[];
}

export interface CatalogCategory {
  /** The `category` value used in algorithm.json. */
  readonly id: string;
  /** The slug stored in the database (differs from `id` for historical reasons, e.g. linked-list vs linked-lists). */
  readonly slug: string;
  readonly name: string;
  readonly description: string;
  readonly sort: number;
  /** Extra words people search for ("two pointers", "lifo"). */
  readonly keywords: readonly string[];
  readonly topic: CatalogTopic;
}

/** Single source of truth shared with tools/content-compiler/catalog-sync.mjs. Ordered by `sort`. */
export const CATEGORIES: readonly CatalogCategory[] = [...(catalogFile.categories as CatalogCategory[])].sort((a, b) => a.sort - b.sort);

export function categoryFor(id: string): CatalogCategory | undefined {
  return CATEGORIES.find((c) => c.id === id);
}

export interface CatalogGroup {
  readonly category: CatalogCategory;
  readonly algorithms: readonly RegisteredAlgorithm[];
}

/** Categories that have at least one algorithm, in learning order, each with its algorithms in registry order. */
export function listGroups(): CatalogGroup[] {
  const all = listAlgorithms();
  return CATEGORIES.map((category) => ({ category, algorithms: all.filter((a) => a.content.meta.category === category.id) })).filter(
    (g) => g.algorithms.length > 0,
  );
}
