import { z } from "zod";
import type { LinkedListNode, LinkedListState } from "@algovision/trace-schema";
import type { FieldError, InputResult } from "../input";
import type { LimitProfile } from "../limits";

export interface ListField {
  readonly name: string;
  /** Used in messages, e.g. "Position" gives "Position must be between 0 and 4." */
  readonly label: string;
  /** Inclusive range that depends on the list length; defaults to +/- maxAbsValue. */
  readonly range?: (length: number) => { readonly min: number; readonly max: number };
}

export interface ListSpec {
  readonly minLength?: number;
  readonly minLengthMessage?: string;
  readonly fields?: readonly ListField[];
}

/** Validates { values, ...integer fields } for a singly linked list with learner-friendly messages. */
export function parseListInput<T>(raw: unknown, limits: LimitProfile, spec: ListSpec): InputResult<T> {
  const max = limits.maxAbsValue;
  const whole = (what: string) =>
    z
      .number({ error: `${what} must be a whole number.` })
      .int(`${what} must be a whole number.`);
  const shape: Record<string, z.ZodType> = {
    values: z
      .array(whole("Each list value").min(-max, `Each list value must be between -${max} and ${max}.`).max(max, `Each list value must be between -${max} and ${max}.`), {
        error: "List values must be a list of numbers.",
      })
      .max(limits.maxListNodes, `The list can have at most ${limits.maxListNodes} nodes.`),
  };
  for (const f of spec.fields ?? []) shape[f.name] = whole(f.label);
  const parsed = z.strictObject(shape).safeParse(raw);
  if (!parsed.success) {
    const errors: FieldError[] = parsed.error.issues.map((issue) => ({ field: String(issue.path[0] ?? "input"), message: issue.message }));
    return { ok: false, errors };
  }
  const data = parsed.data as Record<string, number | number[]>;
  const values = data.values as number[];
  const errors: FieldError[] = [];
  if (spec.minLength !== undefined && values.length < spec.minLength) {
    errors.push({
      field: "values",
      message: spec.minLengthMessage ?? `Enter at least ${spec.minLength} node${spec.minLength === 1 ? "" : "s"}.`,
    });
  } else {
    for (const f of spec.fields ?? []) {
      const v = data[f.name] as number;
      const { min, max: hi } = f.range ? f.range(values.length) : { min: -max, max };
      if (v < min || v > hi) errors.push({ field: f.name, message: `${f.label} must be between ${min} and ${hi}.` });
    }
  }
  return errors.length > 0 ? { ok: false, errors } : { ok: true, value: data as unknown as T };
}

export const fmt = (values: readonly number[]): string => (values.length === 0 ? "empty" : `[${values.join(", ")}]`);

export function makeNodes(values: readonly number[]): LinkedListNode[] {
  return values.map((value, i) => ({ id: `n${i + 1}`, value, next: i + 1 < values.length ? `n${i + 2}` : null }));
}

/** Values from head to the end, following next pointers. */
export function walkValues(nodes: readonly LinkedListNode[], head: string | null): number[] {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const out: number[] = [];
  for (let id = head; id !== null; id = byId.get(id)!.next) out.push(byId.get(id)!.value);
  return out;
}

export const valueOf = (nodes: readonly LinkedListNode[], id: string | null): number | null =>
  id === null ? null : nodes.find((n) => n.id === id)!.value;

export const nextOf = (nodes: readonly LinkedListNode[], id: string): string | null => nodes.find((n) => n.id === id)!.next;

export function listState(nodes: readonly LinkedListNode[], head: string | null, pointers: Record<string, string | null>): LinkedListState {
  return { kind: "linkedList", nodes: nodes.map((n) => ({ ...n })), head, pointers };
}

/**
 * The web view lays out detached chains in `nodes` order, each starting at the left edge, so a
 * chain must be listed from its first node. Reorders so the head chain comes first and every other
 * chain is listed top-down. Pure presentation; node ids and links are unchanged.
 */
export function layoutOrder(nodes: readonly LinkedListNode[], head: string | null): LinkedListNode[] {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const out: LinkedListNode[] = [];
  const placed = new Set<string>();
  const walk = (start: string | null) => {
    for (let id = start; id !== null && !placed.has(id); id = byId.get(id)!.next) {
      placed.add(id);
      out.push(byId.get(id)!);
    }
  };
  walk(head);
  const pointedTo = new Set(nodes.flatMap((n) => (n.next === null ? [] : [n.next])));
  for (const n of nodes) if (!placed.has(n.id) && !pointedTo.has(n.id)) walk(n.id);
  for (const n of nodes) walk(n.id);
  return out;
}
