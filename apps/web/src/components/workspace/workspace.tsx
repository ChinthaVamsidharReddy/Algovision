"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { LANGUAGES, getAlgorithm, resolveLimits, type LanguageId, type LimitProfile } from "@algovision/algorithms";
import type { ExecutionStep, ExecutionTrace } from "@algovision/trace-schema";
import { isPlaying } from "@algovision/viz-engine";
import { buildTrace, defaultTexts, type FieldErrors, type InputTexts } from "@/lib/build-trace";
import { parseUrlState, serializeUrlState } from "@/lib/url-state";
import { CodeView } from "./code-view";
import { Controls } from "./controls";
import { InputForm } from "./input-form";
import { LanguageTabs, PANEL_ID, tabId } from "./language-tabs";
import { ArrayView } from "./array-view";
import { GridView } from "./grid-view";
import { LinkedListView } from "./linked-list-view";
import { QueueView, StackView } from "./sequence-view";
import { GraphView } from "./graph-view";
import { TreeView } from "./tree-view";
import { ExplanationPanel, VariablesPanel } from "./panels";
import { usePlayback } from "./use-playback";
import { LearningActions } from "../learning/learning-actions";
import { QuizPanel } from "../learning/quiz-panel";

const ENV_PROFILE = process.env.NEXT_PUBLIC_VIZ_LIMIT_PROFILE;
const LANG_KEY = "av-language";

function isTypingTarget(t: EventTarget | null): boolean {
  if (!(t instanceof HTMLElement)) return false;
  return /^(INPUT|TEXTAREA|SELECT|BUTTON|A)$/.test(t.tagName) || t.getAttribute("role") === "tab" || t.isContentEditable;
}

export function Workspace({ algorithmId }: { algorithmId: string }) {
  const entry = getAlgorithm(algorithmId);
  if (!entry) throw new Error(`Unknown algorithm: ${algorithmId}`);
  return <WorkspaceInner key={algorithmId} algorithmId={algorithmId} />;
}

