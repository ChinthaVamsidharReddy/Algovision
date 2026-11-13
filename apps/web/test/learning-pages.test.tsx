import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LIMIT_PROFILES, PATHS, generateQuiz, getAlgorithm, runAlgorithm } from "@algovision/algorithms";
import { AuthClient } from "../src/lib/auth-client";

const replace = vi.fn();
let search = "";
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(search),
  usePathname: () => "/compare",
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
import { QuizPanel } from "../src/components/learning/quiz-panel";
import { AlgorithmExtras } from "../src/components/learning/algorithm-extras";
import { PathList } from "../src/components/paths/path-list";
import { PathView } from "../src/components/paths/path-view";
import { CompareView } from "../src/components/compare/compare-view";
import { compareRows, extrasFor, pathData } from "../src/lib/learning-data";

const json = (status: number, body?: unknown) => new Response(body === undefined ? null : JSON.stringify(body), { status });
const USER = { id: "u1", email: "ada@example.com", fullName: "Ada Lovelace", roles: ["ROLE_STUDENT"] };
const session = () => json(200, { user: USER, accessToken: "t", accessTokenExpiresAt: new Date(Date.now() + 900_000).toISOString() });
const store = () => ({ getItem: () => null, setItem: () => {}, removeItem: () => {} });
const done = (slug: string) => ({ algorithmSlug: slug, status: "COMPLETED", lastLanguage: "java", firstViewedAt: "2026-01-01T00:00:00Z", lastViewedAt: "2026-01-02T00:00:00Z", completedAt: "2026-01-02T00:00:00Z" });

async function mount(ui: React.ReactNode, completed: string[] = [], signedIn = completed.length > 0) {
  const f = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.endsWith("/auth/login") || url.endsWith("/auth/refresh")) return session();
    if (url.endsWith("/me/progress")) return json(200, { progress: completed.map(done) });
    if (url.endsWith("/me/bookmarks")) return json(200, { bookmarks: [] });
    return json(204);
  });
  const auth = new AuthClient({ fetchImpl: f as never, storage: store(), locks: null });
  const view = render(
    <AuthProvider client={auth}>
      <LearningProvider>{ui}</LearningProvider>
    </AuthProvider>,
  );
  if (signedIn) await act(() => auth.login("ada@example.com", "pw"));
  else await act(() => auth.init());
  return view;
}

beforeEach(() => {
  replace.mockClear();
  search = "";
});

const entry = getAlgorithm("binary-search")!;
const run = runAlgorithm("binary-search", entry.content.meta.defaultInput, LIMIT_PROFILES.standard);
if (!run.ok) throw new Error("binary-search must run");
const labels = Object.fromEntries(entry.content.meta.anchors.map((a) => [a.id, a.label]));

describe("quiz panel", () => {
  it("asks questions about the trace, grades them, jumps to steps and reports a score", async () => {
    const onJump = vi.fn();
    const user = userEvent.setup();
    await mount(<QuizPanel trace={run.trace} labels={labels} onJump={onJump} />, [], false);
    await user.click(screen.getByRole("button", { name: "Start quiz" }));
    const expected = generateQuiz(run.trace, labels, { seed: 1, count: 5 });
    expect(screen.getByText(`Question 1 of ${expected.length}`)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: `Show me step ${expected[0]!.step + 1}` }));
    expect(onJump).toHaveBeenCalledWith(expected[0]!.step);

    // First question: wrong on purpose.
    const wrong = expected[0]!.options.findIndex((_, i) => i !== expected[0]!.answer);
    await user.click(screen.getByRole("radio", { name: expected[0]!.options[wrong]! }));
    await user.click(screen.getByRole("button", { name: "Check answer" }));
    expect(screen.getByRole("status")).toHaveTextContent(`Not quite. The answer is ${expected[0]!.options[expected[0]!.answer]}`);

    for (let i = 1; i < expected.length; i++) {
      await user.click(screen.getByRole("button", { name: "Next question" }));
      await user.click(screen.getByRole("radio", { name: expected[i]!.options[expected[i]!.answer]! }));
      await user.click(screen.getByRole("button", { name: "Check answer" }));
      expect(screen.getByRole("status")).toHaveTextContent("Correct.");
    }
    await user.click(screen.getByRole("button", { name: "See my score" }));
    expect(screen.getByText(`You got ${expected.length - 1} of ${expected.length}.`)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "New questions" }));
    expect(screen.getByText(`Question 1 of ${generateQuiz(run.trace, labels, { seed: 2, count: 5 }).length}`)).toBeInTheDocument();
  });

  it("disables checking until an option is picked and has no accessibility violations", async () => {
    const user = userEvent.setup();
    const { container } = await mount(<QuizPanel trace={run.trace} labels={labels} onJump={() => {}} />, [], false);
    await user.click(screen.getByRole("button", { name: "Start quiz" }));
    expect(screen.getByRole("button", { name: "Check answer" })).toBeDisabled();
    const result = await axe.run(container);
    expect(result.violations.map((v) => v.id)).toEqual([]);
  });
});

