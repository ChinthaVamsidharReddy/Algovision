import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { describe, expect, it, vi } from "vitest";
import { AuthClient } from "../src/lib/auth-client";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(""),
}));
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

import { AuthProvider } from "../src/components/auth/auth-provider";
import { MobileMenu } from "../src/components/mobile-menu";

const USER = { id: "u1", email: "ada@example.com", fullName: "Ada Lovelace", roles: ["ROLE_STUDENT"] };
const session = () => new Response(JSON.stringify({ user: USER, accessToken: "t", accessTokenExpiresAt: new Date(Date.now() + 900_000).toISOString() }), { status: 200 });

function setup(signedIn: boolean) {
  const store = { getItem: () => (signedIn ? "1" : null), setItem: () => {}, removeItem: () => {} };
  const client = new AuthClient({ fetchImpl: (async () => session()) as never, storage: store, locks: null });
  return render(
    <AuthProvider client={client}>
      <MobileMenu />
    </AuthProvider>,
  );
}

describe("MobileMenu", () => {
  it("keeps the links out of the page until it is opened", async () => {
    setup(false);
    const button = screen.getByRole("button", { name: /Menu/ });
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("link", { name: "Algorithms" })).toBeNull();
    await userEvent.click(button);
    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("link", { name: "Algorithms" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sign in" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sign up" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /theme/ })).toBeInTheDocument();
  });

  it("shows the member's links and a sign-out button when signed in", async () => {
    setup(true);
    await userEvent.click(screen.getByRole("button", { name: /Menu/ }));
    expect(await screen.findByRole("link", { name: "My learning" })).toHaveAttribute("href", "/dashboard");
    expect(screen.getByRole("link", { name: "Bookmarks" })).toHaveAttribute("href", "/bookmarks");
    expect(screen.getByText(/Hi, Ada/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign out" })).toBeInTheDocument();
  });

  it("closes on Escape and returns focus to the button", async () => {
    setup(false);
    const button = screen.getByRole("button", { name: /Menu/ });
    await userEvent.click(button);
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(button).toHaveAttribute("aria-expanded", "false"));
    expect(button).toHaveFocus();
    expect(screen.queryByRole("link", { name: "Algorithms" })).toBeNull();
  });

  it("has no accessibility violations open or closed", async () => {
    const { container } = setup(false);
    expect((await axe.run(container, { rules: { "color-contrast": { enabled: false } } })).violations).toEqual([]);
    await userEvent.click(screen.getByRole("button", { name: /Menu/ }));
    expect((await axe.run(container, { rules: { "color-contrast": { enabled: false } } })).violations).toEqual([]);
  });
});