function WorkspaceInner({ algorithmId }: { algorithmId: string }) {
  const { content } = getAlgorithm(algorithmId)!;
  const params = useSearchParams();
  const pathname = usePathname();
  const inputNames = useMemo(() => content.meta.inputs.map((i) => i.name), [content]);
  const defaults = useMemo(() => defaultTexts(content), [content]);

  // Read the URL once; afterwards the URL follows the state, not the other way round.
  const [initial] = useState(() => parseUrlState(params, inputNames, ENV_PROFILE));
  const [limits, setLimits] = useState<LimitProfile>(initial.limits);
  const [language, setLanguage] = useState<LanguageId>(initial.language);

  const [boot] = useState(() => {
    const texts: InputTexts = { ...defaults, ...initial.inputs };
    const attempt = buildTrace(content, texts, initial.limits);
    if (attempt.ok) return { texts, trace: attempt.trace, errors: {} as FieldErrors, fatal: null as string | null };
    const fallback = buildTrace(content, defaults, initial.limits);
    return {
      texts: defaults as InputTexts,
      trace: fallback.ok ? fallback.trace : null,
      errors: attempt.kind === "input" ? attempt.errors : ({} as FieldErrors),
      fatal: attempt.kind === "trace" ? attempt.message : fallback.ok ? null : "The default example could not be built.",
    };
  });
  const [texts, setTexts] = useState<InputTexts>(boot.texts);
  const [trace, setTrace] = useState<ExecutionTrace | null>(boot.trace);
  const [fatal, setFatal] = useState<string | null>(boot.fatal);

  const total = trace?.steps.length ?? 1;
  const [playback, dispatch] = usePlayback(total, initial.speed, boot.trace ? Math.min(initial.step, total - 1) : 0);

  // Remember the language choice (best effort) when the URL does not specify one.
  useEffect(() => {
    if (params.get("lang")) return;
    try {
      const saved = localStorage.getItem(LANG_KEY);
      if (LANGUAGES.some((l) => l.id === saved)) setLanguage(saved as LanguageId);
    } catch {
      /* storage blocked */
    }
  }, []);
  const chooseLanguage = useCallback((id: LanguageId) => {
    setLanguage(id);
    try {
      localStorage.setItem(LANG_KEY, id);
    } catch {
      /* storage blocked */
    }
  }, []);

  // URL follows state (replaceState so Back does not step through every click).
  useEffect(() => {
    const qs = serializeUrlState({
      language,
      step: playback.index,
      speed: playback.speed,
      inputs: texts,
      isDefaultInput: inputNames.every((n) => (texts[n] ?? "").replace(/\s+/g, "") === (defaults[n] ?? "").replace(/\s+/g, "")),
      limitsId: limits.id,
      envLimitsId: resolveLimits(ENV_PROFILE).id,
    });
    const next = qs ? `${pathname}?${qs}` : pathname;
    if (`${window.location.pathname}${window.location.search}` !== next) window.history.replaceState(null, "", next);
  }, [language, playback.index, playback.speed, texts, inputNames, defaults, limits, pathname]);

  // Keyboard shortcuts (ignored while typing or when a control has focus).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey || isTypingTarget(e.target)) return;
      const map: Record<string, () => void> = {
        ArrowRight: () => dispatch({ type: "NEXT" }),
        ArrowLeft: () => dispatch({ type: "PREV" }),
        " ": () => dispatch({ type: "TOGGLE" }),
        Home: () => dispatch({ type: "JUMP", index: 0 }),
        End: () => dispatch({ type: "JUMP", index: Number.MAX_SAFE_INTEGER }),
        r: () => dispatch({ type: "RESET" }),
      };
      const action = map[e.key];
      if (action) {
        e.preventDefault();
        action();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [dispatch]);

  const apply = useCallback(
    (next: InputTexts): FieldErrors | null => {
      const result = buildTrace(content, next, limits);
      if (!result.ok) {
        if (result.kind === "input") return result.errors;
        setFatal(result.message);
        return null;
      }
      setFatal(null);
      setTexts(next);
      setTrace(result.trace);
      dispatch({ type: "LOAD", total: result.trace.steps.length });
      return null;
    },
    [content, limits, dispatch],
  );

  const reset = useCallback(() => {
    apply(defaults);
  }, [apply, defaults]);

  const retry = () => {
    setLimits(resolveLimits(limits.id));
    apply(texts);
  };

  const step: ExecutionStep | undefined = trace?.steps[Math.min(playback.index, total - 1)];
  const lang = LANGUAGES.find((l) => l.id === language)!;
  const file = content.code[language];
  const anchorId = step?.source.kind === "anchor" ? step.source.id : null;
  const ranges = anchorId ? (file.anchors[anchorId] ?? []) : [];
  const anchorLabel = content.meta.anchors.find((a) => a.id === anchorId)?.label ?? "";
  const anchorLabels = useMemo(() => Object.fromEntries(content.meta.anchors.map((a) => [a.id, a.label])), [content]);

  return (
    <div className="space-y-5">
      <header className="space-y-2">
        <p className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-wide text-muted">
          <span>{content.meta.category.replaceAll("-", " ")}</span>
          <span aria-hidden="true">&middot;</span>
          <span>{content.meta.difficulty}</span>
          {limits.id === "lite" && <span className="rounded bg-surface-2 px-1.5">lite mode</span>}
        </p>
        <h1 className="text-3xl font-bold tracking-tight">{content.meta.title}</h1>
        <p className="max-w-3xl text-muted">{content.meta.summary}</p>
        <p className="text-sm">
          Time <strong>{content.meta.complexity.time}</strong> &middot; Space <strong>{content.meta.complexity.space}</strong>
        </p>
        <LearningActions slug={algorithmId} title={content.meta.title} language={language} returnTo={pathname} />
      </header>

      {fatal && (
        <div role="alert" className="space-y-2 rounded-xl border border-danger bg-surface p-4">
          <p className="font-semibold text-danger">Could not build this visualization</p>
          <p>{fatal}</p>
          <button type="button" onClick={retry} className="min-h-11 rounded-lg bg-accent px-4 font-semibold text-accent-fg">
            Try again
          </button>
        </div>
      )}

      <InputForm specs={content.meta.inputs} texts={texts} limits={limits} maxItems={content.meta.stateKind === "linkedList" ? limits.maxListNodes : content.meta.stateKind === "graph" ? limits.maxArrayLength * 2 : content.meta.stateKind === "grid" ? limits.maxDpText : limits.maxArrayLength} externalErrors={boot.errors} onApply={apply} onReset={reset} />

      {step && trace && (
        <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <div className="min-w-0 space-y-4">
            {trace.stateKind === "linkedList" && <LinkedListView step={step as ExecutionStep<"linkedList">} />}
            {trace.stateKind === "array" && <ArrayView step={step as ExecutionStep<"array">} />}
            {trace.stateKind === "stack" && <StackView step={step as ExecutionStep<"stack">} />}
            {trace.stateKind === "queue" && <QueueView step={step as ExecutionStep<"queue">} />}
            {trace.stateKind === "tree" && <TreeView step={step as ExecutionStep<"tree">} />}
            {trace.stateKind === "graph" && <GraphView step={step as ExecutionStep<"graph">} />}
            {trace.stateKind === "grid" && <GridView step={step as ExecutionStep<"grid">} />}
            <Controls state={playback} dispatch={dispatch} />
            <ExplanationPanel step={step} playback={playback} />
            <VariablesPanel step={step} />
          </div>
          <div className="min-w-0 space-y-3">
            <LanguageTabs value={language} onChange={chooseLanguage} />
            <div role="tabpanel" id={PANEL_ID} aria-labelledby={tabId(language)}>
              <CodeView file={file} language={lang} ranges={ranges} anchorLabel={anchorLabel} />
            </div>
            <p className="text-xs text-muted">
              Shortcuts: <kbd>←</kbd> <kbd>→</kbd> step, <kbd>Space</kbd> play/pause, <kbd>Home</kbd>/<kbd>End</kbd> jump, <kbd>R</kbd> reset.
              {isPlaying(playback) ? " Playing…" : ""}
            </p>
          </div>
        </div>
      )}

      {trace && <QuizPanel trace={trace} labels={anchorLabels} onJump={(index) => dispatch({ type: "JUMP", index })} />}
    </div>
  );
}

export function WorkspaceSkeleton() {
  return (
    <div role="status" aria-live="polite" className="space-y-4 py-8">
      <div className="h-9 w-2/3 animate-pulse rounded-lg bg-surface-2" />
      <div className="h-40 animate-pulse rounded-xl bg-surface-2" />
      <p className="text-muted">Loading visualization…</p>
    </div>
  );
}
