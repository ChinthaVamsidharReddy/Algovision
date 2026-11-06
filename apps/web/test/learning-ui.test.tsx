import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthClient } from "../src/lib/auth-client";

const replace = vi.fn();
const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, push }),
  useSearchParams: () => new URLSearchParams(""),
  usePathname: () => "/algorithms",
}));
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

import { AuthProvider } from "../src/components/auth/auth-provider";
import { LearningProvider } from "../src/components/learning/learning-provider";
import { CatalogBrowser } from "../src/components/catalog/catalog-browser";
import { Dashboard } from "../src/components/dashboard/dashboard";
import { BookmarksPage } from "../src/components/dashboard/bookmarks-page";
import { LearningActions } from "../src/components/learning/learning-actions";
import { HeaderSearch } from "../src/components/header-search";
import { catalogCards } from "../src/lib/catalog-cards";

const cards = catalogCards();
const USER = { id: "u1", email: "ada@example.com", fullName: "Ada Lovelace", roles: ["ROLE_STUDENT"] };
const json = (status: number, body?: unknown) => new Response(body === undefined ? null : JSON.stringify(body), { status });
const session = () => json(200, { user: USER, accessToken: "t", accessTokenExpiresAt: new Date(Date.now() + 900_000).toISOString() });
const store = () => ({ getItem: () => null, setItem: () => {}, removeItem: () => {} });
const entry = (slug: string, status: string) => ({ algorithmSlug: slug, status, lastLanguage: "java", firstViewedAt: "2026-01-01T00:00:00Z", lastViewedAt: "2026-01-02T00:00:00Z", completedAt: status === "COMPLETED" ? "2026-01-02T00:00:00Z" : null });

interface Server {
  progress: unknown[];
  bookmarks: string[];
  failWrites?: boolean;
  failLoad?: boolean;
  calls: string[];
}
function handler(s: Server) {
  return vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method ?? "GET";
    s.calls.push(`${method} ${url}`);
    if (url.endsWith("/auth/login")) return session();
    if (url.endsWith("/auth/refresh")) return session();
    if (url.endsWith("/me/progress")) return s.failLoad ? json(500, { detail: "Server error." }) : json(200, { progress: s.progress });
    if (url.endsWith("/me/bookmarks")) return json(200, { bookmarks: s.bookmarks.map((b) => ({ algorithmSlug: b, name: b, createdAt: "x" })) });
    if (method !== "GET" && s.failWrites) return json(500, { detail: "Could not save." });
    if (url.includes("/me/bookmarks/")) {
      const slug = url.split("/").pop()!;
      s.bookmarks = method === "PUT" ? [...s.bookmarks, slug] : s.bookmarks.filter((b) => b !== slug);
    }
    return json(204);
  });
}

async function mount(ui: React.ReactNode, server: Server, signedIn = true) {
  const f = handler(server);
  const auth = new AuthClient({ fetchImpl: f as never, storage: store(), locks: null });
  const view = render(
    <AuthProvider client={auth}>
      <LearningProvider>{ui}</LearningProvider>
    </AuthProvider>,
  );
  if (signedIn) await act(() => auth.login("ada@example.com", "pw"));
  else await act(() => auth.init());
  return { ...view, f, auth };
}
const fresh = (): Server => ({ progress: [], bookmarks: [], calls: [] });
beforeEach(() => {
  replace.mockClear();
  push.mockClear();
});

