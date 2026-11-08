import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GraphState } from "@algovision/trace-schema";
import { describeGraph } from "../src/lib/describe";
import { GR, GRAPH_SIZE, layoutGraph } from "../src/lib/graph-layout";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(""),
  usePathname: () => "/algorithms/bfs-traversal",
}));

import { Workspace } from "../src/components/workspace/workspace";

beforeEach(() => window.history.replaceState(null, "", "/"));

const stateOf = (n: number, edges: [number, number, number?][], extra: Partial<GraphState> = {}): GraphState => ({
  kind: "graph", directed: false,
  nodes: Array.from({ length: n }, (_, i) => ({ id: `g${i}`, value: i })),
  edges: edges.map(([a, b, w]) => ({ from: `g${a}`, to: `g${b}`, weight: w ?? null })),
  current: null, activeEdge: null, frontier: [], frontierName: "", visited: [], marks: {}, markName: "", output: [], ...extra,
});

describe("layoutGraph", () => {
  it("puts vertices on a circle inside the drawing and never on top of each other", () => {
    for (let n = 1; n <= 8; n++) {
      const { nodes } = layoutGraph(stateOf(n, []));
      expect(nodes).toHaveLength(n);
      for (const a of nodes) {
        expect(a.x).toBeGreaterThanOrEqual(GR);
        expect(a.x).toBeLessThanOrEqual(GRAPH_SIZE - GR);
        expect(a.y).toBeGreaterThanOrEqual(GR);
        expect(a.y).toBeLessThanOrEqual(GRAPH_SIZE - GR);
        for (const b of nodes) if (a !== b) expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThan(2 * GR + 4);
      }
    }
  });
  it("stops edges at the vertex borders and is deterministic", () => {
    const s = stateOf(3, [[0, 1], [1, 2]]);
    const l = layoutGraph(s);
    expect(l.edges).toHaveLength(2);
    const [a, b] = l.nodes;
    const e = l.edges[0]!;
    expect(Math.hypot(e.x1 - a!.x, e.y1 - a!.y)).toBeCloseTo(GR);
    expect(Math.hypot(e.x2 - b!.x, e.y2 - b!.y)).toBeCloseTo(GR);
    expect(layoutGraph(s)).toEqual(layoutGraph(s));
  });
});

describe("describeGraph", () => {
  it("lists edges, work list, marks and output in vertex numbers", () => {
    const s = stateOf(3, [[0, 1, 4], [1, 2, 3]], { current: "g1", activeEdge: { from: "g1", to: "g2" }, frontier: ["g2"], frontierName: "Queue", visited: ["g0", "g1"], marks: { g0: 0, g1: 4, g2: null }, markName: "Distance", output: [0] });
    expect(describeGraph(s)).toBe("undirected graph with 3 vertices; edges: 0–1 (4), 1–2 (3); current: 1; examining edge 1–2; queue: 2; visited: 0, 1; Distance: 0=0, 1=4, 2=–; output: [0]");
    expect(describeGraph({ ...s, directed: true, edges: [{ from: "g0", to: "g1", weight: null }] })).toContain("directed graph");
    expect(describeGraph(stateOf(0, []))).toBe("empty graph");
  });
});

describe("Workspace: bfs-traversal", () => {
  it("draws the graph, starts with an empty queue and fills the output in visit order", async () => {
    const user = userEvent.setup();
    const { container } = render(<Workspace algorithmId="bfs-traversal" />);
    expect(screen.getByRole("img", { name: /^Graph\./ })).toBeInTheDocument();
    expect(container.querySelectorAll("[data-node-id]")).toHaveLength(6);
    expect(container.querySelectorAll("[data-edge]")).toHaveLength(6);
    expect(screen.getByTestId("graph-output")).toHaveTextContent("[ ]");
    for (let i = 0; i < 4; i++) await user.click(screen.getByRole("button", { name: /Next/ }));
    expect(screen.getByTestId("graph-frontier")).not.toHaveTextContent("empty");
    fireEvent.keyDown(document.body, { key: "End" });
    expect(screen.getByTestId("graph-output")).toHaveTextContent("[0, 1, 2, 3, 4, 5]");
    expect(screen.getByTestId("graph-frontier")).toHaveTextContent("empty");
  });

  it("marks the vertex being processed and the edge being examined", async () => {
    const user = userEvent.setup();
    const { container } = render(<Workspace algorithmId="bfs-traversal" />);
    let sawEdge = false;
    for (let i = 0; i < 40; i++) {
      await user.click(screen.getByRole("button", { name: /Next/ }));
      if (container.querySelector('[data-edge][data-active="true"]')) { sawEdge = true; expect(container.querySelector('[data-role="active"]')).not.toBeNull(); break; }
    }
    expect(sawEdge).toBe(true);
  });

  it("accepts edges up to the limit and rejects bad ones with a message", async () => {
    const user = userEvent.setup();
    render(<Workspace algorithmId="bfs-traversal" />);
    const box = screen.getByLabelText("Edges");
    await user.clear(box);
    await user.type(box, "0,1,1,1");
    await user.click(screen.getByRole("button", { name: "Visualize" }));
    expect(await screen.findByText(/cannot join a vertex to itself/)).toBeInTheDocument();
    await user.clear(box);
    await user.type(box, Array.from({ length: 32 }, () => 0).join(","));
    await user.click(screen.getByRole("button", { name: "Visualize" }));
    expect(await screen.findByText(/at most 30 values/)).toBeInTheDocument();
  });

  it("has no axe violations", async () => {
    const user = userEvent.setup();
    const { container } = render(<Workspace algorithmId="bfs-traversal" />);
    expect((await axe.run(container, { rules: { "color-contrast": { enabled: false } } })).violations.map((v) => v.id)).toEqual([]);
    for (let i = 0; i < 8; i++) await user.click(screen.getByRole("button", { name: /Next/ }));
    expect((await axe.run(container, { rules: { "color-contrast": { enabled: false } } })).violations.map((v) => v.id)).toEqual([]);
  });
});

describe("Workspace: weighted and directed graphs", () => {
  it("dijkstra shows edge weights and a distance under every vertex", () => {
    const { container } = render(<Workspace algorithmId="dijkstra" />);
    expect(container.querySelectorAll("[data-edge] text")).toHaveLength(5);
    expect(container.querySelectorAll("[data-mark]")).toHaveLength(5);
    fireEvent.keyDown(document.body, { key: "End" });
    expect(screen.getByTestId("graph-output")).toHaveTextContent("[0, 3, 1, 8, -1]");
  });
  it("topological sort draws arrowheads and ends with a valid order", () => {
    const { container } = render(<Workspace algorithmId="topological-sort-kahn" />);
    expect(container.querySelectorAll("[data-edge] line[marker-end]")).toHaveLength(6);
    fireEvent.keyDown(document.body, { key: "End" });
    expect(screen.getByTestId("graph-output")).toHaveTextContent("[4, 5, 0, 2, 3, 1]");
  });
  it("union-find has no work-list panel", () => {
    render(<Workspace algorithmId="union-find-components" />);
    expect(screen.queryByTestId("graph-frontier")).toBeNull();
  });
});
