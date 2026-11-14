"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { previewValue, PRACTICE_LANGUAGES, type PracticeLanguage, type PracticeVector } from "@algovision/algorithms";
import { runTests, stopRuntime, type CaseOutcome, type RunEnd } from "@/lib/practice/runner";
import { markSolved, readDraft, writeDraft } from "@/lib/practice/storage";

export interface WorkbenchProps {
  readonly id: string;
  readonly title: string;
  readonly adapter?: "list" | "tree";
  readonly fns: Record<PracticeLanguage, string>;
  readonly starters: Record<PracticeLanguage, string>;
  readonly vectors: readonly PracticeVector[];
}

type Phase = "idle" | "loading" | "running";

const STATUS_LABEL: Record<CaseOutcome["status"], string> = { pass: "Passed", fail: "Wrong answer", error: "Error", timeout: "Timed out", skipped: "Not run" };
const STATUS_MARK: Record<CaseOutcome["status"], string> = { pass: "✓", fail: "✗", error: "!", timeout: "⏱", skipped: "–" };
const STATUS_CLASS: Record<CaseOutcome["status"], string> = { pass: "text-success", fail: "text-danger", error: "text-danger", timeout: "text-danger", skipped: "text-muted" };

export function PracticeWorkbench({ id, title, adapter, fns, starters, vectors }: WorkbenchProps) {
  const [language, setLanguage] = useState<PracticeLanguage>("python");
  const [codes, setCodes] = useState<Record<PracticeLanguage, string>>(starters);
  const [phase, setPhase] = useState<Phase>("idle");
  const [outcomes, setOutcomes] = useState<CaseOutcome[] | null>(null);
  const [end, setEnd] = useState<RunEnd | null>(null);
  const [summary, setSummary] = useState("");
  const [solved, setSolved] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // Restore saved drafts after hydration (the server renders the starter code).
  useEffect(() => {
    setCodes((c) => ({ javascript: readDraft(id, "javascript") ?? c.javascript, python: readDraft(id, "python") ?? c.python }));
    setSolved(readDraft(id, "solved") === "1");
  }, [id]);
  useEffect(
    () => () => {
      abortRef.current?.abort();
      stopRuntime("javascript");
      stopRuntime("python");
    },
    [],
  );

  const busy = phase !== "idle";
  const onChange = (value: string) => {
    setCodes((c) => ({ ...c, [language]: value }));
    writeDraft(id, language, value);
  };

  const run = useCallback(async () => {
    if (busy) return;
    const controller = new AbortController();
    abortRef.current = controller;
    setPhase("loading");
    setEnd(null);
    setSummary("");
    setOutcomes(vectors.map<CaseOutcome>(() => ({ status: "skipped" })));
    const live: CaseOutcome[] = vectors.map(() => ({ status: "skipped" }));
    const result = await runTests(
      { language, source: codes[language], fn: fns[language], adapter, vectors },
      {
        onLoading: () => setPhase("loading"),
        onCaseStart: () => setPhase("running"),
        onCase: (i, o) => {
          live[i] = o;
          setOutcomes([...live]);
        },
      },
      controller.signal,
    );
    setOutcomes(result.outcomes);
    setEnd(result.end);
    setPhase("idle");
    const passed = result.outcomes.filter((o) => o.status === "pass").length;
    if (result.end.kind === "finished") {
      setSummary(`${passed} of ${vectors.length} tests passed.`);
      if (passed === vectors.length) {
        markSolved(id);
        setSolved(true);
      }
    } else if (result.end.kind === "setup-error") setSummary("Your code could not be loaded.");
    else if (result.end.kind === "load-failed") setSummary("The runtime could not be loaded.");
    else setSummary("Run stopped.");
  }, [busy, vectors, language, codes, fns, adapter, id]);

  const reset = () => {
    onChange(starters[language]);
    setOutcomes(null);
    setEnd(null);
    setSummary("");
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      void run();
      return;
    }
    // Tab inserts spaces; Escape followed by Tab leaves the editor so keyboard users are never trapped.
    if (e.key === "Escape") {
      (e.currentTarget as HTMLTextAreaElement).dataset.leave = "1";
      return;
    }
    if (e.key === "Tab" && !e.shiftKey && e.currentTarget.dataset.leave !== "1") {
      e.preventDefault();
      const t = e.currentTarget;
      const { selectionStart: a, selectionEnd: b, value } = t;
      const next = `${value.slice(0, a)}    ${value.slice(b)}`;
      onChange(next);
      requestAnimationFrame(() => t.setSelectionRange(a + 4, a + 4));
      return;
    }
    e.currentTarget.dataset.leave = "";
  };

  const failedIndex = outcomes?.findIndex((o) => o.status === "fail" || o.status === "error" || o.status === "timeout") ?? -1;
  const consoleText = (outcomes ?? []).map((o, i) => (o.stdout ? `[${vectors[i]!.name}]\n${o.stdout}` : "")).filter(Boolean).join("\n");

  return (
    <section aria-labelledby="workbench-h" className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="workbench-h" className="text-xl font-semibold">
          Your solution {solved && <span className="ml-2 rounded-full bg-surface-2 px-2 py-0.5 text-xs font-medium text-success">✓ Solved</span>}
        </h2>
        <div role="group" aria-label="Language" className="inline-flex rounded-lg border border-border p-0.5">
          {PRACTICE_LANGUAGES.map((l) => (
            <button
              key={l.id}
              type="button"
              aria-pressed={language === l.id}
              disabled={busy}
              onClick={() => setLanguage(l.id)}
              className={`min-h-11 rounded-md px-3 text-sm font-medium ${language === l.id ? "bg-accent text-accent-fg" : "hover:bg-surface-2"}`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      <label htmlFor="code-editor" className="sr-only">
        {title} solution in {language === "python" ? "Python" : "JavaScript"}. Press Escape then Tab to leave the editor.
      </label>
      <textarea
        id="code-editor"
        value={codes[language]}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        rows={16}
        className="block w-full resize-y rounded-xl border border-border bg-surface-2 p-3 font-mono text-sm leading-relaxed"
      />
      <p className="text-xs text-muted">Tab indents. Press Escape, then Tab, to move on. Ctrl+Enter runs your tests. Your code stays in this browser.</p>

      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => void run()} disabled={busy} className="inline-flex min-h-11 items-center rounded-lg bg-accent px-4 text-sm font-semibold text-accent-fg disabled:opacity-60">
          {phase === "loading" ? (language === "python" ? "Loading Python…" : "Starting…") : phase === "running" ? "Running…" : "Run tests"}
        </button>
        {busy && (
          <button type="button" onClick={() => abortRef.current?.abort()} className="inline-flex min-h-11 items-center rounded-lg border border-border px-4 text-sm font-medium hover:bg-surface-2">
            Stop
          </button>
        )}
        <button type="button" onClick={reset} disabled={busy} className="inline-flex min-h-11 items-center rounded-lg border border-border px-4 text-sm font-medium hover:bg-surface-2 disabled:opacity-60">
          Reset code
        </button>
      </div>
      {phase === "loading" && language === "python" && <p className="text-sm text-muted">Python runs in your browser. The first run downloads about 14 MB and is cached afterwards.</p>}

      <div role="status" aria-live="polite" data-testid="practice-summary" className="min-h-6 text-sm font-medium">{summary}</div>

      {end?.kind === "load-failed" && (
        <div role="alert" className="rounded-xl border border-border bg-surface-2 p-3 text-sm">
          <p className="font-medium text-danger">{end.message}</p>
          <button type="button" onClick={() => void run()} className="mt-2 inline-flex min-h-11 items-center rounded-lg border border-border px-3 text-sm font-medium hover:bg-surface">Try again</button>
        </div>
      )}
      {end?.kind === "setup-error" && (
        <div role="alert" data-testid="practice-alert" className="rounded-xl border border-border bg-surface-2 p-3 text-sm">
          <p className="font-medium text-danger">Your code could not be loaded</p>
          <pre className="mt-1 overflow-x-auto whitespace-pre-wrap font-mono text-xs">{end.message}</pre>
        </div>
      )}

      {outcomes && end?.kind !== "setup-error" && end?.kind !== "load-failed" && (
        <div className="relative overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[30rem] text-left text-sm">
            <caption className="sr-only">Test results</caption>
            <thead className="bg-surface-2">
              <tr>
                <th scope="col" className="px-3 py-2">Test</th>
                <th scope="col" className="px-3 py-2">Result</th>
                <th scope="col" className="px-3 py-2">Input</th>
                <th scope="col" className="px-3 py-2">Expected</th>
                <th scope="col" className="px-3 py-2">Got</th>
              </tr>
            </thead>
            <tbody>
              {vectors.map((v, i) => {
                const o = outcomes[i]!;
                // Hidden-test style: the first failing test is always shown in full; passing and skipped rows stay short.
                const detail = o.status !== "skipped" && (o.status !== "pass" || i < 2);
                return (
                  <tr key={v.name} className="border-t border-border align-top">
                    <th scope="row" className="px-3 py-2 font-medium">{v.name}</th>
                    <td className={`px-3 py-2 font-medium ${STATUS_CLASS[o.status]}`}>
                      <span aria-hidden="true">{STATUS_MARK[o.status]} </span>
                      {STATUS_LABEL[o.status]}
                      {o.ms !== undefined && <span className="ml-1 text-xs font-normal text-muted">{Math.round(o.ms)} ms</span>}
                    </td>
                    <td className="px-3 py-2 font-mono text-xs">{detail ? previewValue(v.args.length === 1 ? v.args[0] : v.args) : ""}</td>
                    <td className="px-3 py-2 font-mono text-xs">{detail ? previewValue(v.expected) : ""}</td>
                    <td className="px-3 py-2 font-mono text-xs">{o.status === "error" || o.status === "timeout" ? <span className="whitespace-pre-wrap text-danger">{o.message}</span> : o.got !== undefined ? previewValue(o.got) : ""}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {failedIndex >= 0 && outcomes?.[failedIndex]?.status === "fail" && <p className="text-sm text-muted">Compare “Expected” and “Got” for {vectors[failedIndex]!.name}. A boolean result counts as 0 or 1.</p>}

      {consoleText && (
        <details className="rounded-xl border border-border">
          <summary className="min-h-11 cursor-pointer px-3 py-2 text-sm font-medium">Console output</summary>
          <pre className="overflow-x-auto whitespace-pre-wrap border-t border-border p-3 font-mono text-xs">{consoleText}</pre>
        </details>
      )}
      <p className="text-sm text-muted">
        Stuck? See reference solutions in four languages on the <Link href={`/algorithms/${id}`} className="font-medium text-accent underline">{title} page</Link>.
      </p>
    </section>
  );
}
