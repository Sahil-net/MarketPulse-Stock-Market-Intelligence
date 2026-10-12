import { useAppStore } from '@/hooks/useAppStore';
import { PageHeader, DemoBadge } from '@/components/shared/States';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Sun, Moon, Globe, DollarSign, Database, KeyRound, Info } from 'lucide-react';
import type { Market, Currency } from '@/types';

interface SettingsProps {
  navigate: (path: string) => void;
}

export function Settings({ navigate: navigateProp }: SettingsProps) {
  const store = useAppStore();

  return (
    <div className="animate-fade-in space-y-4 max-w-2xl">
      <PageHeader title="Settings" description="Customize your MarketPulse experience">
        <DemoBadge />
      </PageHeader>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Globe className="h-4 w-4 text-primary" />Market & Currency</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Default Market</Label>
              <p className="text-xs text-muted-foreground">Choose which market to display by default</p>
            </div>
            <Select value={store.market} onValueChange={(v: Market) => store.setMarket(v)}>
              <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="US">United States</SelectItem>
                <SelectItem value="IN">India</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label>Display Currency</Label>
              <p className="text-xs text-muted-foreground">Currency for displaying prices</p>
            </div>
            <Select value={store.currency} onValueChange={(v: Currency) => store.setCurrency(v)}>
              <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD ($)</SelectItem>
                <SelectItem value="INR">INR (₹)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2">{store.theme === 'dark' ? <Moon className="h-4 w-4 text-primary" /> : <Sun className="h-4 w-4 text-primary" />}Appearance</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Label>Dark Theme</Label>
              <p className="text-xs text-muted-foreground">Toggle between dark and light appearance</p>
            </div>
            <Switch checked={store.theme === 'dark'} onCheckedChange={store.toggleTheme} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Database className="h-4 w-4 text-primary" />Data Provider</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-lg border border-warning/30 bg-warning/5 p-3">
            <div className="flex items-center gap-2 mb-1">
              <Info className="h-4 w-4 text-warning" />
              <span className="text-sm font-medium text-warning">Demo Mode Active</span>
            </div>
            <p className="text-xs text-muted-foreground">
              The app is currently running with demo data. To connect a real financial data provider
              (Alpha Vantage, Finnhub, Twelve Data, etc.), add the API key to your environment variables
              and configure the provider in the data service layer.
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Data Source</span>
              <span className="text-foreground">Demo / Sample Data</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Update Frequency</span>
              <span className="text-foreground">On load</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Caching</span>
              <span className="text-foreground">Not configured</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><KeyRound className="h-4 w-4 text-primary" />Account & Persistence</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <p className="text-sm text-muted-foreground">
              Watchlists and portfolio holdings are currently saved locally in your browser.
              To enable cloud sync and authentication, connect a Supabase project by adding
              your Supabase URL and keys to the environment variables.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigateProp('/watchlists')}>Manage Watchlists</Button>
          <span className="mx-2 text-muted-foreground">·</span>
          <Button variant="outline" size="sm" onClick={() => navigateProp('/portfolio')}>View Portfolio</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Info className="h-4 w-4 text-primary" />About MarketPulse</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground leading-relaxed">
            MarketPulse is a stock market intelligence platform for discovering and analyzing
 stocks, ETFs, and mutual funds. It provides performance rankings, technical indicators,
 sector analysis, screeners, and portfolio tracking. All data shown is demo data for
 illustration purposes and should not be used for investment decisions.
          </p>
          <p className="mt-2 text-xs text-muted-foreground/70">Version 1.0.0 · Built with React, Vite, Tailwind CSS, and Recharts</p>
        </CardContent>
      </Card>
    </div>
  );
}
