import type { ExecutionStep } from "@algovision/trace-schema";
import { describeGrid } from "@/lib/describe";
import { GRID_CELL, layoutGrid } from "@/lib/grid-layout";

type GridStep = ExecutionStep<"grid">;

export function GridView({ step }: { step: GridStep }) {
  const layout = layoutGrid(step.state, step.highlights);
  const description = describeGrid(step.state);
  const changed = new Set(step.changed.flatMap((c) => (c.kind === "index" ? [c.index] : [])));
  return (
    <div className="space-y-2">
      <div className="overflow-x-auto rounded-xl border border-border bg-surface" data-testid="viz-scroll">
        <svg role="img" aria-label={`Grid. ${description}`} viewBox={`0 0 ${layout.width} ${layout.height}`} width={layout.width} height={layout.height} className="mx-auto block max-w-none" style={{ minWidth: layout.width }}>
          {layout.colHeaders.map((h, i) => (
            <text key={`c${i}`} x={h.x} y={30} textAnchor="middle" fontSize={13} fontWeight={700} fill="var(--muted)">
              {h.text}
            </text>
          ))}
          {layout.rowHeaders.map((h, i) => (
            <text key={`r${i}`} x={30} y={h.y} textAnchor="middle" dominantBaseline="central" fontSize={13} fontWeight={700} fill="var(--muted)">
              {h.text}
            </text>
          ))}
          {layout.cells.map((c) => {
            const fill = c.role === "none" ? "var(--surface-2)" : `var(--role-${c.role}-fill)`;
            const stroke = c.role === "none" ? "var(--border)" : `var(--role-${c.role}-stroke)`;
            const emphasised = c.role === "active" || c.role === "found" || c.role === "swapped" || c.role === "compared" || c.role === "created";
            return (
              <g key={c.index} className="viz-node" style={{ transform: `translate(${c.x}px, ${c.y}px)` }} data-cell-index={c.index} data-role={c.role} data-changed={changed.has(c.index) ? "true" : undefined}>
                <rect width={GRID_CELL} height={GRID_CELL} rx={6} fill={fill} stroke={stroke} strokeWidth={emphasised ? 3 : 1.5} strokeDasharray={c.role === "pointer" ? "5 3" : undefined} />
                <text x={GRID_CELL / 2} y={GRID_CELL / 2 + (c.label ? 4 : 0)} textAnchor="middle" dominantBaseline="central" fontSize={17} fontWeight={700} fill="var(--text)">
                  {c.text}
                </text>
                {c.label && (
                  <text x={GRID_CELL / 2} y={11} textAnchor="middle" fontSize={9} fontWeight={600} fill="var(--text)">
                    {c.label}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
      <p aria-hidden="true" className="break-words font-mono text-sm text-muted" data-testid="state-text">
        {description}
      </p>
    </div>
  );
}
