import { useState, useMemo } from 'react';
import { useStocks, useAllSectors, useExchanges } from '@/hooks/useData';
import { useAppStore } from '@/hooks/useAppStore';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { ChangeBadge } from '@/components/shared/ChangeBadge';
import { PageHeader, DemoBadge, EmptyState } from '@/components/shared/States';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { exportToCSV } from '@/lib/csv';
import { calculateReturn } from '@/services/technicalAnalysis';
import { formatPrice, formatMarketCap, formatVolume, formatRatio, formatPercent } from '@/lib/format';
import { Download, Filter, X, SlidersHorizontal } from 'lucide-react';
import type { Stock } from '@/types';

interface StockScreenerProps {
  navigate: (path: string) => void;
}

interface Filters {
  sector: string;
  exchange: string;
  minMarketCap: string;
  minDailyReturn: string;
  maxDailyReturn: string;
  minVolume: string;
  minPE: string;
  maxPE: string;
  minDivYield: string;
  aboveSMA50: boolean;
  aboveSMA200: boolean;
}

const DEFAULT_FILTERS: Filters = {
  sector: 'all', exchange: 'all', minMarketCap: '', minDailyReturn: '', maxDailyReturn: '',
  minVolume: '', minPE: '', maxPE: '', minDivYield: '', aboveSMA50: false, aboveSMA200: false,
};

