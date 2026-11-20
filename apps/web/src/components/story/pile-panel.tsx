"use client";

import { useMemo } from "react";
import type { ExecutionStep } from "@algovision/trace-schema";
import type { PileStory, PileTrace } from "@/lib/stories/types";
import { StoryShell, TONE } from "./story-panel";

const CELL = 48;
const PITCH = 56;
const MARKER = 42; // room for the pointer above the input strip
const STRIP_H = CELL + 6;
const GAP = 14;

/**
 * The story of a stack or a queue. Above, the input being read, with a pointer on the current item; below, the container:
 * a stack stands up (the top is the top) and a queue lies down (the front leaves on the left, new ones join on the right).
 */
export function PilePanel({ story, step, trace }: { story: PileStory; step: ExecutionStep<"stack" | "queue">; trace: PileTrace }) {
  const frame = useMemo(() => story.frame(step, trace), [story, step, trace]);
  const finished = step.index === trace.steps.length - 1;
  // Keep the container the same size for the whole run, so nothing jumps when items come and go.
  const slots = useMemo(() => Math.max(3, ...trace.steps.map((s) => s.state.items.length)), [trace]);
  const strip = frame.strip;
  const stripW = strip ? strip.items.length * PITCH : 0;
  const stack = story.shape === "stack";
  const boxW = stack ? CELL + 36 : slots * PITCH + 12;
  const boxH = stack ? slots * (CELL + 6) + 12 : CELL + 12;
  const width = Math.max(stripW, boxW + 90, 220);
  const stripY = MARKER;
  const boxY = (strip ? MARKER + STRIP_H + GAP + 16 : 4) + 18; // 18 = the container's caption
  const height = boxY + boxH + (stack ? 6 : 28);
  const boxX = (width - boxW) / 2;

  const scene = (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="absolute left-0 top-0" aria-hidden="true">
      {strip && (
        <g data-testid="story-strip">
          <text x={(width - stripW) / 2} y={12} fontSize={11} fontWeight={700} fill="var(--muted)">
            {strip.label}
          </text>
          {strip.items.map((it, i) => {
            const t = TONE[it.tone];
            const x = (width - stripW) / 2 + i * PITCH + (PITCH - CELL) / 2;
            return (
              <g key={i} data-tone={it.tone} data-testid="story-strip-cell">
                <rect x={x} y={stripY + 4} width={CELL} height={CELL - 6} rx={8} fill={t.fill} stroke={t.stroke} strokeWidth={it.tone === "plain" ? 1.5 : 3} strokeDasharray={it.tone === "dim" ? "5 3" : undefined} />
                <text x={x + CELL / 2} y={stripY + 4 + (CELL - 6) / 2} textAnchor="middle" dominantBaseline="central" fontSize={17} fontWeight={700} fill="var(--text)">
                  {it.text}
                </text>
              </g>
            );
          })}
          {strip.at !== undefined && strip.at >= 0 && strip.at < strip.items.length && (
            <text x={(width - stripW) / 2 + strip.at * PITCH + PITCH / 2} y={stripY} textAnchor="middle" fontSize={20} data-testid="story-pointer" data-at={strip.at}>
              👇
            </text>
          )}
        </g>
      )}
      <text x={boxX} y={boxY - 6} fontSize={11} fontWeight={700} fill="var(--muted)">
        {frame.pileName}
      </text>
      {stack ? (
        <>
          <path d={`M ${boxX} ${boxY} V ${boxY + boxH} H ${boxX + boxW} V ${boxY}`} fill="none" stroke="var(--text)" strokeWidth={3} />
          {frame.pile.map((it, i) => {
            const t = TONE[it.tone];
            const y = boxY + boxH - 6 - (i + 1) * (CELL + 6) + 6;
            return (
              <g key={i} data-testid="story-node" data-tone={it.tone} data-pos={i}>
                <rect x={boxX + 18} y={y} width={CELL} height={CELL} rx={8} fill={t.fill} stroke={t.stroke} strokeWidth={it.tone === "plain" ? 1.5 : 3} />
                <text x={boxX + 18 + CELL / 2} y={y + CELL / 2 + (it.sub ? 4 : 0)} textAnchor="middle" dominantBaseline="central" fontSize={18} fontWeight={700} fill="var(--text)">
                  {it.text}
                </text>
                {it.sub && (
                  <text x={boxX + 18 + CELL / 2} y={y + 9} textAnchor="middle" fontSize={9} fontWeight={600} fill="var(--text)">
                    {it.sub}
                  </text>
                )}
                {i === frame.pile.length - 1 && (
                  <text x={boxX + boxW + 8} y={y + CELL / 2} dominantBaseline="central" fontSize={12} fontWeight={700} fill="var(--text)">
                    ◀ top
                  </text>
                )}
              </g>
            );
          })}
        </>
      ) : (
        <>
          <path d={`M ${boxX} ${boxY} H ${boxX + boxW} M ${boxX} ${boxY + boxH} H ${boxX + boxW}`} fill="none" stroke="var(--text)" strokeWidth={3} />
          {frame.pile.map((it, i) => {
            const t = TONE[it.tone];
            const x = boxX + 6 + i * PITCH;
            return (
              <g key={i} data-testid="story-node" data-tone={it.tone} data-pos={i}>
                <rect x={x} y={boxY + 6} width={CELL} height={CELL} rx={8} fill={t.fill} stroke={t.stroke} strokeWidth={it.tone === "plain" ? 1.5 : 3} />
                <text x={x + CELL / 2} y={boxY + 6 + CELL / 2 + (it.sub ? 4 : 0)} textAnchor="middle" dominantBaseline="central" fontSize={18} fontWeight={700} fill="var(--text)">
                  {it.text}
                </text>
                {it.sub && (
                  <text x={x + CELL / 2} y={boxY + 15} textAnchor="middle" fontSize={9} fontWeight={600} fill="var(--text)">
                    {it.sub}
                  </text>
                )}
              </g>
            );
          })}
          {frame.pile.length > 0 && (
            <>
              {frame.pile.length > 1 && (
                <text x={boxX + 6 + CELL / 2} y={boxY + boxH + 16} textAnchor="middle" fontSize={12} fontWeight={700} fill="var(--text)">
                  front
                </text>
              )}
              <text x={boxX + 6 + (frame.pile.length - 1) * PITCH + CELL / 2} y={boxY + boxH + 16} textAnchor="middle" fontSize={12} fontWeight={700} fill="var(--text)">
                {frame.pile.length === 1 ? "front and back" : "back"}
              </text>
            </>
          )}
        </>
      )}
      {frame.pile.length === 0 && (
        <text x={width / 2} y={boxY + boxH / 2} textAnchor="middle" dominantBaseline="central" fontSize={14} fill="var(--muted)">
          empty
        </text>
      )}
    </svg>
  );
  return <StoryShell meta={story} content={frame} finished={finished} scene={{ width, height, children: scene }} />;
}
