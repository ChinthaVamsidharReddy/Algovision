import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthClient } from "../src/lib/auth-client";

const replace = vi.fn();
let search = "";
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(search),
  usePathname: () => "/login",
}));
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

import { AuthProvider } from "../src/components/auth/auth-provider";
import { LoginForm } from "../src/components/auth/login-form";
import { RegisterForm } from "../src/components/auth/register-form";
import { ForgotPasswordForm } from "../src/components/auth/forgot-form";
import { ResetPasswordForm } from "../src/components/auth/reset-form";
import { UserMenu } from "../src/components/auth/user-menu";

const USER = { id: "u1", email: "ada@example.com", fullName: "Ada Lovelace", roles: ["ROLE_STUDENT"] };
const json = (status: number, body?: unknown) => new Response(body === undefined ? null : JSON.stringify(body), { status });
const ok = () => json(200, { user: USER, accessToken: "t", accessTokenExpiresAt: new Date(Date.now() + 900_000).toISOString() });
const store = () => ({ getItem: () => null, setItem: () => {}, removeItem: () => {} });

function setup(ui: React.ReactNode, f: ReturnType<typeof vi.fn>) {
  const client = new AuthClient({ fetchImpl: f as never, storage: store(), locks: null });
  return { client, ...render(<AuthProvider client={client}>{ui}</AuthProvider>) };
}

beforeEach(() => {
  replace.mockClear();
  search = "";
});

describe("login", () => {
  it("validates empty fields locally without calling the API", async () => {
    const f = vi.fn();
    setup(<LoginForm />, f);
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));
    expect(screen.getByText("Enter your email.")).toBeInTheDocument();
    expect(screen.getByText("Enter your password.")).toBeInTheDocument();
    expect(f).not.toHaveBeenCalled();
  });

  it("signs in and goes to the safe next page", async () => {
    search = "next=/algorithms/bubble-sort";
    const f = vi.fn().mockResolvedValue(ok());
    setup(<LoginForm />, f);
    await userEvent.type(screen.getByLabelText("Email"), "ada@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "tr1cky-Passphrase!");
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/algorithms/bubble-sort"));
  });

  it("ignores an unsafe next and falls back to the dashboard", async () => {
    search = "next=https://evil.test";
    const f = vi.fn().mockResolvedValue(ok());
    setup(<LoginForm />, f);
    await userEvent.type(screen.getByLabelText("Email"), "a@b.co");
    await userEvent.type(screen.getByLabelText("Password"), "pw");
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/dashboard"));
  });

  it("shows the server message for wrong credentials and lets the user retry", async () => {
    const f = vi.fn().mockResolvedValue(json(401, { code: "INVALID_CREDENTIALS", detail: "The email or password is not correct." }));
    setup(<LoginForm />, f);
    await userEvent.type(screen.getByLabelText("Email"), "a@b.co");
    await userEvent.type(screen.getByLabelText("Password"), "pw");
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));
    expect(await screen.findByText("The email or password is not correct.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign in" })).toBeEnabled();
    expect(replace).not.toHaveBeenCalled();
  });

  it("shows a friendly message when the server cannot be reached", async () => {
    const f = vi.fn().mockRejectedValue(new TypeError("down"));
    setup(<LoginForm />, f);
    await userEvent.type(screen.getByLabelText("Email"), "a@b.co");
    await userEvent.type(screen.getByLabelText("Password"), "pw");
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));
    expect(await screen.findByText(/Could not reach the server/, undefined, { timeout: 15_000 })).toBeInTheDocument();
  }, 20_000);

  it("password visibility toggle works and the form has no accessibility violations", async () => {
    const { container } = setup(<LoginForm />, vi.fn());
    const pw = screen.getByLabelText("Password");
    expect(pw).toHaveAttribute("type", "password");
    await userEvent.click(screen.getByRole("button", { name: "Show" }));
    expect(pw).toHaveAttribute("type", "text");
    const results = await axe.run(container, { rules: { "color-contrast": { enabled: false } } });
    expect(results.violations.map((v) => v.id)).toEqual([]);
  });

  it("confirms a completed password reset", () => {
    search = "reset=1";
    setup(<LoginForm />, vi.fn());
    expect(screen.getByRole("status")).toHaveTextContent("Your password was changed");
  });
});

