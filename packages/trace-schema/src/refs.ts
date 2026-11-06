import { z } from "zod";

/** Points at one drawable element of a data structure: a cell by position or a node by stable id. */
export const ElementRefSchema = z.discriminatedUnion("kind", [
  z.strictObject({ kind: z.literal("index"), index: z.number().int().min(0) }),
  z.strictObject({ kind: z.literal("node"), id: z.string().min(1) }),
]);
export type ElementRef = z.infer<typeof ElementRefSchema>;

export const nodeRef = (id: string): ElementRef => ({ kind: "node", id });
export const indexRef = (index: number): ElementRef => ({ kind: "index", index });

export function refKey(ref: ElementRef): string {
  return ref.kind === "node" ? `node:${ref.id}` : `index:${ref.index}`;
}
