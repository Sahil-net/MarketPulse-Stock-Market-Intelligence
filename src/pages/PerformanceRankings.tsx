import { useState, useMemo } from 'react';
import { useStocks, useETFs, useMutualFunds, useSectors } from '@/hooks/useData';
import { useAppStore } from '@/hooks/useAppStore';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { ChangeBadge } from '@/components/shared/ChangeBadge';
import { PageHeader, DemoBadge, EmptyState } from '@/components/shared/States';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { exportToCSV } from '@/lib/csv';
import { calculateReturn, calculateVolatility } from '@/services/technicalAnalysis';
import { formatPercent, formatVolume } from '@/lib/format';
import { Download } from 'lucide-react';
import type { PeriodKey } from '@/types';

interface PerformanceRankingsProps {
  navigate: (path: string) => void;
}

const RANKING_TYPES = [
  { value: 'best-stocks', label: 'Best Stocks' },
  { value: 'worst-stocks', label: 'Worst Stocks' },
  { value: 'best-etfs', label: 'Best ETFs' },
  { value: 'worst-etfs', label: 'Worst ETFs' },
  { value: 'best-funds', label: 'Best Funds' },
  { value: 'worst-funds', label: 'Worst Funds' },
  { value: 'best-sectors', label: 'Best Sectors' },
  { value: 'worst-sectors', label: 'Worst Sectors' },
  { value: 'high-volume', label: 'Highest Volume' },
  { value: 'high-volatility', label: 'Highest Volatility' },
  { value: 'momentum', label: 'Strongest Momentum' },
  { value: 'weak-momentum', label: 'Weakest Momentum' },
  { value: 'new-highs', label: 'New 52W Highs' },
  { value: 'new-lows', label: 'New 52W Lows' },
];

const PERIOD_OPTIONS: PeriodKey[] = ['1D', '1W', '1M', '3M', '6M', 'YTD', '1Y', '3Y', '5Y'];
const PERIOD_DAYS: Record<PeriodKey, number> = { '1D': 1, '1W': 7, '1M': 30, '3M': 90, '6M': 180, YTD: 0, '1Y': 365, '3Y': 1095, '5Y': 1825 };

interface RankRow {
  symbol: string;
  name: string;
  type: string;
  exchange: string;
  returnPct: number;
  volume: number;
  volatility: number;
  metric: string;
}

