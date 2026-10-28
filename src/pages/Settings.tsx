import { useState } from 'react';
import { useAppStore } from '@/hooks/useAppStore';
import { useAuth } from '@/hooks/useAuth';
import { PageHeader } from '@/components/shared/States';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Sun, Moon, Globe, KeyRound, Info, LogOut, Trash2, User, Activity } from 'lucide-react';

interface SettingsProps {
  navigate: (path: string) => void;
}

export function Settings({ navigate: navigateProp }: SettingsProps) {
  const store = useAppStore();
  const { user, signOut, deleteAccount } = useAuth();
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function handleDeleteAccount() {
    setDeleting(true);
    setDeleteError(null);
    const { error } = await deleteAccount();
    setDeleting(false);
    if (error) {
      setDeleteError(error);
    }
  }

  return (
    <div className="animate-fade-in space-y-4 max-w-2xl">
      <PageHeader title="Settings" description="Customize your MarketPulse experience" />

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><User className="h-4 w-4 text-primary" />Account</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Signed in as</span>
            <span className="text-foreground font-medium">{user?.email}</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label>Sign Out</Label>
              <p className="text-xs text-muted-foreground">Sign out of your account on this device</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => signOut()}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Globe className="h-4 w-4 text-primary" />Market</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <p className="text-sm text-foreground">United States (USD)</p>
            <p className="mt-1 text-xs text-muted-foreground">MarketPulse covers US equities and ETFs. Prices are displayed in US dollars.</p>
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
        <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Activity className="h-4 w-4 text-primary" />Real-Time Data</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-lg border border-success/30 bg-success/5 p-3">
            <div className="flex items-center gap-2 mb-1">
              <Info className="h-4 w-4 text-success" />
              <span className="text-sm font-medium text-success">Live Data Enabled</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Real-time stock quotes, price history, and market news are fetched live
              from Finnhub. Market data for ETFs continues to use
              built-in data. To activate live data, add your Finnhub API key as
              FINNHUB_API_KEY in the edge function secrets.
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Data Source</span>
              <span className="text-foreground">Finnhub (Live) + Built-in</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Update Frequency</span>
              <span className="text-foreground">Real-time on page load</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><KeyRound className="h-4 w-4 text-primary" />Account & Persistence</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <p className="text-sm text-muted-foreground">
              Your watchlists, portfolio holdings, and settings are saved to your account
              and sync across devices. Market data is fetched live when available.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigateProp('/watchlists')}>Manage Watchlists</Button>
            <Button variant="outline" size="sm" onClick={() => navigateProp('/portfolio')}>View Portfolio</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-destructive/30">
        <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2 text-destructive"><Trash2 className="h-4 w-4" />Danger Zone</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
            <p className="text-sm text-muted-foreground">
              Permanently delete your account and all associated data including watchlists,
              portfolio holdings, and settings. This action cannot be undone.
            </p>
          </div>
          {deleteError && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              {deleteError}
            </div>
          )}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" disabled={deleting}>
                <Trash2 className="h-4 w-4 mr-2" />
                {deleting ? 'Deleting...' : 'Delete Account'}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently erase your account and all data — watchlists, portfolio holdings, and settings. You will be signed out immediately. This cannot be reversed.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAccount}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Yes, delete everything
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Info className="h-4 w-4 text-primary" />About MarketPulse</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground leading-relaxed">
            MarketPulse is a stock market intelligence platform for discovering and analyzing
            stocks, ETFs, and indices. It provides performance rankings, technical indicators,
            sector analysis, screeners, and portfolio tracking with real-time data.
          </p>
          <p className="mt-2 text-xs text-muted-foreground/70">Version 2.0.0 · Built with React, Vite, Tailwind CSS, Recharts, and Supabase</p>
        </CardContent>
      </Card>
    </div>
  );
}
