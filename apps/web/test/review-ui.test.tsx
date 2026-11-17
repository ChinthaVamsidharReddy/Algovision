import { act, fireEvent, render, screen } from "@testing-library/react";
import axe from "axe-core";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({ default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => <a href={href} {...rest}>{children}</a> }));
const state = { status: "ready" as string, progress: new Map<string, unknown>() };
vi.mock("../src/components/learning/learning-provider", () => ({ useLearning: () => state, useLearningClient: () => null }));

import { NotesBox } from "../src/components/learning/notes-box";
import { ReviewPage } from "../src/components/review/review-page";
import { localDay } from "../src/lib/activity-log";
import { addDays, readReview, writeReview } from "../src/lib/review";
import type { CatalogCard } from "../src/lib/catalog-cards";

const card = (id: string, title: string): CatalogCard => ({ id, title, summary: `${title} summary`, difficulty: "beginner", categoryId: "c", categoryName: "Cat", topicName: "T", time: "O(n)", space: "O(1)", stateKind: "array", keywords: [] });
const cards = [card("a", "Alpha"), card("b", "Beta")];
const today = localDay(new Date());

beforeEach(() => {
  localStorage.clear();
  state.status = "ready";
  state.progress = new Map();
});

describe("review page", () => {
  it("explains the empty state when nothing has been learned", () => {
    render(<ReviewPage cards={cards} />);
    expect(screen.getByTestId("review-empty")).toHaveTextContent("Nothing to review yet");
  });

  it("seeds from solved practice marks, hides the answer until asked, and schedules by grade", async () => {
    localStorage.setItem("algovision.solved.a", addDays(today, -3));
    localStorage.setItem("algovision.solved.b", addDays(today, -2));
    const { container } = render(<ReviewPage cards={cards} />);
    expect(screen.getByTestId("review-remaining")).toHaveTextContent("2 left today");
    expect(screen.getByRole("heading", { name: "Alpha" })).toBeInTheDocument();
    expect(screen.queryByText("Alpha summary")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Show the answer" }));
    expect(screen.getByText("Alpha summary")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Open it to refresh/ })).toHaveAttribute("href", "/algorithms/a");
    const r = await axe.run(container, { rules: { "color-contrast": { enabled: false } } });
    expect(r.violations.map((v) => v.id)).toEqual([]);

    fireEvent.click(screen.getByRole("button", { name: "I remembered it" }));
    expect(readReview().items.a).toEqual({ box: 1, due: addDays(today, 3) });
    expect(screen.getByRole("heading", { name: "Beta" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Show the answer" }));
    fireEvent.click(screen.getByRole("button", { name: /I forgot/ }));
    expect(readReview().items.b).toEqual({ box: 0, due: addDays(today, 1) });
    expect(screen.getByTestId("review-empty")).toHaveTextContent("All done for today");
    expect(screen.getByTestId("review-summary")).toHaveTextContent("You reviewed 2 today");
  });

  it("seeds from completed progress when signed in and ignores algorithms that no longer exist", () => {
    state.progress = new Map([
      ["a", { algorithmSlug: "a", status: "COMPLETED", completedAt: new Date(Date.now() - 5 * 86400000).toISOString() }],
      ["gone", { algorithmSlug: "gone", status: "COMPLETED", completedAt: new Date().toISOString() }],
      ["b", { algorithmSlug: "b", status: "IN_PROGRESS", completedAt: null }],
    ]);
    render(<ReviewPage cards={cards} />);
    expect(screen.getByTestId("review-remaining")).toHaveTextContent("1 left today");
    expect(screen.getByRole("heading", { name: "Alpha" })).toBeInTheDocument();
  });

  it("says nothing is due when every card is scheduled later, with the next day", () => {
    writeReview({ items: { a: { box: 2, due: addDays(today, 5) } }, muted: [] });
    render(<ReviewPage cards={cards} />);
    expect(screen.getByTestId("review-empty")).toHaveTextContent("Nothing is due today");
    expect(screen.getByTestId("review-summary")).toHaveTextContent(addDays(today, 5));
  });

  it("waits for signed-in progress before building the queue", () => {
    state.status = "loading";
    render(<ReviewPage cards={cards} />);
    expect(screen.getByRole("status")).toHaveTextContent("Loading your review list");
  });
});

describe("notes box", () => {
  it("loads the saved note, saves typed text after a pause, and toggles the review reminder", async () => {
    vi.useFakeTimers();
    try {
      localStorage.setItem("algovision.notes.a", "old note");
      render(<NotesBox id="a" />);
      const box = screen.getByLabelText("Your private notes on this algorithm") as HTMLTextAreaElement;
      expect(box.value).toBe("old note");
      fireEvent.change(box, { target: { value: "new note" } });
      expect(screen.getByTestId("note-status")).toHaveTextContent("stay in this browser");
      await act(async () => {
        await vi.advanceTimersByTimeAsync(600);
      });
      expect(localStorage.getItem("algovision.notes.a")).toBe("new note");
      expect(screen.getByTestId("note-status")).toHaveTextContent("Saved in this browser");

      const remind = screen.getByRole("checkbox", { name: /Remind me to review/ });
      expect(remind).not.toBeChecked();
      fireEvent.click(remind);
      expect(readReview().items.a).toBeDefined();
      expect(remind).toBeChecked();
      fireEvent.click(remind);
      expect(readReview().items.a).toBeUndefined();
      expect(readReview().muted).toContain("a");
    } finally {
      vi.useRealTimers();
    }
  });
});
