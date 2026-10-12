import { useState, useMemo } from 'react';
import { useETF } from '@/hooks/useData';
import { useAppStore } from '@/hooks/useAppStore';
import { ChangeBadge } from '@/components/shared/ChangeBadge';
import { DemoBadge, EmptyState } from '@/components/shared/States';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { calculateReturn, calculateVolatility, calculateMaxDrawdown, calculateSharpeRatio } from '@/services/technicalAnalysis';
import { formatPrice, formatMarketCap, formatVolume, formatPercent, formatDate, formatRatio } from '@/lib/format';
import { ArrowLeft, Star, Layers } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip as RTooltip, ResponsiveContainer, CartesianGrid, ReferenceLine,
  PieChart, Pie, Cell,
} from 'recharts';
import type { PeriodKey } from '@/types';

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))', 'hsl(var(--primary))', 'hsl(var(--success))'];

interface ETFDetailProps {
  ticker: string;
  navigate: (path: string) => void;
}

export function ETFDetail({ ticker, navigate }: ETFDetailProps) {
  const store = useAppStore();
  const etf = useETF(ticker);
  const [period, setPeriod] = useState<PeriodKey>('1Y');

  const chartData = useMemo(() => {
    if (!etf) return [];
    const days: Record<PeriodKey, number> = { '1D': 1, '1W': 7, '1M': 30, '3M': 90, '6M': 180, YTD: 0, '1Y': 365, '3Y': 1095, '5Y': 1825 };
    const periodDays = period === 'YTD' ? Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 1).getTime()) / 86400000) : days[period];
    return etf.history.slice(-Math.min(periodDays + 1, etf.history.length)).map((p) => ({ date: p.date, close: p.close }));
  }, [etf, period]);

  const metrics = useMemo(() => {
    if (!etf) return null;
    const closes = etf.history.map((p) => p.close);
    return {
      return1Y: calculateReturn(etf.history, 365) ?? 0,
      return3Y: calculateReturn(etf.history, 1095) ?? 0,
      return5Y: calculateReturn(etf.history, 1825) ?? 0,
      volatility: calculateVolatility(closes.slice(-252)),
      maxDrawdown: calculateMaxDrawdown(closes.slice(-252)),
      sharpe: calculateSharpeRatio(closes.slice(-252)),
    };
  }, [etf]);

  if (!etf) {
    return <EmptyState title="ETF not found" description={`No ETF with ticker "${ticker}" was found.`} action={<Button variant="outline" onClick={() => navigate('/etfs')}>Back to ETFs</Button>} />;
  }

  const isUp = etf.changePct >= 0;
  const chartColor = isUp ? 'hsl(var(--success))' : 'hsl(var(--destructive))';
  const inWatchlist = store.isInWatchlist(etf.ticker);

  const fundInfo = [
    { label: 'Issuer', value: etf.issuer },
    { label: 'Exchange', value: etf.exchange },
    { label: 'Category', value: etf.category },
    { label: 'Tracking Index', value: etf.trackingIndex },
    { label: 'NAV', value: formatPrice(etf.nav, etf.currency) },
    { label: 'AUM', value: formatMarketCap(etf.aum, etf.currency) },
    { label: 'Expense Ratio', value: `${etf.expenseRatio.toFixed(3)}%` },
    { label: 'Distribution Yield', value: etf.yield !== null ? formatPercent(etf.yield, false) : '—' },
    { label: 'Volume', value: formatVolume(etf.volume) },
    { label: 'Inception Date', value: formatDate(etf.inceptionDate) },
  ];

  return (
    <div className="animate-fade-in space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/etfs')} className="mt-1"><ArrowLeft className="h-4 w-4" /></Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-foreground">{etf.name}</h1>
              <DemoBadge />
            </div>
            <div className="mt-1 flex items-center gap-3">
              <span className="text-sm font-medium text-muted-foreground">{etf.ticker} · {etf.exchange}</span>
              <span className="text-xs text-muted-foreground">{etf.category}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-2xl font-bold tabular-nums text-foreground">{formatPrice(etf.price, etf.currency)}</p>
            <div className="mt-0.5"><ChangeBadge value={etf.change} pct={etf.changePct} showIcon size="md" /></div>
          </div>
          <Button variant={inWatchlist ? 'default' : 'outline'} size="icon"
            onClick={() => inWatchlist ? store.removeFromWatchlist(store.watchlists[0]?.id ?? '', etf.ticker) : store.addToWatchlist(store.watchlists[0]?.id ?? '', etf.ticker, 'etf')}>
            <Star className={`h-4 w-4 ${inWatchlist ? 'fill-current' : ''}`} />
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base flex items-center gap-2"><Layers className="h-4 w-4 text-primary" />Price History</CardTitle>
          <Tabs value={period} onValueChange={(v) => setPeriod(v as PeriodKey)}>
            <TabsList className="h-7">
              {(['1M', '3M', '6M', 'YTD', '1Y', '3Y', '5Y'] as PeriodKey[]).map((p) => <TabsTrigger key={p} value={p} className="px-2 py-0 text-xs">{p}</TabsTrigger>)}
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="etfGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={chartColor} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={chartColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} tickLine={false} axisLine={false}
                tickFormatter={(v) => new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} minTickGap={60} />
              <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} tickLine={false} axisLine={false}
                domain={['auto', 'auto']} orientation="right" tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(1)}k` : v.toFixed(0)} />
              <RTooltip contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                labelFormatter={(v) => new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                formatter={(v: number) => [formatPrice(v, etf.currency), 'Close']} />
              <ReferenceLine y={chartData[0]?.close} stroke="hsl(var(--border))" strokeDasharray="3 3" />
              <Area type="monotone" dataKey="close" stroke={chartColor} strokeWidth={2} fill="url(#etfGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Fund Information</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              {fundInfo.map((f) => (
                <div key={f.label}>
                  <p className="text-xs text-muted-foreground">{f.label}</p>
                  <p className="text-sm font-medium text-foreground">{f.value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Performance & Risk</CardTitle></CardHeader>
          <CardContent>
            {metrics && (
              <div className="space-y-2">
                {[
                  { label: '1Y Return', value: formatPercent(metrics.return1Y), positive: metrics.return1Y >= 0 },
                  { label: '3Y Return', value: formatPercent(metrics.return3Y), positive: metrics.return3Y >= 0 },
                  { label: '5Y Return', value: formatPercent(metrics.return5Y), positive: metrics.return5Y >= 0 },
                  { label: 'Volatility (1Y)', value: `${metrics.volatility.toFixed(2)}%`, neutral: true },
                  { label: 'Max Drawdown', value: `${metrics.maxDrawdown.toFixed(2)}%`, negative: true },
                  { label: 'Sharpe Ratio', value: metrics.sharpe !== null ? metrics.sharpe.toFixed(3) : '—', neutral: true },
                ].map((r) => (
                  <div key={r.label} className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{r.label}</span>
                    <span className={`text-sm font-medium tabular-nums ${r.negative ? 'text-destructive' : r.neutral ? 'text-foreground' : r.positive ? 'text-success' : 'text-destructive'}`}>{r.value}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Sector Allocation</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={etf.sectorAllocation} dataKey="weight" nameKey="sector" cx="50%" cy="50%" outerRadius={60} innerRadius={35}>
                  {etf.sectorAllocation.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <RTooltip contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(v: number) => `${v.toFixed(1)}%`} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 space-y-1">
              {etf.sectorAllocation.slice(0, 5).map((s, i) => (
                <div key={s.sector} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-muted-foreground">{s.sector}</span>
                  </div>
                  <span className="text-foreground tabular-nums">{s.weight.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Top Holdings</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {etf.topHoldings.map((h, i) => (
              <div key={h.name} className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-6">{i + 1}</span>
                <span className="text-sm text-foreground flex-1">{h.name}</span>
                <div className="w-32 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(h.weight, 100)}%` }} />
                </div>
                <span className="text-sm text-muted-foreground tabular-nums w-12 text-right">{h.weight.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