export function StockScreener({ navigate }: StockScreenerProps) {
  const store = useAppStore();
  const stocks = useStocks(store.market);
  const allSectors = useAllSectors();
  const exchanges = useExchanges();
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);

  const filtered = useMemo(() => {
    return stocks.filter((s) => {
      if (filters.sector !== 'all' && s.sector !== filters.sector) return false;
      if (filters.exchange !== 'all' && s.exchange !== filters.exchange) return false;
      if (filters.minMarketCap && s.marketCap < parseFloat(filters.minMarketCap) * 1e9) return false;
      if (filters.minDailyReturn && s.changePct < parseFloat(filters.minDailyReturn)) return false;
      if (filters.maxDailyReturn && s.changePct > parseFloat(filters.maxDailyReturn)) return false;
      if (filters.minVolume && s.volume < parseFloat(filters.minVolume) * 1e6) return false;
      if (filters.minPE && (s.peRatio === null || s.peRatio < parseFloat(filters.minPE))) return false;
      if (filters.maxPE && (s.peRatio === null || s.peRatio > parseFloat(filters.maxPE))) return false;
      if (filters.minDivYield && (s.dividendYield === null || s.dividendYield < parseFloat(filters.minDivYield))) return false;
      if (filters.aboveSMA50) {
        const sma50 = s.history.slice(-50).reduce((sum, p) => sum + p.close, 0) / 50;
        if (s.price < sma50) return false;
      }
      if (filters.aboveSMA200) {
        const sma200 = s.history.slice(-200).reduce((sum, p) => sum + p.close, 0) / 200;
        if (s.price < sma200) return false;
      }
      return true;
    });
  }, [stocks, filters]);

  function updateFilter<K extends keyof Filters>(key: K, value: Filters[K]) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  function handleExport() {
    exportToCSV('screener-results.csv',
      ['Ticker', 'Name', 'Sector', 'Price', 'Change%', 'MarketCap', 'PE', 'DivYield', 'Volume'],
      filtered.map((s) => [s.ticker, s.name, s.sector, s.price, s.changePct, s.marketCap, s.peRatio ?? '', s.dividendYield ?? '', s.volume])
    );
  }

  const columns: Column<Stock>[] = [
    { key: 'ticker', header: 'Ticker', sortable: true, accessor: (s) => s.ticker, render: (s) => <span className="font-medium text-foreground">{s.ticker}</span> },
    { key: 'name', header: 'Company', sortable: true, accessor: (s) => s.name, render: (s) => <span className="text-muted-foreground text-sm truncate max-w-[160px] inline-block">{s.name}</span> },
    { key: 'sector', header: 'Sector', sortable: true, accessor: (s) => s.sector, render: (s) => <span className="text-muted-foreground text-xs">{s.sector}</span> },
    { key: 'price', header: 'Price', sortable: true, align: 'right', accessor: (s) => s.price, render: (s) => <span className="text-foreground">{formatPrice(s.price, s.currency)}</span> },
    { key: 'changePct', header: 'Chg %', sortable: true, align: 'right', accessor: (s) => s.changePct, render: (s) => <ChangeBadge value={s.change} pct={s.changePct} size="sm" /> },
    { key: 'marketCap', header: 'Mkt Cap', sortable: true, align: 'right', accessor: (s) => s.marketCap, render: (s) => <span className="text-muted-foreground">{formatMarketCap(s.marketCap, s.currency)}</span> },
    { key: 'peRatio', header: 'P/E', sortable: true, align: 'right', accessor: (s) => s.peRatio, render: (s) => <span className="text-muted-foreground">{formatRatio(s.peRatio)}</span> },
    { key: 'dividendYield', header: 'Div Yld', sortable: true, align: 'right', accessor: (s) => s.dividendYield ?? -1, render: (s) => <span className="text-muted-foreground">{s.dividendYield !== null ? formatPercent(s.dividendYield, false) : '—'}</span> },
    { key: 'volume', header: 'Volume', sortable: true, align: 'right', accessor: (s) => s.volume, render: (s) => <span className="text-muted-foreground">{formatVolume(s.volume)}</span> },
  ];

  const activeFilterCount = Object.entries(filters).filter(([k, v]) => v !== DEFAULT_FILTERS[k as keyof Filters]).length;

  return (
    <div className="animate-fade-in space-y-4">
      <PageHeader title="Stock Screener" description={`${filtered.length} stocks match your criteria`}>
        <Button variant="outline" size="sm" onClick={handleExport}><Download className="mr-1.5 h-3.5 w-3.5" />Export</Button>
        <DemoBadge />
      </PageHeader>

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        {/* Filter panel */}
        <Card className="h-fit">
          <CardContent className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-semibold"><SlidersHorizontal className="h-4 w-4 text-primary" />Filters</h3>
              {activeFilterCount > 0 && (
                <Button variant="ghost" size="sm" onClick={() => setFilters(DEFAULT_FILTERS)}><X className="mr-1 h-3 w-3" />Clear ({activeFilterCount})</Button>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <Label className="text-xs">Sector</Label>
                <Select value={filters.sector} onValueChange={(v) => updateFilter('sector', v)}>
                  <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sectors</SelectItem>
                    {allSectors.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs">Exchange</Label>
                <Select value={filters.exchange} onValueChange={(v) => updateFilter('exchange', v)}>
                  <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Exchanges</SelectItem>
                    {exchanges.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div>
                <Label className="text-xs">Min Market Cap (B)</Label>
                <Input className="mt-1 h-8 text-xs" type="number" placeholder="e.g. 10" value={filters.minMarketCap} onChange={(e) => updateFilter('minMarketCap', e.target.value)} />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Min Daily %</Label>
                  <Input className="mt-1 h-8 text-xs" type="number" placeholder="-5" value={filters.minDailyReturn} onChange={(e) => updateFilter('minDailyReturn', e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">Max Daily %</Label>
                  <Input className="mt-1 h-8 text-xs" type="number" placeholder="5" value={filters.maxDailyReturn} onChange={(e) => updateFilter('maxDailyReturn', e.target.value)} />
                </div>
              </div>

              <div>
                <Label className="text-xs">Min Volume (M)</Label>
                <Input className="mt-1 h-8 text-xs" type="number" placeholder="e.g. 1" value={filters.minVolume} onChange={(e) => updateFilter('minVolume', e.target.value)} />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Min P/E</Label>
                  <Input className="mt-1 h-8 text-xs" type="number" placeholder="0" value={filters.minPE} onChange={(e) => updateFilter('minPE', e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">Max P/E</Label>
                  <Input className="mt-1 h-8 text-xs" type="number" placeholder="50" value={filters.maxPE} onChange={(e) => updateFilter('maxPE', e.target.value)} />
                </div>
              </div>

              <div>
                <Label className="text-xs">Min Div Yield (%)</Label>
                <Input className="mt-1 h-8 text-xs" type="number" placeholder="0" value={filters.minDivYield} onChange={(e) => updateFilter('minDivYield', e.target.value)} />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label className="text-xs">Technical Filters</Label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={filters.aboveSMA50} onChange={(e) => updateFilter('aboveSMA50', e.target.checked)} className="h-3.5 w-3.5 accent-primary" />
                  <span className="text-xs text-muted-foreground">Price above SMA 50</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={filters.aboveSMA200} onChange={(e) => updateFilter('aboveSMA200', e.target.checked)} className="h-3.5 w-3.5 accent-primary" />
                  <span className="text-xs text-muted-foreground">Price above SMA 200</span>
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardContent className="p-0">
            {filtered.length === 0 ? (
              <EmptyState title="No stocks match" description="Adjust your filter criteria to see results." icon={<Filter className="h-12 w-12" />} />
            ) : (
              <DataTable columns={columns} data={filtered} rowKey={(s) => s.id} onRowClick={(s) => navigate(`/stock/${s.ticker}`)} initialSortKey="marketCap" dense />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
