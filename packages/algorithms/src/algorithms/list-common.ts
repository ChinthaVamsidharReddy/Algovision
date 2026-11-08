import { nodeRef, type Highlight, type HighlightRole, type LinkedListNode, type LinkedListState } from "@algovision/trace-schema";

/** A mutable singly linked list that produces trace states. Ids are n1, n2, ... in input order. */
export class ListModel {
  readonly nodes: LinkedListNode[];
  head: string | null;
  private nextId: number;

  constructor(values: readonly number[]) {
    this.nodes = values.map((value, i) => ({ id: `n${i + 1}`, value, next: i + 1 < values.length ? `n${i + 2}` : null }));
    this.head = this.nodes[0]?.id ?? null;
    this.nextId = values.length + 1;
  }

  node(id: string): LinkedListNode {
    const n = this.nodes.find((x) => x.id === id);
    if (!n) throw new Error(`no node ${id}`);
    return n;
  }

  value(id: string): number {
    return this.node(id).value;
  }

  next(id: string): string | null {
    return this.node(id).next;
  }

  create(value: number): string {
    const id = `n${this.nextId++}`;
    this.nodes.push({ id, value, next: null });
    return id;
  }

  remove(id: string): void {
    const i = this.nodes.findIndex((x) => x.id === id);
    if (i >= 0) this.nodes.splice(i, 1);
  }

  /** Values from the head to the end. */
  values(): number[] {
    const out: number[] = [];
    for (let id = this.head; id !== null; id = this.node(id).next) out.push(this.node(id).value);
    return out;
  }

  state(pointers: Record<string, string | null> = {}): LinkedListState {
    return { kind: "linkedList", nodes: this.nodes.map((n) => ({ ...n })), head: this.head, pointers: { ...pointers } };
  }
}

export const hl = (id: string, role: HighlightRole, label?: string): Highlight => ({ target: nodeRef(id), role, ...(label ? { label } : {}) });
export const fmtList = (values: readonly number[]): string => (values.length === 0 ? "an empty list" : values.join(" → ") + " → null");
export { nodeRef };
