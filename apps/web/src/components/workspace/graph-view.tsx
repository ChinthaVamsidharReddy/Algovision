import type { ExecutionStep, Highlight, HighlightRole } from "@algovision/trace-schema";
import { describeGraph } from "@/lib/describe";
import { GR, layoutGraph } from "@/lib/graph-layout";
import { ROLE_PRIORITY } from "@/lib/linked-list-layout";

function roleFor(highlights: readonly Highlight[], id: string): { role: HighlightRole | "none"; label?: string } {
  const mine = highlights.filter((h) => h.target.kind === "node" && h.target.id === id);
  mine.sort((a, b) => ROLE_PRIORITY.indexOf(a.role) - ROLE_PRIORITY.indexOf(b.role));
  const label = mine.find((h) => h.label)?.label;
  return { role: mine[0]?.role ?? "none", ...(label ? { label } : {}) };
}

export function GraphView({ step }: { step: ExecutionStep<"graph"> }) {
  const { state } = step;
  const layout = layoutGraph(state);
  const description = describeGraph(state);
  const changed = new Set(step.changed.flatMap((c) => (c.kind === "node" ? [c.id] : [])));
  const visited = new Set(state.visited);
  const numberOf = new Map(state.nodes.map((n) => [n.id, n.value]));
  const active = state.activeEdge;
  const isActive = (from: string, to: string) => active !== null && ((active.from === from && active.to === to) || (!state.directed && active.from === to && active.to === from));

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-border bg-surface" data-testid="viz-scroll">
        <svg role="img" aria-label={`Graph. ${description}`} viewBox={`0 0 ${layout.size} ${layout.size}`} className="mx-auto block h-auto w-full max-w-[420px]">
          <defs>
            <marker id="graph-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--text)" />
            </marker>
            <marker id="graph-arrow-active" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--role-active-stroke)" />
            </marker>
          </defs>
          {layout.edges.map((e) => {
            const on = isActive(e.from, e.to);
            return (
              <g key={`${e.from}>${e.to}`} data-edge={`${e.from}>${e.to}`} data-active={on ? "true" : undefined}>
                <line x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2} stroke={on ? "var(--role-active-stroke)" : "var(--text)"} strokeWidth={on ? 4 : 2} markerEnd={state.directed ? (on ? "url(#graph-arrow-active)" : "url(#graph-arrow)") : undefined} />
                {e.weight !== null && (
                  <text x={e.mx} y={e.my - 4} textAnchor="middle" fontSize={12} fontWeight={700} fill="var(--text)" stroke="var(--surface)" strokeWidth={3} paintOrder="stroke">
                    {e.weight}
                  </text>
                )}
              </g>
            );
          })}
          {layout.nodes.map((n) => {
            const r = roleFor(step.highlights, n.id);
            const role: HighlightRole | "none" = r.role !== "none" ? r.role : state.current === n.id ? "active" : visited.has(n.id) ? "visited" : "none";
            const fill = role === "none" ? "var(--surface-2)" : `var(--role-${role}-fill)`;
            const stroke = role === "none" ? "var(--border)" : `var(--role-${role}-stroke)`;
            const strong = role === "active" || role === "found";
            const mark = state.marks[n.id];
            return (
              <g key={n.id} data-node-id={n.id} data-role={role} data-changed={changed.has(n.id) ? "true" : undefined}>
                <circle cx={n.x} cy={n.y} r={GR} fill={fill} stroke={stroke} strokeWidth={strong ? 3 : 1.5} strokeDasharray={role === "pointer" ? "5 3" : undefined} />
                <text x={n.x} y={n.y} textAnchor="middle" dominantBaseline="central" fontSize={15} fontWeight={700} fill="var(--text)">
                  {n.value}
                </text>
                {state.markName && (
                  <text x={n.x} y={n.y + GR + 12} textAnchor="middle" fontSize={11} fontWeight={700} fill="var(--text)" data-mark={n.id}>
                    {mark === null || mark === undefined ? "–" : mark}
                  </text>
                )}
                {r.label && (
                  <text x={n.x} y={n.y - GR - 5} textAnchor="middle" fontSize={11} fontWeight={700} fill="var(--text)">
                    {r.label}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
        {state.markName && <p className="px-3 pb-2 text-center text-xs text-muted">Numbers under each vertex: {state.markName}</p>}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {state.frontierName && (
          <section aria-labelledby="frontier-heading" className="rounded-xl border border-border bg-surface p-3">
            <h2 id="frontier-heading" className="mb-2 text-sm font-bold">{state.frontierName}</h2>
            <p className="break-words font-mono text-sm" data-testid="graph-frontier">
              {state.frontier.length === 0 ? "empty" : state.frontier.map((id) => numberOf.get(id)).join(", ")}
            </p>
          </section>
        )}
        <section aria-labelledby="graph-output-heading" className="rounded-xl border border-border bg-surface p-3">
          <h2 id="graph-output-heading" className="mb-2 text-sm font-bold">Output so far</h2>
          <p className="break-words font-mono text-sm" data-testid="graph-output">
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
