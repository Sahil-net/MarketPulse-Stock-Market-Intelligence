import { useMemo } from 'react';
import { useSectors, useStocks } from '@/hooks/useData';
import { useAppStore } from '@/hooks/useAppStore';
import { ChangeBadge } from '@/components/shared/ChangeBadge';
import { Sparkline } from '@/components/shared/Sparkline';
import { PageHeader, DemoBadge } from '@/components/shared/States';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatPercent, formatMarketCap, formatVolume } from '@/lib/format';
import { LineChart as LineChartIcon } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as RTooltip, ResponsiveContainer, CartesianGrid, Cell,
} from 'recharts';

interface SectorAnalysisProps {
  navigate: (path: string) => void;
}

export function SectorAnalysis({ navigate }: SectorAnalysisProps) {
  const store = useAppStore();
  const sectors = useSectors(store.market);
  const stocks = useStocks(store.market);

  const sectorChartData = useMemo(() => {
    return sectors.map((s) => ({ name: s.name, changePct: s.changePct, marketCap: s.marketCap }));
  }, [sectors]);

  const stocksBySector = useMemo(() => {
    const map = new Map<string, typeof stocks>();
    stocks.forEach((s) => {
      const arr = map.get(s.sector) || [];
      arr.push(s);
      map.set(s.sector, arr);
    });
    return map;
  }, [stocks]);

  return (
    <div className="animate-fade-in space-y-4">
      <PageHeader title="Sector Analysis" description={`Performance by sector · ${store.market === 'IN' ? 'India' : 'US'} markets`}>
        <DemoBadge />
      </PageHeader>

      {/* Sector performance bar chart */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <LineChartIcon className="h-4 w-4 text-primary" /> Sector Performance (Daily)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={sectorChartData} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} horizontal={false} />
              <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} tickLine={false} axisLine={false}
                tickFormatter={(v) => `${v}%`} />
              <YAxis type="category" dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} tickLine={false} axisLine={false}
                width={100} />
              <RTooltip contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                formatter={(v: number) => [formatPercent(v), 'Change']} />
              <Bar dataKey="changePct" radius={[0, 4, 4, 0]}>
                {sectorChartData.map((entry, i) => (
                  <Cell key={i} fill={entry.changePct >= 0 ? 'hsl(var(--success))' : 'hsl(var(--destructive))'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Sector cards */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {sectors.map((sector) => {
          const sectorStocks = stocksBySector.get(sector.name) || [];
          return (
            <Card key={sector.name} className="cursor-pointer hover:border-muted-foreground/30 transition-colors" >
              <CardContent className="p-4" onClick={() => navigate('/stocks')}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">{sector.name}</h3>
                    <p className="text-xs text-muted-foreground">{sector.stockCount} stocks · {formatMarketCap(sector.marketCap, store.currency)}</p>
                  </div>
                  <ChangeBadge value={sector.changePct} pct={sector.changePct} size="sm" showIcon />
                </div>
                <Sparkline data={sector.sparkline} positive={sector.changePct >= 0} width={260} height={40} className="w-full" />
                <div className="mt-3 space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Top Performers</p>
                  {sector.topStocks.map((s) => (
                    <div key={s.ticker} className="flex items-center justify-between">
                      <button onClick={(e) => { e.stopPropagation(); navigate(`/stock/${s.ticker}`); }} className="text-sm text-foreground hover:text-primary">{s.ticker}</button>
                      <ChangeBadge value={s.changePct} pct={s.changePct} size="sm" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
