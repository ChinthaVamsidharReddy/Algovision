"use client";

import { useEffect, useState } from "react";
import { solvedIds } from "@/lib/practice/storage";

/** Shows a check next to practice links for problems this browser has solved. Renders nothing until storage has been read. */
export function SolvedMark({ id }: { id: string }) {
  const [on, setOn] = useState(false);
  useEffect(() => setOn(solvedIds([id]).has(id)), [id]);
  return on ? <span className="ml-2 text-xs font-medium text-success">✓ Solved</span> : null;
}
