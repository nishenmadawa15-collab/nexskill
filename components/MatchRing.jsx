export default function MatchRing({ score, size = 64, strokeWidth = 6, label }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 75 ? '#B6FF3B' : score >= 50 ? '#F2A93B' : '#E8543F';

  return (
    <div className="inline-flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="match-ring" width={size} height={size}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#DEDACD"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center font-mono font-medium text-ink" style={{ fontSize: size * 0.26 }}>
          {score}
        </div>
      </div>
      {label && <div className="label-eyebrow">{label}</div>}
    </div>
  );
}
