import { useMemo } from 'react';
import { useAppStore } from '@/hooks/useAppStore';
import { useStocks } from '@/hooks/useData';
import { PageHeader, EmptyState } from '@/components/shared/States';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Bell, BellRing, Trash2, RotateCcw, ArrowUpCircle, ArrowDownCircle, Download } from 'lucide-react';
import { formatPrice, formatDate } from '@/lib/format';
import { exportToCSV } from '@/lib/csv';

interface PriceAlertsProps {
  navigate: (path: string) => void;
}

export function PriceAlerts({ navigate }: PriceAlertsProps) {
  const store = useAppStore();
  const stocks = useStocks();

  const stockMap = useMemo(() => {
    const map = new Map<string, number>();
    stocks.forEach((s) => map.set(s.ticker, s.price));
    return map;
  }, [stocks]);

  const alerts = store.priceAlerts;
  const activeCount = alerts.filter((a) => a.enabled && !a.triggered).length;
  const triggeredCount = alerts.filter((a) => a.triggered).length;

  function handleExport() {
    const active = alerts.filter((a) => a.enabled && !a.triggered);
    exportToCSV(
      'active-price-alerts.csv',
      ['Symbol', 'Name', 'Direction', 'Target Price', 'Current Price', 'Created'],
      active.map((a) => [
        a.symbol,
        a.name,
        a.direction,
        a.targetPrice,
        stockMap.get(a.symbol) ?? '',
        a.createdAt,
      ]),
    );
  }

  return (
    <div className="animate-fade-in space-y-4 max-w-4xl">
      <PageHeader
        title="Price Alerts"
        description="Get notified when a stock crosses your target price"
      >
        <Button variant="outline" size="sm" onClick={handleExport} disabled={activeCount === 0}>
          <Download className="mr-1.5 h-3.5 w-3.5" />
          Export
        </Button>
      </PageHeader>

      {alerts.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={<Bell className="h-10 w-10" />}
              title="No price alerts yet"
              description="Create an alert from any stock detail page by clicking the bell icon, and we'll notify you when the price crosses your threshold."
              action={
                <Button variant="outline" size="sm" onClick={() => navigate('/stocks')}>
                  Browse Stocks
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <BellRing className="h-4 w-4" />
                  <span className="text-xs font-medium">Active</span>
                </div>
                <p className="mt-1.5 text-xl font-bold tabular-nums text-foreground">{activeCount}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Bell className="h-4 w-4" />
                  <span className="text-xs font-medium">Triggered</span>
                </div>
                <p className="mt-1.5 text-xl font-bold tabular-nums text-foreground">{triggeredCount}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Bell className="h-4 w-4" />
                  <span className="text-xs font-medium">Total</span>
                </div>
                <p className="mt-1.5 text-xl font-bold tabular-nums text-foreground">{alerts.length}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Your Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {alerts.map((alert) => {
                  const livePrice = stockMap.get(alert.symbol);
                  const distance = livePrice
                    ? Math.abs(livePrice - alert.targetPrice) / alert.targetPrice * 100
                    : null;

                  return (
                    <div
                      key={alert.id}
                      className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${
                        alert.triggered
                          ? 'border-primary/30 bg-primary/5'
                          : alert.enabled
                            ? 'border-border bg-card'
                            : 'border-border bg-muted/20'
                      }`}
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted/40">
                        {alert.direction === 'above' ? (
                          <ArrowUpCircle className="h-5 w-5 text-success" />
                        ) : (
                          <ArrowDownCircle className="h-5 w-5 text-destructive" />
                        )}
                      </div>

                      <button
                        onClick={() => navigate(`/stock/${alert.symbol}`)}
                        className="flex flex-1 items-center gap-2 text-left min-w-0"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-foreground">{alert.symbol}</span>
                            <span className="truncate text-xs text-muted-foreground">{alert.name}</span>
                          </div>
                          <div className="mt-0.5 flex items-center gap-2 text-xs">
                            <span className="text-muted-foreground">
                              {alert.direction === 'above' ? 'Above' : 'Below'}{' '}
                              <span className="font-medium text-foreground tabular-nums">
                                {formatPrice(alert.targetPrice, 'USD')}
                              </span>
                            </span>
                            {livePrice !== undefined && (
                              <span className="text-muted-foreground">
                                · Now <span className="font-medium text-foreground tabular-nums">{formatPrice(livePrice, 'USD')}</span>
                              </span>
                            )}
                            {distance !== null && !alert.triggered && alert.enabled && (
                              <span className="text-muted-foreground/70 tabular-nums">
                                ({distance < 1 ? distance.toFixed(2) : distance.toFixed(1)}% away)
                              </span>
                            )}
                          </div>
                        </div>
                      </button>

                      <div className="flex items-center gap-2 shrink-0">
                        {alert.triggered ? (
                          <>
                            <Badge variant="default" className="text-[10px]">Triggered</Badge>
                            {alert.triggeredAt && (
                              <span className="hidden text-xs text-muted-foreground sm:inline">
                                {formatDate(alert.triggeredAt)}
                              </span>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => store.resetPriceAlert(alert.id)}
                              title="Re-enable alert"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        ) : (
                          <Switch
                            checked={alert.enabled}
                            onCheckedChange={() => store.togglePriceAlert(alert.id)}
                          />
                        )}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete this alert?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will remove the {alert.direction} alert for {alert.symbol} at {formatPrice(alert.targetPrice, 'USD')}. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => store.removePriceAlert(alert.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
