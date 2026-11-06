"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth, useAuthClient } from "./auth-provider";

/** Header account area: sign in / sign up for guests, name + links + sign out for members. */
export function UserMenu() {
  const auth = useAuth();
  const client = useAuthClient();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  if (auth.status === "loading") {
    return <span aria-hidden="true" className="inline-block h-9 w-20 animate-pulse rounded-md bg-surface-2" />;
  }
  if (auth.status === "anonymous") {
    return (
      <span className="flex items-center gap-1 sm:gap-2">
        {auth.restoreFailed && (
          <button type="button" onClick={() => void client.retryRestore()} className="rounded-md px-2 py-2 text-sm font-medium text-danger underline">
            Retry sign-in
          </button>
        )}
        <Link href="/login" className="rounded-md px-3 py-2 text-sm font-medium text-muted hover:text-fg">
          Sign in
        </Link>
        <Link href="/register" className="rounded-md bg-accent px-3 py-2 text-sm font-semibold text-accent-fg hover:opacity-90">
          Sign up
        </Link>
      </span>
    );
  }
  const first = auth.user.fullName.split(" ")[0] ?? auth.user.fullName;
  return (
    <span className="flex items-center gap-1 sm:gap-2">
      <Link href="/dashboard" className="rounded-md px-3 py-2 text-sm font-medium text-muted hover:text-fg">
        My learning
      </Link>
      <Link href="/bookmarks" className="rounded-md px-3 py-2 text-sm font-medium text-muted hover:text-fg">
        Bookmarks
      </Link>
      <span className="hidden text-sm sm:inline" title={auth.user.email}>
        Hi, {first}
      </span>
      <button
        type="button"
        disabled={signingOut}
        onClick={async () => {
          setSigningOut(true);
          await client.logout();
          router.replace("/");
          setSigningOut(false);
        }}
        className="rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-surface-2 disabled:opacity-60"
      >
        Sign out
      </button>
    </span>
  );
}
