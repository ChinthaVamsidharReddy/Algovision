"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth, useAuthClient } from "./auth-provider";

/** Header account area: sign in / sign up for guests, name + links + sign out for members. */
export function UserMenu({ stacked = false }: { stacked?: boolean }) {
  const auth = useAuth();
  const client = useAuthClient();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  if (auth.status === "loading") {
    return <span aria-hidden="true" className="inline-block h-9 w-20 animate-pulse rounded-md bg-surface-2" />;
  }
  const wrap = stacked ? "flex flex-col items-stretch gap-1" : "flex items-center gap-2";
  const link = stacked
    ? "flex min-h-11 items-center rounded-md px-3 text-base font-medium hover:bg-surface-2"
    : "rounded-md px-3 py-2 text-sm font-medium text-muted hover:text-fg";
  if (auth.status === "anonymous") {
    return (
      <span className={wrap}>
        {auth.restoreFailed && (
          <button type="button" onClick={() => void client.retryRestore()} className={`rounded-md px-2 py-2 text-sm font-medium text-danger underline ${stacked ? "min-h-11 text-left" : ""}`}>
            Retry sign-in
          </button>
        )}
        <Link href="/login" className={link}>
          Sign in
        </Link>
        <Link href="/register" className={`rounded-md bg-accent px-3 py-2 text-sm font-semibold text-accent-fg hover:opacity-90 ${stacked ? "flex min-h-11 items-center justify-center" : ""}`}>
          Sign up
        </Link>
      </span>
    );
  }
  const first = auth.user.fullName.split(" ")[0] ?? auth.user.fullName;
  return (
    <span className={wrap}>
      <Link href="/dashboard" className={link}>
        My learning
      </Link>
      <Link href="/bookmarks" className={link}>
        Bookmarks
      </Link>
      <span className={stacked ? "px-3 py-2 text-sm text-muted" : "text-sm"} title={auth.user.email}>
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
        className={`rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-surface-2 disabled:opacity-60 ${stacked ? "min-h-11 text-base" : ""}`}
      >
        Sign out
      </button>
    </span>
  );
}
