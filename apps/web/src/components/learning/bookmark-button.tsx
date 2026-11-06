"use client";

import Link from "next/link";
import { useAuth, useOptionalAuthClient } from "../auth/auth-provider";
import { useLearning, useLearningClient } from "./learning-provider";

/** Bookmark toggle. Guests get a link to sign in (and come back here afterwards). */
export function BookmarkButton({ slug, title, returnTo, compact = false }: { slug: string; title: string; returnTo: string; compact?: boolean }) {
  const hasAuth = useOptionalAuthClient() !== null;
  if (!hasAuth) return null;
  return <Inner slug={slug} title={title} returnTo={returnTo} compact={compact} />;
}

function Inner({ slug, title, returnTo, compact }: { slug: string; title: string; returnTo: string; compact: boolean }) {
  const auth = useAuth();
  const learning = useLearning();
  const client = useLearningClient();
  const size = compact ? "min-h-9 px-2.5 text-sm" : "min-h-11 px-4";
  if (auth.status === "loading") return <span aria-hidden="true" className={`inline-block h-9 w-24 animate-pulse rounded-lg bg-surface-2`} />;
  if (auth.status === "anonymous") {
    return (
      <Link href={`/login?next=${encodeURIComponent(returnTo)}`} className={`inline-flex items-center rounded-lg border border-border font-semibold hover:bg-surface-2 ${size}`}>
        <span aria-hidden="true">☆&nbsp;</span>Bookmark<span className="sr-only">&nbsp;{title} (sign in required)</span>
      </Link>
    );
  }
  const on = learning.bookmarks.has(slug);
  const busy = learning.pending.has(slug);
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-busy={busy}
      disabled={busy || !client}
      onClick={() => void client?.toggleBookmark(slug)}
      className={`inline-flex items-center rounded-lg border font-semibold hover:bg-surface-2 disabled:opacity-60 ${on ? "border-accent text-accent" : "border-border"} ${size}`}
    >
      <span aria-hidden="true">{on ? "★" : "☆"}&nbsp;</span>
      {on ? "Bookmarked" : "Bookmark"}
      <span className="sr-only">&nbsp;{title}</span>
    </button>
  );
}
