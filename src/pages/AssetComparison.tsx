import { useState, useMemo } from 'react';
import { useStocks, useETFs, useMutualFunds } from '@/hooks/useData';
import { useAppStore } from '@/hooks/useAppStore';
import { PageHeader, DemoBadge, EmptyState } from '@/components/shared/States';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { calculateReturn, calculateVolatility, calculateMaxDrawdown, calculateSharpeRatio } from '@/services/technicalAnalysis';
import { formatPercent, formatPrice } from '@/lib/format';
import { X, Plus, GitCompareArrows } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip as RTooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts';

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

interface AssetComparisonProps {
  navigate: (path: string) => void;
}

interface ComparisonItem {
  symbol: string;
  name: string;
  type: string;
  history: { date: string; close: number }[];
  currency: 'INR' | 'USD';
}

export function AssetComparison({ navigate }: AssetComparisonProps) {
  const store = useAppStore();
  const stocks = useStocks(store.market);
  const etfs = useETFs(store.market);
  const funds = useMutualFunds();

  const [selected, setSelected] = useState<ComparisonItem[]>([]);
  const [searchType, setSearchType] = useState<'stock' | 'etf' | 'fund'>('stock');
  const [searchQuery, setSearchQuery] = useState('');
  const [period, setPeriod] = useState('1Y');

  const availableAssets = useMemo(() => {
    if (searchType === 'stock') return stocks.map((s) => ({ symbol: s.ticker, name: s.name, type: 'stock', history: s.history, currency: s.currency }));
    if (searchType === 'etf') return etfs.map((e) => ({ symbol: e.ticker, name: e.name, type: 'etf', history: e.history, currency: e.currency }));
    return funds.map((f) => ({ symbol: f.id, name: f.name, type: 'fund', history: f.navHistory.map((n) => ({ date: n.date, close: n.nav })), currency: 'INR' as const }));
  }, [stocks, etfs, funds, searchType]);

  const searchResults = useMemo(() => {
    if (!searchQuery) return availableAssets.slice(0, 8);
    const q = searchQuery.toLowerCase();
    return availableAssets.filter((a) => a.symbol.toLowerCase().includes(q) || a.name.toLowerCase().includes(q)).slice(0, 8);
  }, [availableAssets, searchQuery]);

  function addAsset(asset: typeof availableAssets[0]) {
    if (selected.length >= 5 || selected.some((s) => s.symbol === asset.symbol)) return;
    setSelected([...selected, { symbol: asset.symbol, name: asset.name, type: asset.type, history: asset.history, currency: asset.currency }]);
  }

  function removeAsset(symbol: string) {
    setSelected(selected.filter((s) => s.symbol !== symbol));
  }

  const periodDays: Record<string, number> = { '1M': 30, '3M': 90, '6M': 180, '1Y': 365, '3Y': 1095, '5Y': 1825 };
  const days = periodDays[period] || 365;

  const chartData = useMemo(() => {
    if (selected.length < 2) return [];
    const minLen = Math.min(...selected.map((s) => s.history.length));
    const startIdx = Math.max(0, minLen - days);
    const data: Record<string, number | string>[] = [];
    const len = Math.min(days + 1, minLen - startIdx);
    for (let i = 0; i < len; i++) {
      const point: Record<string, number | string> = { date: selected[0].history[startIdx + i].date };
      selected.forEach((s) => {
        const base = s.history[startIdx].close;
        const current = s.history[startIdx + i].close;
        point[s.symbol] = ((current - base) / base) * 100;
      });
      data.push(point);
    }
    return data;
  }, [selected, days]);

  const metrics = useMemo(() => {
    return selected.map((s) => {
      const closes = s.history.map((p) => p.close);
      const slice = closes.slice(-days);
      const ret = ((slice[slice.length - 1] - slice[0]) / slice[0]) * 100;
      return {
        symbol: s.symbol,
        name: s.name,
        totalReturn: ret,
        annualizedReturn: days > 365 ? (Math.pow(1 + ret / 100, 365 / days) - 1) * 100 : null,
        volatility: calculateVolatility(slice),
        maxDrawdown: calculateMaxDrawdown(slice),
        sharpe: calculateSharpeRatio(slice),
      };
    });
  }, [selected, days]);

  return (
    <div className="animate-fade-in space-y-4">
      <PageHeader title="Asset Comparison" description="Compare up to 5 stocks, ETFs, or mutual funds">
        <DemoBadge />
      </PageHeader>

      {/* Asset selector */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Select value={searchType} onValueChange={(v) => setSearchType(v as typeof searchType)}>
              <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="stock">Stocks</SelectItem>
                <SelectItem value="etf">ETFs</SelectItem>
                <SelectItem value="fund">Mutual Funds</SelectItem>
              </SelectContent>
            </Select>
            <Input placeholder="Search to add..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="max-w-xs" />
            <span className="text-xs text-muted-foreground">{selected.length}/5 selected</span>
          </div>

          {/* Search results */}
          {searchResults.length > 0 && selected.length < 5 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {searchResults.slice(0, 6).map((a) => (
                <button
                  key={a.symbol}
                  onClick={() => addAsset(a)}
                  className="flex items-center gap-1.5 rounded-lg border border-border bg-muted/30 px-2.5 py-1 text-xs hover:border-primary hover:bg-primary/5 transition-colors"
                >
                  <Plus className="h-3 w-3 text-primary" />
                  <span className="font-medium text-foreground">{a.symbol}</span>
                  <span className="text-muted-foreground max-w-[100px] truncate">{a.name}</span>
                </button>
              ))}
            </div>
          )}

          {/* Selected assets */}
          {selected.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selected.map((s, i) => (
                <div key={s.symbol} className="flex items-center gap-2 rounded-lg border px-2.5 py-1 text-xs" style={{ borderColor: COLORS[i] + '40' }}>
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                  <span className="font-medium text-foreground">{s.symbol}</span>
                  <button onClick={() => removeAsset(s.symbol)} className="text-muted-foreground hover:text-destructive"><X className="h-3 w-3" /></button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selected.length < 2 ? (
        <Card>
          <CardContent>
            <EmptyState
              title="Select at least 2 assets to compare"
              description="Search and add assets above to see normalized performance charts and risk metrics."
              icon={<GitCompareArrows className="h-12 w-12" />}
            />
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Period selector */}
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground">Period:</Label>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[100px] h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {['1M', '3M', '6M', '1Y', '3Y', '5Y'].map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Normalized chart */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Normalized Performance (%)</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={340}>
                <LineChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} tickLine={false} axisLine={false}
                    tickFormatter={(v) => new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} minTickGap={60} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} tickLine={false} axisLine={false}
                    orientation="right" tickFormatter={(v) => `${v.toFixed(0)}%`} />
                  <RTooltip contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                    labelFormatter={(v) => new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    formatter={(v: number) => [formatPercent(v), '']} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  {selected.map((s, i) => (
                    <Line key={s.symbol} type="monotone" dataKey={s.symbol} stroke={COLORS[i]} strokeWidth={2} dot={false} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Metrics table */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Risk & Return Metrics</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Metric</th>
                      {metrics.map((m, i) => (
                        <th key={m.symbol} className="px-3 py-2 text-right text-xs font-medium" style={{ color: COLORS[i] }}>{m.symbol}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { label: 'Total Return', get: (m: typeof metrics[0]) => formatPercent(m.totalReturn), color: (m: typeof metrics[0]) => m.totalReturn >= 0 ? 'text-success' : 'text-destructive' },
                      { label: 'Annualized Return', get: (m: typeof metrics[0]) => m.annualizedReturn !== null ? formatPercent(m.annualizedReturn) : '—', color: () => 'text-foreground' },
                      { label: 'Volatility (Annualized)', get: (m: typeof metrics[0]) => `${m.volatility.toFixed(2)}%`, color: () => 'text-foreground' },
                      { label: 'Max Drawdown', get: (m: typeof metrics[0]) => `${m.maxDrawdown.toFixed(2)}%`, color: () => 'text-destructive' },
                      { label: 'Sharpe Ratio', get: (m: typeof metrics[0]) => m.sharpe !== null ? m.sharpe.toFixed(3) : '—', color: () => 'text-foreground' },
                    ].map((row) => (
                      <tr key={row.label} className="border-b border-border/50">
                        <td className="px-3 py-2 text-muted-foreground">{row.label}</td>
                        {metrics.map((m) => (
                          <td key={m.symbol} className={`px-3 py-2 text-right tabular-nums ${row.color(m)}`}>{row.get(m)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Returns are price returns calculated from closing prices. Comparison uses a common {period} period.
                All assets compared in their native currency — cross-currency comparisons require reliable FX data.
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
