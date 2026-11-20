"use client";

import { useMemo } from "react";
import type { ExecutionStep } from "@algovision/trace-schema";
import { GR, layoutGraph } from "@/lib/graph-layout";
import type { GraphStory, GraphTrace } from "@/lib/stories/types";
import { StoryShell, TONE } from "./story-panel";

const ACTOR_H = 52; // emoji + name
const TOP = ACTOR_H + 4; // room above the highest vertex for a character
const SIDE = 30; // room left and right so characters and weights are not clipped

/**
 * The story of a graph. Vertices sit exactly where the normal graph view puts them (same circle, same edges, same weights);
 * a character stands above the vertex it is at, the edge being looked at is drawn thick, and small badges under vertices
 * carry what the story is counting (distance, cost, waiting).
 */
export function GraphPanel({ story, step, trace }: { story: GraphStory; step: ExecutionStep<"graph">; trace: GraphTrace }) {
  const frame = useMemo(() => story.frame(step, trace), [story, step, trace]);
  const finished = step.index === trace.steps.length - 1;
  const layout = useMemo(() => layoutGraph(step.state), [step.state]);
  const width = layout.size + SIDE * 2;
  const height = layout.size + TOP;
  const byId = new Map(layout.nodes.map((n) => [n.id, n]));
  const active = step.state.activeEdge;
  const standing = frame.actors.flatMap((a) => {
    const n = byId.get(a.node);
    return n ? [{ a, x: n.x + SIDE, y: n.y + TOP }] : [];
  });

  const scene = (
    <>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="absolute left-0 top-0" aria-hidden="true">
        <defs>
          <marker id="story-graph-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--text)" />
          </marker>
          <marker id="story-graph-arrow-active" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--role-active-stroke)" />
          </marker>
        </defs>
        {layout.edges.map((e) => {
          const on = active !== null && ((active.from === e.from && active.to === e.to) || (!step.state.directed && active.from === e.to && active.to === e.from));
          return (
            <g key={`${e.from}>${e.to}`} data-story-edge={`${e.from}>${e.to}`} data-story-active={on ? "true" : undefined}>
              <line x1={e.x1 + SIDE} y1={e.y1 + TOP} x2={e.x2 + SIDE} y2={e.y2 + TOP} stroke={on ? "var(--role-active-stroke)" : "var(--text)"} strokeWidth={on ? 4 : 2} markerEnd={step.state.directed ? (on ? "url(#story-graph-arrow-active)" : "url(#story-graph-arrow)") : undefined} />
              {e.weight !== null && (
                <text x={e.mx + SIDE} y={e.my + TOP - 4} textAnchor="middle" fontSize={12} fontWeight={700} fill="var(--text)" stroke="var(--surface)" strokeWidth={3} paintOrder="stroke">
                  {e.weight}
                </text>
              )}
            </g>
          );
        })}
        {layout.nodes.map((n) => {
          const tone = frame.tones[n.id] ?? "plain";
          const t = TONE[tone];
          const badge = frame.badges?.[n.id];
          return (
            <g key={n.id} data-story-node={n.id} data-tone={tone} data-testid="story-node">
              <circle cx={n.x + SIDE} cy={n.y + TOP} r={GR} fill={t.fill} stroke={t.stroke} strokeWidth={tone === "plain" ? 1.5 : 3} />
              <text x={n.x + SIDE} y={n.y + TOP} textAnchor="middle" dominantBaseline="central" fontSize={15} fontWeight={700} fill="var(--text)">
                {n.value}
              </text>
              {badge !== undefined && (
                <text x={n.x + SIDE} y={n.y + TOP + GR + 13} textAnchor="middle" fontSize={12} fontWeight={700} fill="var(--text)" stroke="var(--surface)" strokeWidth={3} paintOrder="stroke">
                  {badge}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      {standing.map(({ a, x, y }) => {
        const mates = standing.filter((s) => s.a.node === a.node);
        const shift = mates.length === 1 ? 0 : (mates.findIndex((m) => m.a === a) - (mates.length - 1) / 2) * 46;
        return (
          <div
            key={a.id}
            data-testid={`actor-${a.id}`}
            data-node={a.node}
            className="absolute text-center motion-safe:transition-[left,top] motion-safe:duration-500"
            style={{ left: x + shift, top: y - GR - ACTOR_H - 2, width: 60, transform: "translateX(-50%)" }}
          >
            <div className="text-3xl leading-none">{a.emoji}</div>
            <div className="mt-0.5 text-xs font-semibold">{a.name}</div>
          </div>
        );
      })}
    </>
  );
  return <StoryShell meta={story} content={frame} finished={finished} scene={{ width, height, children: scene }} />;
}
