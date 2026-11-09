import type { ExecutionStep, Highlight, HighlightRole } from "@algovision/trace-schema";
import { describeLinkedList } from "@/lib/describe";
import { LABEL_LINE, layoutLinkedList, NODE_H, NODE_W, PTR_W, ROLE_PRIORITY } from "@/lib/linked-list-layout";

type LinkedListStep = ExecutionStep<"linkedList">;

function roleFor(highlights: readonly Highlight[], id: string): { role: HighlightRole; label?: string } | null {
  const mine = highlights.filter((h) => h.target.kind === "node" && h.target.id === id);
  if (mine.length === 0) return null;
  mine.sort((a, b) => ROLE_PRIORITY.indexOf(a.role) - ROLE_PRIORITY.indexOf(b.role));
  const labelled = mine.find((h) => h.label && h.label !== "head");
  return { role: mine[0]!.role, label: labelled?.label };
}

export function LinkedListView({ step }: { step: LinkedListStep }) {
  const nodeLabels = new Map<string, string>();
  for (const n of step.state.nodes) {
    const l = roleFor(step.highlights, n.id)?.label;
    if (l) nodeLabels.set(n.id, l);
  }
  const layout = layoutLinkedList(step.state, nodeLabels);
  const description = describeLinkedList(step.state);
  const changed = new Set(step.changed.flatMap((c) => (c.kind === "node" ? [c.id] : [])));

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto rounded-xl border border-border bg-surface" data-testid="viz-scroll">
        <svg
          role="img"
          aria-label={`Linked list. ${description}`}
          viewBox={`0 0 ${layout.width} ${layout.height}`}
          width={layout.width}
          height={layout.height}
          className="mx-auto block max-w-none"
          style={{ minWidth: layout.width }}
        >
          <defs>
            <marker id="arrowhead" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto" markerUnits="userSpaceOnUse">
              <path d="M0,0 L9,4.5 L0,9 Z" fill="var(--text)" />
            </marker>
          </defs>

          {layout.edges.map((e) => (
            <g key={`${e.from}>${e.to}`} className="viz-edge" style={{ transform: `translate(${e.x1}px, ${e.y1}px)` }} data-edge={`${e.from}>${e.to}`}>
              <line x1={0} y1={0} x2={e.x2 - e.x1} y2={e.y2 - e.y1} stroke="var(--text)" strokeWidth={2} markerEnd="url(#arrowhead)" />
              <circle cx={0} cy={0} r={3.5} fill="var(--text)" />
            </g>
          ))}

          {layout.nodes.map((n) => {
            const r = roleFor(step.highlights, n.id);
            const role = r?.role ?? "none";
            const fill = r ? `var(--role-${role}-fill)` : "var(--surface-2)";
            const stroke = r ? `var(--role-${role}-stroke)` : "var(--border)";
            const emphasised = role === "active" || role === "created" || role === "found";
            return (
              <g
                key={n.id}
                className="viz-node"
                style={{ transform: `translate(${n.x}px, ${n.y}px)` }}
                data-node-id={n.id}
                data-role={role}
                data-changed={changed.has(n.id) ? "true" : undefined}
              >
                <rect
                  width={NODE_W}
                  height={NODE_H}
                  rx={8}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={emphasised ? 3 : 1.5}
                  strokeDasharray={role === "pointer" ? "6 4" : undefined}
                />
                <line x1={NODE_W - PTR_W} y1={0} x2={NODE_W - PTR_W} y2={NODE_H} stroke={stroke} strokeWidth={1.5} />
                <text x={(NODE_W - PTR_W) / 2} y={NODE_H / 2} textAnchor="middle" dominantBaseline="central" fontSize={17} fontWeight={700} fill="var(--text)">
                  {n.value}
                </text>
                {n.isNull && (
                  <text x={NODE_W - PTR_W / 2} y={NODE_H / 2} textAnchor="middle" dominantBaseline="central" fontSize={15} fill="var(--muted)">
                    ∅
                  </text>
                )}
              </g>
            );
          })}

          {layout.pointers.map((p) =>
            p.side === "below" ? (
              <g key={p.name} className="viz-pointer" style={{ transform: `translate(${p.x}px, ${p.y}px)` }} data-pointer={p.name}>
                {!p.nullTarget && <line x1={0} y1={30} x2={0} y2={3} stroke="var(--text)" strokeWidth={2} markerEnd="url(#arrowhead)" />}
                <text x={0} y={p.nullTarget ? 22 : 46} textAnchor="middle" fontSize={14} fontWeight={700} fill="var(--text)">
                  {p.nullTarget ? "head → null" : "head"}
                </text>
              </g>
            ) : null,
          )}

          {layout.stacks.map((st) => (
            <g key={`${st.x}-${st.y}`} data-label-stack={`${st.x},${st.y}`}>
              {st.lines.map((l, k) => (
                <text
                  key={l.text}
                  x={st.x}
                  y={st.y - 10 - k * LABEL_LINE}
                  textAnchor="start"
                  fontSize={12}
                  fontWeight={l.pointer === null ? 600 : 700}
                  fill={l.nullTarget ? "var(--muted)" : "var(--text)"}
                  data-pointer={l.pointer ?? undefined}
                  data-line={k}
                >
                  {l.text}
                </text>
              ))}
            </g>
          ))}


          {layout.nodes.length === 0 && (
            <text x={layout.width / 2} y={layout.mainY + NODE_H / 2} textAnchor="middle" fontSize={15} fill="var(--muted)">
              The list is empty
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
