import { useId } from "react";

/** The AlgoMigo mark: three rising bars (an algorithm running) with a friendly highlight dot. */
export function Logo({ size = 32, className }: { size?: number; className?: string }) {
  const id = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" focusable="false" className={className}>
      <defs>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3445d6" />
          <stop offset="1" stopColor="#7c3aed" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill={`url(#${id}-g)`} />
      <rect x="14" y="34" width="10" height="16" rx="3" fill="#fff" opacity="0.7" />
      <rect x="27" y="26" width="10" height="24" rx="3" fill="#fff" opacity="0.85" />
      <rect x="40" y="18" width="10" height="32" rx="3" fill="#fff" />
      <circle cx="45" cy="11" r="3.5" fill="#fcd34d" />
    </svg>
  );
}
