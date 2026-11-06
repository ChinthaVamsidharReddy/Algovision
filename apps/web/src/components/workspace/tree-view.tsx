import type { ExecutionStep, Highlight, HighlightRole } from "@algovision/trace-schema";
import { describeTree } from "@/lib/describe";
import { layoutTree, R } from "@/lib/tree-layout";
import { ROLE_PRIORITY } from "@/lib/linked-list-layout";

function roleFor(highlights: readonly Highlight[], id: string): { role: HighlightRole | "none"; label?: string } {
  const mine = highlights.filter((h) => h.target.kind === "node" && h.target.id === id);
  mine.sort((a, b) => ROLE_PRIORITY.indexOf(a.role) - ROLE_PRIORITY.indexOf(b.role));
  const label = mine.find((h) => h.label)?.label;
  return { role: mine[0]?.role ?? "none", ...(label ? { label } : {}) };
}

export function TreeView({ step }: { step: ExecutionStep<"tree"> }) {
  const { state } = step;
  const layout = layoutTree(state);
  const description = describeTree(state);
  const changed = new Set(step.changed.flatMap((c) => (c.kind === "node" ? [c.id] : [])));
  const valueOf = new Map(state.nodes.map((n) => [n.id, n.value]));
  const frames = [...state.callStack].reverse(); // innermost call first, like a real call stack
  const labelY = (y: number) => y - R - 6;

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-xl border border-border bg-surface" data-testid="viz-scroll">
        <svg
          role="img"
          aria-label={`Binary tree. ${description}`}
          viewBox={`0 0 ${layout.width} ${layout.height + 16}`}
          width={layout.width}
          height={layout.height + 16}
          className="mx-auto block max-w-none"
          style={{ minWidth: layout.width }}
        >
          {layout.edges.map((e) => (
            <line key={`${e.from}>${e.to}`} x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2} stroke="var(--text)" strokeWidth={2} data-edge={`${e.from}>${e.to}`} />
          ))}
          {layout.nodes.map((n) => {
            const r = roleFor(step.highlights, n.id);
            const fill = r.role === "none" ? "var(--surface-2)" : `var(--role-${r.role}-fill)`;
            const stroke = r.role === "none" ? "var(--border)" : `var(--role-${r.role}-stroke)`;
            const strong = r.role === "active" || r.role === "found";
            return (
              <g key={n.id} data-node-id={n.id} data-role={r.role} data-changed={changed.has(n.id) ? "true" : undefined}>
                <circle cx={n.x} cy={n.y} r={R} fill={fill} stroke={stroke} strokeWidth={strong ? 3 : 1.5} strokeDasharray={r.role === "pointer" ? "5 3" : undefined} />
                <text x={n.x} y={n.y} textAnchor="middle" dominantBaseline="central" fontSize={16} fontWeight={700} fill="var(--text)">
                  {n.value}
                </text>
                {r.label && (
                  <text x={n.x} y={labelY(n.y)} textAnchor="middle" fontSize={11} fontWeight={700} fill="var(--text)">
                    {r.label}
                  </text>
                )}
              </g>
            );
          })}
          {layout.nodes.length === 0 && (
            <text x={layout.width / 2} y={layout.height / 2} textAnchor="middle" fontSize={15} fill="var(--muted)">
              The tree is empty
            </text>
          )}
        </svg>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <section aria-labelledby="callstack-heading" className="rounded-xl border border-border bg-surface p-3">
          <h2 id="callstack-heading" className="mb-2 text-sm font-bold">
            Call stack <span className="font-normal text-muted">(innermost first)</span>
          </h2>
          {frames.length === 0 ? (
            <p className="text-sm text-muted" data-testid="call-stack-empty">
              No active calls
            </p>
          ) : (
            <ol className="space-y-1 font-mono text-sm" data-testid="call-stack">
              {frames.map((id, i) => (
                <li key={`${frames.length - i}`} className={`rounded border px-2 py-0.5 ${i === 0 ? "border-border bg-surface-2 font-bold" : "border-transparent"}`}>
                  {id === null ? "visit(null)" : `visit(${valueOf.get(id)})`}
                </li>
              ))}
            </ol>
          )}
        </section>
        <section aria-labelledby="output-heading" className="rounded-xl border border-border bg-surface p-3">
          <h2 id="output-heading" className="mb-2 text-sm font-bold">
            Output so far
          </h2>
          <p className="break-words font-mono text-sm" data-testid="tree-output">
            {state.output.length === 0 ? "[ ]" : `[${state.output.join(", ")}]`}
          </p>
        </section>
      </div>
      <p aria-hidden="true" className="break-words font-mono text-sm text-muted" data-testid="state-text">
        {description}
      </p>
    </div>
  );
}