describe("learning paths", () => {
  it("lists every path with its size and starts a signed-out learner at the first step", async () => {
    const data = pathData();
    await mount(<PathList paths={data} />, [], false);
    for (const p of PATHS) expect(screen.getByRole("link", { name: p.title })).toHaveAttribute("href", `/paths/${p.id}`);
    expect(screen.getAllByRole("progressbar")).toHaveLength(PATHS.length);
  });

  it("marks completed steps, suggests the next step and shows what to learn before", async () => {
    const path = pathData().find((p) => p.id === "sorting-and-searching")!;
    await mount(<PathView path={path} />, ["bubble-sort", "selection-sort"]);
    await waitFor(() => expect(screen.getByRole("progressbar", { name: "Path progress" })).toHaveAttribute("aria-valuetext", `2 of ${path.steps.length} complete`));
    expect(screen.getByRole("link", { name: "Continue" })).toHaveAttribute("href", "/algorithms/insertion-sort");
    const merge = screen.getAllByRole("link", { name: "Merge Sort" })[0]!.closest("li")!;
    expect(within(merge).getByText(/Best after:/)).toBeInTheDocument();
    expect(within(merge).getByRole("link", { name: "Insertion Sort" })).toBeInTheDocument();
  });

  it("offers sign-in when signed out", async () => {
    const path = pathData()[0]!;
    await mount(<PathView path={path} />, [], false);
    expect(screen.getByRole("link", { name: "Start this path" })).toHaveAttribute("href", `/algorithms/${path.steps[0]!.id}`);
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", `/login?next=${encodeURIComponent(`/paths/${path.id}`)}`);
  });
});

describe("algorithm extras", () => {
  it("shows prerequisites with completion, paths and practice links that open safely", async () => {
    await mount(<AlgorithmExtras id="binary-search-first-occurrence" extras={extrasFor("binary-search-first-occurrence")} />, ["binary-search"]);
    await waitFor(() => expect(screen.getByText("completed")).toBeInTheDocument());
    expect(screen.getByRole("link", { name: "Binary Search" })).toHaveAttribute("href", "/algorithms/binary-search");
    expect(screen.getByRole("link", { name: /Find First and Last Position/ })).toHaveAttribute("rel", "noopener noreferrer");
    expect(screen.getByRole("link", { name: "Compare with another algorithm" })).toHaveAttribute("href", "/compare?a=binary-search-first-occurrence");
  });
});

describe("compare", () => {
  it("shows suggestions first, then a side-by-side table with real example step counts", async () => {
    const rows = compareRows();
    expect(rows).toHaveLength(getAllCount());
    expect(rows.every((r) => r.exampleSteps > 0)).toBe(true);
    const { unmount } = await mount(<CompareView rows={rows} />, [], false);
    expect(screen.getByRole("link", { name: /Bubble Sort vs Merge Sort/ })).toHaveAttribute("href", "/compare?a=bubble-sort&b=merge-sort");
    unmount();

    search = "a=bubble-sort&b=merge-sort";
    const { container } = await mount(<CompareView rows={rows} />, [], false);
    const table = screen.getByRole("table", { name: /Bubble Sort and Merge Sort/ });
    expect(within(table).getByRole("row", { name: /^Time/ })).toHaveTextContent("O(n²)");
    expect(within(table).getByRole("row", { name: /^Time/ })).toHaveTextContent("O(n log n)");
    expect(within(table).getByRole("row", { name: /^Steps in its example/ })).toBeInTheDocument();
    const result = await axe.run(container);
    expect(result.violations.map((v) => v.id)).toEqual([]);
  });

  it("writes a chosen algorithm into the address", async () => {
    const user = userEvent.setup();
    search = "a=bubble-sort";
    await mount(<CompareView rows={compareRows()} />, [], false);
    await user.selectOptions(screen.getByLabelText("Second algorithm"), "quick-sort");
    expect(replace).toHaveBeenCalledWith("/compare?a=bubble-sort&b=quick-sort", { scroll: false });
  });
});

function getAllCount() {
  return compareRows().length > 0 ? pathData().flatMap((p) => p.steps).reduce((s, x) => s.add(x.id), new Set<string>()).size : 0;
}
