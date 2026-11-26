import { render, screen, within } from "@testing-library/react";
import axe from "axe-core";
import { describe, expect, it, vi } from "vitest";
import { brand } from "../brand.config";

vi.mock("@/components/auth/auth-provider", () => ({ useAuth: () => ({ status: "anonymous" }), AuthProvider: ({ children }: { children: unknown }) => children }));
vi.mock("@/components/backend-status", () => ({ BackendStatus: () => <span>status</span> }));
vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams(""), usePathname: () => "/", useRouter: () => ({ push: () => undefined, replace: () => undefined }) }));
vi.mock("@/components/auth/user-menu", () => ({ UserMenu: () => null }));

import HomePage from "../src/app/home/page";
import LandingPage from "../src/app/page";
import { SiteFooter } from "../src/components/site-footer";
import { SiteHeader } from "../src/components/site-header";
import { catalogCards } from "../src/lib/catalog-cards";

describe("brand", () => {
  it("is AlgoMigo with its tagline and no stale name", () => {
    expect(brand.name).toBe("AlgoMigo");
    expect(brand.tagline).toBe("Your friendly companion for mastering DSA.");
    expect(JSON.stringify(brand)).not.toMatch(/AlgoVision/);
  });
});

describe("footer", () => {
  it("has the brand, copyright, country, social links and only working internal links", () => {
    render(<SiteFooter />);
    const footer = screen.getByRole("contentinfo");
    expect(within(footer).getByText(/AlgoMigo\. All rights reserved/)).toBeInTheDocument();
    expect(within(footer).getByText(new RegExp(`in ${brand.country}`))).toBeInTheDocument();
    const social = within(footer).getByRole("list", { name: "Social media" });
    const links = within(social).getAllByRole("link");
    expect(links.length).toBe(Object.values(brand.social).filter(Boolean).length);
    for (const a of links) {
      expect(a).toHaveAttribute("target", "_blank");
      expect(a.getAttribute("rel")).toContain("noopener");
      expect(a.getAttribute("aria-label")).toMatch(/^AlgoMigo on /);
    }
    for (const a of within(footer).getAllByRole("link")) expect(a.getAttribute("href"), a.textContent ?? "").toMatch(/^(\/|https:\/\/)/);
  });
  it("has no accessibility violations", async () => {
    const { container } = render(<SiteFooter />);
    const r = await axe.run(container, { rules: { "color-contrast": { enabled: false }, region: { enabled: false } } });
    expect(r.violations.map((v) => v.id)).toEqual([]);
  });
});

describe("header", () => {
  it("shows the brand and a Home link", () => {
    render(<SiteHeader cards={catalogCards()} />);
    expect(screen.getAllByText("AlgoMigo").length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: "Home" })[0]).toHaveAttribute("href", "/home");
  });
});

describe("landing page", () => {
  it("has one h1 with the tagline for assistive tech, a start link and real numbers", () => {
    render(<LandingPage />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(brand.tagline);
    for (const a of screen.getAllByRole("link", { name: /Start learning/ })) expect(a).toHaveAttribute("href", "/home");
    const stats = screen.getByRole("region", { name: "AlgoMigo in numbers" });
    expect(stats).toHaveTextContent(String(catalogCards().length));
  });
  it("has no accessibility violations", async () => {
    const { container } = render(<LandingPage />);
    const r = await axe.run(container, { rules: { "color-contrast": { enabled: false }, region: { enabled: false } } });
    expect(r.violations.map((v) => `${v.id}: ${v.nodes[0]?.html.slice(0, 80)}`)).toEqual([]);
  });
});

describe("home page", () => {
  it("greets a guest, links every topic and the starter algorithms", () => {
    render(<HomePage />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Welcome to AlgoMigo");
    const topics = screen.getByRole("region", { name: "Explore by topic" });
    expect(within(topics).getAllByRole("link").length).toBe(new Set(catalogCards().map((c) => c.categoryId)).size);
    for (const l of within(topics).getAllByRole("link")) expect(l.getAttribute("href")).toMatch(/^\/algorithms#cat-/);
    const start = screen.getByRole("region", { name: "Start here" });
    expect(within(start).getAllByRole("link").length).toBeGreaterThanOrEqual(8);
  });
  it("has no accessibility violations", async () => {
    const { container } = render(<HomePage />);
    const r = await axe.run(container, { rules: { "color-contrast": { enabled: false }, region: { enabled: false } } });
    expect(r.violations.map((v) => `${v.id}: ${v.nodes[0]?.html.slice(0, 80)}`)).toEqual([]);
  });
});
