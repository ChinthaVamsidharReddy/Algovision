"use client";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div role="alert" className="mx-auto max-w-xl space-y-4 py-16 text-center">
      <h1 className="text-3xl font-bold">Something went wrong</h1>
      <p className="text-muted">This page failed to load. Your work is not lost; try again.</p>
      {error.digest && <p className="text-sm text-muted">Reference: {error.digest}</p>}
      <button type="button" onClick={reset} className="min-h-11 rounded-lg bg-accent px-5 font-semibold text-accent-fg">
        Try again
      </button>
    </div>
  );
}
