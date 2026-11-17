import { render, screen, within } from "@testing-library/react";
import axe from "axe-core";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn(), push: vi.fn() }), useSearchParams: () => new URLSearchParams(""), usePathname: () => "/dashboard" }));
vi.mock("next/link", () => ({ default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => <a href={href} {...rest}>{children}</a> }));

const state = { status: "ready" as "ready" | "idle", progress: new Map<string, unknown>(), error: null as string | null };
const auth = { status: "authenticated", user: { id: "u", email: "a@b.c", fullName: "Ada Lovelace", roles: [] } };
vi.mock("../src/components/learning/learning-provider", () => ({ useLearning: () => state, useLearningClient: () => null }));
vi.mock("../src/components/auth/auth-provider", () => ({ useAuth: () => auth, useAuthClient: () => ({}) }));

import { EngagementPanel } from "../src/components/dashboard/engagement-panel";
import { Certificate } from "../src/components/paths/certificate";
import { localDay } from "../src/lib/activity-log";

const groups = [{ id: "g", name: "Group", ids: ["a", "b"] }];
const paths = [{ id: "p", title: "Path P", steps: ["a", "b"] }];
const done = (slug: string) => ({ algorithmSlug: slug, status: "COMPLETED", lastLanguage: null, firstViewedAt: "2026-11-10T10:00:00", lastViewedAt: "2026-11-10T10:00:00", completedAt: "2026-11-10T10:00:00" });
const pathData = { id: "p", title: "Path P", summary: "s", level: "BEGINNER" as const, outcomes: ["Do a thing"], steps: ["a", "b"].map((id) => ({ id, title: id.toUpperCase(), difficulty: "Easy" as never, time: "O(n)", prerequisites: [] })) };

beforeEach(() => {
  localStorage.clear();
  state.progress = new Map();
  state.status = "ready";
});

describe("engagement panel", () => {
  it("shows a first-day learner level 1, no streak and no badges, with a prompt", async () => {
    const { container } = render(<EngagementPanel groups={groups} paths={paths} />);
    expect(screen.getByTestId("level")).toHaveTextContent("Level 1");
    expect(screen.getByTestId("streak")).toHaveTextContent("0 days");
    expect(screen.getByText(/Open an algorithm today to start a streak/)).toBeInTheDocument();
    expect(screen.getByText(/No badges yet/)).toBeInTheDocument();
    const r = await axe.run(container, { rules: { "color-contrast": { enabled: false } } });
    expect(r.violations.map((v) => v.id)).toEqual([]);
  });
  it("shows XP, a streak from today's activity, earned badges and a certificate link", () => {
    localStorage.setItem("algovision.days", JSON.stringify([localDay(new Date())]));
    state.progress = new Map([["a", done("a")], ["b", done("b")]]);
    render(<EngagementPanel groups={groups} paths={paths} />);
    expect(screen.getByTestId("xp")).toHaveTextContent("150 XP");
    expect(screen.getByTestId("level")).toHaveTextContent("Level 2");
    expect(screen.getByTestId("streak")).toHaveTextContent("1 day");
    expect(within(screen.getByTestId("badges-earned")).getByText("First step")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Path P" })).toHaveAttribute("href", "/paths/p/certificate");
    expect(screen.getByRole("progressbar", { name: "Progress to the next level" })).toHaveAttribute("aria-valuenow", "33");
  });
});

describe("certificate", () => {
  it("is locked with a progress bar until every step is complete", () => {
    state.progress = new Map([["a", done("a")]]);
    render(<Certificate path={pathData} />);
    expect(screen.getByTestId("certificate-locked")).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: "Path progress" })).toHaveAttribute("aria-valuenow", "50");
    expect(screen.queryByTestId("certificate")).not.toBeInTheDocument();
  });
  it("shows the learner's name, the path and the finish date once complete", async () => {
    state.progress = new Map([["a", done("a")], ["b", done("b")]]);
    const { container } = render(<Certificate path={pathData} />);
    expect(screen.getByTestId("certificate-name")).toHaveTextContent("Ada Lovelace");
    expect(screen.getByTestId("certificate")).toHaveTextContent("Path P");
    expect(screen.getByTestId("certificate-date")).toHaveTextContent(/November 10, 2026|10 November 2026/);
    expect(screen.getByText(/not an accredited qualification/)).toBeInTheDocument();
    const r = await axe.run(container, { rules: { "color-contrast": { enabled: false } } });
    expect(r.violations.map((v) => v.id)).toEqual([]);
  });
  it("shows a loading state while progress loads", () => {
    state.status = "idle";
    render(<Certificate path={pathData} />);
    expect(screen.getByText("Loading your progress…")).toBeInTheDocument();
  });
});