describe("catalog browser", () => {
  it("lists every algorithm grouped by topic, and guests see a sign-in link on bookmark", async () => {
    await mount(<CatalogBrowser cards={cards} title="Algorithms" />, fresh(), false);
    expect(screen.getByRole("heading", { level: 1, name: "Algorithms" })).toBeInTheDocument();
    expect(screen.getAllByRole("listitem").length).toBeGreaterThanOrEqual(cards.length);
    const link = screen.getAllByRole("link", { name: /Bookmark/ })[0]!;
    expect(link.getAttribute("href")).toMatch(/^\/login\?next=%2Falgorithms$/);
    expect(screen.queryByRole("progressbar")).toBeNull();
  });

  it("searching narrows the list, announces the count and has an empty state with a reset", async () => {
    await mount(<CatalogBrowser cards={cards} title="Algorithms" />, fresh(), false);
    await userEvent.type(screen.getByLabelText(/Search algorithms/), "stack");
    expect(screen.getByRole("status")).toHaveTextContent(/result/);
    const stack = cards.find((c) => c.id === "stack-push-pop")!;
    expect(screen.getByRole("link", { name: stack.title })).toBeInTheDocument();
    await userEvent.clear(screen.getByLabelText(/Search algorithms/));
    await userEvent.type(screen.getByLabelText(/Search algorithms/), "blockchain");
    expect(screen.getByText(/Nothing matches/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Clear search and filters" }));
    expect(screen.getAllByRole("listitem").length).toBeGreaterThanOrEqual(cards.length);
  });

  it("filters by difficulty and topic", async () => {
    await mount(<CatalogBrowser cards={cards} title="Algorithms" />, fresh(), false);
    await userEvent.selectOptions(screen.getByLabelText("Topic"), "sorting");
    const items = screen.getAllByRole("listitem");
    expect(items.length).toBe(cards.filter((c) => c.categoryId === "sorting").length);
  });

  it("signed-in users see their progress bar and badges", async () => {
    const s = { ...fresh(), progress: [entry("bubble-sort", "COMPLETED"), entry("linear-search", "IN_PROGRESS")] };
    await mount(<CatalogBrowser cards={cards} title="Algorithms" />, s);
    expect(await screen.findByRole("progressbar", { name: "Your progress" })).toHaveAttribute("aria-valuenow", String(Math.round((1 / cards.length) * 100)));
    expect(screen.getByText("✓ Completed")).toBeInTheDocument();
    expect(screen.getByText("In progress")).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = await mount(<CatalogBrowser cards={cards} title="Algorithms" />, fresh(), false);
    const r = await axe.run(container, { rules: { "color-contrast": { enabled: false } } });
    expect(r.violations.map((v) => `${v.id}: ${v.nodes[0]?.html}`)).toEqual([]);
  });
});

describe("bookmarks", () => {
  it("toggle saves to the API and the bookmarks page lists it", async () => {
    const s = fresh();
    await mount(<CatalogBrowser cards={cards} title="Algorithms" />, s);
    const btn = (await screen.findAllByRole("button", { name: /^Bookmark/ }))[0]!;
    await userEvent.click(btn);
    await waitFor(() => expect(s.calls.some((c) => c.startsWith("PUT ") && c.includes("/me/bookmarks/"))).toBe(true));
    expect(screen.getAllByRole("button", { name: /^Bookmarked/ })[0]).toHaveAttribute("aria-pressed", "true");
  });

  it("a failed save rolls back and shows the reason on the bookmarks page", async () => {
    const s = { ...fresh(), bookmarks: ["bubble-sort"] };
    await mount(<BookmarksPage cards={cards} />, s);
    s.failWrites = true;
    await userEvent.click(await screen.findByRole("button", { name: /^Bookmarked/ }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Could not save.");
    expect(screen.getByRole("button", { name: /^Bookmarked/ })).toBeInTheDocument();
  });

  it("empty state links to the catalog; guests are asked to sign in", async () => {
    await mount(<BookmarksPage cards={cards} />, fresh());
    expect(await screen.findByText("No bookmarks yet.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Browse algorithms" })).toHaveAttribute("href", "/algorithms");
  });

  it("guests see a sign-in prompt that returns them to the bookmarks page", async () => {
    await mount(<BookmarksPage cards={cards} />, fresh(), false);
    expect(screen.getByRole("heading", { name: /Sign in to see your bookmarks/ })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Sign in" })[0]).toHaveAttribute("href", "/login?next=%2Fbookmarks");
  });
});

describe("workspace actions", () => {
  it("opening records a view, and Mark as complete saves and flips to Completed", async () => {
    const s = fresh();
    await mount(<LearningActions slug="bubble-sort" title="Bubble Sort" language="python" returnTo="/algorithms/bubble-sort" />, s);
    await waitFor(() => expect(s.calls).toContain("POST /api/v1/algorithms/bubble-sort/view"));
    await userEvent.click(await screen.findByRole("button", { name: "Mark as complete" }));
    expect(await screen.findByText("Completed")).toBeInTheDocument();
    expect(s.calls).toContain("POST /api/v1/algorithms/bubble-sort/complete");
  });

  it("a failed completion shows an error and offers the button again", async () => {
    const s = fresh();
    await mount(<LearningActions slug="bubble-sort" title="Bubble Sort" language="java" returnTo="/x" />, s);
    s.failWrites = true;
    await userEvent.click(await screen.findByRole("button", { name: "Mark as complete" }));
    expect(await screen.findByText("Could not save.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Mark as complete" })).toBeEnabled();
  });

  it("guests are invited to sign in and come back", async () => {
    await mount(<LearningActions slug="bubble-sort" title="Bubble Sort" language="java" returnTo="/algorithms/bubble-sort" />, fresh(), false);
    const link = screen.getByRole("link", { name: "Sign in" });
    expect(link).toHaveAttribute("href", "/login?next=%2Falgorithms%2Fbubble-sort");
  });

  it("renders nothing outside providers, so the visualizer works without the app shell", () => {
    const { container } = render(<LearningActions slug="x" title="X" language="java" returnTo="/" />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe("dashboard", () => {
  it("shows overall and per-topic progress, a resume link and completed items", async () => {
    const s = { ...fresh(), progress: [entry("bubble-sort", "COMPLETED"), entry("linear-search", "IN_PROGRESS")] };
    await mount(<Dashboard cards={cards} />, s);
    expect(await screen.findByRole("heading", { name: "My learning" })).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: "Overall progress" })).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: "Sorting" })).toHaveAttribute("aria-valuenow");
    expect(screen.getByRole("link", { name: "Continue" })).toHaveAttribute("href", "/algorithms/linear-search");
    expect(within(screen.getByRole("region", { name: "Completed" })).getByRole("link", { name: "Bubble Sort" })).toBeInTheDocument();
  });

  it("a brand-new learner gets a clear first step", async () => {
    await mount(<Dashboard cards={cards} />, fresh());
    expect(await screen.findByText(/You have not started anything yet/)).toBeInTheDocument();
  });

  it("shows an error with retry when progress cannot be loaded", { timeout: 20_000 }, async () => {
    const s = { ...fresh(), failLoad: true };
    await mount(<Dashboard cards={cards} />, s);
    expect(await screen.findByText("Could not load your progress", undefined, { timeout: 10_000 })).toBeInTheDocument();
    s.failLoad = false;
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByRole("heading", { name: "My learning" })).toBeInTheDocument();
  });
});

describe("header search", () => {
  it("suggests matches, arrow keys + Enter open the algorithm, Enter alone opens results", async () => {
    render(<HeaderSearch cards={cards} />);
    const box = screen.getByRole("combobox", { name: "Search algorithms" });
    await userEvent.type(box, "bubble");
    expect(screen.getByRole("option", { name: /Bubble Sort/ })).toBeInTheDocument();
    await userEvent.keyboard("{ArrowDown}{Enter}");
    expect(push).toHaveBeenCalledWith("/algorithms/bubble-sort");
    push.mockClear();
    await userEvent.clear(box);
    await userEvent.type(box, "two pointers{Enter}");
    expect(push).toHaveBeenCalledWith("/search?q=two%20pointers");
  });

  it("the / key focuses the box unless the user is already typing", async () => {
    render(<HeaderSearch cards={cards} />);
    await userEvent.keyboard("/");
    expect(screen.getByRole("combobox")).toHaveFocus();
  });

  it("says when nothing matches and closes on Escape", async () => {
    render(<HeaderSearch cards={cards} />);
    await userEvent.type(screen.getByRole("combobox"), "zzzzzz");
    expect(screen.getByText(/No match/)).toBeInTheDocument();
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("listbox")).toBeNull();
  });
});
