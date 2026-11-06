"use client";

import { useRef, type KeyboardEvent } from "react";
import { LANGUAGES, type LanguageId } from "@algovision/algorithms";

export const tabId = (id: LanguageId) => `tab-${id}`;
export const PANEL_ID = "code-panel";

export function LanguageTabs({ value, onChange }: { value: LanguageId; onChange: (id: LanguageId) => void }) {
  const refs = useRef(new Map<LanguageId, HTMLButtonElement>());

  const move = (e: KeyboardEvent, index: number) => {
    const targets: Record<string, number> = {
      ArrowRight: (index + 1) % LANGUAGES.length,
      ArrowLeft: (index - 1 + LANGUAGES.length) % LANGUAGES.length,
      Home: 0,
      End: LANGUAGES.length - 1,
    };
    const next = targets[e.key];
    if (next === undefined) return;
    e.preventDefault();
    const lang = LANGUAGES[next]!;
    onChange(lang.id);
    refs.current.get(lang.id)?.focus();
  };

  return (
    <div role="tablist" aria-label="Programming language" className="flex flex-wrap gap-1 rounded-lg bg-surface-2 p-1">
      {LANGUAGES.map((lang, i) => {
        const selected = lang.id === value;
        return (
          <button
            key={lang.id}
            ref={(el) => {
              if (el) refs.current.set(lang.id, el);
            }}
            type="button"
            role="tab"
            id={tabId(lang.id)}
            aria-selected={selected}
            aria-controls={PANEL_ID}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(lang.id)}
            onKeyDown={(e) => move(e, i)}
            className={`min-h-11 flex-1 rounded-md px-3 text-sm font-semibold ${
              selected ? "bg-surface text-fg shadow-sm ring-1 ring-border" : "text-muted hover:text-fg"
            }`}
          >
            {lang.label}
          </button>
        );
      })}
    </div>
  );
}
