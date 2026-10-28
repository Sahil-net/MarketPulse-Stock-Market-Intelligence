import { useState } from 'react';
import { useAppStore } from '@/hooks/useAppStore';
import { useStocks, useETFs } from '@/hooks/useData';
import { PageHeader, DemoBadge, EmptyState } from '@/components/shared/States';
import { ChangeBadge } from '@/components/shared/ChangeBadge';
import { Sparkline } from '@/components/shared/Sparkline';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { formatPrice, formatPercent } from '@/lib/format';
import { Plus, Trash2, Eye, X } from 'lucide-react';
import type { AssetType } from '@/types';

interface WatchlistsProps {
  navigate: (path: string) => void;
}

export function Watchlists({ navigate }: WatchlistsProps) {
  const store = useAppStore();
  const stocks = useStocks();
  const etfs = useETFs();
  const [activeWlId, setActiveWlId] = useState(store.watchlists[0]?.id ?? '');
  const [showCreate, setShowCreate] = useState(false);
  const [newWlName, setNewWlName] = useState('');
  const [addSymbol, setAddSymbol] = useState('');

  const activeWl = store.watchlists.find((w) => w.id === activeWlId) || store.watchlists[0];

  function getPriceFor(symbol: string, type: AssetType) {
    if (type === 'stock') {
      const s = stocks.find((st) => st.ticker === symbol);
      return s ? { price: s.price, changePct: s.changePct, change: s.change, currency: s.currency, sparkline: s.sparkline, name: s.name, exchange: s.exchange } : null;
    }
    if (type === 'etf') {
      const e = etfs.find((et) => et.ticker === symbol);
      return e ? { price: e.price, changePct: e.changePct, change: e.change, currency: e.currency, sparkline: e.sparkline, name: e.name, exchange: e.exchange } : null;
    }
    return null;
  }

  function handleAdd() {
    if (!addSymbol || !activeWl) return;
    const stockMatch = stocks.find((s) => s.ticker.toUpperCase() === addSymbol.toUpperCase());
    if (stockMatch) { store.addToWatchlist(activeWl.id, stockMatch.ticker, 'stock'); setAddSymbol(''); return; }
    const etfMatch = etfs.find((e) => e.ticker.toUpperCase() === addSymbol.toUpperCase());
    if (etfMatch) { store.addToWatchlist(activeWl.id, etfMatch.ticker, 'etf'); setAddSymbol(''); return; }
  }

  return (
    <div className="animate-fade-in space-y-4">
      <PageHeader title="Watchlists" description="Track assets you're interested in across sessions">
        <Button size="sm" onClick={() => setShowCreate(true)}><Plus className="mr-1.5 h-3.5 w-3.5" />New List</Button>
        <DemoBadge />
      </PageHeader>

      <div className="grid gap-4 lg:grid-cols-[200px_1fr]">
        {/* Watchlist sidebar */}
        <div className="space-y-2">
          {store.watchlists.map((wl) => (
            <button
              key={wl.id}
              onClick={() => setActiveWlId(wl.id)}
              className={`flex w-full items-center justify-between rounded-lg border p-3 text-left transition-colors ${
                activeWl?.id === wl.id ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-muted-foreground/30'
              }`}
            >
              <div>
                <p className="text-sm font-medium text-foreground">{wl.name}</p>
                <p className="text-xs text-muted-foreground">{wl.symbols.length} assets</p>
              </div>
              {store.watchlists.length > 1 && (
                <button
                  onClick={(e) => { e.stopPropagation(); store.deleteWatchlist(wl.id); if (activeWlId === wl.id) setActiveWlId(store.watchlists[0]?.id ?? ''); }}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </button>
          ))}
        </div>

        {/* Watchlist content */}
        <div className="space-y-4">
          {activeWl && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-base flex items-center gap-2"><Eye className="h-4 w-4 text-primary" />{activeWl.name}</CardTitle>
                <div className="flex items-center gap-2">
                  <Input placeholder="Add symbol..." value={addSymbol} onChange={(e) => setAddSymbol(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAdd()} className="w-32 h-8 text-xs" />
                  <Button size="sm" variant="outline" onClick={handleAdd}><Plus className="h-3.5 w-3.5" /></Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {activeWl.symbols.length === 0 ? (
                  <EmptyState title="Watchlist is empty" description="Add stocks or ETFs by typing their symbol above." />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Symbol</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Name</th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">Price</th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">Change</th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">Trend</th>
                          <th className="px-3 py-2"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeWl.symbols.map((sym) => {
                          const data = getPriceFor(sym.symbol, sym.type);
                          if (!data) return (
                            <tr key={sym.symbol} className="border-b border-border/50">
                              <td className="px-3 py-2.5 font-medium text-foreground">{sym.symbol}</td>
                              <td className="px-3 py-2.5 text-muted-foreground text-xs">Data unavailable</td>
                              <td className="px-3 py-2.5"></td><td className="px-3 py-2.5"></td><td className="px-3 py-2.5"></td>
                              <td className="px-3 py-2.5"><button onClick={() => store.removeFromWatchlist(activeWl.id, sym.symbol)} className="text-muted-foreground hover:text-destructive"><X className="h-3.5 w-3.5" /></button></td>
                            </tr>
                          );
                          return (
                            <tr key={sym.symbol} className="border-b border-border/50 hover:bg-muted/30 cursor-pointer" onClick={() => {
                              if (sym.type === 'stock') navigate(`/stock/${sym.symbol}`);
                              else if (sym.type === 'etf') navigate(`/etf/${sym.symbol}`);
                            }}>
                              <td className="px-3 py-2.5 font-medium text-foreground">{sym.symbol}</td>
                              <td className="px-3 py-2.5 text-muted-foreground text-xs truncate max-w-[180px]">{data.name}</td>
                              <td className="px-3 py-2.5 text-right tabular-nums text-foreground">{formatPrice(data.price, data.currency)}</td>
                              <td className="px-3 py-2.5 text-right"><ChangeBadge value={data.change} pct={data.changePct} size="sm" /></td>
                              <td className="px-3 py-2.5"><Sparkline data={data.sparkline} positive={data.changePct >= 0} width={60} height={24} /></td>
                              <td className="px-3 py-2.5"><button onClick={(e) => { e.stopPropagation(); store.removeFromWatchlist(activeWl.id, sym.symbol); }} className="text-muted-foreground hover:text-destructive"><X className="h-3.5 w-3.5" /></button></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Create watchlist dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Watchlist</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="wl-name">Watchlist Name</Label>
              <Input id="wl-name" placeholder="e.g. Tech Stocks, Dividend Picks..." value={newWlName} onChange={(e) => setNewWlName(e.target.value)} className="mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={() => { if (newWlName) { store.createWatchlist(newWlName); setNewWlName(''); setShowCreate(false); } }}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
