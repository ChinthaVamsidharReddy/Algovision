import { beforeEach, describe, expect, it } from "vitest";
import { localDay, readDays, recordToday } from "../src/lib/activity-log";
import { computeEngagement, levelFor, streakOf, XP, type EngagementInput } from "../src/lib/engagement";
import { markSolved, solvedMarks } from "../src/lib/practice/storage";

const groups = [
  { id: "sorting", name: "Sorting", ids: ["a", "b", "c"] },
  { id: "search", name: "Searching", ids: ["d", "e"] },
];
const paths = [{ id: "basics", title: "Basics", steps: ["a", "b"] }];
const entry = (slug: string, status: "IN_PROGRESS" | "COMPLETED", when = "2026-11-10T09:00:00") => ({
  algorithmSlug: slug,
  status,
  lastLanguage: null,
  firstViewedAt: when,
  lastViewedAt: when,
  completedAt: status === "COMPLETED" ? when : null,
});
const base = (over: Partial<EngagementInput> = {}): EngagementInput => ({ progress: [], solved: [], activityDays: [], groups, paths, today: "2026-11-17", ...over });

describe("levels", () => {
  it("levels need 100, 150, 200 ... XP", () => {
    expect(levelFor(0)).toEqual({ level: 1, into: 0, need: 100 });
    expect(levelFor(99)).toEqual({ level: 1, into: 99, need: 100 });
    expect(levelFor(100)).toEqual({ level: 2, into: 0, need: 150 });
    expect(levelFor(250)).toEqual({ level: 3, into: 0, need: 200 });
    expect(levelFor(-5).level).toBe(1);
  });
});

describe("streaks", () => {
  const s = (days: string[], today = "2026-11-17") => streakOf(new Set(days), today);
  it("counts consecutive days ending today", () => {
    expect(s(["2026-11-15", "2026-11-16", "2026-11-17"])).toEqual({ current: 3, longest: 3, activeToday: true });
  });
  it("stays alive when the last day was yesterday, and dies after a missed day", () => {
    expect(s(["2026-11-15", "2026-11-16"])).toEqual({ current: 2, longest: 2, activeToday: false });
    expect(s(["2026-11-14", "2026-11-15"])).toEqual({ current: 0, longest: 2, activeToday: false });
  });
  it("tracks the longest run separately and crosses month and year ends", () => {
    expect(s(["2026-10-01", "2026-10-02", "2026-10-03", "2026-11-17"]).longest).toBe(3);
    expect(streakOf(new Set(["2026-12-31", "2027-01-01", "2027-01-02"]), "2027-01-02").current).toBe(3);
    expect(streakOf(new Set(["2024-02-28", "2024-02-29", "2024-03-01"]), "2024-03-01").current).toBe(3);
  });
  it("handles no days", () => {
    expect(s([])).toEqual({ current: 0, longest: 0, activeToday: false });
  });
});

describe("computeEngagement", () => {
  it("starts empty", () => {
    const e = computeEngagement(base());
    expect(e.xp).toBe(0);
    expect(e.level.level).toBe(1);
    expect(e.badges.filter((b) => b.earned)).toEqual([]);
    expect(e.streak.current).toBe(0);
  });
  it("derives XP from started, completed, solved and finished paths", () => {
    const e = computeEngagement(base({ progress: [entry("a", "COMPLETED"), entry("b", "COMPLETED"), entry("c", "IN_PROGRESS")], solved: [{ id: "a", date: "2026-11-10" }] }));
    expect(e.started).toBe(3);
    expect(e.completed).toBe(2);
    expect(e.xp).toBe(3 * XP.started + 2 * XP.completed + 1 * XP.solved + 1 * XP.path);
    expect(e.completedPaths).toEqual(["basics"]);
    expect(e.pathFinishedOn.get("basics")).toBe("2026-11-10");
  });
  it("ignores algorithms that no longer exist", () => {
    const e = computeEngagement(base({ progress: [entry("gone", "COMPLETED")], solved: [{ id: "gone", date: null }] }));
    expect(e.xp).toBe(0);
    expect(e.completed).toBe(0);
  });
  it("awards badges at their thresholds and shows progress toward the rest", () => {
    const e = computeEngagement(base({ progress: [entry("a", "COMPLETED")] }));
    const by = new Map(e.badges.map((b) => [b.id, b]));
    expect(by.get("first-step")!.earned).toBe(true);
    expect(by.get("steady")).toMatchObject({ earned: false, value: 1, target: 10 });
    expect(by.get("path-basics")).toMatchObject({ earned: false, value: 1, target: 2 });
    expect(by.get("master-sorting")).toMatchObject({ earned: false, value: 1, target: 3 });
    const all = computeEngagement(base({ progress: ["a", "b", "c"].map((i) => entry(i, "COMPLETED")) }));
    expect(all.badges.find((b) => b.id === "master-sorting")!.earned).toBe(true);
    expect(all.badges.find((b) => b.id === "path-finisher")!.earned).toBe(true);
  });
  it("combines server timestamps, solved days and the local log into one streak, once per day", () => {
    const e = computeEngagement(base({ progress: [entry("a", "COMPLETED", "2026-11-15T10:00:00")], solved: [{ id: "b", date: "2026-11-16" }], activityDays: ["2026-11-17", "2026-11-17"] }));
    expect(e.streak.current).toBe(3);
    expect(e.badges.find((b) => b.id === "streak-3")!.earned).toBe(true);
  });
  it("is idempotent: the same facts always give the same numbers", () => {
    const input = base({ progress: [entry("a", "COMPLETED")], solved: [{ id: "a", date: null }] });
    expect(computeEngagement(input)).toEqual(computeEngagement(input));
  });
});

describe("activity log and solved marks", () => {
  beforeEach(() => localStorage.clear());
  it("records each local day once, in order, and ignores junk", () => {
    recordToday(new Date(2026, 10, 17, 23, 59));
    recordToday(new Date(2026, 10, 17, 1, 0));
    recordToday(new Date(2026, 10, 16, 12, 0));
    expect(readDays()).toEqual(["2026-11-16", "2026-11-17"]);
    localStorage.setItem("algovision.days", JSON.stringify(["x", 3, "2026-01-01"]));
    expect(readDays()).toEqual(["2026-01-01"]);
    localStorage.setItem("algovision.days", "not json");
    expect(readDays()).toEqual([]);
    expect(localDay(new Date(2026, 0, 5))).toBe("2026-01-05");
  });
  it("keeps only the last 400 days", () => {
    localStorage.setItem("algovision.days", JSON.stringify(Array.from({ length: 400 }, (_, i) => localDay(new Date(2025, 0, 1 + i)))));
    recordToday(new Date(2027, 0, 1));
    const days = readDays();
    expect(days).toHaveLength(400);
    expect(days[days.length - 1]).toBe("2027-01-01");
  });
  it("saves the day a problem was first solved, keeps old marks working, and counts the day for the streak", () => {
    markSolved("a", "2026-11-10");
    markSolved("a", "2026-11-12");
    localStorage.setItem("algovision.solved.b", "1");
    expect(solvedMarks(["a", "b", "c"])).toEqual([{ id: "a", date: "2026-11-10" }, { id: "b", date: null }]);
    expect(readDays().length).toBe(1);
  });
});
