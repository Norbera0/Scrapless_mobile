
'use client';

import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface GaugeProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  units?: string;
  className?: string;
}

export function Gauge({
  value,
  max = 1000,
  size = 150,
  strokeWidth = 15,
  label,
  units,
  className,
}: GaugeProps) {
  const center = size / 2;
  const radius = center - strokeWidth;
  const circumference = 2 * Math.PI * radius;

  const getScoreColor = (score: number, maxScore: number) => {
    const ratio = score / maxScore;
    if (ratio >= 0.7) return 'stroke-green-600';
    if (ratio >= 0.5) return 'stroke-amber-500';
    return 'stroke-red-600';
  };

  const scoreColor = getScoreColor(value, max);

  const offset = circumference - (value / max) * circumference;

  return (
    <div className={cn("relative", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        {/* Background track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="transparent"
          stroke="hsl(var(--secondary))"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
        />
        {/* Foreground value arc */}
        <motion.circle
          cx={center}
          cy={center}
          r={radius}
          fill="transparent"
          className={cn('transition-colors duration-500', scoreColor)}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold">{Math.round(value)}</span>
        {label && <span className="text-sm text-muted-foreground">{label}</span>}
      </div>
    </div>
  );
}
