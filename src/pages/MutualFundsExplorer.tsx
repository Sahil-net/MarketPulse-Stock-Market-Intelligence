import { useState, useMemo } from 'react';
import { useMutualFunds } from '@/hooks/useData';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { PageHeader, DemoBadge, EmptyState } from '@/components/shared/States';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { exportToCSV } from '@/lib/csv';
import { formatPrice, formatMarketCap, formatPercent, formatDate } from '@/lib/format';
import { Search, Download, X } from 'lucide-react';
import type { MutualFund } from '@/types';

interface MutualFundsExplorerProps {
  navigate: (path: string) => void;
}

const CATEGORIES = ['Equity', 'Debt', 'Hybrid', 'Index', 'ELSS', 'Liquid'];
const PLANS = ['Direct', 'Regular'];
const OPTIONS = ['Growth', 'IDCW'];

export function MutualFundsExplorer({ navigate }: MutualFundsExplorerProps) {
  const funds = useMutualFunds();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [plan, setPlan] = useState('all');
  const [option, setOption] = useState('all');

  const filtered = useMemo(() => {
    let result = funds;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((f) => f.name.toLowerCase().includes(q) || f.amc.toLowerCase().includes(q));
    }
    if (category !== 'all') result = result.filter((f) => f.category === category);
    if (plan !== 'all') result = result.filter((f) => f.plan === plan);
    if (option !== 'all') result = result.filter((f) => f.option === option);
    return result;
  }, [funds, search, category, plan, option]);

  function handleExport() {
    exportToCSV('mutual-funds.csv',
      ['Scheme', 'AMC', 'Category', 'Plan', 'Option', 'NAV', 'Expense Ratio', 'AUM', '1M', '3M', '6M', '1Y', '3Y', '5Y', 'Benchmark', 'Risk'],
      filtered.map((f) => [f.name, f.amc, f.category, f.plan, f.option, f.nav, f.expenseRatio, f.aum, f.returns['1M'], f.returns['3M'], f.returns['6M'], f.returns['1Y'], f.returns['3Y'], f.returns['5Y'], f.benchmark, f.riskLevel])
    );
  }

  const riskColor: Record<string, string> = {
    'Low': 'text-success', 'Moderate': 'text-warning', 'High': 'text-destructive', 'Very High': 'text-destructive',
  };

  const columns: Column<MutualFund>[] = [
    {
      key: 'name', header: 'Scheme Name', sortable: true, accessor: (f) => f.name,
      render: (f) => (
        <div className="max-w-[220px]">
          <span className="text-foreground hover:text-primary cursor-pointer text-sm">{f.name}</span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Badge variant="outline" className="text-[10px]">{f.category}</Badge>
            <Badge variant="secondary" className="text-[10px]">{f.plan}</Badge>
            <Badge variant="secondary" className="text-[10px]">{f.option}</Badge>
          </div>
        </div>
      ),
    },
    {
      key: 'amc', header: 'AMC', sortable: true, accessor: (f) => f.amc,
      render: (f) => <span className="text-muted-foreground text-xs">{f.amc}</span>,
    },
    {
      key: 'nav', header: 'NAV', sortable: true, align: 'right', accessor: (f) => f.nav,
      render: (f) => <span className="text-foreground">{formatPrice(f.nav, 'INR')}</span>,
    },
    {
      key: 'returns.1M', header: '1M', sortable: true, align: 'right', accessor: (f) => f.returns['1M'],
      render: (f) => <span className={f.returns['1M'] >= 0 ? 'text-success' : 'text-destructive'}>{formatPercent(f.returns['1M'])}</span>,
    },
    {
      key: 'returns.3M', header: '3M', sortable: true, align: 'right', accessor: (f) => f.returns['3M'],
      render: (f) => <span className={f.returns['3M'] >= 0 ? 'text-success' : 'text-destructive'}>{formatPercent(f.returns['3M'])}</span>,
    },
    {
      key: 'returns.6M', header: '6M', sortable: true, align: 'right', accessor: (f) => f.returns['6M'],
      render: (f) => <span className={f.returns['6M'] >= 0 ? 'text-success' : 'text-destructive'}>{formatPercent(f.returns['6M'])}</span>,
    },
    {
      key: 'returns.1Y', header: '1Y', sortable: true, align: 'right', accessor: (f) => f.returns['1Y'],
      render: (f) => <span className={f.returns['1Y'] >= 0 ? 'text-success' : 'text-destructive'}>{formatPercent(f.returns['1Y'])}</span>,
    },
    {
      key: 'returns.3Y', header: '3Y', sortable: true, align: 'right', accessor: (f) => f.returns['3Y'],
      render: (f) => <span className={f.returns['3Y'] >= 0 ? 'text-success' : 'text-destructive'}>{formatPercent(f.returns['3Y'])}</span>,
    },
    {
      key: 'returns.5Y', header: '5Y', sortable: true, align: 'right', accessor: (f) => f.returns['5Y'],
      render: (f) => <span className={f.returns['5Y'] >= 0 ? 'text-success' : 'text-destructive'}>{formatPercent(f.returns['5Y'])}</span>,
    },
    {
      key: 'expenseRatio', header: 'Expense', sortable: true, align: 'right', accessor: (f) => f.expenseRatio,
      render: (f) => <span className="text-muted-foreground">{f.expenseRatio.toFixed(2)}%</span>,
    },
    {
      key: 'aum', header: 'AUM', sortable: true, align: 'right', accessor: (f) => f.aum,
      render: (f) => <span className="text-muted-foreground">{formatMarketCap(f.aum, 'INR')}</span>,
    },
    {
      key: 'benchmark', header: 'Benchmark', sortable: true, accessor: (f) => f.benchmark,
      render: (f) => <span className="text-muted-foreground text-xs">{f.benchmark}</span>,
    },
    {
      key: 'riskLevel', header: 'Risk', sortable: true, accessor: (f) => f.riskLevel,
      render: (f) => <span className={`text-xs font-medium ${riskColor[f.riskLevel]}`}>{f.riskLevel}</span>,
    },
  ];

  return (
    <div className="animate-fade-in space-y-4">
      <PageHeader title="Mutual Funds Explorer" description="Indian mutual funds with NAV history and performance returns">
        <Button variant="outline" size="sm" onClick={handleExport}><Download className="mr-1.5 h-3.5 w-3.5" />Export</Button>
        <DemoBadge />
      </PageHeader>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[200px] flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search by scheme or AMC..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-[110px]"><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={plan} onValueChange={setPlan}>
              <SelectTrigger className="w-[100px]"><SelectValue placeholder="Plan" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Plans</SelectItem>
                {PLANS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={option} onValueChange={setOption}>
              <SelectTrigger className="w-[110px]"><SelectValue placeholder="Option" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Options</SelectItem>
                {OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
              </SelectContent>
            </Select>
            {(search || category !== 'all' || plan !== 'all' || option !== 'all') && (
              <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setCategory('all'); setPlan('all'); setOption('all'); }}><X className="mr-1 h-3.5 w-3.5" />Clear</Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <EmptyState title="No funds found" description="Try adjusting your filters." />
          ) : (
            <DataTable columns={columns} data={filtered} rowKey={(f) => f.id} onRowClick={(f) => navigate(`/mutual-fund/${f.id}`)} initialSortKey="aum" dense />
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        NAV data is updated at end of each trading day. Returns for periods &gt; 1 year are annualized (CAGR).
        This is demo data for illustration only.
      </p>
    </div>
  );
}
