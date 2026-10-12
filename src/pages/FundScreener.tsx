import { useState, useMemo } from 'react';
import { useMutualFunds } from '@/hooks/useData';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { PageHeader, DemoBadge, EmptyState } from '@/components/shared/States';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { exportToCSV } from '@/lib/csv';
import { formatPrice, formatMarketCap, formatPercent } from '@/lib/format';
import { Download, X, SlidersHorizontal } from 'lucide-react';
import type { MutualFund } from '@/types';

interface FundScreenerProps {
  navigate: (path: string) => void;
}

interface FundFilters {
  category: string;
  plan: string;
  option: string;
  minNav: string;
  maxExpense: string;
  minAum: string;
  minReturn1Y: string;
  minReturn3Y: string;
  riskLevel: string;
}

const DEFAULT_FILTERS: FundFilters = {
  category: 'all', plan: 'all', option: 'all', minNav: '', maxExpense: '', minAum: '', minReturn1Y: '', minReturn3Y: '', riskLevel: 'all',
};

export function FundScreener({ navigate }: FundScreenerProps) {
  const funds = useMutualFunds();
  const [filters, setFilters] = useState<FundFilters>(DEFAULT_FILTERS);

  const filtered = useMemo(() => {
    return funds.filter((f) => {
      if (filters.category !== 'all' && f.category !== filters.category) return false;
      if (filters.plan !== 'all' && f.plan !== filters.plan) return false;
      if (filters.option !== 'all' && f.option !== filters.option) return false;
      if (filters.minNav && f.nav < parseFloat(filters.minNav)) return false;
      if (filters.maxExpense && f.expenseRatio > parseFloat(filters.maxExpense)) return false;
      if (filters.minAum && f.aum < parseFloat(filters.minAum) * 1e7) return false;
      if (filters.minReturn1Y && f.returns['1Y'] < parseFloat(filters.minReturn1Y)) return false;
      if (filters.minReturn3Y && f.returns['3Y'] < parseFloat(filters.minReturn3Y)) return false;
      if (filters.riskLevel !== 'all' && f.riskLevel !== filters.riskLevel) return false;
      return true;
    });
  }, [funds, filters]);

  function updateFilter<K extends keyof FundFilters>(key: K, value: FundFilters[K]) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  function handleExport() {
    exportToCSV('fund-screener.csv',
      ['Scheme', 'AMC', 'Category', 'Plan', 'NAV', 'Expense', '1Y%', '3Y%', '5Y%', 'AUM', 'Risk'],
      filtered.map((f) => [f.name, f.amc, f.category, f.plan, f.nav, f.expenseRatio, f.returns['1Y'], f.returns['3Y'], f.returns['5Y'], f.aum, f.riskLevel])
    );
  }

  const columns: Column<MutualFund>[] = [
    { key: 'name', header: 'Scheme', sortable: true, accessor: (f) => f.name, render: (f) => <span className="text-foreground text-sm hover:text-primary">{f.name}</span> },
    { key: 'amc', header: 'AMC', sortable: true, accessor: (f) => f.amc, render: (f) => <span className="text-muted-foreground text-xs">{f.amc}</span> },
    { key: 'category', header: 'Category', sortable: true, accessor: (f) => f.category, render: (f) => <span className="text-xs text-muted-foreground">{f.category}</span> },
    { key: 'nav', header: 'NAV', sortable: true, align: 'right', accessor: (f) => f.nav, render: (f) => <span className="text-foreground">{formatPrice(f.nav, 'INR')}</span> },
    { key: 'expenseRatio', header: 'Expense', sortable: true, align: 'right', accessor: (f) => f.expenseRatio, render: (f) => <span className="text-muted-foreground">{f.expenseRatio.toFixed(2)}%</span> },
    { key: 'returns.1Y', header: '1Y', sortable: true, align: 'right', accessor: (f) => f.returns['1Y'], render: (f) => <span className={f.returns['1Y'] >= 0 ? 'text-success' : 'text-destructive'}>{formatPercent(f.returns['1Y'])}</span> },
    { key: 'returns.3Y', header: '3Y', sortable: true, align: 'right', accessor: (f) => f.returns['3Y'], render: (f) => <span className={f.returns['3Y'] >= 0 ? 'text-success' : 'text-destructive'}>{formatPercent(f.returns['3Y'])}</span> },
    { key: 'returns.5Y', header: '5Y', sortable: true, align: 'right', accessor: (f) => f.returns['5Y'], render: (f) => <span className={f.returns['5Y'] >= 0 ? 'text-success' : 'text-destructive'}>{formatPercent(f.returns['5Y'])}</span> },
    { key: 'aum', header: 'AUM', sortable: true, align: 'right', accessor: (f) => f.aum, render: (f) => <span className="text-muted-foreground">{formatMarketCap(f.aum, 'INR')}</span> },
    { key: 'riskLevel', header: 'Risk', sortable: true, accessor: (f) => f.riskLevel, render: (f) => <span className="text-xs text-muted-foreground">{f.riskLevel}</span> },
  ];

  const activeFilterCount = Object.entries(filters).filter(([k, v]) => v !== DEFAULT_FILTERS[k as keyof FundFilters]).length;

  return (
    <div className="animate-fade-in space-y-4">
      <PageHeader title="Fund Screener" description={`${filtered.length} funds match your criteria`}>
        <Button variant="outline" size="sm" onClick={handleExport}><Download className="mr-1.5 h-3.5 w-3.5" />Export</Button>
        <DemoBadge />
      </PageHeader>

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
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
                <Label className="text-xs">Category</Label>
                <Select value={filters.category} onValueChange={(v) => updateFilter('category', v)}>
                  <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {['Equity', 'Debt', 'Hybrid', 'Index', 'ELSS', 'Liquid'].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Plan</Label>
                  <Select value={filters.plan} onValueChange={(v) => updateFilter('plan', v)}>
                    <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="Direct">Direct</SelectItem>
                      <SelectItem value="Regular">Regular</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Option</Label>
                  <Select value={filters.option} onValueChange={(v) => updateFilter('option', v)}>
                    <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="Growth">Growth</SelectItem>
                      <SelectItem value="IDCW">IDCW</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div>
                <Label className="text-xs">Min NAV (₹)</Label>
                <input className="mt-1 h-8 w-full rounded-md border border-input bg-transparent px-2 text-xs" type="number" placeholder="0" value={filters.minNav} onChange={(e) => updateFilter('minNav', e.target.value)} />
              </div>

              <div>
                <Label className="text-xs">Max Expense (%)</Label>
                <input className="mt-1 h-8 w-full rounded-md border border-input bg-transparent px-2 text-xs" type="number" placeholder="2" value={filters.maxExpense} onChange={(e) => updateFilter('maxExpense', e.target.value)} />
              </div>

              <div>
                <Label className="text-xs">Min AUM (Cr ₹)</Label>
                <input className="mt-1 h-8 w-full rounded-md border border-input bg-transparent px-2 text-xs" type="number" placeholder="1000" value={filters.minAum} onChange={(e) => updateFilter('minAum', e.target.value)} />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Min 1Y (%)</Label>
                  <input className="mt-1 h-8 w-full rounded-md border border-input bg-transparent px-2 text-xs" type="number" placeholder="10" value={filters.minReturn1Y} onChange={(e) => updateFilter('minReturn1Y', e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">Min 3Y (%)</Label>
                  <input className="mt-1 h-8 w-full rounded-md border border-input bg-transparent px-2 text-xs" type="number" placeholder="10" value={filters.minReturn3Y} onChange={(e) => updateFilter('minReturn3Y', e.target.value)} />
                </div>
              </div>

              <div>
                <Label className="text-xs">Risk Level</Label>
                <Select value={filters.riskLevel} onValueChange={(v) => updateFilter('riskLevel', v)}>
                  <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Moderate">Moderate</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Very High">Very High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            {filtered.length === 0 ? (
              <EmptyState title="No funds match" description="Adjust your filter criteria to see results." />
            ) : (
              <DataTable columns={columns} data={filtered} rowKey={(f) => f.id} onRowClick={(f) => navigate(`/mutual-fund/${f.id}`)} initialSortKey="aum" dense />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
