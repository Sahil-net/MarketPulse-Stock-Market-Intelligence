import { useState, useMemo } from 'react';
import { useAppStore } from '@/hooks/useAppStore';
import { useStocks, useETFs } from '@/hooks/useData';
import { PageHeader, DemoBadge, EmptyState } from '@/components/shared/States';
import { ChangeBadge } from '@/components/shared/ChangeBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatPrice, formatPercent } from '@/lib/format';
import { Plus, Trash2, Briefcase, TrendingUp, TrendingDown } from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RTooltip,
} from 'recharts';
import type { Currency, AssetType } from '@/types';

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))', 'hsl(var(--primary))', 'hsl(var(--success))', 'hsl(var(--warning))'];

interface PortfolioProps {
  navigate: (path: string) => void;
}

export function Portfolio({ navigate: navigateProp }: PortfolioProps) {
  const store = useAppStore();
  const stocks = useStocks();
  const etfs = useETFs();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ symbol: '', name: '', type: 'stock' as AssetType, quantity: '', purchasePrice: '', purchaseDate: '', transactionCosts: '0', dividends: '0' });

  function getCurrentPrice(symbol: string, type: AssetType): { price: number; currency: Currency; name: string } | null {
    if (type === 'stock') { const s = stocks.find((st) => st.ticker === symbol); return s ? { price: s.price, currency: s.currency, name: s.name } : null; }
    if (type === 'etf') { const e = etfs.find((et) => et.ticker === symbol); return e ? { price: e.price, currency: e.currency, name: e.name } : null; }
    return null;
  }

  const holdings = useMemo(() => {
    return store.portfolio.map((h) => {
      const current = getCurrentPrice(h.symbol, h.type);
      const currentPrice = current?.price ?? h.currentPrice;
      const marketValue = h.quantity * currentPrice;
      const invested = h.quantity * h.purchasePrice + h.transactionCosts;
      const unrealizedPnL = marketValue - invested + h.dividends;
      const unrealizedPnLPct = invested > 0 ? (unrealizedPnL / invested) * 100 : 0;
      return { ...h, currentPrice, marketValue, invested, unrealizedPnL, unrealizedPnLPct, name: current?.name ?? h.name, currency: current?.currency ?? h.currency };
    });
  }, [store.portfolio, stocks, etfs]);

  const totals = useMemo(() => {
    const totalValue = holdings.reduce((s, h) => s + h.marketValue, 0);
    const totalInvested = holdings.reduce((s, h) => s + h.invested, 0);
    const totalPnL = totalValue - totalInvested + holdings.reduce((s, h) => s + h.dividends, 0);
    const totalPnLPct = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;
    return { totalValue, totalInvested, totalPnL, totalPnLPct };
  }, [holdings]);

  const allocation = useMemo(() => {
    const map = new Map<string, number>();
    holdings.forEach((h) => map.set(h.symbol, (map.get(h.symbol) || 0) + h.marketValue));
    return Array.from(map.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [holdings]);

  function handleAdd() {
    if (!form.symbol || !form.quantity || !form.purchasePrice) return;
    const current = getCurrentPrice(form.symbol, form.type);
    store.addPortfolioHolding({
      symbol: form.symbol.toUpperCase(),
      name: current?.name ?? form.name,
      type: form.type,
      quantity: parseFloat(form.quantity),
      purchasePrice: parseFloat(form.purchasePrice),
      purchaseDate: form.purchaseDate || new Date().toISOString().split('T')[0],
      transactionCosts: parseFloat(form.transactionCosts) || 0,
      dividends: parseFloat(form.dividends) || 0,
      currentPrice: current?.price ?? 0,
      currency: current?.currency ?? 'USD',
    });
    setForm({ symbol: '', name: '', type: 'stock', quantity: '', purchasePrice: '', purchaseDate: '', transactionCosts: '0', dividends: '0' });
    setShowAdd(false);
  }

  return (
    <div className="animate-fade-in space-y-4">
      <PageHeader title="Portfolio Tracker" description="Manually add holdings to track your investments">
        <Button size="sm" onClick={() => setShowAdd(true)}><Plus className="mr-1.5 h-3.5 w-3.5" />Add Holding</Button>
        <DemoBadge />
      </PageHeader>

      {holdings.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              title="Your portfolio is empty"
              description="Add your first holding by clicking 'Add Holding'. Enter the symbol, quantity, and purchase price to track your investments."
              icon={<Briefcase className="h-12 w-12" />}
              action={<Button onClick={() => setShowAdd(true)}><Plus className="mr-1.5 h-3.5 w-3.5" />Add First Holding</Button>}
            />
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Card className="p-4">
              <p className="text-xs text-muted-foreground">Total Value</p>
              <p className="mt-1 text-lg font-bold tabular-nums text-foreground">{formatPrice(totals.totalValue, 'USD')}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-muted-foreground">Invested</p>
              <p className="mt-1 text-lg font-bold tabular-nums text-foreground">{formatPrice(totals.totalInvested, 'USD')}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-muted-foreground">Unrealized P&L</p>
              <p className={`mt-1 text-lg font-bold tabular-nums ${totals.totalPnL >= 0 ? 'text-success' : 'text-destructive'}`}>
                {totals.totalPnL >= 0 ? '+' : ''}{formatPrice(totals.totalPnL, 'USD')}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-muted-foreground">Return %</p>
              <div className="mt-1"><ChangeBadge value={totals.totalPnLPct} pct={totals.totalPnLPct} size="md" showIcon /></div>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
            {/* Holdings table */}
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base">Holdings</CardTitle></CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Symbol</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">Qty</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">Buy Price</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">Current</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">Market Value</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">P&L</th>
                        <th className="px-3 py-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {holdings.map((h) => (
                        <tr key={h.id} className="border-b border-border/50 hover:bg-muted/30">
                          <td className="px-3 py-2.5">
                            <span className="font-medium text-foreground">{h.symbol}</span>
                            <p className="text-xs text-muted-foreground truncate max-w-[120px]">{h.name}</p>
                          </td>
                          <td className="px-3 py-2.5 text-right tabular-nums text-foreground">{h.quantity}</td>
                          <td className="px-3 py-2.5 text-right tabular-nums text-muted-foreground">{formatPrice(h.purchasePrice, h.currency)}</td>
                          <td className="px-3 py-2.5 text-right tabular-nums text-foreground">{formatPrice(h.currentPrice, h.currency)}</td>
                          <td className="px-3 py-2.5 text-right tabular-nums text-foreground">{formatPrice(h.marketValue, h.currency)}</td>
                          <td className="px-3 py-2.5 text-right">
                            <div className="flex flex-col items-end">
                              <span className={`text-sm font-medium tabular-nums ${h.unrealizedPnL >= 0 ? 'text-success' : 'text-destructive'}`}>
                                {h.unrealizedPnL >= 0 ? '+' : ''}{formatPrice(h.unrealizedPnL, h.currency)}
                              </span>
                              <span className={`text-xs ${h.unrealizedPnLPct >= 0 ? 'text-success' : 'text-destructive'}`}>{formatPercent(h.unrealizedPnLPct)}</span>
                            </div>
                          </td>
                          <td className="px-3 py-2.5"><button onClick={() => store.removePortfolioHolding(h.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Allocation pie */}
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base">Allocation</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={allocation} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={40}>
                      {allocation.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <RTooltip contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                      formatter={(v: number) => formatPrice(v, 'USD')} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-2 space-y-1">
                  {allocation.slice(0, 5).map((a, i) => (
                    <div key={a.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="text-muted-foreground">{a.name}</span>
                      </div>
                      <span className="text-foreground tabular-nums">{((a.value / totals.totalValue) * 100).toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Add holding dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Portfolio Holding</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label htmlFor="type">Asset Type</Label>
              <Select value={form.type} onValueChange={(v: AssetType) => setForm({ ...form, type: v })}>
                <SelectTrigger id="type" className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="stock">Stock</SelectItem>
                  <SelectItem value="etf">ETF</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label htmlFor="symbol">Symbol</Label>
              <Input id="symbol" placeholder="e.g. AAPL" value={form.symbol} onChange={(e) => setForm({ ...form, symbol: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="qty">Quantity</Label>
              <Input id="qty" type="number" placeholder="10" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="price">Purchase Price</Label>
              <Input id="price" type="number" placeholder="150.00" value={form.purchasePrice} onChange={(e) => setForm({ ...form, purchasePrice: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="date">Purchase Date</Label>
              <Input id="date" type="date" value={form.purchaseDate} onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="costs">Transaction Costs</Label>
              <Input id="costs" type="number" placeholder="0" value={form.transactionCosts} onChange={(e) => setForm({ ...form, transactionCosts: e.target.value })} className="mt-1" />
            </div>
            <div className="col-span-2">
              <Label htmlFor="divs">Dividends Received</Label>
              <Input id="divs" type="number" placeholder="0" value={form.dividends} onChange={(e) => setForm({ ...form, dividends: e.target.value })} className="mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={handleAdd}>Add Holding</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
