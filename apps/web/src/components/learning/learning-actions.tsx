"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useAuth, useOptionalAuthClient } from "../auth/auth-provider";
import { BookmarkButton } from "./bookmark-button";
import { useLearning, useLearningClient } from "./learning-provider";

/** Workspace header actions: bookmark, mark complete, and the "sign in to save" prompt for guests. */
export function LearningActions({ slug, title, language, returnTo }: { slug: string; title: string; language: string; returnTo: string }) {
  if (useOptionalAuthClient() === null) return null;
  return <Inner slug={slug} title={title} language={language} returnTo={returnTo} />;
}

function Inner({ slug, title, language, returnTo }: { slug: string; title: string; language: string; returnTo: string }) {
  const auth = useAuth();
  const learning = useLearning();
  const client = useLearningClient();
  const userId = auth.status === "authenticated" ? auth.user.id : null;

  // Opening an algorithm counts as starting it. Best effort, once per sign-in.
  useEffect(() => {
    if (userId && client) void client.view(slug, language);
    // language is read when the page opens; changing tabs afterwards must not re-record a view
  }, [userId, client, slug]);

  if (auth.status === "loading") return <div aria-hidden="true" className="h-11 w-64 animate-pulse rounded-lg bg-surface-2" />;
  if (auth.status === "anonymous") {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <BookmarkButton slug={slug} title={title} returnTo={returnTo} />
        <p className="text-sm text-muted">
          <Link href={`/login?next=${encodeURIComponent(returnTo)}`} className="font-medium text-accent underline">
            Sign in
          </Link>{" "}
          to save your progress and bookmarks.
        </p>
      </div>
    );
  }
  const entry = learning.progress.get(slug);
  const completed = entry?.status === "COMPLETED";
  const busy = learning.pending.has(slug);
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-3">
        <BookmarkButton slug={slug} title={title} returnTo={returnTo} />
        {completed ? (
          <span role="status" className="inline-flex min-h-11 items-center rounded-lg border border-success px-4 font-semibold text-success">
            <span aria-hidden="true">✓&nbsp;</span>Completed
          </span>
        ) : (
          <button
            type="button"
            disabled={busy || !client}
            aria-busy={busy}
            onClick={() => void client?.complete(slug, language)}
            className="min-h-11 rounded-lg bg-accent px-4 font-semibold text-accent-fg hover:opacity-90 disabled:opacity-60"
          >
            Mark as complete
          </button>
        )}
        {learning.status === "error" && (
          <span role="alert" className="text-sm text-danger">
            {learning.error}{" "}
            <button type="button" onClick={() => void client?.load()} className="font-medium underline">
              Retry
            </button>
          </span>
        )}
      </div>
      {learning.actionError && (
        <p role="alert" className="text-sm font-medium text-danger">
          {learning.actionError}
        </p>
      )}
    </div>
  );
}
