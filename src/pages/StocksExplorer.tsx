import { useState, useMemo } from 'react';
import { useStocks, useAllSectors, useExchanges } from '@/hooks/useData';
import { useAppStore } from '@/hooks/useAppStore';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { ChangeBadge } from '@/components/shared/ChangeBadge';
import { Sparkline } from '@/components/shared/Sparkline';
import { PageHeader, DemoBadge, EmptyState } from '@/components/shared/States';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { exportToCSV } from '@/lib/csv';
import { formatPrice, formatMarketCap, formatVolume, formatRatio, formatPercent } from '@/lib/format';
import { Search, Download, Star, X } from 'lucide-react';
import type { Stock } from '@/types';

const PAGE_SIZE = 15;

interface StocksExplorerProps {
  navigate: (path: string) => void;
}

export function StocksExplorer({ navigate }: StocksExplorerProps) {
  const store = useAppStore();
  const stocks = useStocks(store.market);
  const allSectors = useAllSectors();
  const exchanges = useExchanges();

  const [search, setSearch] = useState('');
  const [sectorFilter, setSectorFilter] = useState('all');
  const [exchangeFilter, setExchangeFilter] = useState('all');
  const [capFilter, setCapFilter] = useState('all');
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    let result = stocks;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((s) => s.ticker.toLowerCase().includes(q) || s.name.toLowerCase().includes(q));
    }
    if (sectorFilter !== 'all') result = result.filter((s) => s.sector === sectorFilter);
    if (exchangeFilter !== 'all') result = result.filter((s) => s.exchange === exchangeFilter);
    if (capFilter === 'large') result = result.filter((s) => s.marketCap >= 10e9);
    if (capFilter === 'mid') result = result.filter((s) => s.marketCap >= 2e9 && s.marketCap < 10e9);
    if (capFilter === 'small') result = result.filter((s) => s.marketCap < 2e9);
    return result;
  }, [stocks, search, sectorFilter, exchangeFilter, capFilter]);

  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  function handleExport() {
    exportToCSV('stocks.csv',
      ['Ticker', 'Name', 'Exchange', 'Sector', 'Price', 'Change', 'Change%', 'MarketCap', 'Volume', 'PE', '52W High', '52W Low'],
      filtered.map((s) => [s.ticker, s.name, s.exchange, s.sector, s.price, s.change, s.changePct, s.marketCap, s.volume, s.peRatio ?? '', s.high52, s.low52])
    );
  }

  function clearFilters() {
    setSearch('');
    setSectorFilter('all');
    setExchangeFilter('all');
    setCapFilter('all');
    setPage(0);
  }

  const columns: Column<Stock>[] = [
    {
      key: 'ticker', header: 'Ticker', sortable: true,
      accessor: (s) => s.ticker,
      render: (s) => (
        <button
          onClick={(e) => { e.stopPropagation(); store.addToWatchlist(store.watchlists[0]?.id ?? '', s.ticker, 'stock'); }}
          className="mr-1.5 inline-flex text-muted-foreground hover:text-warning"
          title="Add to watchlist"
        >
          <Star className="h-3.5 w-3.5" />
        </button>
      ),
    },
    {
      key: 'name', header: 'Company', sortable: true,
      accessor: (s) => s.name,
      render: (s) => <span className="text-foreground hover:text-primary cursor-pointer">{s.name}</span>,
    },
    {
      key: 'exchange', header: 'Exchange', sortable: true,
      accessor: (s) => s.exchange,
      render: (s) => <span className="text-muted-foreground text-xs">{s.exchange}</span>,
    },
    {
      key: 'sector', header: 'Sector', sortable: true,
      accessor: (s) => s.sector,
      render: (s) => <span className="text-muted-foreground text-xs">{s.sector}</span>,
    },
    {
      key: 'price', header: 'Price', sortable: true, align: 'right',
      accessor: (s) => s.price,
      render: (s) => <span className="text-foreground">{formatPrice(s.price, s.currency)}</span>,
    },
    {
      key: 'change', header: 'Change', sortable: true, align: 'right',
      accessor: (s) => s.change,
      render: (s) => <span className={s.change >= 0 ? 'text-success' : 'text-destructive'}>{formatPrice(s.change, s.currency)}</span>,
    },
    {
      key: 'changePct', header: 'Chg %', sortable: true, align: 'right',
      accessor: (s) => s.changePct,
      render: (s) => <ChangeBadge value={s.change} pct={s.changePct} size="sm" />,
    },
    {
      key: 'marketCap', header: 'Mkt Cap', sortable: true, align: 'right',
      accessor: (s) => s.marketCap,
      render: (s) => <span className="text-muted-foreground">{formatMarketCap(s.marketCap, s.currency)}</span>,
    },
    {
      key: 'volume', header: 'Volume', sortable: true, align: 'right',
      accessor: (s) => s.volume,
      render: (s) => <span className="text-muted-foreground">{formatVolume(s.volume)}</span>,
    },
    {
      key: 'peRatio', header: 'P/E', sortable: true, align: 'right',
      accessor: (s) => s.peRatio,
      render: (s) => <span className="text-muted-foreground">{formatRatio(s.peRatio)}</span>,
    },
    {
      key: 'high52', header: '52W High', sortable: true, align: 'right',
      accessor: (s) => s.high52,
      render: (s) => <span className="text-muted-foreground">{formatPrice(s.high52, s.currency)}</span>,
    },
    {
      key: 'low52', header: '52W Low', sortable: true, align: 'right',
      accessor: (s) => s.low52,
      render: (s) => <span className="text-muted-foreground">{formatPrice(s.low52, s.currency)}</span>,
    },
    {
      key: 'sparkline', header: '', sortable: false, align: 'right',
      accessor: () => 0,
      render: (s) => <Sparkline data={s.sparkline} width={60} height={24} positive={s.changePct >= 0} />,
    },
  ];

  return (
    <div className="animate-fade-in space-y-4">
      <PageHeader title="Stocks Explorer" description={`${filtered.length} stocks · US markets`}>
        <Button variant="outline" size="sm" onClick={handleExport}><Download className="mr-1.5 h-3.5 w-3.5" />Export</Button>
        <DemoBadge />
      </PageHeader>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[200px] flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by ticker or company..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                className="pl-9"
              />
            </div>
            <Select value={sectorFilter} onValueChange={(v) => { setSectorFilter(v); setPage(0); }}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="Sector" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sectors</SelectItem>
                {allSectors.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={exchangeFilter} onValueChange={(v) => { setExchangeFilter(v); setPage(0); }}>
              <SelectTrigger className="w-[110px]"><SelectValue placeholder="Exchange" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Exchanges</SelectItem>
                {exchanges.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={capFilter} onValueChange={(v) => { setCapFilter(v); setPage(0); }}>
              <SelectTrigger className="w-[120px]"><SelectValue placeholder="Market Cap" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Caps</SelectItem>
                <SelectItem value="large">Large Cap</SelectItem>
                <SelectItem value="mid">Mid Cap</SelectItem>
                <SelectItem value="small">Small Cap</SelectItem>
              </SelectContent>
            </Select>
            {(search || sectorFilter !== 'all' || exchangeFilter !== 'all' || capFilter !== 'all') && (
              <Button variant="ghost" size="sm" onClick={clearFilters}><X className="mr-1 h-3.5 w-3.5" />Clear</Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <EmptyState title="No stocks found" description="Try adjusting your filters or search query." />
          ) : (
            <DataTable columns={columns} data={paged} rowKey={(s) => s.id} onRowClick={(s) => navigate(`/stock/${s.ticker}`)} initialSortKey="marketCap" />
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Page {page + 1} of {totalPages}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>Prev</Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}
