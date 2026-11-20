"use client";

import { useMemo } from "react";
import type { ExecutionStep } from "@algovision/trace-schema";
import { layoutTree, R } from "@/lib/tree-layout";
import type { TreeStory, TreeTrace } from "@/lib/stories/types";
import { StoryShell, TONE } from "./story-panel";

const ACTOR_H = 52; // emoji + name
const TOP = ACTOR_H + 12; // room above the root for a character

/**
 * The story of a binary tree. The nodes sit exactly where the normal tree view puts them (same layout, same links);
 * characters stand above the node they are at, and nodes are coloured by what the story says about them.
 */
export function TreePanel({ story, step, trace }: { story: TreeStory; step: ExecutionStep<"tree">; trace: TreeTrace }) {
  const frame = useMemo(() => story.frame(step, trace), [story, step, trace]);
  const finished = step.index === trace.steps.length - 1;
  const layout = useMemo(() => layoutTree(step.state), [step.state]);
  const width = Math.max(layout.width, 140);
  const height = layout.height + TOP;
  const byId = new Map(layout.nodes.map((n) => [n.id, n]));
  const standing = frame.actors.flatMap((a) => {
    const n = byId.get(a.node);
    return n ? [{ a, x: n.x, y: n.y + TOP }] : [];
  });

  const scene = (
    <>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="absolute left-0 top-0" aria-hidden="true">
        {layout.edges.map((e) => (
          <line key={`${e.from}>${e.to}`} x1={e.x1} y1={e.y1 + TOP} x2={e.x2} y2={e.y2 + TOP} stroke="var(--text)" strokeWidth={2} data-story-edge={`${e.from}>${e.to}`} />
        ))}
        {layout.nodes.map((n) => {
          const tone = frame.tones[n.id] ?? "plain";
          const t = TONE[tone];
          return (
            <g key={n.id} data-story-node={n.id} data-tone={tone} data-testid="story-node">
              <circle cx={n.x} cy={n.y + TOP} r={R} fill={t.fill} stroke={t.stroke} strokeWidth={tone === "plain" ? 1.5 : 3} strokeDasharray={tone === "dim" ? "5 3" : undefined} />
              <text x={n.x} y={n.y + TOP} textAnchor="middle" dominantBaseline="central" fontSize={16} fontWeight={700} fill="var(--text)">
                {n.value}
              </text>
            </g>
          );
        })}
        {layout.nodes.length === 0 && (
          <text x={width / 2} y={height / 2} textAnchor="middle" fontSize={15} fill="var(--muted)">
            Empty ground
          </text>
        )}
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
            style={{ left: x + shift, top: y - R - ACTOR_H - 2, width: 60, transform: "translateX(-50%)" }}
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
