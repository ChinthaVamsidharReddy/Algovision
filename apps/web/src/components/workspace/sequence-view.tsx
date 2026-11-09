import type { ExecutionStep, Highlight, HighlightRole } from "@algovision/trace-schema";
import { describeQueue, describeStack } from "@/lib/describe";
import { ROLE_PRIORITY } from "@/lib/linked-list-layout";

const CELL_W = 64;
const CELL_H = 44;
const GAP = 6;
const PAD = 20;

function roleAt(highlights: readonly Highlight[], index: number): { role: HighlightRole | "none"; label?: string } {
  const mine = highlights.filter((h) => h.target.kind === "index" && h.target.index === index);
  mine.sort((a, b) => ROLE_PRIORITY.indexOf(a.role) - ROLE_PRIORITY.indexOf(b.role));
  const label = mine.find((h) => h.label)?.label;
  return { role: mine[0]?.role ?? "none", ...(label ? { label } : {}) };
}

function Cell({ x, y, value, index, role, changed }: { x: number; y: number; value: number; index: number; role: HighlightRole | "none"; changed: boolean }) {
  const fill = role === "none" ? "var(--surface-2)" : `var(--role-${role}-fill)`;
  const stroke = role === "none" ? "var(--border)" : `var(--role-${role}-stroke)`;
  return (
    <g className="viz-node" style={{ transform: `translate(${x}px, ${y}px)` }} data-cell-index={index} data-role={role} data-changed={changed ? "true" : undefined}>
      <rect width={CELL_W} height={CELL_H} rx={8} fill={fill} stroke={stroke} strokeWidth={role === "created" || role === "active" ? 3 : 1.5} strokeDasharray={role === "pointer" ? "6 4" : undefined} />
      <text x={CELL_W / 2} y={CELL_H / 2} textAnchor="middle" dominantBaseline="central" fontSize={18} fontWeight={700} fill="var(--text)">
        {value}
      </text>
    </g>
  );
}

const changedIndexes = (step: { changed: readonly { kind: string; index?: number }[] }) =>
  new Set(step.changed.flatMap((c) => (c.kind === "index" && c.index !== undefined ? [c.index] : [])));

/** Vertical: bottom at the bottom, top at the top, so "push" and "pop" move the same way the words do. */
export function StackView({ step }: { step: ExecutionStep<"stack"> }) {
  const items = step.state.items;
  const description = describeStack(step.state);
  const changed = changedIndexes(step);
  const height = Math.max(items.length, 1) * (CELL_H + GAP) + 2 * PAD + 8;
  const width = CELL_W + 2 * PAD + 70;
  const yOf = (i: number) => height - PAD - (i + 1) * (CELL_H + GAP) + GAP;

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto rounded-xl border border-border bg-surface" data-testid="viz-scroll">
        <svg role="img" aria-label={`Stack. ${description}`} viewBox={`0 0 ${width} ${height}`} width={width} height={height} className="mx-auto block max-w-none">
          <line x1={PAD - 6} y1={PAD} x2={PAD - 6} y2={height - PAD + 4} stroke="var(--text)" strokeWidth={3} />
          <line x1={PAD - 6} y1={height - PAD + 4} x2={PAD + CELL_W + 6} y2={height - PAD + 4} stroke="var(--text)" strokeWidth={3} />
          <line x1={PAD + CELL_W + 6} y1={PAD} x2={PAD + CELL_W + 6} y2={height - PAD + 4} stroke="var(--text)" strokeWidth={3} />
          {items.map((value, i) => {
            const r = roleAt(step.highlights, i);
            return (
              <g key={i}>
                <Cell x={PAD} y={yOf(i)} value={value} index={i} role={r.role} changed={changed.has(i)} />
                {r.label && (
                  <text x={PAD + CELL_W + 16} y={yOf(i) + CELL_H / 2} dominantBaseline="central" fontSize={13} fontWeight={700} fill="var(--text)">
                    ◀ {r.label}
                  </text>
                )}
              </g>
            );
          })}
          {items.length === 0 && (
            <text x={PAD + CELL_W / 2} y={height / 2} textAnchor="middle" fontSize={14} fill="var(--muted)">
              empty
            </text>
          )}
        </svg>
      </div>
      <p aria-hidden="true" className="break-words font-mono text-sm text-muted" data-testid="state-text">
        {description}
      </p>
    </div>
  );
}

/** Horizontal: front on the left (where items leave), rear on the right (where they join). */
export function QueueView({ step }: { step: ExecutionStep<"queue"> }) {
  const items = step.state.items;
  const description = describeQueue(step.state);
  const changed = changedIndexes(step);
  const width = Math.max(Math.max(items.length, 1) * (CELL_W + GAP) + 2 * PAD, 360);
  const height = CELL_H + 2 * PAD + 34;
  const y = PAD + 18;

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto rounded-xl border border-border bg-surface" data-testid="viz-scroll">
        <svg role="img" aria-label={`Queue. ${description}`} viewBox={`0 0 ${width} ${height}`} width={width} height={height} className="mx-auto block max-w-none" style={{ minWidth: width }}>
          {items.map((value, i) => {
            const r = roleAt(step.highlights, i);
            const x = PAD + i * (CELL_W + GAP);
            return (
              <g key={i}>
                <Cell x={x} y={y} value={value} index={i} role={r.role} changed={changed.has(i)} />
                {r.label && (
                  <text x={x + CELL_W / 2} y={y - 8} textAnchor="middle" fontSize={12} fontWeight={700} fill="var(--text)">
                    {r.label}
                  </text>
                )}
              </g>
            );
          })}
          <text x={PAD} y={y + CELL_H + 22} fontSize={12} fill="var(--muted)">
            ◀ leaves here (front)
          </text>
          <text x={width - PAD} y={y + CELL_H + 22} textAnchor="end" fontSize={12} fill="var(--muted)">
            joins here (rear) ▶
          </text>
          {items.length === 0 && (
            <text x={width / 2} y={y + CELL_H / 2} textAnchor="middle" dominantBaseline="central" fontSize={14} fill="var(--muted)">
              empty
            </text>
          )}
        </svg>
      </div>
      <p aria-hidden="true" className="break-words font-mono text-sm text-muted" data-testid="state-text">
        {description}
      </p>
    </div>
  );
}
