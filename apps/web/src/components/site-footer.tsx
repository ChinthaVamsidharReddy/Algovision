import Link from "next/link";
import { brand } from "../../brand.config";
import { BackendStatus } from "./backend-status";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 text-sm text-muted sm:px-6 lg:px-8">
        <p>
          {brand.name} &middot; {brand.tagline}
        </p>
        <nav aria-label="Footer" className="flex gap-4">
          <Link href="/paths" className="hover:underline">Paths</Link>
          <Link href="/compare" className="hover:underline">Compare</Link>
          <Link href="/cheatsheet" className="hover:underline">Cheat sheet</Link>
        </nav>
        <BackendStatus />
      </div>
    </footer>
  );
}
