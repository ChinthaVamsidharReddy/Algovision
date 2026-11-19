"use client";

import { useMemo } from "react";
import type { ExecutionStep } from "@algovision/trace-schema";
import { layoutLinkedList, NODE_H, NODE_W, PAD_X, PTR_W } from "@/lib/linked-list-layout";
import type { ChainFrame, ChainStory, LinkedListTrace } from "@/lib/stories/types";
import { StoryShell, TONE } from "./story-panel";

const ACTOR_H = 52; // emoji + name
const BAND = ACTOR_H + 12; // room above every row of nodes for the characters
const END_W = 96; // room to the right of the last node for characters standing at "null"

/**
 * The story of a chain of nodes (linked-list algorithms). The nodes sit exactly where the normal linked-list view puts
 * them (same layout, same links), so the story shows the real pointers; characters stand above the nodes they point at.
 */
export function ChainPanel({ story, step, trace }: { story: ChainStory; step: ExecutionStep<"linkedList">; trace: LinkedListTrace }) {
  const frame = useMemo(() => story.frame(step, trace), [story, step, trace]);
  const finished = step.index === trace.steps.length - 1;
  const layout = useMemo(() => layoutLinkedList({ ...step.state, pointers: {} }, new Map(), { minPadTop: BAND + 8, minRowGap: NODE_H + BAND + 8 }), [step.state]);
  const hasEnd = frame.actors.some((a) => a.node === "end");
  const width = layout.width + (hasEnd ? END_W : 0);
  const height = layout.height - 24;
  const byId = new Map(layout.nodes.map((n) => [n.id, n]));
  const endX = layout.width - PAD_X + 40;

  return <StoryShell meta={story} content={frame} finished={finished} scene={{ width, height, children: <ChainScene frame={frame} layout={layout} byId={byId} width={width} height={height} endX={endX} hasEnd={hasEnd} /> }} />;
}

function ChainScene({ frame, layout, byId, width, height, endX, hasEnd }: { frame: ChainFrame; layout: ReturnType<typeof layoutLinkedList>; byId: Map<string, { x: number; y: number }>; width: number; height: number; endX: number; hasEnd: boolean }) {
  const where = (node: string): { x: number; y: number } | null => {
    if (node === "end") return { x: endX, y: layout.mainY };
    const n = byId.get(node);
    return n ? { x: n.x + NODE_W / 2, y: n.y } : null;
  };
  const standing = frame.actors.flatMap((a) => {
    const at = where(a.node);
    return at ? [{ a, at }] : [];
  });
  const head = layout.pointers.find((p) => p.name === "head");

  return (
    <>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="absolute left-0 top-0" aria-hidden="true">
        <defs>
          <marker id="story-arrow" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto" markerUnits="userSpaceOnUse">
            <path d="M0,0 L9,4.5 L0,9 Z" fill="var(--text)" />
          </marker>
        </defs>
        {layout.edges.map((e) => (
          <g key={`${e.from}>${e.to}`} data-edge={`${e.from}>${e.to}`}>
            <line x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2} stroke="var(--text)" strokeWidth={2} markerEnd="url(#story-arrow)" />
            <circle cx={e.x1} cy={e.y1} r={3.5} fill="var(--text)" />
          </g>
        ))}
        {layout.nodes.map((n) => {
          const t = TONE[frame.tones[n.id] ?? "plain"];
          return (
            <g key={n.id} transform={`translate(${n.x}, ${n.y})`} data-story-node={n.id} data-tone={frame.tones[n.id] ?? "plain"} data-testid="story-node">
              <rect width={NODE_W} height={NODE_H} rx={8} fill={t.fill} stroke={t.stroke} strokeWidth={frame.tones[n.id] && frame.tones[n.id] !== "plain" ? 3 : 1.5} strokeDasharray={frame.tones[n.id] === "dim" ? "6 4" : undefined} />
              <line x1={NODE_W - PTR_W} y1={0} x2={NODE_W - PTR_W} y2={NODE_H} stroke={t.stroke} strokeWidth={1.5} />
              <text x={(NODE_W - PTR_W) / 2} y={NODE_H / 2} textAnchor="middle" dominantBaseline="central" fontSize={17} fontWeight={700} fill={t.text}>
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
        {head && !head.nullTarget && (
          <text x={head.x} y={head.y + 18} textAnchor="middle" fontSize={13} fontWeight={700} fill="var(--text)">
            head
          </text>
        )}
        {layout.nodes.length === 0 && (
          <text x={PAD_X + NODE_W / 2} y={layout.mainY + NODE_H / 2} textAnchor="middle" fontSize={14} fill="var(--muted)">
            empty
          </text>
        )}
        {hasEnd && (
          <g>
            <rect x={endX - 18} y={layout.mainY + 4} width={36} height={NODE_H - 8} rx={18} fill="none" stroke="var(--border)" strokeWidth={1.5} strokeDasharray="4 4" />
            <text x={endX} y={layout.mainY + NODE_H / 2} textAnchor="middle" dominantBaseline="central" fontSize={15} fill="var(--muted)">
              ∅
            </text>
          </g>
        )}
      </svg>
      {standing.map(({ a, at }) => {
        const mates = standing.filter((s) => s.a.node === a.node);
        const shift = mates.length === 1 ? 0 : (mates.findIndex((m) => m.a === a) - (mates.length - 1) / 2) * 46;
        return (
          <div
            key={a.id}
            data-testid={`actor-${a.id}`}
            data-node={a.node}
            className="absolute text-center motion-safe:transition-[left,top] motion-safe:duration-500"
            style={{ left: at.x + shift, top: at.y - ACTOR_H - 6, width: 60, transform: "translateX(-50%)" }}
          >
            <div className="text-3xl leading-none">{a.emoji}</div>
            <div className="mt-0.5 text-xs font-semibold">{a.name}</div>
          </div>
        );
      })}
    </>
  );
}
