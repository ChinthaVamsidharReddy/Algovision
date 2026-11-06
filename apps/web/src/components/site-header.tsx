import Link from "next/link";
import { brand } from "../../brand.config";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./auth/user-menu";
import { HeaderSearch } from "./header-search";
import type { CatalogCard } from "@/lib/catalog-cards";

export function SiteHeader({ cards }: { cards: CatalogCard[] }) {
  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight">
          <span aria-hidden="true" className="inline-grid size-8 place-items-center rounded-lg bg-accent text-accent-fg">
            ◉
          </span>
          {brand.name}
        </Link>
        <div className="order-last w-full sm:order-none sm:w-auto sm:flex-1 sm:max-w-xs">
          <HeaderSearch cards={cards} />
        </div>
        <nav aria-label="Main" className="flex items-center gap-1 sm:gap-3">
          <Link href="/algorithms" className="rounded-md px-3 py-2 text-sm font-medium text-muted hover:text-fg">
            Algorithms
          </Link>
          <ThemeToggle />
          <UserMenu />
        </nav>
      </div>
    </header>
  );
}
