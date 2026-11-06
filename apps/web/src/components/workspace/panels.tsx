import type { EventType, ExecutionStep } from "@algovision/trace-schema";
import { stepLabel, type PlaybackState } from "@algovision/viz-engine";

const EVENT_NAMES: Partial<Record<EventType, string>> = {
  init: "Start",
  insertNode: "Create node",
  link: "Link",
  unlink: "Unlink",
  movePointer: "Move pointer",
  compare: "Compare",
  swap: "Swap",
  assign: "Assign",
  visit: "Visit",
  found: "Found",
  call: "Call",
  return: "Return",
  push: "Push",
  pop: "Pop",
  peek: "Peek",
  enqueue: "Enqueue",
  dequeue: "Dequeue",
  underflow: "Underflow",
  overflow: "Overflow",
  notFound: "Not found",
  done: "Done",
};

export function ExplanationPanel({ step, playback }: { step: ExecutionStep; playback: PlaybackState }) {
  return (
    <section aria-labelledby="explain-heading" className="rounded-xl border border-border bg-surface p-4">
      <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1">
        <h2 id="explain-heading" className="text-base font-bold">
          {stepLabel(playback)}
        </h2>
        <span className="rounded-full bg-surface-2 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-muted">
          {EVENT_NAMES[step.event.type] ?? step.event.type}
        </span>
      </div>
      <p aria-live="polite" aria-atomic="true" className="text-base leading-relaxed" data-testid="explanation">
        {step.explanation}
      </p>
    </section>
  );
}

export function VariablesPanel({ step }: { step: ExecutionStep }) {
  return (
    <section aria-labelledby="vars-heading" className="rounded-xl border border-border bg-surface p-4">
      <h2 id="vars-heading" className="mb-2 text-base font-bold">
        Variables
      </h2>
      <table className="w-full text-sm">
        <thead className="sr-only">
          <tr>
            <th scope="col">Name</th>
            <th scope="col">Value</th>
            <th scope="col">Changed</th>
          </tr>
        </thead>
        <tbody>
          {step.variables.map((v) => (
            <tr key={v.name} className="border-t border-border first:border-t-0" data-changed={v.changed ? "true" : undefined}>
              <th scope="row" className="py-1.5 pr-3 text-left font-mono font-medium">
                {v.name}
              </th>
              <td className={`py-1.5 font-mono ${v.changed ? "font-bold" : ""}`}>{String(v.value)}</td>
              <td className="w-6 py-1.5 text-right">
                {v.changed && (
                  <>
                    <span aria-hidden="true" className="text-(--code-active-bar)">
                      ●
                    </span>
                    <span className="sr-only">changed</span>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
