import { describe, expect, it } from "vitest";
import { catalogCards, groupCards } from "../src/lib/catalog-cards";
import { searchCards, withinOneEdit } from "../src/lib/search";

const cards = catalogCards();
const top = (q: string) => searchCards(q, cards).map((r) => r.card.id);

describe("catalog cards", () => {
  it("has one card per algorithm with a category name, and groups keep catalog order", () => {
    expect(cards.length).toBeGreaterThanOrEqual(10);
    for (const c of cards) {
      expect(c.categoryName.length).toBeGreaterThan(0);
      expect(c.keywords.length).toBeGreaterThan(0);
    }
    const groups = groupCards(cards);
    expect(groups.flatMap((g) => g.cards).length).toBe(cards.length);
  });
});

describe("search", () => {
  it("finds an algorithm by name, partial name and typo", () => {
    expect(top("bubble sort")[0]).toBe("bubble-sort");
    expect(top("bubb")[0]).toBe("bubble-sort");
    expect(top("buble sort")[0]).toBe("bubble-sort");
    expect(top("sroting")).toContain("bubble-sort");
    expect(top("BINARY SEARCH")[0]).toBe("binary-search");
  });

  it("finds by data structure words and synonyms", () => {
    expect(top("stack")).toContain("stack-push-pop");
    expect(top("fifo")).toContain("queue-enqueue-dequeue");
    expect(top("lifo")).toContain("stack-push-pop");
    expect(top("linked list")).toEqual(expect.arrayContaining(["linked-list-insert-head", "linked-list-insert-tail"]));
    expect(top("recursion")).toContain("binary-tree-inorder");
    expect(top("inorder")).toContain("binary-tree-inorder");
  });

  it("finds by category and by topic", () => {
    expect(top("sorting")).toEqual(expect.arrayContaining(["bubble-sort", "selection-sort", "insertion-sort"]));
    expect(top("searching")).toEqual(expect.arrayContaining(["linear-search", "binary-search"]));
  });

  it("requires every word to match, so extra words narrow the result", () => {
    const wide = top("sort");
    const narrow = top("selection sort");
    expect(narrow.length).toBeLessThanOrEqual(wide.length);
    expect(narrow[0]).toBe("selection-sort");
    expect(top("bubble stack")).toEqual([]);
  });

  it("returns nothing for empty, punctuation-only or unknown queries", () => {
    expect(top("")).toEqual([]);
    expect(top("   ")).toEqual([]);
    expect(top("???")).toEqual([]);
    expect(top("blockchain")).toEqual([]);
  });

  it("ranks a title match above a summary-only match", () => {
    const fake = [
      { ...cards[0]!, id: "a", title: "Alpha", summary: "mentions zebra here", keywords: [] },
      { ...cards[0]!, id: "b", title: "Zebra Walk", summary: "nothing", keywords: [] },
    ];
    expect(searchCards("zebra", fake).map((r) => r.card.id)).toEqual(["b", "a"]);
  });

  it("does not crash on regex characters or very long input", () => {
    expect(() => searchCards("(.*)[", cards)).not.toThrow();
    expect(() => searchCards("a".repeat(10_000), cards)).not.toThrow();
  });
});

describe("withinOneEdit", () => {
  it("accepts one insertion, deletion or substitution only", () => {
    expect(withinOneEdit("bubble", "bubel")).toBe(false);
    expect(withinOneEdit("sorting", "sroting")).toBe(true);
    expect(withinOneEdit("abcd", "cdab")).toBe(false);
    expect(withinOneEdit("bubble", "bubbl")).toBe(true);
    expect(withinOneEdit("sort", "sart")).toBe(true);
    expect(withinOneEdit("sort", "sorts")).toBe(true);
    expect(withinOneEdit("sort", "soot1")).toBe(false);
    expect(withinOneEdit("a", "a")).toBe(true);
  });
});
