import { localDay } from "./activity-log";

/**
 * Spaced repetition, kept in this browser. Each algorithm the learner has finished (or solved, or added by hand)
 * becomes a review card in a Leitner box. Remembering moves it to a longer gap, forgetting sends it back to box 0.
 * Everything here is a pure function over a plain store, so it is easy to test; the storage helpers at the bottom
 * guard every access because storage can be blocked or full.
 */
export const INTERVALS = [1, 3, 7, 14, 30, 60] as const;
export const MAX_BOX = INTERVALS.length - 1;

export interface ReviewCard {
  box: number;
  /** YYYY-MM-DD, local day on or after which the card is due. */
  due: string;
}
export interface ReviewStore {
  items: Record<string, ReviewCard>;
  /** Algorithms the learner asked not to be reminded about (so syncing does not add them back). */
  muted: string[];
}
export interface Seed {
  id: string;
  /** The day the learner finished it, if known. */
  date: string | null;
}

export const emptyStore = (): ReviewStore => ({ items: {}, muted: [] });

const DAY = /^\d{4}-\d{2}-\d{2}$/;

/** Adds whole days to a YYYY-MM-DD day without any time-zone or daylight-saving surprises. */
export function addDays(day: string, n: number): string {
  const [y, m, d] = day.split("-").map(Number);
  const t = new Date(Date.UTC(y!, m! - 1, d! + n));
  return `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, "0")}-${String(t.getUTCDate()).padStart(2, "0")}`;
}

/** Adds a card for every seed that has none (and is not muted); first review is one day after finishing. */
export function syncReview(store: ReviewStore, seeds: readonly Seed[], today: string): ReviewStore {
  let items = store.items;
  for (const s of seeds) {
    if (items[s.id] || store.muted.includes(s.id)) continue;
    if (items === store.items) items = { ...items };
    const base = s.date && DAY.test(s.date) ? s.date : today;
    const due = addDays(base, INTERVALS[0]);
    items[s.id] = { box: 0, due: due < today ? today : due };
  }
  return items === store.items ? store : { ...store, items };
}

export function addCard(store: ReviewStore, id: string, today: string): ReviewStore {
  return {
    items: { ...store.items, [id]: store.items[id] ?? { box: 0, due: addDays(today, INTERVALS[0]) } },
    muted: store.muted.filter((m) => m !== id),
  };
}

export function removeCard(store: ReviewStore, id: string): ReviewStore {
  const { [id]: _gone, ...rest } = store.items;
  return { items: rest, muted: store.muted.includes(id) ? store.muted : [...store.muted, id] };
}

/** Cards due on or before today, most overdue first (ties by id so the order is stable). */
export function dueCards(store: ReviewStore, today: string): string[] {
  return Object.entries(store.items)
    .filter(([, c]) => c.due <= today)
    .sort((a, b) => a[1].due.localeCompare(b[1].due) || a[0].localeCompare(b[0]))
    .map(([id]) => id);
}

/** The next day anything is due after today, or null when nothing is waiting. */
export function nextDue(store: ReviewStore, today: string): string | null {
  const later = Object.values(store.items)
    .map((c) => c.due)
    .filter((d) => d > today)
    .sort();
  return later[0] ?? null;
}

export function grade(store: ReviewStore, id: string, remembered: boolean, today: string): ReviewStore {
  const card = store.items[id];
  if (!card) return store;
  const box = remembered ? Math.min(card.box + 1, MAX_BOX) : 0;
  return { ...store, items: { ...store.items, [id]: { box, due: addDays(today, INTERVALS[remembered ? box : 0]!) } } };
}

// ---- storage ----

const KEY = "algovision.review";

export function readReview(): ReviewStore {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "null") as Partial<ReviewStore> | null;
    if (!raw || typeof raw !== "object" || typeof raw.items !== "object" || raw.items === null) return emptyStore();
    const items: Record<string, ReviewCard> = {};
    for (const [id, c] of Object.entries(raw.items)) {
      if (c && typeof c.box === "number" && Number.isInteger(c.box) && c.box >= 0 && c.box <= MAX_BOX && typeof c.due === "string" && DAY.test(c.due)) items[id] = { box: c.box, due: c.due };
    }
    const muted = Array.isArray(raw.muted) ? raw.muted.filter((m): m is string => typeof m === "string") : [];
    return { items, muted };
  } catch {
    return emptyStore();
  }
}

export function writeReview(store: ReviewStore): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    /* storage unavailable: the schedule is not kept */
  }
}

export const today = (): string => localDay(new Date());
