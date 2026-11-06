"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import type { CatalogCard } from "@/lib/catalog-cards";
import { searchCards } from "@/lib/search";

/** Header search box with live suggestions. Enter opens the full results page; `/` focuses the box. */
export function HeaderSearch({ cards }: { cards: CatalogCard[] }) {
  const router = useRouter();
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const suggestions = useMemo(() => searchCards(query, cards).slice(0, 6).map((r) => r.card), [query, cards]);
  const showList = open && query.trim().length > 0;

  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      const t = e.target;
      const typing = t instanceof HTMLElement && (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable);
      if (e.key === "/" && !typing && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  function go(path: string) {
    setOpen(false);
    setActive(-1);
    router.push(path);
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown" && suggestions.length > 0) {
      e.preventDefault();
      setOpen(true);
      setActive((a) => (a + 1) % suggestions.length);
    } else if (e.key === "ArrowUp" && suggestions.length > 0) {
      e.preventDefault();
      setActive((a) => (a <= 0 ? suggestions.length - 1 : a - 1));
    } else if (e.key === "Escape") {
      setOpen(false);
      setActive(-1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const picked = active >= 0 ? suggestions[active] : undefined;
      if (picked) go(`/algorithms/${picked.id}`);
      else if (query.trim()) go(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  }

  return (
    <div role="search" className="relative w-full sm:w-64">
      <label htmlFor={`${listId}-input`} className="sr-only">
        Search algorithms
      </label>
      <input
        id={`${listId}-input`}
        ref={inputRef}
        type="search"
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
        value={query}
        placeholder="Search…  ( / )"
        autoComplete="off"
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          setActive(-1);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        onKeyDown={onKeyDown}
        className="min-h-10 w-full rounded-lg border border-border bg-bg px-3 text-sm"
      />
      {showList && (
        <ul id={listId} role="listbox" aria-label="Suggestions" className="absolute left-0 right-0 z-40 mt-1 overflow-hidden rounded-lg border border-border bg-surface shadow-lg">
          {suggestions.length === 0 ? (
            <li role="option" aria-selected="false" className="px-3 py-2 text-sm text-muted">
              No match. Press Enter to search anyway.
            </li>
          ) : (
            suggestions.map((c, i) => (
              <li
                key={c.id}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === active}
                onMouseDown={(e) => {
                  e.preventDefault();
                  go(`/algorithms/${c.id}`);
                }}
                className={`cursor-pointer px-3 py-2 text-sm ${i === active ? "bg-surface-2" : ""}`}
              >
                <span className="font-medium">{c.title}</span> <span className="text-muted">&middot; {c.categoryName}</span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
