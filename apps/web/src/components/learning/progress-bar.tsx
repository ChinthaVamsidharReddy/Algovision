export function ProgressBar({ label, done, total, percent }: { label: string; done: number; total: number; percent: number }) {
  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted">
          {done} of {total} complete &middot; {percent}%
        </span>
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-valuetext={`${done} of ${total} complete`}
        className="h-2.5 w-full overflow-hidden rounded-full bg-surface-2"
      >
        <div className="h-full rounded-full bg-success" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
