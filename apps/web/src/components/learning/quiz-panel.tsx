"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { generateQuiz } from "@algovision/algorithms";
import type { ExecutionTrace } from "@algovision/trace-schema";

const QUESTIONS = 5;

/**
 * "Test yourself": predict-the-next-step questions generated from the trace on screen. Every answer is read from the trace,
 * so the quiz is always about the input the learner chose.
 */
export function QuizPanel({ trace, labels, onJump }: { trace: ExecutionTrace; labels: Readonly<Record<string, string>>; onJump: (index: number) => void }) {
  const [open, setOpen] = useState(false);
  const [round, setRound] = useState(1);
  const [at, setAt] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState(0);
  const groupId = useId();

  const questions = useMemo(() => (open ? generateQuiz(trace, labels, { seed: round, count: QUESTIONS }) : []), [open, trace, labels, round]);

  // A new input means new questions.
  useEffect(() => {
    setAt(0); setPicked(null); setChecked(false); setScore(0);
  }, [trace, round]);

  if (!open) {
    return (
      <section aria-labelledby={`${groupId}-title`} className="rounded-xl border border-border bg-surface p-5">
        <h2 id={`${groupId}-title`} className="text-lg font-semibold">Test yourself</h2>
        <p className="mb-3 text-muted">Answer a few questions about what happens next in this run. They use the input you chose above.</p>
        <button type="button" onClick={() => setOpen(true)} className="min-h-11 rounded-lg bg-accent px-5 font-semibold text-accent-fg">
          Start quiz
        </button>
      </section>
    );
  }

  const done = at >= questions.length;
  const q = questions[at];

  const check = () => {
    if (picked === null || !q) return;
    setChecked(true);
    if (picked === q.answer) setScore((s) => s + 1);
  };
  const next = () => {
    setAt((i) => i + 1);
    setPicked(null);
    setChecked(false);
  };

  return (
    <section aria-labelledby={`${groupId}-title`} className="space-y-4 rounded-xl border border-border bg-surface p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id={`${groupId}-title`} className="text-lg font-semibold">Test yourself</h2>
        {!done && q && <p className="text-sm text-muted" aria-live="polite">Question {at + 1} of {questions.length}</p>}
      </div>

      {questions.length === 0 && <p className="text-muted">This run is too short for questions. Try a longer input.</p>}

      {!done && q && (
        <fieldset className="space-y-3">
          <legend className="sr-only">{q.prompt}</legend>
          <p className="rounded-lg bg-surface-2 p-3 text-sm">
            <span className="font-medium">At step {q.step + 1}: </span>
            {q.context}
          </p>
          <p className="font-medium">{q.prompt}</p>
          <button type="button" onClick={() => onJump(q.step)} className="min-h-11 rounded-lg border border-border px-3 text-sm font-medium hover:bg-surface-2">
            Show me step {q.step + 1}
          </button>
          <div role="radiogroup" aria-label={q.prompt} className="grid gap-2 sm:grid-cols-2">
            {q.options.map((opt, i) => {
              const state = !checked ? "" : i === q.answer ? "border-success" : i === picked ? "border-danger" : "";
              return (
                <label key={`${q.id}-${i}`} className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 hover:bg-surface-2 ${state}`}>
                  <input type="radio" name={`${groupId}-${q.id}`} checked={picked === i} disabled={checked} onChange={() => setPicked(i)} />
                  <span>{opt}</span>
                </label>
              );
            })}
          </div>
          {!checked ? (
            <button type="button" onClick={check} disabled={picked === null} className="min-h-11 rounded-lg bg-accent px-5 font-semibold text-accent-fg disabled:opacity-50">
              Check answer
            </button>
          ) : (
            <div role="status" className="space-y-2">
              <p className={picked === q.answer ? "font-semibold text-success" : "font-semibold text-danger"}>
                {picked === q.answer ? "Correct." : `Not quite. The answer is ${q.options[q.answer]}.`}
              </p>
              <p className="text-sm text-muted">{q.explanation}</p>
              <div className="flex flex-wrap gap-2">
                {q.kind !== "result" && (
                  <button type="button" onClick={() => onJump(q.step + 1)} className="min-h-11 rounded-lg border border-border px-3 text-sm font-medium hover:bg-surface-2">
                    Show me step {q.step + 2}
                  </button>
                )}
                <button type="button" onClick={next} className="min-h-11 rounded-lg bg-accent px-5 font-semibold text-accent-fg">
                  {at + 1 === questions.length ? "See my score" : "Next question"}
                </button>
              </div>
            </div>
          )}
        </fieldset>
      )}

      {done && questions.length > 0 && (
        <div role="status" className="space-y-3">
          <p className="text-xl font-semibold">You got {score} of {questions.length}.</p>
          <p className="text-muted">{score === questions.length ? "Perfect. Try a different input, or the next algorithm on your path." : "Step through the run again and watch the variables, then try new questions."}</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setRound((r) => r + 1)} className="min-h-11 rounded-lg bg-accent px-5 font-semibold text-accent-fg">New questions</button>
            <button type="button" onClick={() => setOpen(false)} className="min-h-11 rounded-lg border border-border px-4 font-medium hover:bg-surface-2">Close</button>
          </div>
        </div>
      )}
    </section>
  );
}
