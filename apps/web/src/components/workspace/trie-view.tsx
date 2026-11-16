import type { ExecutionStep, Highlight, HighlightRole } from "@algovision/trace-schema";
import { describeTrie } from "@/lib/describe";
import { layoutTrie, TR } from "@/lib/trie-layout";
import { ROLE_PRIORITY } from "@/lib/linked-list-layout";

function roleFor(highlights: readonly Highlight[], id: string): { role: HighlightRole | "none"; label?: string } {
  const mine = highlights.filter((h) => h.target.kind === "node" && h.target.id === id);
  mine.sort((a, b) => ROLE_PRIORITY.indexOf(a.role) - ROLE_PRIORITY.indexOf(b.role));
  const label = mine.find((h) => h.label)?.label;
  return { role: mine[0]?.role ?? "none", ...(label ? { label } : {}) };
}

export function TrieView({ step }: { step: ExecutionStep<"trie"> }) {
  const { state } = step;
  const layout = layoutTrie(state);
  const description = describeTrie(state);
  const changed = new Set(step.changed.flatMap((c) => (c.kind === "node" ? [c.id] : [])));
  const tracked = state.nodes.some((n) => n.count > 0);
  const letters = [...state.word];

  return (
    <div className="space-y-3">
      <section aria-labelledby="word-heading" className="rounded-xl border border-border bg-surface p-3">
        <h2 id="word-heading" className="mb-2 text-sm font-bold">
          Suffix being inserted
        </h2>
        {state.position === null ? (
          <p className="text-sm text-muted" data-testid="trie-word-empty">
            None right now
          </p>
        ) : (
          <p className="flex flex-wrap gap-1 font-mono text-base" data-testid="trie-word" aria-label={`${state.word}, ${state.position} of ${letters.length} letters done`}>
            {letters.map((ch, i) => (
              <span
                key={`${i}-${ch}`}
                data-state={i < state.position! ? "done" : i === state.position ? "next" : "todo"}
                className={`inline-flex h-8 w-8 items-center justify-center rounded border font-bold ${i < state.position! ? "border-border bg-surface-2 text-muted" : i === state.position ? "border-text bg-surface-2" : "border-border"}`}
              >
                {ch}
              </span>
            ))}
          </p>
        )}
      </section>

      <div className="overflow-x-auto rounded-xl border border-border bg-surface" data-testid="viz-scroll">
        <svg
          role="img"
          aria-label={`Trie. ${description}`}
          viewBox={`0 0 ${layout.width} ${layout.height + 16}`}
          width={layout.width}
          height={layout.height + 16}
          className="mx-auto block max-w-none"
          style={{ minWidth: layout.width }}
        >
          {layout.edges.map((e) => (
            <line key={`${e.from}>${e.to}`} x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2} stroke="var(--text)" strokeWidth={1.5} data-edge={`${e.from}>${e.to}`} />
          ))}
          {layout.nodes.map((n) => {
            const r = roleFor(step.highlights, n.id);
            const fill = r.role === "none" ? "var(--surface-2)" : `var(--role-${r.role}-fill)`;
            const stroke = r.role === "none" ? "var(--border)" : `var(--role-${r.role}-stroke)`;
            const strong = r.role === "active" || r.role === "found";
            return (
              <g key={n.id} data-node-id={n.id} data-role={r.role} data-changed={changed.has(n.id) ? "true" : undefined}>
                <circle cx={n.x} cy={n.y} r={TR} fill={fill} stroke={stroke} strokeWidth={strong ? 3 : 1.5} strokeDasharray={r.role === "pointer" ? "4 3" : undefined} />
                {n.depth === 0 ? (
                  <text x={n.x} y={n.y} textAnchor="middle" dominantBaseline="central" fontSize={9} fontWeight={700} fill="var(--text)">
                    root
                  </text>
                ) : (
                  tracked && (
                    <text x={n.x} y={n.y} textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={700} fill="var(--text)" data-testid="trie-count">
                      {n.count}
                    </text>
                  )
                )}
                {r.label && n.depth > 0 && (
                  <text x={n.x} y={n.y + TR + 9} textAnchor="middle" fontSize={10} fontWeight={700} fill="var(--text)">
                    {r.label}
                  </text>
                )}
              </g>
            );
          })}
          {layout.edges.map((e) => (
            <g key={`l-${e.from}>${e.to}`} data-edge-letter={e.letter}>
              <rect x={e.lx - 7} y={e.ly - 8} width={14} height={16} rx={3} fill="var(--surface)" stroke="var(--border)" />
              <text x={e.lx} y={e.ly} textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={700} fill="var(--text)">
                {e.letter}
              </text>
            </g>
          ))}
        </svg>
      </div>
      <p aria-hidden="true" className="break-words font-mono text-sm text-muted" data-testid="state-text">
        {description}
      </p>
    </div>
  );
}
