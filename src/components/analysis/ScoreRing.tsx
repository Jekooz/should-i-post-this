'use client';

interface ScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export function ScoreRing({ score, size = 120, strokeWidth = 8, className = '' }: ScoreRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = (Math.min(10, Math.max(0, score)) / 10) * circumference;

  const getColor = (s: number) => {
    if (s >= 8) return 'hsl(142 76% 36%)'; // success green
    if (s >= 6) return 'hsl(217 91% 60%)'; // blue
    if (s >= 4) return 'hsl(38 92% 50%)'; // amber
    if (s >= 2) return 'hsl(25 95% 53%)'; // orange
    return 'hsl(0 84% 60%)'; // red
  };

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getColor(score)}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
          className="transition-[stroke-dashoffset] duration-700 ease-out motion-reduce:transition-none"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold tabular-nums">{score.toFixed(1)}</span>
        <span className="text-xs text-muted-foreground">out of 10</span>
      </div>
    </div>
  );
}