describe("register", () => {
  it("maps server field errors onto the right fields", async () => {
    const f = vi.fn().mockResolvedValue(json(400, { code: "INVALID_INPUT", detail: "Please fix", errors: [{ field: "email", message: "An account with this email already exists." }] }));
    setup(<RegisterForm />, f);
    await userEvent.type(screen.getByLabelText("Name"), "Ada");
    await userEvent.type(screen.getByLabelText("Email"), "ada@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "tr1cky-Passphrase!");
    await userEvent.click(screen.getByRole("button", { name: "Create account" }));
    expect(await screen.findByText("An account with this email already exists.")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toHaveAttribute("aria-invalid", "true");
  });

  it("requires a 10-character password before calling the API", async () => {
    const f = vi.fn();
    setup(<RegisterForm />, f);
    await userEvent.type(screen.getByLabelText("Name"), "Ada");
    await userEvent.type(screen.getByLabelText("Email"), "ada@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "short");
    await userEvent.click(screen.getByRole("button", { name: "Create account" }));
    expect(screen.getByText("Use at least 10 characters.")).toBeInTheDocument();
    expect(f).not.toHaveBeenCalled();
  });

  it("creates the account, signs in and redirects", async () => {
    const f = vi.fn().mockResolvedValue(json(201, { user: USER, accessToken: "t", accessTokenExpiresAt: new Date(Date.now() + 900_000).toISOString() }));
    setup(<RegisterForm />, f);
    await userEvent.type(screen.getByLabelText("Name"), "Ada");
    await userEvent.type(screen.getByLabelText("Email"), "ada@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "tr1cky-Passphrase!");
    await userEvent.click(screen.getByRole("button", { name: "Create account" }));
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/dashboard"));
  });
});

describe("forgot and reset password", () => {
  it("forgot-password shows the same neutral confirmation", async () => {
    const f = vi.fn().mockResolvedValue(json(202, { message: "If an account exists for that email, a reset link has been sent." }));
    setup(<ForgotPasswordForm />, f);
    await userEvent.type(screen.getByLabelText("Email"), "ghost@example.com");
    await userEvent.click(screen.getByRole("button", { name: "Send reset link" }));
    expect(await screen.findByRole("status")).toHaveTextContent("If an account exists");
  });

  it("forgot-password reports rate limiting", async () => {
    const f = vi.fn().mockResolvedValue(json(429, { code: "TOO_MANY_ATTEMPTS", detail: "Too many failed attempts. Try again in a few minutes." }));
    setup(<ForgotPasswordForm />, f);
    await userEvent.type(screen.getByLabelText("Email"), "a@b.co");
    await userEvent.click(screen.getByRole("button", { name: "Send reset link" }));
    expect(await screen.findByText(/Too many failed attempts/, undefined, { timeout: 15_000 })).toBeInTheDocument();
  }, 20_000);

  it("reset without a token explains and offers a new link", () => {
    setup(<ResetPasswordForm />, vi.fn());
    expect(screen.getByText(/needs the link from your email/)).toBeInTheDocument();
  });

  it("reset checks the two passwords match, then submits the token", async () => {
    search = "token=" + "a".repeat(43);
    const f = vi.fn().mockResolvedValue(json(204));
    setup(<ResetPasswordForm />, f);
    await userEvent.type(screen.getByLabelText("New password"), "an0ther-Good-Passphrase");
    await userEvent.type(screen.getByLabelText("Repeat new password"), "different");
    await userEvent.click(screen.getByRole("button", { name: "Change password" }));
    expect(screen.getByText("The passwords do not match.")).toBeInTheDocument();
    expect(f).not.toHaveBeenCalled();
    await userEvent.clear(screen.getByLabelText("Repeat new password"));
    await userEvent.type(screen.getByLabelText("Repeat new password"), "an0ther-Good-Passphrase");
    await userEvent.click(screen.getByRole("button", { name: "Change password" }));
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/login?reset=1"));
    expect(JSON.parse((f.mock.calls[0]![1] as RequestInit).body as string)).toEqual({ token: "a".repeat(43), password: "an0ther-Good-Passphrase" });
  });

  it("an expired link shows the server message and a way to request a new one", async () => {
    search = "token=" + "b".repeat(43);
    const f = vi.fn().mockResolvedValue(json(400, { code: "RESET_TOKEN_INVALID", detail: "This reset link is invalid or has expired. Request a new one." }));
    setup(<ResetPasswordForm />, f);
    await userEvent.type(screen.getByLabelText("New password"), "an0ther-Good-Passphrase");
    await userEvent.type(screen.getByLabelText("Repeat new password"), "an0ther-Good-Passphrase");
    await userEvent.click(screen.getByRole("button", { name: "Change password" }));
    expect(await screen.findByText(/invalid or has expired/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Request a new link" })).toHaveAttribute("href", "/forgot-password");
  });
});

describe("user menu", () => {
  it("guests see Sign in and Sign up", async () => {
    setup(<UserMenu />, vi.fn());
    expect(await screen.findByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/login");
    expect(screen.getByRole("link", { name: "Sign up" })).toHaveAttribute("href", "/register");
  });

  it("members see their links and can sign out", async () => {
    const f = vi.fn().mockResolvedValueOnce(ok()).mockResolvedValue(json(204));
    const { client } = setup(<UserMenu />, f);
    await act(() => client.login("ada@example.com", "pw"));
    expect(screen.getByText("Hi, Ada")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Bookmarks" })).toHaveAttribute("href", "/bookmarks");
    await userEvent.click(screen.getByRole("button", { name: "Sign out" }));
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/"));
    expect(await screen.findByRole("link", { name: "Sign in" })).toBeInTheDocument();
  });
});
