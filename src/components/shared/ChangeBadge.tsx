import { cn } from '@/lib/utils';
import { formatPercent, formatChange } from '@/lib/format';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { Currency } from '@/types';

interface ChangeBadgeProps {
  value: number;
  pct?: number;
  showIcon?: boolean;
  showValue?: boolean;
  currency?: Currency;
  size?: 'sm' | 'md';
  className?: string;
}

export function ChangeBadge({
  value,
  pct,
  showIcon = false,
  showValue = false,
  currency = 'USD',
  size = 'md',
  className,
}: ChangeBadgeProps) {
  const isUp = value > 0;
  const isDown = value < 0;
  const isFlat = value === 0;

  const colorClass = isUp
    ? 'text-success'
    : isDown
    ? 'text-destructive'
    : 'text-muted-foreground';

  const bgClass = isUp
    ? 'bg-success/10'
    : isDown
    ? 'bg-destructive/10'
    : 'bg-muted';

  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-medium tabular-nums',
        textSize,
        colorClass,
        bgClass,
        className
      )}
    >
      {showIcon && isUp && <TrendingUp className="h-3 w-3" />}
      {showIcon && isDown && <TrendingDown className="h-3 w-3" />}
      {showIcon && isFlat && <Minus className="h-3 w-3" />}
      {showValue && <span>{formatChange(value, currency)}</span>}
      {pct !== undefined && <span>{formatPercent(pct)}</span>}
      {pct === undefined && !showValue && <span>{formatPercent(value)}</span>}
    </span>
  );
}
