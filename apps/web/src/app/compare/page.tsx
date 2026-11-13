import type { Metadata } from "next";
import { Suspense } from "react";
import { CompareView } from "@/components/compare/compare-view";
import { compareRows } from "@/lib/learning-data";

export const metadata: Metadata = { title: "Compare algorithms", description: "Put two algorithms side by side: cost, level and how long their example takes." };

export default function ComparePage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Compare algorithms</h1>
        <p className="max-w-3xl text-muted">Pick any two algorithms to see their cost, level and the length of their worked example side by side.</p>
      </div>
      <Suspense fallback={<p role="status" className="text-muted">Loading…</p>}>
        <CompareView rows={compareRows()} />
      </Suspense>
    </div>
  );
}
