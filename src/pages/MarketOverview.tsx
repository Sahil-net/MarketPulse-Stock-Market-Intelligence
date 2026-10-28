import { useState, useMemo } from 'react';
import { useIndices, useStocks, useSectors } from '@/hooks/useData';
import { useAppStore } from '@/hooks/useAppStore';
import { Sparkline } from '@/components/shared/Sparkline';
import { ChangeBadge } from '@/components/shared/ChangeBadge';
import { PageHeader, DemoBadge } from '@/components/shared/States';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatPrice, formatCompact, formatPercent, formatVolume } from '@/lib/format';
import { ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown, BarChart3, Activity, Trophy, AlertTriangle } from 'lucide-react';
import type { MarketIndex, Stock, PeriodKey } from '@/types';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';

interface MarketOverviewProps {
  navigate: (path: string) => void;
}

export function MarketOverview({ navigate }: MarketOverviewProps) {
  const store = useAppStore();
  const indices = useIndices(store.market);
  const stocks = useStocks(store.market);
  const sectors = useSectors(store.market);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [chartPeriod, setChartPeriod] = useState<PeriodKey>('1M');

  const currentIndex = indices[selectedIdx] || indices[0];

  const chartData = useMemo(() => {
    if (!currentIndex) return [];
    const days: Record<PeriodKey, number> = { '1D': 1, '1W': 7, '1M': 30, '3M': 90, '6M': 180, YTD: 0, '1Y': 365, '3Y': 1095, '5Y': 1825 };
    const periodDays = chartPeriod === 'YTD' ? Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 1).getTime()) / 86400000) : days[chartPeriod];
    return currentIndex.history.slice(-Math.min(periodDays + 1, currentIndex.history.length)).map((p) => ({
      date: p.date,
      value: p.close,
      volume: p.volume,
    }));
  }, [currentIndex, chartPeriod]);

  const gainers = useMemo(() => [...stocks].sort((a, b) => b.changePct - a.changePct).slice(0, 5), [stocks]);
  const losers = useMemo(() => [...stocks].sort((a, b) => a.changePct - b.changePct).slice(0, 5), [stocks]);

  const advancing = stocks.filter((s) => s.changePct > 0).length;
  const declining = stocks.filter((s) => s.changePct < 0).length;
  const unchanged = stocks.filter((s) => s.changePct === 0).length;
  const bestSector = sectors[0];
  const worstSector = sectors[sectors.length - 1];
  const highVolume = [...stocks].sort((a, b) => b.volume - a.volume)[0];
  const newHighs = stocks.filter((s) => s.price >= s.high52 * 0.98).length;
  const newLows = stocks.filter((s) => s.price <= s.low52 * 1.02).length;

  const totalChange = currentIndex?.changePct ?? 0;
  const chartColor = totalChange >= 0 ? 'hsl(var(--success))' : 'hsl(var(--destructive))';

  const moverColumns: Column<Stock>[] = [
    {
      key: 'ticker', header: 'Ticker', sortable: true,
      accessor: (s) => s.ticker,
      render: (s) => <span className="font-medium text-foreground">{s.ticker}</span>,
    },
    {
      key: 'name', header: 'Company', sortable: true,
      accessor: (s) => s.name,
      render: (s) => <span className="text-muted-foreground truncate max-w-[120px] inline-block">{s.name}</span>,
    },
    {
      key: 'price', header: 'Price', sortable: true, align: 'right',
      accessor: (s) => s.price,
      render: (s) => <span className="text-foreground">{formatPrice(s.price, s.currency)}</span>,
    },
    {
      key: 'changePct', header: 'Change', sortable: true, align: 'right',
      accessor: (s) => s.changePct,
      render: (s) => <ChangeBadge value={s.change} pct={s.changePct} size="sm" />,
    },
    {
      key: 'volume', header: 'Volume', sortable: true, align: 'right',
      accessor: (s) => s.volume,
      render: (s) => <span className="text-muted-foreground">{formatVolume(s.volume)}</span>,
    },
  ];

  const statCards = [
    { label: 'Advancing', value: advancing, icon: TrendingUp, color: 'text-success', bg: 'bg-success/10' },
    { label: 'Declining', value: declining, icon: TrendingDown, color: 'text-destructive', bg: 'bg-destructive/10' },
    { label: 'Unchanged', value: unchanged, icon: Activity, color: 'text-muted-foreground', bg: 'bg-muted' },
    { label: 'Best Sector', value: bestSector?.name ?? '—', sub: bestSector ? formatPercent(bestSector.changePct) : '', icon: Trophy, color: 'text-success', bg: 'bg-success/10' },
    { label: 'Worst Sector', value: worstSector?.name ?? '—', sub: worstSector ? formatPercent(worstSector.changePct) : '', icon: AlertTriangle, color: 'text-destructive', bg: 'bg-destructive/10' },
    { label: 'High Volume', value: highVolume?.ticker ?? '—', sub: highVolume ? formatVolume(highVolume.volume) : '', icon: BarChart3, color: 'text-primary', bg: 'bg-primary/10' },
    { label: '52W Highs', value: newHighs, icon: ArrowUpRight, color: 'text-success', bg: 'bg-success/10' },
    { label: '52W Lows', value: newLows, icon: ArrowDownRight, color: 'text-destructive', bg: 'bg-destructive/10' },
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Market Overview" description="Real-time market intelligence · United States">
        <DemoBadge />
      </PageHeader>

      {/* Index cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {indices.map((idx, i) => (
          <IndexCard
            key={idx.id}
            index={idx}
            currency={store.currency}
            selected={i === selectedIdx}
            onClick={() => setSelectedIdx(i)}
          />
        ))}
      </div>

      {/* Main chart */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              {currentIndex?.name}
              <ChangeBadge value={currentIndex?.change ?? 0} pct={currentIndex?.changePct} size="sm" />
            </CardTitle>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {formatPrice(currentIndex?.value ?? 0, store.currency)} · {currentIndex?.sessionStatus === 'open' ? 'Market Open' : 'Market Closed'}
            </p>
          </div>
          <Tabs value={chartPeriod} onValueChange={(v) => setChartPeriod(v as PeriodKey)}>
            <TabsList className="h-7">
              {(['1D', '1W', '1M', '3M', '6M', 'YTD', '1Y', '5Y'] as PeriodKey[]).map((p) => (
                <TabsTrigger key={p} value={p} className="px-2 py-0 text-xs">{p}</TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="indexGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={chartColor} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={chartColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                minTickGap={50}
              />
              <YAxis
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                domain={['auto', 'auto']}
                tickFormatter={(v) => formatCompact(v)}
                orientation="right"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
                labelFormatter={(v) => new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                formatter={(v: number) => [formatPrice(v, store.currency), 'Value']}
              />
              <ReferenceLine y={chartData[0]?.value} stroke="hsl(var(--border))" strokeDasharray="3 3" />
              <Area
                type="monotone"
                dataKey="value"
                stroke={chartColor}
                strokeWidth={2}
                fill="url(#indexGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Market statistics */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-foreground">Market Statistics</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {statCards.map((stat) => (
            <Card key={stat.label} className="p-3">
              <div className="flex items-center gap-2">
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${stat.bg}`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="truncate text-sm font-semibold text-foreground">{stat.value}</p>
                  {stat.sub && <p className={`text-xs ${stat.color}`}>{stat.sub}</p>}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Movers */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <ArrowUpRight className="h-4 w-4 text-success" />
              Top Gainers
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/gainers')}>
              View all →
            </Button>
          </CardHeader>
          <CardContent className="pt-0">
            <DataTable
              columns={moverColumns}
              data={gainers}
              rowKey={(s) => s.id}
              onRowClick={(s) => navigate(`/stock/${s.ticker}`)}
              dense
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <ArrowDownRight className="h-4 w-4 text-destructive" />
              Top Losers
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/losers')}>
              View all →
            </Button>
          </CardHeader>
          <CardContent className="pt-0">
            <DataTable
              columns={moverColumns}
              data={losers}
              rowKey={(s) => s.id}
              onRowClick={(s) => navigate(`/stock/${s.ticker}`)}
              dense
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function IndexCard({
  index, currency, selected, onClick,
}: {
  index: MarketIndex;
  currency: 'USD';
  selected: boolean;
  onClick: () => void;
}) {
  const isUp = index.changePct >= 0;
  return (
    <button
      onClick={onClick}
      className={`rounded-lg border p-3 text-left transition-all ${
        selected ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'border-border bg-card hover:border-muted-foreground/30'
      }`}
    >
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{index.name}</span>
        <span className={`h-1.5 w-1.5 rounded-full ${index.sessionStatus === 'open' ? 'bg-success' : 'bg-muted-foreground/40'}`} />
      </div>
      <div className="flex items-end justify-between gap-2">
        <div>
          <p className="text-base font-semibold tabular-nums text-foreground">{formatPrice(index.value, currency)}</p>
          <div className="mt-0.5 flex items-center gap-1.5">
            <ChangeBadge value={index.change} pct={index.changePct} size="sm" showIcon />
          </div>
        </div>
        <Sparkline data={index.sparkline} positive={isUp} width={56} height={28} />
      </div>
    </button>
  );
}
