import type { Currency, PeriodKey } from '@/types';

export function formatPrice(value: number | null | undefined, currency: Currency = 'USD'): string {
  if (value === null || value === undefined || isNaN(value)) return '—';
  const symbol = '$';
  const decimals = value >= 1000 ? 2 : value >= 1 ? 2 : 4;
  return `${symbol}${value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) return '—';
  return value.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

export function formatCompact(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) return '—';
  if (value >= 1e12) return `${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(2)}K`;
  return value.toFixed(2);
}

export function formatMarketCap(value: number | null | undefined, currency: Currency = 'USD'): string {
  if (value === null || value === undefined || isNaN(value)) return '—';
  const symbol = '$';
  if (value >= 1e12) return `${symbol}${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `${symbol}${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `${symbol}${(value / 1e6).toFixed(2)}M`;
  return `${symbol}${value.toFixed(0)}`;
}

export function formatVolume(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) return '—';
  if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
  return value.toFixed(0);
}

export function formatPercent(value: number | null | undefined, withSign = true): string {
  if (value === null || value === undefined || isNaN(value)) return '—';
  const sign = withSign && value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

export function formatChange(value: number | null | undefined, currency: Currency = 'USD'): string {
  if (value === null || value === undefined || isNaN(value)) return '—';
  const symbol = '$';
  const sign = value > 0 ? '+' : '';
  return `${sign}${symbol}${Math.abs(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

export function formatRatio(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) return '—';
  return value.toFixed(2);
}

export function isPositive(value: number): boolean {
  return value > 0;
}

export function isNegative(value: number): boolean {
  return value < 0;
}

export const PERIOD_DAYS: Record<PeriodKey, number> = {
  '1D': 1,
  '1W': 7,
  '1M': 30,
  '3M': 90,
  '6M': 180,
  YTD: 0, // computed dynamically
  '1Y': 365,
  '3Y': 1095,
  '5Y': 1825,
};

export const PERIODS: PeriodKey[] = ['1D', '1W', '1M', '3M', '6M', 'YTD', '1Y', '3Y', '5Y'];

export function periodToDate(period: PeriodKey): string {
  const now = new Date();
  if (period === 'YTD') {
    return `${now.getFullYear()}-01-01`;
  }
  const days = PERIOD_DAYS[period];
  const d = new Date(now);
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
}

export function annualizeReturn(totalReturn: number, days: number): number | null {
  if (days < 1) return null;
  const years = days / 365;
  if (years < 1) return null;
  return (Math.pow(1 + totalReturn / 100, 1 / years) - 1) * 100;
}