export function PerformanceRankings({ navigate }: PerformanceRankingsProps) {
  const store = useAppStore();
  const stocks = useStocks(store.market);
  const etfs = useETFs(store.market);
  const funds = useMutualFunds();
  const sectors = useSectors(store.market);

  const [rankType, setRankType] = useState('best-stocks');
  const [period, setPeriod] = useState<PeriodKey>('1M');

  const periodDays = period === 'YTD' ? Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 1).getTime()) / 86400000) : PERIOD_DAYS[period];

  const results = useMemo((): RankRow[] => {
    const buildStockRows = (list: typeof stocks) => list.map((s) => ({
      symbol: s.ticker, name: s.name, type: 'stock', exchange: s.exchange,
      returnPct: calculateReturn(s.history, periodDays) ?? 0,
      volume: s.volume,
      volatility: calculateVolatility(s.history.slice(-periodDays).map((p) => p.close)),
      metric: '',
    }));

    const buildEtfRows = (list: typeof etfs) => list.map((e) => ({
      symbol: e.ticker, name: e.name, type: 'etf', exchange: e.exchange,
      returnPct: calculateReturn(e.history, periodDays) ?? 0,
      volume: e.volume,
      volatility: calculateVolatility(e.history.slice(-periodDays).map((p) => p.close)),
      metric: '',
    }));

    const buildFundRows = () => funds.map((f) => {
      const retMap: Record<string, keyof typeof f.returns> = { '1M': '1M', '3M': '3M', '6M': '6M', '1Y': '1Y', '3Y': '3Y', '5Y': '5Y' };
      const retKey = retMap[period] ?? '1Y';
      return { symbol: f.id, name: f.name, type: 'fund', exchange: '—', returnPct: f.returns[retKey] ?? 0, volume: 0, volatility: 0, metric: '' };
    });

    const buildSectorRows = () => sectors.map((s) => ({ symbol: s.name, name: s.name, type: 'sector', exchange: '—', returnPct: s.changePct, volume: 0, volatility: 0, metric: '' }));

    let rows: RankRow[] = [];
    const isBest = rankType.startsWith('best-');
    const isWorst = rankType.startsWith('worst-');

    if (rankType.includes('stock')) rows = buildStockRows(stocks);
    else if (rankType.includes('etf')) rows = buildEtfRows(etfs);
    else if (rankType.includes('fund')) rows = buildFundRows();
    else if (rankType.includes('sector')) rows = buildSectorRows();
    else if (rankType === 'high-volume') {
      rows = buildStockRows(stocks).sort((a, b) => b.volume - a.volume).map((r) => ({ ...r, metric: formatVolume(r.volume) }));
      return rows.slice(0, 20);
    } else if (rankType === 'high-volatility') {
      rows = buildStockRows(stocks).sort((a, b) => b.volatility - a.volatility).map((r) => ({ ...r, metric: r.volatility.toFixed(2) + '%' }));
      return rows.slice(0, 20);
    } else if (rankType === 'momentum') {
      rows = buildStockRows(stocks).filter((r) => r.returnPct > 0).sort((a, b) => b.returnPct - a.returnPct);
      return rows.slice(0, 20);
    } else if (rankType === 'weak-momentum') {
      rows = buildStockRows(stocks).filter((r) => r.returnPct < 0).sort((a, b) => a.returnPct - b.returnPct);
      return rows.slice(0, 20);
    } else if (rankType === 'new-highs') {
      return stocks.filter((s) => s.price >= s.high52 * 0.98).map((s) => ({
        symbol: s.ticker, name: s.name, type: 'stock', exchange: s.exchange,
        returnPct: s.changePct, volume: s.volume, volatility: 0, metric: 'Near 52W High',
      }));
    } else if (rankType === 'new-lows') {
      return stocks.filter((s) => s.price <= s.low52 * 1.02).map((s) => ({
        symbol: s.ticker, name: s.name, type: 'stock', exchange: s.exchange,
        returnPct: s.changePct, volume: s.volume, volatility: 0, metric: 'Near 52W Low',
      }));
    }

    rows.sort((a, b) => isBest ? b.returnPct - a.returnPct : isWorst ? a.returnPct - b.returnPct : 0);
    return rows.slice(0, 20);
  }, [rankType, period, stocks, etfs, funds, sectors, periodDays]);

  function handleExport() {
    exportToCSV(`rankings-${rankType}-${period}.csv`,
      ['Rank', 'Symbol', 'Name', 'Type', 'Return %', 'Volume', 'Volatility %', 'Metric'],
      results.map((r, i) => [i + 1, r.symbol, r.name, r.type, r.returnPct.toFixed(2), r.volume, r.volatility.toFixed(2), r.metric])
    );
  }

  const columns: Column<RankRow>[] = [
    { key: 'rank', header: '#', sortable: false, align: 'right', accessor: () => 0, render: (_r, i) => <span className="text-xs text-muted-foreground">{(i ?? 0) + 1}</span> },
    { key: 'symbol', header: 'Symbol', sortable: true, accessor: (r) => r.symbol, render: (r) => <span className="font-medium text-foreground">{r.symbol}</span> },
    { key: 'name', header: 'Name', sortable: true, accessor: (r) => r.name, render: (r) => <span className="text-muted-foreground truncate max-w-[200px] inline-block text-sm">{r.name}</span> },
    { key: 'type', header: 'Type', sortable: true, accessor: (r) => r.type, render: (r) => <span className="text-xs uppercase text-muted-foreground">{r.type}</span> },
    { key: 'returnPct', header: 'Return %', sortable: true, align: 'right', accessor: (r) => r.returnPct, render: (r) => <ChangeBadge value={r.returnPct} pct={r.returnPct} size="sm" /> },
    { key: 'volume', header: 'Volume', sortable: true, align: 'right', accessor: (r) => r.volume, render: (r) => <span className="text-muted-foreground">{r.volume > 0 ? formatVolume(r.volume) : '—'}</span> },
    { key: 'volatility', header: 'Volatility', sortable: true, align: 'right', accessor: (r) => r.volatility, render: (r) => <span className="text-muted-foreground">{r.volatility > 0 ? `${r.volatility.toFixed(2)}%` : '—'}</span> },
    { key: 'metric', header: 'Note', sortable: false, accessor: (r) => r.metric, render: (r) => r.metric ? <span className="text-xs text-warning">{r.metric}</span> : null },
  ];

  return (
    <div className="animate-fade-in space-y-4">
      <PageHeader title="Performance Rankings" description="Dynamic rankings calculated from available price history data">
        <Button variant="outline" size="sm" onClick={handleExport}><Download className="mr-1.5 h-3.5 w-3.5" />Export</Button>
        <DemoBadge />
      </PageHeader>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <Select value={rankType} onValueChange={setRankType}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {RANKING_TYPES.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={period} onValueChange={(v) => setPeriod(v as PeriodKey)}>
              <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {PERIOD_OPTIONS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {results.length === 0 ? (
            <EmptyState title="No results" description="No data available for this ranking type and period." />
          ) : (
            <DataTable
              columns={columns}
              data={results}
              rowKey={(r) => `${r.type}-${r.symbol}`}
              onRowClick={(r) => {
                if (r.type === 'stock') navigate(`/stock/${r.symbol}`);
                else if (r.type === 'etf') navigate(`/etf/${r.symbol}`);
                else if (r.type === 'fund') navigate(`/mutual-fund/${r.symbol}`);
              }}
              initialSortKey="returnPct"
              initialSortDir={rankType.startsWith('worst-') ? 'asc' : 'desc'}
              dense
            />
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Period: {period} · Calculation: Return (%) = ((End Price - Start Price) / Start Price) × 100 · Data freshness: Demo data
      </p>
    </div>
  );
}
