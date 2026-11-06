import { ApiError } from "./api";
import type { AuthClient } from "./auth-client";

export interface ProgressEntry {
  readonly algorithmSlug: string;
  readonly status: "IN_PROGRESS" | "COMPLETED";
  readonly lastLanguage: string | null;
  readonly firstViewedAt: string;
  readonly lastViewedAt: string;
  readonly completedAt: string | null;
}

export interface BookmarkEntry {
  readonly algorithmSlug: string;
  readonly name: string;
  readonly createdAt: string;
}

export type LearningState = {
  readonly status: "idle" | "loading" | "ready" | "error";
  readonly progress: ReadonlyMap<string, ProgressEntry>;
  readonly bookmarks: ReadonlySet<string>;
  /** Slugs with a save in flight, so buttons can show a busy state. */
  readonly pending: ReadonlySet<string>;
  readonly error: string | null;
  /** The last failed save (bookmark/complete), shown next to the button; cleared by the next action. */
  readonly actionError: string | null;
};

const EMPTY: LearningState = { status: "idle", progress: new Map(), bookmarks: new Set(), pending: new Set(), error: null, actionError: null };

type Listener = () => void;

/** Per-user progress and bookmarks, kept in sync with the API. Optimistic writes roll back when the server refuses. */
export class LearningClient {
  private state: LearningState = EMPTY;
  private readonly listeners = new Set<Listener>();
  private readonly viewed = new Set<string>();
  private generation = 0;

  constructor(
    private readonly auth: Pick<AuthClient, "request">,
    private readonly now: () => number = Date.now,
  ) {}

  getState = (): LearningState => this.state;

  subscribe = (l: Listener): (() => void) => {
    this.listeners.add(l);
    return () => this.listeners.delete(l);
  };

  private set(patch: Partial<LearningState>) {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((l) => l());
  }

  /** Forget everything (sign-out). Late replies from earlier requests are ignored. */
  reset() {
    this.generation++;
    this.viewed.clear();
    this.state = EMPTY;
    this.listeners.forEach((l) => l());
  }

  async load(): Promise<void> {
    const gen = ++this.generation;
    this.set({ status: "loading", error: null });
    try {
      const [p, b] = await Promise.all([
        this.auth.request<{ progress: ProgressEntry[] }>("/api/v1/me/progress"),
        this.auth.request<{ bookmarks: BookmarkEntry[] }>("/api/v1/me/bookmarks"),
      ]);
      if (gen !== this.generation) return;
      this.set({
        status: "ready",
        progress: new Map(p.progress.map((e) => [e.algorithmSlug, e])),
        bookmarks: new Set(b.bookmarks.map((e) => e.algorithmSlug)),
      });
    } catch (error) {
      if (gen !== this.generation) return;
      this.set({ status: "error", error: error instanceof ApiError ? error.message : "Could not load your progress." });
    }
  }

  /** Records that the learner opened an algorithm. Once per slug per sign-in; failures are silent (best effort). */
  async view(slug: string, language: string | null): Promise<void> {
    if (this.viewed.has(slug)) return;
    this.viewed.add(slug);
    const gen = this.generation;
    const stamp = new Date(this.now()).toISOString();
    try {
      await this.auth.request(`/api/v1/algorithms/${slug}/view`, { method: "POST", body: language ? { language } : {} });
      if (gen !== this.generation) return;
      const old = this.state.progress.get(slug);
      this.putProgress(
        old
          ? { ...old, lastLanguage: language ?? old.lastLanguage, lastViewedAt: stamp }
          : { algorithmSlug: slug, status: "IN_PROGRESS", lastLanguage: language, firstViewedAt: stamp, lastViewedAt: stamp, completedAt: null },
      );
    } catch {
      this.viewed.delete(slug); // try again next time the page opens
    }
  }

  async complete(slug: string, language: string | null): Promise<void> {
    if (this.state.pending.has(slug) || this.state.progress.get(slug)?.status === "COMPLETED") return;
    const gen = this.generation;
    const before = this.state.progress.get(slug);
    const stamp = new Date(this.now()).toISOString();
    this.mark(slug, true);
    this.putProgress({
      algorithmSlug: slug,
      status: "COMPLETED",
      lastLanguage: language ?? before?.lastLanguage ?? null,
      firstViewedAt: before?.firstViewedAt ?? stamp,
      lastViewedAt: stamp,
      completedAt: stamp,
    });
    try {
      await this.auth.request(`/api/v1/algorithms/${slug}/complete`, { method: "POST", body: language ? { language } : {} });
      if (gen === this.generation) this.mark(slug, false);
    } catch (error) {
      if (gen !== this.generation) return;
      const progress = new Map(this.state.progress);
      if (before) progress.set(slug, before);
      else progress.delete(slug);
      this.set({ progress, actionError: messageFor(error, "Could not save your progress.") });
      this.mark(slug, false);
    }
  }

  async toggleBookmark(slug: string): Promise<void> {
    if (this.state.pending.has(slug)) return;
    const gen = this.generation;
    const had = this.state.bookmarks.has(slug);
    this.mark(slug, true);
    this.setBookmark(slug, !had);
    try {
      await this.auth.request(`/api/v1/me/bookmarks/${slug}`, { method: had ? "DELETE" : "PUT" });
      if (gen === this.generation) this.mark(slug, false);
    } catch (error) {
      if (gen !== this.generation) return;
      this.setBookmark(slug, had);
      this.set({ actionError: messageFor(error, "Could not update your bookmark.") });
      this.mark(slug, false);
    }
  }

  clearActionError() {
    if (this.state.actionError) this.set({ actionError: null });
  }

  private mark(slug: string, on: boolean) {
    const pending = new Set(this.state.pending);
    if (on) pending.add(slug);
    else pending.delete(slug);
    this.set({ pending, ...(on ? { actionError: null } : {}) });
  }

  private putProgress(entry: ProgressEntry) {
    const progress = new Map(this.state.progress);
    progress.set(entry.algorithmSlug, entry);
    this.set({ progress });
  }

  private setBookmark(slug: string, on: boolean) {
    const bookmarks = new Set(this.state.bookmarks);
    if (on) bookmarks.add(slug);
    else bookmarks.delete(slug);
    this.set({ bookmarks });
  }
}

function messageFor(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}
