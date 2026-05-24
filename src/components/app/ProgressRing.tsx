type Props = {
  pct: number;
  label: string;
  sub?: string;
  color: string; // css color
  size?: number;
};

export function ProgressRing({ pct, label, sub, color, size = 120 }: Props) {
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.min(100, Math.max(0, pct)) / 100) * c;
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke="var(--muted)"
            strokeWidth={stroke}
            fill="none"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={c}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 600ms ease" }}
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          <div className="text-center">
            <div className="font-display text-2xl font-semibold">{pct}%</div>
            {sub && <div className="text-[10px] text-muted-foreground">{sub}</div>}
          </div>
        </div>
      </div>
      <div className="text-sm font-medium" style={{ color }}>
        {label}
      </div>
    </div>
  );
}