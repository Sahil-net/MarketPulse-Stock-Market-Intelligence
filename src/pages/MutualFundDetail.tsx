import { useMemo } from 'react';
import { useMutualFund } from '@/hooks/useData';
import { DemoBadge, EmptyState } from '@/components/shared/States';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatPrice, formatPercent, formatMarketCap, formatDate } from '@/lib/format';
import { ArrowLeft, PieChart as PieIcon } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip as RTooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell,
} from 'recharts';

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))', 'hsl(var(--primary))'];

interface MutualFundDetailProps {
  id: string;
  navigate: (path: string) => void;
}

export function MutualFundDetail({ id, navigate }: MutualFundDetailProps) {
  const fund = useMutualFund(id);

  const navChartData = useMemo(() => {
    if (!fund) return [];
    return fund.navHistory.slice(-365).map((n) => ({ date: n.date, nav: n.nav }));
  }, [fund]);

  if (!fund) {
    return <EmptyState title="Fund not found" description={`No mutual fund with ID "${id}" was found.`} action={<Button variant="outline" onClick={() => navigate('/mutual-funds')}>Back to Funds</Button>} />;
  }

  const riskColor: Record<string, string> = { 'Low': 'text-success', 'Moderate': 'text-warning', 'High': 'text-destructive', 'Very High': 'text-destructive' };

  const fundInfo = [
    { label: 'AMC', value: fund.amc },
    { label: 'Category', value: fund.category },
    { label: 'Plan', value: fund.plan },
    { label: 'Option', value: fund.option },
    { label: 'NAV Date', value: formatDate(fund.navDate) },
    { label: 'Expense Ratio', value: `${fund.expenseRatio.toFixed(2)}%` },
    { label: 'AUM', value: formatMarketCap(fund.aum, 'INR') },
    { label: 'Benchmark', value: fund.benchmark },
    { label: 'Risk Level', value: fund.riskLevel },
    { label: 'Inception Date', value: formatDate(fund.inceptionDate) },
  ];

  return (
    <div className="animate-fade-in space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/mutual-funds')} className="mt-1"><ArrowLeft className="h-4 w-4" /></Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-foreground">{fund.name}</h1>
              <DemoBadge />
            </div>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{fund.amc}</span>
              <Badge variant="outline" className="text-[10px]">{fund.category}</Badge>
              <Badge variant="secondary" className="text-[10px]">{fund.plan}</Badge>
              <Badge variant="secondary" className="text-[10px]">{fund.option}</Badge>
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold tabular-nums text-foreground">{formatPrice(fund.nav, 'INR')}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">NAV · {formatDate(fund.navDate)}</p>
          <span className={`text-xs font-medium ${riskColor[fund.riskLevel]}`}>Risk: {fund.riskLevel}</span>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">NAV History (1 Year)</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={navChartData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="navGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} tickLine={false} axisLine={false}
                tickFormatter={(v) => new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} minTickGap={60} />
              <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} tickLine={false} axisLine={false}
                domain={['auto', 'auto']} orientation="right" tickFormatter={(v) => v.toFixed(0)} />
              <RTooltip contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                labelFormatter={(v) => new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                formatter={(v: number) => [formatPrice(v, 'INR'), 'NAV']} />
              <Area type="monotone" dataKey="nav" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#navGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Fund Details</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              {fundInfo.map((f) => (
                <div key={f.label}>
                  <p className="text-xs text-muted-foreground">{f.label}</p>
                  <p className={`text-sm font-medium ${f.label === 'Risk Level' ? riskColor[f.value] : 'text-foreground'}`}>{f.value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Performance Returns</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(fund.returns).map(([key, val]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{key === '1M' ? '1 Month' : key === '3M' ? '3 Months' : key === '6M' ? '6 Months' : key === '1Y' ? '1 Year' : key === '3Y' ? '3 Years (CAGR)' : '5 Years (CAGR)'}</span>
                  <span className={`text-sm font-medium tabular-nums ${val >= 0 ? 'text-success' : 'text-destructive'}`}>{formatPercent(val)}</span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">Returns for periods &gt; 1 year are annualized (CAGR).</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><PieIcon className="h-4 w-4 text-primary" />Sector Allocation</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={fund.sectorAllocation} dataKey="weight" nameKey="sector" cx="50%" cy="50%" outerRadius={60} innerRadius={35}>
                  {fund.sectorAllocation.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <RTooltip contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(v: number) => `${v.toFixed(1)}%`} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 space-y-1">
              {fund.sectorAllocation.slice(0, 5).map((s, i) => (
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
            {fund.topHoldings.map((h, i) => (
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
