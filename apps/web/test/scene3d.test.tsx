import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams(""), usePathname: () => "/algorithms/x" }));

import { resolveLimits, runAlgorithm } from "@algovision/algorithms";
import type { PileTrace } from "../src/lib/stories/types";
import { describeQueue, queueCast, SPACING } from "../src/lib/scene3d/queue-scene";
import { queueEnqueueDequeueStory } from "../src/lib/stories/queue-enqueue-dequeue";
import { Workspace } from "../src/components/workspace/workspace";

const traceOf = (input: unknown): PileTrace => {
  const r = runAlgorithm("queue-enqueue-dequeue", input, resolveLimits("standard"));
  if (!r.ok) throw new Error(JSON.stringify(r.errors));
  return r.trace as unknown as PileTrace;
};
const vectors = JSON.parse(readFileSync(resolve(process.cwd(), "../../packages/algorithms/content/queue-enqueue-dequeue/vectors.json"), "utf8")) as { name: string; input: unknown }[];

describe("queue scene (3D description)", () => {
  it("keeps every person's identity: arrivals join the back, the front person is served", () => {
    const t = traceOf({ values: [10, 20, 30], removes: 2 });
    const ids: string[] = [];
    for (const s of t.steps) {
      const d = describeQueue(s, t);
      const line = d.actors.filter((a) => a.kind === "person" && !a.exit).sort((a, b) => a.x - b.x);
      // people stand in the line in arrival order, one slot apart, starting at the counter
      line.forEach((a, i) => expect(a.x).toBeCloseTo(i * SPACING));
      expect(line.map((a) => a.label)).toEqual(s.state.items.map(String));
      ids.push(line.map((a) => a.id).join(","));
    }
    const last = describeQueue(t.steps[t.steps.length - 1]!, t);
    expect(last.actors.filter((a) => a.kind === "person" && !a.exit).map((a) => a.label)).toEqual(["30"]);
  });
  it("the served person walks away holding a ticket, and is the same figure who stood at the front", () => {
    const t = traceOf({ values: [7, 8], removes: 1 });
    const before = describeQueue(t.steps.find((s) => s.state.items.length === 2)!, t).actors.find((a) => a.x === 0 && a.kind === "person")!;
    const serve = t.steps.find((s) => s.source.kind === "anchor" && s.source.id === "dequeue")!;
    const d = describeQueue(serve, t);
    const gone = d.actors.find((a) => a.exit)!;
    expect(gone.id).toBe(before.id);
    expect(gone.holds).toBe("ticket");
    expect(d.actors.find((a) => a.kind === "clerk")!.holds).toBe("ticket");
    // the next person moved up to the front
    expect(d.actors.find((a) => a.kind === "person" && !a.exit)!.x).toBe(0);
  });
  it("a new arrival starts away from the line and has a stable id", () => {
    const t = traceOf({ values: [1, 2, 3], removes: 0 });
    const cast = queueCast(t, t.steps.length - 1);
    expect(cast.line.map((p) => p.id)).toEqual([1, 2, 3]);
    const enq = t.steps.filter((s) => s.source.kind === "anchor" && s.source.id === "enqueue");
    const d = describeQueue(enq[1]!, t);
    const newest = d.actors.find((a) => a.label === "2")!;
    expect(newest.from!.x).toBeGreaterThan(newest.x);
  });
  it("serving an empty line changes nobody", () => {
    const t = traceOf({ values: [], removes: 1 });
    for (const s of t.steps) expect(describeQueue(s, t).actors.filter((a) => a.kind === "person")).toHaveLength(0);
  });
  it("describes every step of every test vector without leaving anyone out of place", () => {
    for (const v of vectors) {
      const t = traceOf(v.input);
      for (const s of t.steps) {
        const d = describeQueue(s, t);
        const ids = d.actors.map((a) => a.id);
        expect(new Set(ids).size, `${v.name} step ${s.index}`).toBe(ids.length);
        expect(d.actors.filter((a) => a.kind === "person" && !a.exit).length, `${v.name} step ${s.index}`).toBe(s.state.items.length);
        expect(d.minX).toBeLessThan(d.maxX);
      }
    }
  });
  it("is registered on the queue story only (stack stays on the classic scene)", () => {
    expect(queueEnqueueDequeueStory.scene3d).toBe(describeQueue);
  });
});

describe("queue story without 3D support", () => {
  it("keeps the classic scene (jsdom has no WebGL)", () => {
    render(<Workspace algorithmId="queue-enqueue-dequeue" />);
    expect(screen.getByTestId("story")).toBeInTheDocument();
    expect(screen.queryByTestId("scene3d-canvas")).toBeNull();
    expect(screen.queryByTestId("story-view-toggle")).toBeNull();
  });
});
