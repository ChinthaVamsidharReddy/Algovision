/** A tiny picture that hints at the shape of data an algorithm works on. Decorative only. */
export function MiniVisual({ kind }: { kind: string }) {
  const stroke = "var(--role-compared-stroke)";
  const fill = "var(--role-compared-fill)";
  const hot = "var(--role-active-stroke)";
  const hotFill = "var(--role-active-fill)";
  const body = (() => {
    switch (kind) {
      case "linkedList":
        return [0, 1, 2].map((i) => (
          <g key={i} transform={`translate(${10 + i * 38} 18)`}>
            <rect width="26" height="22" rx="5" fill={i === 1 ? hotFill : fill} stroke={i === 1 ? hot : stroke} strokeWidth="2" />
            {i < 2 && <path d="M28 11h8m-3-3 3 3-3 3" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" />}
          </g>
        ));
      case "stack":
        return [0, 1, 2].map((i) => <rect key={i} x="32" y={40 - i * 13} width="56" height="10" rx="4" fill={i === 2 ? hotFill : fill} stroke={i === 2 ? hot : stroke} strokeWidth="2" />);
      case "queue":
        return [0, 1, 2, 3].map((i) => <rect key={i} x={8 + i * 28} y="18" width="22" height="22" rx="5" fill={i === 0 ? hotFill : fill} stroke={i === 0 ? hot : stroke} strokeWidth="2" />);
      case "tree":
      case "trie":
        return (
          <g stroke={stroke} strokeWidth="2" fill={fill}>
            <path d="M60 14 36 34M60 14l24 20M36 34 24 48M36 34l12 14" fill="none" />
            <circle cx="60" cy="12" r="7" fill={hotFill} stroke={hot} />
            <circle cx="36" cy="34" r="7" />
            <circle cx="84" cy="34" r="7" />
            <circle cx="24" cy="50" r="6" />
            <circle cx="48" cy="50" r="6" />
          </g>
        );
      case "graph":
        return (
          <g stroke={stroke} strokeWidth="2" fill={fill}>
            <path d="M24 16 60 30 96 14M60 30 40 50M60 30l34 22M24 16l16 34" fill="none" />
            <circle cx="24" cy="16" r="7" />
            <circle cx="60" cy="30" r="7" fill={hotFill} stroke={hot} />
            <circle cx="96" cy="14" r="7" />
            <circle cx="40" cy="50" r="7" />
            <circle cx="94" cy="52" r="7" />
          </g>
        );
      case "grid":
        return Array.from({ length: 9 }, (_, i) => <rect key={i} x={30 + (i % 3) * 20} y={10 + Math.floor(i / 3) * 18} width="17" height="15" rx="3" fill={i === 4 ? hotFill : fill} stroke={i === 4 ? hot : stroke} strokeWidth="1.5" />);
      default:
        return [22, 38, 28, 46, 32, 40].map((h, i) => <rect key={i} x={10 + i * 18} y={58 - h} width="13" height={h} rx="3" fill={i === 3 ? hotFill : fill} stroke={i === 3 ? hot : stroke} strokeWidth="2" />);
    }
  })();
  return (
    <svg viewBox="0 0 120 64" className="h-16 w-full" aria-hidden="true" focusable="false">
      {body}
    </svg>
  );
}
