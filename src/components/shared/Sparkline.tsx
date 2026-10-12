import { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  positive?: boolean;
  className?: string;
}

export function Sparkline({ data, width = 80, height = 28, positive, className }: SparklineProps) {
  const path = useMemo(() => {
    if (!data || data.length < 2) return '';
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const step = width / (data.length - 1);
    return data
      .map((v, i) => {
        const x = i * step;
        const y = height - ((v - min) / range) * height;
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }, [data, width, height]);

  const areaPath = useMemo(() => {
    if (!path) return '';
    return `${path} L${width},${height} L0,${height} Z`;
  }, [path, width, height]);

  const isPositive = positive ?? (data.length >= 2 && data[data.length - 1] >= data[0]);
  const color = isPositive ? 'hsl(var(--success))' : 'hsl(var(--destructive))';

  if (!data || data.length < 2) {
    return <div className={cn('opacity-30', className)} style={{ width, height }} />;
  }

  return (
    <svg width={width} height={height} className={cn('overflow-visible', className)}>
      <defs>
        <linearGradient id={`spark-${Math.random().toString(36).slice(2)}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.25} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={color} fillOpacity={0.08} />
      <path d={path} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
