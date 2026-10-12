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
import { calculateReturn } from '@/services/technicalAnalysis';
import { formatPrice, formatPercent, formatVolume } from '@/lib/format';
import { Download } from 'lucide-react';
import type { PeriodKey, Stock, ETF, MutualFund } from '@/types';

interface RankingsProps {
  navigate: (path: string) => void;
  mode: 'gainers' | 'losers';
}

const PERIOD_OPTIONS: PeriodKey[] = ['1D', '1W', '1M', '3M', '6M', 'YTD', '1Y', '3Y', '5Y'];
const PERIOD_DAYS: Record<PeriodKey, number> = { '1D': 1, '1W': 7, '1M': 30, '3M': 90, '6M': 180, YTD: 0, '1Y': 365, '3Y': 1095, '5Y': 1825 };

export function Rankings({ navigate, mode }: RankingsProps) {
  const store = useAppStore();
  const stocks = useStocks(store.market);
  const etfs = useETFs(store.market);
  const funds = useMutualFunds();
  const sectors = useSectors(store.market);

  const [period, setPeriod] = useState<PeriodKey>('1M');
  const [assetType, setAssetType] = useState<'stocks' | 'etfs' | 'funds' | 'sectors'>('stocks');

  const periodDays = period === 'YTD' ? Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 1).getTime()) / 86400000) : PERIOD_DAYS[period];

  const stockResults = useMemo(() => {
    return stocks
      .map((s) => {
        const ret = calculateReturn(s.history, periodDays);
        return { symbol: s.ticker, name: s.name, type: 'stock' as const, exchange: s.exchange, startPrice: s.history[s.history.length - 1 - periodDays]?.close ?? 0, endPrice: s.price, returnPct: ret ?? 0, volume: s.volume, currency: s.currency };
      })
      .filter((r) => r.startPrice > 0)
      .sort((a, b) => mode === 'gainers' ? b.returnPct - a.returnPct : a.returnPct - b.returnPct);
  }, [stocks, periodDays, mode]);

  const etfResults = useMemo(() => {
    return etfs
      .map((e) => {
        const ret = calculateReturn(e.history, periodDays);
        return { symbol: e.ticker, name: e.name, type: 'etf' as const, exchange: e.exchange, startPrice: e.history[e.history.length - 1 - periodDays]?.close ?? 0, endPrice: e.price, returnPct: ret ?? 0, volume: e.volume, currency: e.currency };
      })
      .filter((r) => r.startPrice > 0)
      .sort((a, b) => mode === 'gainers' ? b.returnPct - a.returnPct : a.returnPct - b.returnPct);
  }, [etfs, periodDays, mode]);

  const fundResults = useMemo(() => {
    const retMap: Record<string, keyof typeof funds[0]['returns']> = { '1M': '1M', '3M': '3M', '6M': '6M', '1Y': '1Y', '3Y': '3Y', '5Y': '5Y' };
    const retKey = retMap[period] ?? '1Y';
    return funds
      .map((f) => ({ symbol: f.id, name: f.name, type: 'mutualfund' as const, exchange: '—', startPrice: 0, endPrice: f.nav, returnPct: f.returns[retKey] ?? 0, volume: 0, currency: 'INR' as const }))
      .sort((a, b) => mode === 'gainers' ? b.returnPct - a.returnPct : a.returnPct - b.returnPct);
  }, [funds, period, mode]);

  const sectorResults = useMemo(() => {
    return sectors.map((s) => ({ symbol: s.name, name: s.name, type: 'sector' as const, exchange: '—', startPrice: 0, endPrice: 0, returnPct: s.changePct, volume: 0, currency: store.currency }))
      .sort((a, b) => mode === 'gainers' ? b.returnPct - a.returnPct : a.returnPct - b.returnPct);
  }, [sectors, mode, store.currency]);

  const results = assetType === 'stocks' ? stockResults : assetType === 'etfs' ? etfResults : assetType === 'funds' ? fundResults : sectorResults;

  function handleExport() {
    exportToCSV(`${mode}-${assetType}-${period}.csv`,
      ['Symbol', 'Name', 'Type', 'Return %', 'Start Price', 'End Price', 'Volume'],
      results.map((r) => [r.symbol, r.name, r.type, r.returnPct.toFixed(2), r.startPrice, r.endPrice, r.volume])
    );
  }

  const columns: Column<typeof results[0]>[] = [
    { key: 'rank', header: '#', sortable: false, align: 'right', accessor: () => 0, render: (_item, i) => <span className="text-muted-foreground text-xs">{(i ?? 0) + 1}</span> },
    {
      key: 'symbol', header: 'Symbol', sortable: true, accessor: (r) => r.symbol,
      render: (r) => <span className="font-medium text-foreground">{r.symbol}</span>,
    },
    {
      key: 'name', header: 'Name', sortable: true, accessor: (r) => r.name,
      render: (r) => <span className="text-muted-foreground text-sm truncate max-w-[200px] inline-block">{r.name}</span>,
    },
    {
      key: 'type', header: 'Type', sortable: true, accessor: (r) => r.type,
      render: (r) => <span className="text-xs uppercase text-muted-foreground">{r.type === 'mutualfund' ? 'Fund' : r.type}</span>,
    },
    {
      key: 'returnPct', header: 'Return %', sortable: true, align: 'right', accessor: (r) => r.returnPct,
      render: (r) => <ChangeBadge value={r.returnPct} pct={r.returnPct} size="sm" />,
    },
    {
      key: 'startPrice', header: 'Start', sortable: true, align: 'right', accessor: (r) => r.startPrice,
      render: (r) => <span className="text-muted-foreground">{r.startPrice > 0 ? formatPrice(r.startPrice, r.currency) : '—'}</span>,
    },
    {
      key: 'endPrice', header: 'End', sortable: true, align: 'right', accessor: (r) => r.endPrice,
      render: (r) => <span className="text-foreground">{r.endPrice > 0 ? formatPrice(r.endPrice, r.currency) : '—'}</span>,
    },
    {
      key: 'volume', header: 'Volume', sortable: true, align: 'right', accessor: (r) => r.volume,
      render: (r) => <span className="text-muted-foreground">{r.volume > 0 ? formatVolume(r.volume) : '—'}</span>,
    },
  ];

  return (
    <div className="animate-fade-in space-y-4">
      <PageHeader
        title={mode === 'gainers' ? 'Top Gainers' : 'Top Losers'}
        description={`Ranked by ${period} performance · Return (%) = ((End Price - Start Price) / Start Price) × 100`}
      >
        <Button variant="outline" size="sm" onClick={handleExport}><Download className="mr-1.5 h-3.5 w-3.5" />Export</Button>
        <DemoBadge />
      </PageHeader>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <Tabs value={assetType} onValueChange={(v) => setAssetType(v as typeof assetType)}>
              <TabsList>
                <TabsTrigger value="stocks">Stocks</TabsTrigger>
                <TabsTrigger value="etfs">ETFs</TabsTrigger>
                <TabsTrigger value="funds">Funds</TabsTrigger>
                <TabsTrigger value="sectors">Sectors</TabsTrigger>
              </TabsList>
            </Tabs>
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
            <EmptyState title="No results" description="No data available for the selected period and asset type." />
          ) : (
            <DataTable
              columns={columns}
              data={results}
              rowKey={(r) => r.symbol}
              onRowClick={(r) => {
                if (r.type === 'stock') navigate(`/stock/${r.symbol}`);
                else if (r.type === 'etf') navigate(`/etf/${r.symbol}`);
                else if (r.type === 'mutualfund') navigate(`/mutual-fund/${r.symbol}`);
              }}
              initialSortKey="returnPct"
              initialSortDir={mode === 'gainers' ? 'desc' : 'asc'}
              dense
            />
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Methodology: Price returns calculated using closing prices. Returns for periods &gt; 1 year are not annualized in this view.
        Data is demo data for illustration purposes and should not be used for investment decisions.
      </p>
    </div>
  );
}
