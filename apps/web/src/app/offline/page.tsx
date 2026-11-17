import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Offline", robots: { index: false } };

/** Shown by the service worker when a page that was never opened before is requested without a connection. */
export default function OfflinePage() {
  return (
    <div className="mx-auto max-w-xl space-y-4 py-10 text-center">
      <h1 className="text-3xl font-bold tracking-tight">You are offline</h1>
      <p className="text-muted">This page has not been opened on this device yet, so it is not available without a connection. Algorithms you have opened before still work, including the visualizations and your notes.</p>
      <p>
        <Link href="/" className="inline-flex min-h-11 items-center rounded-lg bg-accent px-5 font-semibold text-accent-fg hover:opacity-90">
          Go to the home page
        </Link>
      </p>
    </div>
  );
}
