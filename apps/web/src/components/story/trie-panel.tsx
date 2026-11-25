"use client";

import { useMemo } from "react";
import type { ExecutionStep } from "@algovision/trace-schema";
import { layoutTrie, T_PAD, TR } from "@/lib/trie-layout";
import type { TrieStory, TrieTrace } from "@/lib/stories/types";
import { StoryShell, TONE } from "./story-panel";

const ACTOR_H = 52; // emoji + name
const TOP = ACTOR_H + 12; // room above the root for a character
const Y_SCALE = 1.55; // levels sit further apart than in the normal view, so a character on a node never covers its parent
const NODE_R = TR + 3; // story nodes are a little larger than the normal view so the letters read well
const CELL = 30;
const PITCH = 36;
const STRIP_TOP = 40; // room for the label and the pointer above the letter strip
const STRIP_H = CELL + 10;

/**
 * The story of a trie. The nodes sit exactly where the normal trie view puts them (same layout, same links); the letter on each edge is
 * written inside the node it leads to, a word end gets a double ring, and characters stand above the node they are at.
 * Above the tree, the letters being walked are shown with a pointer on the next one.
 */
export function TriePanel({ story, step, trace }: { story: TrieStory; step: ExecutionStep<"trie">; trace: TrieTrace }) {
  const frame = useMemo(() => story.frame(step, trace), [story, step, trace]);
  const finished = step.index === trace.steps.length - 1;
  const layout = useMemo(() => layoutTrie(step.state), [step.state]);
  const strip = frame.strip;
  const stripW = strip ? strip.items.length * PITCH : 0;
  const width = Math.max(layout.width + 20, stripW + 20, 180);
  const shift = (width - layout.width) / 2; // centre the tree in the scene
  const stripY = 0;
  const treeY = (strip ? STRIP_TOP + STRIP_H + 8 : 0) + TOP;
  const treeH = (layout.height - 2 * T_PAD) * Y_SCALE + 2 * T_PAD;
  const height = treeY + treeH + 22; // 22 = room for a badge under the lowest nodes
  const spread = (y: number) => T_PAD + (y - T_PAD) * Y_SCALE;
  const byId = new Map(layout.nodes.map((n) => [n.id, { ...n, y: spread(n.y) }]));
  const lines = layout.edges.flatMap((e) => {
    const p = byId.get(e.from);
    const c = byId.get(e.to);
    if (!p || !c) return [];
    const dx = c.x - p.x;
    const dy = c.y - p.y;
    const len = Math.hypot(dx, dy) || 1;
    const r = NODE_R;
    return [{ key: `${e.from}>${e.to}`, x1: p.x + (dx / len) * r, y1: p.y + (dy / len) * r, x2: c.x - (dx / len) * r, y2: c.y - (dy / len) * r }];
  });
  const standing = frame.actors.flatMap((a) => {
    const n = byId.get(a.node);
    return n ? [{ a, x: n.x + shift, y: n.y + treeY }] : [];
  });
  const stripX = (width - stripW) / 2;

  const scene = (
    <>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="absolute left-0 top-0" aria-hidden="true">
        {strip && (
          <g data-testid="story-strip">
            <text x={stripX} y={stripY + 12} fontSize={11} fontWeight={700} fill="var(--muted)">
              {strip.label}
            </text>
            {strip.items.map((it, i) => {
              const t = TONE[it.tone];
              const x = stripX + i * PITCH + (PITCH - CELL) / 2;
              return (
                <g key={i} data-tone={it.tone} data-testid="story-strip-cell">
                  <rect x={x} y={STRIP_TOP + 4} width={CELL} height={CELL + 2} rx={6} fill={t.fill} stroke={t.stroke} strokeWidth={it.tone === "plain" ? 1.5 : 3} strokeDasharray={it.tone === "dim" ? "5 3" : undefined} />
                  <text x={x + CELL / 2} y={STRIP_TOP + 4 + (CELL + 2) / 2} textAnchor="middle" dominantBaseline="central" fontSize={16} fontWeight={700} fill="var(--text)">
                    {it.text}
                  </text>
                </g>
              );
            })}
            {strip.at !== undefined && strip.at >= 0 && strip.at < strip.items.length && (
              <text x={stripX + strip.at * PITCH + PITCH / 2} y={STRIP_TOP - 2} textAnchor="middle" fontSize={20} data-testid="story-pointer" data-at={strip.at}>
                👇
              </text>
            )}
          </g>
        )}
        {lines.map((e) => (
          <g key={e.key} data-story-edge={e.key}>
            <line x1={e.x1 + shift} y1={e.y1 + treeY} x2={e.x2 + shift} y2={e.y2 + treeY} stroke="var(--text)" strokeWidth={2} />
          </g>
        ))}
        {[...byId.values()].map((n) => {
          const tone = frame.tones[n.id] ?? "plain";
          const t = TONE[tone];
          const cx = n.x + shift;
          const cy = n.y + treeY;
          const isRoot = n.depth === 0;
          return (
            <g key={n.id} data-story-node={n.id} data-tone={tone} data-end={n.end ? "true" : undefined} data-testid="story-node">
              <circle cx={cx} cy={cy} r={NODE_R} fill={t.fill} stroke={t.stroke} strokeWidth={tone === "plain" ? 1.5 : 3} strokeDasharray={tone === "dim" ? "5 3" : undefined} />
              {n.end && <circle cx={cx} cy={cy} r={NODE_R + 4} fill="none" stroke="var(--text)" strokeWidth={1.5} data-testid="story-word-end" />}
              <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" fontSize={isRoot ? 11 : 15} fontWeight={700} fill="var(--text)">
                {isRoot ? "root" : n.label}
              </text>
              {frame.badges?.[n.id] && (
                <text x={cx} y={cy + NODE_R + 14} textAnchor="middle" fontSize={11} fontWeight={700} fill="var(--muted)" data-testid="story-badge">
                  {frame.badges[n.id]}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      {standing.map(({ a, x, y }) => {
        const mates = standing.filter((s) => s.a.node === a.node);
        const off = mates.length === 1 ? 0 : (mates.findIndex((m) => m.a === a) - (mates.length - 1) / 2) * 46;
        return (
          <div
            key={a.id}
            data-testid={`actor-${a.id}`}
            data-node={a.node}
            className="absolute text-center motion-safe:transition-[left,top] motion-safe:duration-500"
            style={{ left: x + off, top: y - NODE_R - ACTOR_H - 2, width: 60, transform: "translateX(-50%)" }}
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
