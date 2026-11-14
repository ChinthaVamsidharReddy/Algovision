import type { ExecutionStep } from "@algovision/trace-schema";
import { describeArray } from "@/lib/describe";
import { CELL_H, CELL_W, layoutArray } from "@/lib/array-layout";

type ArrayStep = ExecutionStep<"array">;

export function ArrayView({ step }: { step: ArrayStep }) {
  const layout = layoutArray(step.state, step.highlights);
  const description = describeArray(step.state);
  const changed = new Set(step.changed.flatMap((c) => (c.kind === "index" ? [c.index] : [])));

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto rounded-xl border border-border bg-surface" data-testid="viz-scroll">
        <svg
          role="img"
          aria-label={`Array. ${description}`}
          viewBox={`0 0 ${layout.width} ${layout.height}`}
          width={layout.width}
          height={layout.height}
          className="mx-auto block max-w-none"
          style={{ minWidth: layout.width }}
        >
          {layout.cells.map((c) => {
            const fill = c.role === "none" ? "var(--surface-2)" : `var(--role-${c.role}-fill)`;
            const stroke = c.role === "none" ? "var(--border)" : `var(--role-${c.role}-stroke)`;
            const emphasised = c.role === "active" || c.role === "found" || c.role === "swapped" || c.role === "compared";
            return (
              <g
                key={c.index}
                className="viz-node"
                style={{ transform: `translate(${c.x}px, ${c.y}px)` }}
                data-cell-index={c.index}
                data-role={c.role}
                data-changed={changed.has(c.index) ? "true" : undefined}
              >
                <rect
                  width={CELL_W}
                  height={CELL_H}
                  rx={8}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={emphasised ? 3 : 1.5}
                  strokeDasharray={c.role === "pointer" ? "6 4" : undefined}
                />
                <text x={CELL_W / 2} y={CELL_H / 2} textAnchor="middle" dominantBaseline="central" fontSize={18} fontWeight={700} fill="var(--text)">
                  {c.text}
                </text>
                <text x={CELL_W / 2} y={CELL_H + 16} textAnchor="middle" fontSize={12} fill="var(--muted)">
                  {c.index}
                </text>
                {c.label && (
                  <text x={CELL_W / 2} y={-8} textAnchor="middle" fontSize={12} fontWeight={600} fill="var(--text)">
                    {c.label}
                  </text>
                )}
              </g>
            );
          })}

          {layout.pointers.map((p) =>
            p.names.map((name, row) => (
              <text
                key={`${p.index}-${name}`}
                x={p.x}
                y={34 + CELL_H + 32 + row * 16}
                textAnchor="middle"
                fontSize={13}
                fontWeight={700}
                fill="var(--text)"
                data-pointer={name}
              >
                {`▲ ${name}`}
              </text>
            )),
          )}

          {layout.cells.length === 0 && (
            <text x={layout.width / 2} y={34 + CELL_H / 2} textAnchor="middle" fontSize={15} fill="var(--muted)">
              The array is empty
            </text>
          )}
        </svg>
      </div>
      <p aria-hidden="true" className="break-words font-mono text-sm text-muted" data-testid="state-text">
        {description}
        {layout.detached.length > 0 ? `; out of range: ${layout.detached.join(", ")}` : ""}
      </p>
    </div>
  );
}
