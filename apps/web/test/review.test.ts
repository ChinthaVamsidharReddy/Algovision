import { beforeEach, describe, expect, it } from "vitest";
import { addCard, addDays, type ReviewStore, dueCards, emptyStore, grade, INTERVALS, nextDue, readReview, removeCard, syncReview, writeReview } from "../src/lib/review";
import { MAX_NOTE, notedIds, readNote, writeNote } from "../src/lib/notes";

beforeEach(() => localStorage.clear());

describe("addDays", () => {
  it("crosses month, year and leap-day boundaries", () => {
    expect(addDays("2026-11-17", 1)).toBe("2026-11-18");
    expect(addDays("2026-11-30", 1)).toBe("2026-12-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
    expect(addDays("2026-03-08", 60)).toBe("2026-05-07");
  });
});

describe("syncReview", () => {
  it("adds finished algorithms one day after their finish day, and today if that is already past", () => {
    const s = syncReview(emptyStore(), [{ id: "a", date: "2026-11-16" }, { id: "b", date: "2026-11-01" }, { id: "c", date: null }], "2026-11-17");
    expect(s.items.a).toEqual({ box: 0, due: "2026-11-17" });
    expect(s.items.b).toEqual({ box: 0, due: "2026-11-17" });
    expect(s.items.c).toEqual({ box: 0, due: "2026-11-18" });
  });
  it("does not touch existing cards, muted ones, or return a new object when nothing changes", () => {
    const base = { items: { a: { box: 3, due: "2026-12-01" } }, muted: ["m"] };
    const s = syncReview(base, [{ id: "a", date: "2026-11-01" }, { id: "m", date: "2026-11-01" }], "2026-11-17");
    expect(s).toBe(base);
  });
});

describe("grading", () => {
  const start: ReviewStore = { items: { a: { box: 0, due: "2026-11-17" } }, muted: [] };
  it("moves up a box and waits the longer gap when remembered", () => {
    const s = grade(start, "a", true, "2026-11-17");
    expect(s.items.a).toEqual({ box: 1, due: addDays("2026-11-17", INTERVALS[1]) });
  });
  it("stays in the last box and never exceeds the longest gap", () => {
    let s = start;
    for (let i = 0; i < 10; i++) s = grade(s, "a", true, "2026-11-17");
    expect(s.items.a).toEqual({ box: INTERVALS.length - 1, due: addDays("2026-11-17", 60) });
  });
  it("falls back to box 0 and tomorrow when forgotten", () => {
    const s = grade({ items: { a: { box: 4, due: "2026-11-17" } }, muted: [] }, "a", false, "2026-11-17");
    expect(s.items.a).toEqual({ box: 0, due: "2026-11-18" });
  });
  it("ignores an unknown id", () => {
    expect(grade(start, "zzz", true, "2026-11-17")).toBe(start);
  });
});

describe("queue", () => {
  const store = { items: { b: { box: 0, due: "2026-11-16" }, a: { box: 0, due: "2026-11-16" }, c: { box: 1, due: "2026-11-17" }, d: { box: 1, due: "2026-11-20" }, e: { box: 1, due: "2026-11-19" } }, muted: [] };
  it("lists due cards most overdue first with a stable tie order", () => {
    expect(dueCards(store, "2026-11-17")).toEqual(["a", "b", "c"]);
  });
  it("finds the next due day after today", () => {
    expect(nextDue(store, "2026-11-17")).toBe("2026-11-19");
    expect(nextDue({ items: {}, muted: [] }, "2026-11-17")).toBeNull();
  });
});

describe("add and remove", () => {
  it("adds a card due tomorrow and un-mutes it; removing mutes so a sync does not bring it back", () => {
    const added = addCard({ items: {}, muted: ["a"] }, "a", "2026-11-17");
    expect(added).toEqual({ items: { a: { box: 0, due: "2026-11-18" } }, muted: [] });
    const removed = removeCard(added, "a");
    expect(removed.items).toEqual({});
    expect(syncReview(removed, [{ id: "a", date: "2026-11-01" }], "2026-11-17").items).toEqual({});
  });
});

describe("storage", () => {
  it("round-trips and discards corrupt entries", () => {
    writeReview({ items: { a: { box: 2, due: "2026-11-20" } }, muted: ["m"] });
    expect(readReview()).toEqual({ items: { a: { box: 2, due: "2026-11-20" } }, muted: ["m"] });
    localStorage.setItem("algovision.review", JSON.stringify({ items: { ok: { box: 1, due: "2026-11-20" }, bad1: { box: 99, due: "2026-11-20" }, bad2: { box: 1, due: "tomorrow" }, bad3: null }, muted: [1, "x"] }));
    expect(readReview()).toEqual({ items: { ok: { box: 1, due: "2026-11-20" } }, muted: ["x"] });
    localStorage.setItem("algovision.review", "not json");
    expect(readReview()).toEqual(emptyStore());
  });
});

describe("notes", () => {
  it("saves, truncates, and deletes on empty text", () => {
    expect(writeNote("a", "hello")).toBe(true);
    expect(readNote("a")).toBe("hello");
    writeNote("a", "x".repeat(MAX_NOTE + 50));
    expect(readNote("a")).toHaveLength(MAX_NOTE);
    expect(notedIds(["a", "b"])).toEqual(["a"]);
    writeNote("a", "   ");
    expect(readNote("a")).toBe("");
    expect(notedIds(["a"])).toEqual([]);
  });
  it("reports failure when storage throws", () => {
    const orig = Storage.prototype.setItem;
    Storage.prototype.setItem = () => {
      throw new Error("full");
    };
    try {
      expect(writeNote("a", "x")).toBe(false);
    } finally {
      Storage.prototype.setItem = orig;
    }
  });
});
