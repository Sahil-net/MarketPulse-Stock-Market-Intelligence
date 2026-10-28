import { useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAppStore } from '@/hooks/useAppStore';
import { useStocks, useIndices, useNews } from '@/hooks/useData';
import { PageHeader } from '@/components/shared/States';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Eye, Briefcase, TrendingUp, TrendingDown, ArrowRight,
  Clock, Mail, Activity, BarChart3, Newspaper, Coins, CalendarClock,
} from 'lucide-react';
import { formatPrice, formatNumber, formatPercent, formatDate } from '@/lib/format';

interface DashboardProps {
  navigate: (path: string) => void;
}

export function Dashboard({ navigate }: DashboardProps) {
  const { user } = useAuth();
  const store = useAppStore();
  const stocks = useStocks();
  const indices = useIndices();
  const news = useNews();

  const topGainers = useMemo(() =>
    [...stocks].sort((a, b) => b.changePct - a.changePct).slice(0, 5),
    [stocks]
  );

  const topLosers = useMemo(() =>
    [...stocks].sort((a, b) => a.changePct - b.changePct).slice(0, 5),
    [stocks]
  );

  const watchlistCount = store.watchlists.reduce((acc, wl) => acc + wl.symbols.length, 0);
  const portfolioCount = store.portfolio.length;

  const portfolioValue = store.portfolio.reduce((acc, h) => {
    const stock = stocks.find((s) => s.ticker === h.symbol);
    const price = stock?.price ?? h.purchasePrice;
    return acc + price * h.quantity;
  }, 0);

  const portfolioCost = store.portfolio.reduce(
    (acc, h) => acc + h.purchasePrice * h.quantity + h.transactionCosts,
    0
  );

  const portfolioPnl = portfolioValue - portfolioCost;
  const portfolioPnlPct = portfolioCost > 0 ? (portfolioPnl / portfolioCost) * 100 : 0;

  const dividendIncome = useMemo(() => {
    return store.portfolio.reduce((acc, h) => {
      const stock = stocks.find((s) => s.ticker === h.symbol);
      const annual = stock?.annualDividend ?? 0;
      return acc + annual * h.quantity;
    }, 0);
  }, [store.portfolio, stocks]);

  const upcomingDividends = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return store.portfolio
      .map((h) => {
        const stock = stocks.find((s) => s.ticker === h.symbol);
        if (!stock?.nextExDate || stock.nextExDate < today) return null;
        return {
          ticker: h.symbol,
          name: stock.name,
          exDate: stock.nextExDate,
          amount: stock.annualDividend ? stock.annualDividend * h.quantity : 0,
          frequency: stock.dividendFrequency ?? '—',
        };
      })
      .filter((d): d is { ticker: string; name: string; exDate: string; amount: number; frequency: string } => d !== null)
      .sort((a, b) => (a.exDate < b.exDate ? -1 : 1));
  }, [store.portfolio, stocks]);

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  })();

  const userEmail = user?.email ?? '';

  return (
    <div className="animate-fade-in space-y-4 max-w-5xl">
      <PageHeader
        title="Dashboard"
        description="Your personal market overview at a glance"
      />

      {/* Welcome banner */}
      <Card className="overflow-hidden border-primary/20">
        <CardContent className="flex items-center justify-between p-5">
          <div>
            <h2 className="text-lg font-semibold text-foreground">{greeting}</h2>
            <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
              <Mail className="h-3.5 w-3.5" />
              {userEmail}
            </p>
          </div>
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <Activity className="h-7 w-7 text-primary" />
          </div>
        </CardContent>
      </Card>

      {/* Quick stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          icon={<Eye className="h-4 w-4" />}
          label="Watchlist Items"
          value={String(watchlistCount)}
          onClick={() => navigate('/watchlists')}
        />
        <StatCard
          icon={<Briefcase className="h-4 w-4" />}
          label="Portfolio Holdings"
          value={String(portfolioCount)}
          onClick={() => navigate('/portfolio')}
        />
        <StatCard
          icon={portfolioPnl >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
          label="Portfolio P&L"
          value={portfolioCount > 0 ? formatPrice(portfolioPnl, store.currency) : '—'}
          subValue={portfolioCount > 0 ? formatPercent(portfolioPnlPct) : undefined}
          valueClass={portfolioPnl >= 0 ? 'text-success' : 'text-destructive'}
          onClick={() => navigate('/portfolio')}
        />
        <StatCard
          icon={<Coins className="h-4 w-4" />}
          label="Est. Annual Dividends"
          value={portfolioCount > 0 ? formatPrice(dividendIncome, store.currency) : '—'}
          subValue={portfolioCount > 0 ? 'Projected' : undefined}
          valueClass="text-success"
          onClick={() => navigate('/portfolio')}
        />
        <StatCard
          icon={<BarChart3 className="h-4 w-4" />}
          label="Tracked Stocks"
          value={String(stocks.length)}
          onClick={() => navigate('/stocks')}
        />
      </div>

      {/* Market snapshot */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="h-4 w-4 text-primary" />
            Market Snapshot
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {indices.slice(0, 6).map((idx) => (
              <button
                key={idx.symbol}
                onClick={() => navigate('/')}
                className="rounded-lg border border-border p-3 text-left transition-colors hover:border-primary/40 hover:bg-muted/30"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">{idx.name}</span>
                  <span className={`text-xs font-semibold ${idx.changePct >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {formatPercent(idx.changePct)}
                  </span>
                </div>
                <div className="mt-1 text-lg font-semibold tabular-nums text-foreground">
                  {formatNumber(idx.value)}
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Top Gainers */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-base">
              <span className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-success" />
                Top Gainers
              </span>
              <button
                onClick={() => navigate('/gainers')}
                className="flex items-center gap-1 text-xs font-normal text-primary hover:underline"
              >
                View all <ArrowRight className="h-3 w-3" />
              </button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {topGainers.map((stock) => (
                <StockRow
                  key={stock.ticker}
                  ticker={stock.ticker}
                  name={stock.name}
                  price={stock.price}
                  changePct={stock.changePct}
                  currency={stock.currency}
                  onClick={() => navigate(`/stock/${stock.ticker}`)}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Losers */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-base">
              <span className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-destructive" />
                Top Losers
              </span>
              <button
                onClick={() => navigate('/losers')}
                className="flex items-center gap-1 text-xs font-normal text-primary hover:underline"
              >
                View all <ArrowRight className="h-3 w-3" />
              </button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {topLosers.map((stock) => (
                <StockRow
                  key={stock.ticker}
                  ticker={stock.ticker}
                  name={stock.name}
                  price={stock.price}
                  changePct={stock.changePct}
                  currency={stock.currency}
                  onClick={() => navigate(`/stock/${stock.ticker}`)}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Dividends */}
      {upcomingDividends.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarClock className="h-4 w-4 text-primary" />
              Upcoming Dividends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {upcomingDividends.slice(0, 5).map((d) => (
                <button
                  key={d.ticker}
                  onClick={() => navigate(`/stock/${d.ticker}`)}
                  className="flex w-full items-center justify-between rounded-lg px-2 py-2 transition-colors hover:bg-muted/30"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm font-semibold text-foreground">{d.ticker}</span>
                    <span className="truncate text-xs text-muted-foreground">{d.name}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs capitalize text-muted-foreground">{d.frequency}</span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <CalendarClock className="h-3 w-3" />
                      {formatDate(d.exDate)}
                    </span>
                    <span className="text-sm font-medium tabular-nums text-success">
                      {formatPrice(d.amount, store.currency)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Latest News */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-base">
            <span className="flex items-center gap-2">
              <Newspaper className="h-4 w-4 text-primary" />
              Latest Market News
            </span>
            <button
              onClick={() => navigate('/news')}
              className="flex items-center gap-1 text-xs font-normal text-primary hover:underline"
            >
              View all <ArrowRight className="h-3 w-3" />
            </button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {news.slice(0, 4).map((item) => (
              <button
                key={item.id}
                onClick={() => navigate('/news')}
                className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-muted/30"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Newspaper className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{item.title}</p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {item.source}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/watchlists')}>
              <Eye className="h-4 w-4 mr-2" /> View Watchlists
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/portfolio')}>
              <Briefcase className="h-4 w-4 mr-2" /> Open Portfolio
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/stocks')}>
              <TrendingUp className="h-4 w-4 mr-2" /> Explore Stocks
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/settings')}>
              <Activity className="h-4 w-4 mr-2" /> Account Settings
            </Button>
            <Separator orientation="vertical" className="hidden h-8 sm:block" />
            <Button variant="outline" size="sm" onClick={() => navigate('/terms')}>
              <Activity className="h-4 w-4 mr-2" /> Terms of Service
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  icon, label, value, subValue, valueClass, onClick,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subValue?: string;
  valueClass?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="text-left rounded-lg border border-border bg-card p-4 transition-all hover:border-primary/40 hover:shadow-md"
    >
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <div className={`mt-2 text-xl font-bold tabular-nums text-foreground ${valueClass ?? ''}`}>
        {value}
      </div>
      {subValue && (
        <div className={`mt-0.5 text-xs font-medium ${subValue.startsWith('-') ? 'text-destructive' : 'text-success'}`}>
          {subValue}
        </div>
      )}
    </button>
  );
}

function StockRow({
  ticker, name, price, changePct, currency, onClick,
}: {
  ticker: string;
  name: string;
  price: number;
  changePct: number;
  currency: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center justify-between rounded-lg px-2 py-2 transition-colors hover:bg-muted/30"
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-sm font-semibold text-foreground">{ticker}</span>
        <span className="truncate text-xs text-muted-foreground">{name}</span>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className="text-sm font-medium tabular-nums text-foreground">
          {formatPrice(price, currency as any)}
        </span>
        <span className={`text-xs font-semibold tabular-nums ${changePct >= 0 ? 'text-success' : 'text-destructive'}`}>
          {formatPercent(changePct)}
        </span>
      </div>
    </button>
  );
}
