"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./auth/user-menu";

/**
 * Below the `lg` breakpoint the header links collapse into this menu so the header never grows wider than the
 * screen. The panel is only in the page while it is open, so there is one "Sign in" link at a time, not two.
 */
export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const id = useId();
  const pathname = usePathname();
  const button = useRef<HTMLButtonElement>(null);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        button.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        ref={button}
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex min-h-11 items-center gap-2 rounded-md border border-border px-3 text-sm font-medium hover:bg-surface-2"
      >
        <span aria-hidden="true" className="text-base leading-none">
          {open ? "✕" : "☰"}
        </span>
        Menu
      </button>
      {open && (
        <nav id={id} aria-label="Main menu" className="absolute inset-x-0 top-full z-40 border-b border-border bg-surface px-4 pb-4 pt-2 shadow-lg">
          <div className="mx-auto flex max-w-md flex-col items-stretch gap-1">
            <Link href="/algorithms" className="flex min-h-11 items-center rounded-md px-3 text-base font-medium hover:bg-surface-2">
              Algorithms
            </Link>
            <UserMenu stacked />
            <div className="mt-2 flex">
              <ThemeToggle />
            </div>
          </div>
        </nav>
      )}
    </div>
  );
}
