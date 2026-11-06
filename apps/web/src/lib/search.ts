import type { CatalogCard } from "./catalog-cards";

export interface SearchResult {
  readonly card: CatalogCard;
  readonly score: number;
}

const norm = (s: string): string => s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "");
const words = (s: string): string[] => norm(s).split(/[^a-z0-9+#]+/).filter(Boolean);

/** One typo: insert, delete or substitute a letter, or swap two neighbours ("buble", "sliding windw", "sroting"). */
export function withinOneEdit(a: string, b: string): boolean {
  if (a === b) return true;
  if (Math.abs(a.length - b.length) > 1) return false;
  if (a.length === b.length) {
    const diff: number[] = [];
    for (let k = 0; k < a.length && diff.length <= 2; k++) if (a[k] !== b[k]) diff.push(k);
    if (diff.length === 2 && diff[1] === diff[0]! + 1 && a[diff[0]!] === b[diff[1]!] && a[diff[1]!] === b[diff[0]!]) return true;
  }
  let i = 0;
  let j = 0;
  let edits = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      i++;
      j++;
      continue;
    }
    if (++edits > 1) return false;
    if (a.length > b.length) i++;
    else if (a.length < b.length) j++;
    else {
      i++;
      j++;
    }
  }
  return edits + (a.length - i) + (b.length - j) <= 1;
}

interface Doc {
  readonly card: CatalogCard;
  readonly title: string;
  readonly titleWords: string[];
  readonly keywords: string[];
  readonly category: string;
  readonly summary: string;
}

function toDoc(card: CatalogCard): Doc {
  return {
    card,
    title: norm(card.title),
    titleWords: words(card.title),
    keywords: card.keywords.map(norm),
    category: norm(`${card.categoryName} ${card.topicName}`),
    summary: norm(card.summary),
  };
}

/** Score of one query token against one document; 0 means "does not match". */
function tokenScore(token: string, d: Doc): number {
  let best = 0;
  if (d.titleWords.includes(token)) best = Math.max(best, 10);
  else if (d.titleWords.some((w) => w.startsWith(token))) best = Math.max(best, 7);
  else if (d.title.includes(token)) best = Math.max(best, 5);
  if (d.keywords.some((k) => k === token || k.split(" ").includes(token))) best = Math.max(best, 6);
  else if (d.keywords.some((k) => k.startsWith(token))) best = Math.max(best, 4);
  if (d.category.includes(token)) best = Math.max(best, 5);
  if (d.summary.includes(token)) best = Math.max(best, 2);
  if (best === 0 && token.length >= 4) {
    const pool = [...d.titleWords, ...d.category.split(" "), ...d.keywords.flatMap((k) => k.split(" "))];
    if (pool.some((w) => w.length >= 4 && withinOneEdit(token, w))) best = 2;
  }
  return best;
}

/**
 * Ranks cards for a query. Every word of the query must match somewhere (title, category/topic, keywords, summary),
 * so "two pointers sorted" narrows instead of widening. Ties keep catalog order. Empty query returns nothing.
 */
export function searchCards(query: string, cards: readonly CatalogCard[]): SearchResult[] {
  const tokens = words(query);
  if (tokens.length === 0) return [];
  const phrase = tokens.join(" ");
  const results: SearchResult[] = [];
  cards.forEach((card, order) => {
    const d = toDoc(card);
    let score = 0;
    for (const t of tokens) {
      const s = tokenScore(t, d);
      if (s === 0) return;
      score += s;
    }
    if (tokens.length > 1 && (d.title.includes(phrase) || d.keywords.includes(phrase) || d.category.includes(phrase))) score += 8;
    results.push({ card, score: score * 1000 - order });
  });
  return results.sort((a, b) => b.score - a.score).map((r) => ({ card: r.card, score: Math.round(r.score / 1000) }));
}
