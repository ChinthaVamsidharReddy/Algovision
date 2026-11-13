import type { Metadata } from "next";
import { PathList } from "@/components/paths/path-list";
import { pathData } from "@/lib/learning-data";

export const metadata: Metadata = { title: "Learning paths", description: "Ordered paths through the algorithms, from first steps to interview-ready." };

export default function PathsPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Learning paths</h1>
        <p className="max-w-3xl text-muted">Not sure where to start? Each path puts algorithms in the order that makes them easiest to learn. Finish a step and it is ticked off for you when you are signed in.</p>
      </div>
      <PathList paths={pathData()} />
    </div>
  );
}
