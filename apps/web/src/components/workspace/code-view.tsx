"use client";

import { useEffect, useRef } from "react";
import type { CodeFile, LanguageInfo, LineRange } from "@algovision/algorithms";
import { tokenize } from "@/lib/tokenize";

export function CodeView({
  file,
  language,
  ranges,
  anchorLabel,
}: {
  file: CodeFile;
  language: LanguageInfo;
  ranges: readonly LineRange[];
  anchorLabel: string;
}) {
  const container = useRef<HTMLDivElement>(null);
  const active = new Set<number>();
  for (const r of ranges) for (let l = r.start; l <= r.end; l++) active.add(l);
  const activeKey = [...active].join(",");

  useEffect(() => {
    const el = container.current;
    if (!el || active.size === 0 || el.scrollHeight <= el.clientHeight) return;
    const target = el.querySelector<HTMLElement>('[data-active="true"]');
    if (!target) return;
    const top = target.offsetTop - el.clientHeight / 2 + target.clientHeight / 2;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (typeof el.scrollTo === "function") el.scrollTo({ top: Math.max(0, top), behavior: reduce ? "auto" : "smooth" });
  }, [activeKey, file]);

  const first = Math.min(...active);
  const last = Math.max(...active);
  const caption =
    active.size === 0 ? "No line highlighted" : `${first === last ? `Line ${first}` : `Lines ${first}–${last}`} · ${anchorLabel}`;

  return (
    <div className="space-y-2">
      <div
        ref={container}
        role="region"
        aria-label={`${language.label} source code`}
        tabIndex={0}
        className="max-h-[26rem] overflow-auto rounded-xl border border-border bg-(--code-bg) py-2 font-mono text-sm"
      >
        <ol className="m-0 min-w-max list-none p-0">
          {file.lines.map((text, i) => {
            const n = i + 1;
            const isActive = active.has(n);
            return (
              <li key={n} className="code-line flex" data-active={isActive ? "true" : "false"} data-line={n} aria-current={isActive ? "true" : undefined}>
                <span aria-hidden="true" className="w-10 shrink-0 select-none pr-3 text-right text-muted">
                  {n}
                </span>
                <code className="whitespace-pre pr-4">
                  {text === "" ? " " : tokenize(text, language.id).map((t, j) => (
                    <span key={j} className={t.kind === "plain" ? undefined : `tok-${t.kind}`}>
                      {t.text}
                    </span>
                  ))}
                </code>
              </li>
            );
          })}
        </ol>
      </div>
      <p className="text-sm text-muted" data-testid="code-caption">
        {caption}
      </p>
    </div>
  );
}
