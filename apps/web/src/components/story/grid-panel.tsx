"use client";

import { useMemo } from "react";
import type { ExecutionStep } from "@algovision/trace-schema";
import { GRID_CELL, layoutGrid } from "@/lib/grid-layout";
import type { GridStory, GridTrace } from "@/lib/stories/types";
import { StoryShell, TONE } from "./story-panel";

/**
 * The story of a table or map. Cells sit exactly where the normal grid view puts them (same headers, same order); each is coloured by
 * what the story says about it, may show a picture or a caption instead of the bare number, and a character stands on the cell it is at.
 */
export function GridPanel({ story, step, trace }: { story: GridStory; step: ExecutionStep<"grid">; trace: GridTrace }) {
  const frame = useMemo(() => story.frame(step, trace), [story, step, trace]);
  const finished = step.index === trace.steps.length - 1;
  const layout = useMemo(() => layoutGrid(step.state, []), [step.state]);
  const width = Math.max(layout.width, 140);
  const at = new Map(layout.cells.map((c) => [String(c.index), c]));
  const standing = frame.actors.flatMap((a) => {
    const c = at.get(a.node);
    return c ? [{ a, c }] : [];
  });

  const scene = (
    <svg width={width} height={layout.height} viewBox={`0 0 ${width} ${layout.height}`} className="absolute left-0 top-0" aria-hidden="true">
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
        const tone = frame.tones[String(c.index)] ?? "plain";
        const t = TONE[tone];
        const over = frame.cells?.[String(c.index)];
        const text = over?.text ?? c.text;
        return (
          <g key={c.index} data-story-node={c.index} data-tone={tone} data-testid="story-node" style={{ transform: `translate(${c.x}px, ${c.y}px)` }}>
            <rect width={GRID_CELL} height={GRID_CELL} rx={6} fill={t.fill} stroke={t.stroke} strokeWidth={tone === "plain" ? 1.5 : 3} strokeDasharray={tone === "dim" ? "5 3" : undefined} />
            <text x={GRID_CELL / 2} y={GRID_CELL / 2 + (over?.sub ? 4 : 0)} textAnchor="middle" dominantBaseline="central" fontSize={/^\d+$/.test(text) || text === "" ? 17 : 22} fontWeight={700} fill="var(--text)">
              {text}
            </text>
            {over?.sub && (
              <text x={GRID_CELL / 2} y={10} textAnchor="middle" fontSize={9} fontWeight={600} fill="var(--text)">
                {over.sub}
              </text>
            )}
          </g>
        );
      })}
      {standing.map(({ a, c }) => {
        const mates = standing.filter((s) => s.a.node === a.node);
        const slot = mates.findIndex((m) => m.a === a);
        return (
          <text
            key={a.id}
            data-testid={`actor-${a.id}`}
            data-node={a.node}
            x={c.x + GRID_CELL - 2 - slot * 18}
            y={c.y + 6}
            textAnchor="end"
            fontSize={20}
            className="motion-safe:transition-[x,y] motion-safe:duration-500"
          >
            {a.emoji}
            <title>{a.name}</title>
          </text>
        );
      })}
    </svg>
  );
  return <StoryShell meta={story} content={frame} finished={finished} scene={{ width, height: layout.height, children: scene }} />;
}
