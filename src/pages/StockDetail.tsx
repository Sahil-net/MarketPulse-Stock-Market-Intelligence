import { useState, useMemo } from 'react';
import { useStock } from '@/hooks/useData';
import { useAppStore } from '@/hooks/useAppStore';
import { useNews } from '@/hooks/useData';
import { ChangeBadge } from '@/components/shared/ChangeBadge';
import { DemoBadge, EmptyState } from '@/components/shared/States';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { calculateTechnicalIndicators, calculateReturn } from '@/services/technicalAnalysis';
import { formatPrice, formatMarketCap, formatVolume, formatRatio, formatPercent, formatNumber, formatDate } from '@/lib/format';
import { ArrowLeft, Star, TrendingUp, TrendingDown, Newspaper, CalendarClock, Coins } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip as RTooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid, ReferenceLine,
} from 'recharts';
import type { PeriodKey } from '@/types';

interface StockDetailProps {
  ticker: string;
  navigate: (path: string) => void;
}

export function StockDetail({ ticker, navigate }: StockDetailProps) {
  const store = useAppStore();
  const stock = useStock(ticker);
  const news = useNews(ticker);
  const [period, setPeriod] = useState<PeriodKey>('3M');
  const [showSMA, setShowSMA] = useState(true);

  const chartData = useMemo(() => {
    if (!stock) return [];
    const days: Record<PeriodKey, number> = { '1D': 1, '1W': 7, '1M': 30, '3M': 90, '6M': 180, YTD: 0, '1Y': 365, '3Y': 1095, '5Y': 1825 };
    const periodDays = period === 'YTD' ? Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 1).getTime()) / 86400000) : days[period];
    return stock.history.slice(-Math.min(periodDays + 1, stock.history.length)).map((p) => ({
      date: p.date,
      close: p.close,
      volume: p.volume,
    }));
  }, [stock, period]);

  const indicators = useMemo(() => (stock ? calculateTechnicalIndicators(stock.history) : null), [stock]);
  const returns = useMemo(() => {
    if (!stock) return {};
    return {
      '1W': calculateReturn(stock.history, 7),
      '1M': calculateReturn(stock.history, 30),
      '3M': calculateReturn(stock.history, 90),
      '6M': calculateReturn(stock.history, 180),
      '1Y': calculateReturn(stock.history, 365),
      '3Y': calculateReturn(stock.history, 1095),
      '5Y': calculateReturn(stock.history, 1825),
    };
  }, [stock]);

  if (!stock) {
    return (
      <div className="animate-fade-in">
        <EmptyState title="Stock not found" description={`No stock with ticker "${ticker}" was found.`}
          action={<Button variant="outline" onClick={() => navigate('/stocks')}>Back to Stocks</Button>}
        />
      </div>
    );
  }

  const isUp = stock.changePct >= 0;
  const chartColor = isUp ? 'hsl(var(--success))' : 'hsl(var(--destructive))';
  const inWatchlist = store.isInWatchlist(stock.ticker);

  const fundamentals = [
    { label: 'Market Cap', value: formatMarketCap(stock.marketCap, stock.currency) },
    { label: 'P/E Ratio', value: formatRatio(stock.peRatio) },
    { label: 'EPS', value: stock.eps ? formatPrice(stock.eps, stock.currency) : '—' },
    { label: 'Dividend Yield', value: stock.dividendYield !== null ? formatPercent(stock.dividendYield, false) : '—' },
    { label: 'Beta', value: formatRatio(stock.beta) },
    { label: 'Book Value', value: formatPrice(stock.bookValue, stock.currency) },
    { label: 'ROE', value: stock.roe !== null ? formatPercent(stock.roe, false) : '—' },
    { label: 'ROCE', value: stock.roce !== null ? formatPercent(stock.roce, false) : '—' },
    { label: 'Debt/Equity', value: formatRatio(stock.debtToEquity) },
    { label: '52W High', value: formatPrice(stock.high52, stock.currency) },
    { label: '52W Low', value: formatPrice(stock.low52, stock.currency) },
    { label: 'Avg Volume', value: formatVolume(stock.avgVolume) },
  ];

  const indicatorRows = indicators ? [
    { label: 'SMA 20', value: indicators.sma20, hint: 'Simple Moving Average over 20 days' },
    { label: 'SMA 50', value: indicators.sma50, hint: 'Simple Moving Average over 50 days' },
    { label: 'SMA 200', value: indicators.sma200, hint: 'Simple Moving Average over 200 days' },
    { label: 'EMA 12', value: indicators.ema12, hint: 'Exponential Moving Average over 12 days' },
    { label: 'EMA 26', value: indicators.ema26, hint: 'Exponential Moving Average over 26 days' },
    { label: 'EMA 50', value: indicators.ema50, hint: 'Exponential Moving Average over 50 days' },
    { label: 'RSI (14)', value: indicators.rsi14, hint: 'Relative Strength Index — above 70 overbought, below 30 oversold' },
    { label: 'MACD', value: indicators.macd, hint: 'Moving Average Convergence Divergence' },
    { label: 'MACD Signal', value: indicators.macdSignal, hint: '9-period EMA of MACD line' },
    { label: 'Bollinger Upper', value: indicators.bollingerUpper, hint: 'Upper Bollinger Band (2 std dev)' },
    { label: 'Bollinger Middle', value: indicators.bollingerMiddle, hint: 'Middle Bollinger Band (20-period SMA)' },
    { label: 'Bollinger Lower', value: indicators.bollingerLower, hint: 'Lower Bollinger Band (2 std dev)' },
    { label: 'ATR (14)', value: indicators.atr, hint: 'Average True Range — measures volatility' },
    { label: 'Hist. Volatility', value: indicators.historicalVolatility, hint: 'Annualized historical volatility (%)' },
  ] : [];

  return (
    <div className="animate-fade-in space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/stocks')} className="mt-1">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-foreground">{stock.name}</h1>
              <DemoBadge />
            </div>
            <div className="mt-1 flex items-center gap-3">
              <span className="text-sm font-medium text-muted-foreground">{stock.ticker} · {stock.exchange}</span>
              <span className="text-xs text-muted-foreground">{stock.sector}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-2xl font-bold tabular-nums text-foreground">{formatPrice(stock.price, stock.currency)}</p>
            <div className="mt-0.5 flex items-center justify-end gap-2">
              <ChangeBadge value={stock.change} pct={stock.changePct} showIcon size="md" />
            </div>
          </div>
          <Button
            variant={inWatchlist ? 'default' : 'outline'}
            size="icon"
            onClick={() => inWatchlist ? store.removeFromWatchlist(store.watchlists[0]?.id ?? '', stock.ticker) : store.addToWatchlist(store.watchlists[0]?.id ?? '', stock.ticker, 'stock')}
          >
            <Star className={`h-4 w-4 ${inWatchlist ? 'fill-current' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Price chart */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">Price History</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant={showSMA ? 'secondary' : 'ghost'} size="sm" onClick={() => setShowSMA(!showSMA)} className="text-xs">SMA</Button>
            <Tabs value={period} onValueChange={(v) => setPeriod(v as PeriodKey)}>
              <TabsList className="h-7">
                {(['1W', '1M', '3M', '6M', 'YTD', '1Y', '5Y'] as PeriodKey[]).map((p) => (
                  <TabsTrigger key={p} value={p} className="px-2 py-0 text-xs">{p}</TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
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
                formatter={(v: number) => [formatPrice(v, stock.currency), 'Close']} />
              <ReferenceLine y={chartData[0]?.close} stroke="hsl(var(--border))" strokeDasharray="3 3" />
              <Area type="monotone" dataKey="close" stroke={chartColor} strokeWidth={2} fill="url(#priceGradient)" />
            </AreaChart>
          </ResponsiveContainer>
          {/* Volume */}
          <ResponsiveContainer width="100%" height={80}>
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
              <XAxis dataKey="date" tick={false} axisLine={false} />
              <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} tickLine={false} axisLine={false}
                orientation="right" tickFormatter={(v) => `${(v/1e6).toFixed(1)}M`} />
              <RTooltip contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                formatter={(v: number) => [formatVolume(v), 'Volume']} />
              <Bar dataKey="volume" fill="hsl(var(--muted))" opacity={0.5} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Fundamentals */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Fundamentals</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              {fundamentals.map((f) => (
                <div key={f.label}>
                  <p className="text-xs text-muted-foreground">{f.label}</p>
                  <p className="text-sm font-medium tabular-nums text-foreground">{f.value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Returns */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Historical Returns</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(returns).map(([key, val]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{key}</span>
                  {val !== null && val !== undefined ? (
                    <span className={`flex items-center gap-1 text-sm font-medium tabular-nums ${val >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {val >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {formatPercent(val)}
                    </span>
                  ) : <span className="text-sm text-muted-foreground">—</span>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Technical indicators */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Technical Indicators</CardTitle>
            <p className="text-xs text-muted-foreground">Analytical tools, not guaranteed predictors.</p>
          </CardHeader>
          <CardContent>
            <TooltipProvider delayDuration={200}>
              <div className="space-y-1.5">
                {indicatorRows.map((row) => (
                  <div key={row.label} className="flex items-center justify-between">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="cursor-help text-sm text-muted-foreground underline decoration-dotted underline-offset-2">{row.label}</span>
                      </TooltipTrigger>
                      <TooltipContent><p className="max-w-[200px]">{row.hint}</p></TooltipContent>
                    </Tooltip>
                    <span className="text-sm font-medium tabular-nums text-foreground">
                      {row.value !== null && row.value !== undefined ? formatNumber(row.value) : '—'}
                    </span>
                  </div>
                ))}
              </div>
            </TooltipProvider>
          </CardContent>
        </Card>
      </div>

      {/* Dividends */}
      {stock.dividendYield !== null && stock.dividendYield > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Coins className="h-4 w-4 text-primary" />
              Dividends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
              <div>
                <p className="text-xs text-muted-foreground">Dividend Yield</p>
                <p className="text-sm font-medium tabular-nums text-foreground">{formatPercent(stock.dividendYield, false)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Annual Payout</p>
                <p className="text-sm font-medium tabular-nums text-foreground">{formatPrice(stock.annualDividend, stock.currency)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Frequency</p>
                <p className="text-sm font-medium capitalize text-foreground">{stock.dividendFrequency ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Next Ex-Date</p>
                <p className="flex items-center gap-1 text-sm font-medium tabular-nums text-foreground">
                  <CalendarClock className="h-3.5 w-3.5 text-muted-foreground" />
                  {stock.nextExDate ? formatDate(stock.nextExDate) : '—'}
                </p>
              </div>
            </div>

            {stock.dividendHistory.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-xs font-medium text-muted-foreground">Payment History</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="px-2 py-1.5 text-left text-xs font-medium text-muted-foreground">Ex-Date</th>
                        <th className="px-2 py-1.5 text-left text-xs font-medium text-muted-foreground">Pay Date</th>
                        <th className="px-2 py-1.5 text-right text-xs font-medium text-muted-foreground">Amount</th>
                        <th className="px-2 py-1.5 text-left text-xs font-medium text-muted-foreground">Type</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stock.dividendHistory.slice(0, 8).map((d, i) => (
                        <tr key={i} className="border-b border-border/40">
                          <td className="px-2 py-1.5 tabular-nums text-foreground">{formatDate(d.exDate)}</td>
                          <td className="px-2 py-1.5 tabular-nums text-muted-foreground">{formatDate(d.payDate)}</td>
                          <td className="px-2 py-1.5 text-right tabular-nums text-foreground">{formatPrice(d.amount, stock.currency)}</td>
                          <td className="px-2 py-1.5">
                            <span className={`text-xs capitalize ${d.type === 'special' ? 'font-medium text-primary' : 'text-muted-foreground'}`}>{d.type}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Company description */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">About {stock.name}</CardTitle></CardHeader>
        <CardContent><p className="text-sm leading-relaxed text-muted-foreground">{stock.description}</p></CardContent>
      </Card>

      {/* News */}
      {news.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base"><Newspaper className="h-4 w-4 text-primary" />Related News</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {news.map((n) => (
                <div key={n.id} className="border-b border-border/50 pb-3 last:border-0 last:pb-0">
                  <a href={n.url} className="text-sm font-medium text-foreground hover:text-primary" target="_blank" rel="noopener noreferrer">{n.title}</a>
                  <p className="mt-1 text-xs text-muted-foreground">{n.summary}</p>
                  <div className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground/70">
                    <span>{n.source}</span>·<span>{formatDate(n.publishedAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
