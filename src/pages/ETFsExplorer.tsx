import { useState, useMemo } from 'react';
import { useETFs } from '@/hooks/useData';
import { useAppStore } from '@/hooks/useAppStore';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { ChangeBadge } from '@/components/shared/ChangeBadge';
import { Sparkline } from '@/components/shared/Sparkline';
import { PageHeader, DemoBadge, EmptyState } from '@/components/shared/States';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';
import { exportToCSV } from '@/lib/csv';
import { calculateReturn, calculateVolatility, calculateMaxDrawdown } from '@/services/technicalAnalysis';
import { formatPrice, formatMarketCap, formatVolume, formatPercent, formatRatio, formatDate } from '@/lib/format';
import { Search, Download, Star, X, Info } from 'lucide-react';
import type { ETF } from '@/types';

interface ETFsExplorerProps {
  navigate: (path: string) => void;
}

const ETF_CATEGORIES = ['Broad Market', 'Sector', 'Dividend', 'Bond', 'Commodity', 'International', 'Thematic'];

export function ETFsExplorer({ navigate }: ETFsExplorerProps) {
  const store = useAppStore();
  const etfs = useETFs(store.market);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [selected, setSelected] = useState<string[]>([]);

  const filtered = useMemo(() => {
    let result = etfs;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((e) => e.ticker.toLowerCase().includes(q) || e.name.toLowerCase().includes(q) || e.issuer.toLowerCase().includes(q));
    }
    if (category !== 'all') result = result.filter((e) => e.category === category);
    return result;
  }, [etfs, search, category]);

  function toggleSelect(ticker: string) {
    setSelected((prev) => prev.includes(ticker) ? prev.filter((t) => t !== ticker) : prev.length < 5 ? [...prev, ticker] : prev);
  }

  function handleExport() {
    exportToCSV('etfs.csv',
      ['Ticker', 'Name', 'Issuer', 'Price', 'NAV', 'Change%', 'AUM', 'Expense Ratio', 'Volume', 'Category', 'Tracking Index', 'Yield', 'Inception'],
      filtered.map((e) => [e.ticker, e.name, e.issuer, e.price, e.nav ?? '', e.changePct, e.aum, e.expenseRatio, e.volume, e.category, e.trackingIndex, e.yield ?? '', e.inceptionDate])
    );
  }

  const comparisonData = useMemo(() => {
    if (selected.length < 2) return [];
    return selected.map((ticker) => {
      const etf = etfs.find((e) => e.ticker === ticker);
      if (!etf) return null;
      const closes = etf.history.map((p) => p.close);
      return {
        ticker: etf.ticker,
        name: etf.name,
        return1Y: calculateReturn(etf.history, 365) ?? 0,
        return3Y: calculateReturn(etf.history, 1095) ?? 0,
        volatility: calculateVolatility(closes.slice(-252)),
        maxDrawdown: calculateMaxDrawdown(closes.slice(-252)),
        expenseRatio: etf.expenseRatio,
        aum: etf.aum,
        normalized: etf.history.slice(-252).map((p, i, arr) => ({
          date: p.date,
          value: ((p.close - arr[0].close) / arr[0].close) * 100,
        })),
      };
    }).filter(Boolean);
  }, [selected, etfs]);

  const columns: Column<ETF>[] = [
    {
      key: 'select', header: '', sortable: false, align: 'center', accessor: () => 0,
      render: (e) => (
        <input
          type="checkbox"
          checked={selected.includes(e.ticker)}
          onChange={(ev) => { ev.stopPropagation(); toggleSelect(e.ticker); }}
          className="h-3.5 w-3.5 accent-primary"
        />
      ),
    },
    {
      key: 'ticker', header: 'Ticker', sortable: true, accessor: (e) => e.ticker,
      render: (e) => <span className="font-medium text-foreground">{e.ticker}</span>,
    },
    {
      key: 'name', header: 'Fund Name', sortable: true, accessor: (e) => e.name,
      render: (e) => <span className="text-muted-foreground truncate max-w-[180px] inline-block text-sm">{e.name}</span>,
    },
    {
      key: 'issuer', header: 'Issuer', sortable: true, accessor: (e) => e.issuer,
      render: (e) => <span className="text-muted-foreground text-xs">{e.issuer}</span>,
    },
    {
      key: 'price', header: 'Price', sortable: true, align: 'right', accessor: (e) => e.price,
      render: (e) => <span className="text-foreground">{formatPrice(e.price, e.currency)}</span>,
    },
    {
      key: 'changePct', header: 'Chg %', sortable: true, align: 'right', accessor: (e) => e.changePct,
      render: (e) => <ChangeBadge value={e.change} pct={e.changePct} size="sm" />,
    },
    {
      key: 'aum', header: 'AUM', sortable: true, align: 'right', accessor: (e) => e.aum,
      render: (e) => <span className="text-muted-foreground">{formatMarketCap(e.aum, e.currency)}</span>,
    },
    {
      key: 'expenseRatio', header: 'Expense', sortable: true, align: 'right', accessor: (e) => e.expenseRatio,
      render: (e) => <span className="text-muted-foreground">{e.expenseRatio.toFixed(3)}%</span>,
    },
    {
      key: 'volume', header: 'Volume', sortable: true, align: 'right', accessor: (e) => e.volume,
      render: (e) => <span className="text-muted-foreground">{formatVolume(e.volume)}</span>,
    },
    {
      key: 'category', header: 'Category', sortable: true, accessor: (e) => e.category,
      render: (e) => <span className="text-xs text-muted-foreground">{e.category}</span>,
    },
    {
      key: 'yield', header: 'Yield', sortable: true, align: 'right', accessor: (e) => e.yield ?? -1,
      render: (e) => <span className="text-muted-foreground">{e.yield !== null ? formatPercent(e.yield, false) : '—'}</span>,
    },
    {
      key: 'sparkline', header: '', sortable: false, align: 'right', accessor: () => 0,
      render: (e) => <Sparkline data={e.sparkline} width={60} height={24} positive={e.changePct >= 0} />,
    },
  ];

  return (
    <div className="animate-fade-in space-y-4">
      <PageHeader title="ETFs Explorer" description={`${filtered.length} ETFs · Select up to 5 to compare`}>
        <Button variant="outline" size="sm" onClick={handleExport}><Download className="mr-1.5 h-3.5 w-3.5" />Export</Button>
        {selected.length >= 2 && (
          <Button size="sm" onClick={() => navigate('/comparison')}>Compare ({selected.length})</Button>
        )}
        <DemoBadge />
      </PageHeader>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[200px] flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search ETFs..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {ETF_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            {(search || category !== 'all') && (
              <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setCategory('all'); }}><X className="mr-1 h-3.5 w-3.5" />Clear</Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <EmptyState title="No ETFs found" description="Try adjusting your filters." />
          ) : (
            <DataTable columns={columns} data={filtered} rowKey={(e) => e.id} onRowClick={(e) => navigate(`/etf/${e.ticker}`)} initialSortKey="aum" />
          )}
        </CardContent>
      </Card>

      {/* Comparison table */}
      {comparisonData.length >= 2 && (
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">ETF Comparison</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Metric</th>
                    {comparisonData.map((d) => (
                      <th key={d!.ticker} className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">{d!.ticker}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: '1Y Return', get: (d: typeof comparisonData[0]) => formatPercent(d!.return1Y), color: (d: typeof comparisonData[0]) => d!.return1Y >= 0 ? 'text-success' : 'text-destructive' },
                    { label: '3Y Return', get: (d: typeof comparisonData[0]) => formatPercent(d!.return3Y), color: (d: typeof comparisonData[0]) => d!.return3Y >= 0 ? 'text-success' : 'text-destructive' },
                    { label: 'Volatility (1Y)', get: (d: typeof comparisonData[0]) => `${d!.volatility.toFixed(2)}%`, color: () => 'text-foreground' },
                    { label: 'Max Drawdown', get: (d: typeof comparisonData[0]) => `${d!.maxDrawdown.toFixed(2)}%`, color: () => 'text-destructive' },
                    { label: 'Expense Ratio', get: (d: typeof comparisonData[0]) => `${d!.expenseRatio.toFixed(3)}%`, color: () => 'text-foreground' },
                    { label: 'AUM', get: (d: typeof comparisonData[0]) => formatMarketCap(d!.aum, 'USD'), color: () => 'text-foreground' },
                  ].map((row) => (
                    <tr key={row.label} className="border-b border-border/50">
                      <td className="px-3 py-2 text-muted-foreground">{row.label}</td>
                      {comparisonData.map((d) => (
                        <td key={d!.ticker} className={`px-3 py-2 text-right tabular-nums ${row.color(d)}`}>{row.get(d)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
