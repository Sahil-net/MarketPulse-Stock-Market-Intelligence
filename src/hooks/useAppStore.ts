import { useState, useEffect, useCallback, useRef } from 'react';
import type { Market, Currency, Watchlist, PortfolioHolding, AssetType, PriceAlert } from '@/types';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

interface AppState {
  market: Market;
  currency: Currency;
  theme: 'dark' | 'light';
  watchlists: Watchlist[];
  portfolio: PortfolioHolding[];
  priceAlerts: PriceAlert[];
  loading: boolean;
  settingsId?: string;
}

const DEFAULT_STATE: AppState = {
  market: 'US',
  currency: 'USD',
  theme: 'dark',
  watchlists: [],
  portfolio: [],
  priceAlerts: [],
  loading: true,
};

let listeners: (() => void)[] = [];
let currentState: AppState = { ...DEFAULT_STATE };
let currentUserId: string | null = null;

function setState(newState: AppState) {
  currentState = newState;
  listeners.forEach((l) => l());
}

function mapWatchlistRow(row: any, items: any[]): Watchlist {
  return {
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
    symbols: items
      .filter((item) => item.watchlist_id === row.id)
      .map((item) => ({
        symbol: item.symbol,
        type: item.asset_type as AssetType,
        addedAt: item.added_at,
      })),
  };
}

function mapHoldingRow(row: any): PortfolioHolding {
  return {
    id: row.id,
    symbol: row.symbol,
    name: row.name,
    type: row.asset_type as AssetType,
    quantity: Number(row.quantity),
    purchasePrice: Number(row.purchase_price),
    purchaseDate: row.purchase_date,
    transactionCosts: Number(row.transaction_costs),
    dividends: Number(row.dividends),
    currentPrice: 0,
    currency: row.currency as Currency,
  };
}

function mapAlertRow(row: any): PriceAlert {
  return {
    id: row.id,
    symbol: row.symbol,
    name: row.name,
    direction: row.direction as 'above' | 'below',
    targetPrice: Number(row.target_price),
    enabled: row.enabled,
    triggered: row.triggered,
    triggeredAt: row.triggered_at,
    createdAt: row.created_at,
  };
}

async function loadFromSupabase(): Promise<Partial<AppState>> {
  const [wlRes, itemsRes, holdingsRes, settingsRes, alertsRes] = await Promise.all([
    supabase.from('watchlists').select('*'),
    supabase.from('watchlist_items').select('*'),
    supabase.from('portfolio_holdings').select('*'),
    supabase.from('app_settings').select('*').limit(1).maybeSingle(),
    supabase.from('price_alerts').select('*').order('created_at', { ascending: false }),
  ]);

  const state: Partial<AppState> = {};

  if (settingsRes.data) {
    state.market = settingsRes.data.market as Market;
    state.currency = settingsRes.data.currency as Currency;
    state.theme = settingsRes.data.theme as 'dark' | 'light';
    state.settingsId = settingsRes.data.id;
  }

  if (wlRes.data && itemsRes.data) {
    state.watchlists = wlRes.data.map((row) => mapWatchlistRow(row, itemsRes.data));
  }

  if (holdingsRes.data) {
    state.portfolio = holdingsRes.data.map(mapHoldingRow);
  }

  if (alertsRes.data) {
    state.priceAlerts = alertsRes.data.map(mapAlertRow);
  }

  return state;
}

async function seedDefaults() {
  try {
    const { data: existingSettings } = await supabase.from('app_settings').select('id').limit(1).maybeSingle();
    if (!existingSettings) {
      await supabase.from('app_settings').insert({ market: 'US', currency: 'USD', theme: 'dark' });
    }

    const { data: existingWl } = await supabase.from('watchlists').select('id').limit(1).maybeSingle();
    if (!existingWl) {
      const { data } = await supabase
        .from('watchlists')
        .insert({ name: 'My Watchlist' })
        .select()
        .single();

      if (data) {
        await supabase.from('watchlist_items').insert([
          { watchlist_id: data.id, symbol: 'AAPL', asset_type: 'stock' },
          { watchlist_id: data.id, symbol: 'NVDA', asset_type: 'stock' },
          { watchlist_id: data.id, symbol: 'TSLA', asset_type: 'stock' },
        ]);
      }
    }
  } catch {
    // ignore
  }
}

export function useAppStore() {
  const { user } = useAuth();
  const [state, setLocalState] = useState(currentState);
  const initRef = useRef<string | null>(null);

  useEffect(() => {
    const listener = () => setLocalState({ ...currentState });
    listeners.push(listener);
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  }, []);

  useEffect(() => {
    if (!user) {
      setState({ ...DEFAULT_STATE, loading: false });
      currentUserId = null;
      initRef.current = null;
      return;
    }

    if (initRef.current === user.id) return;
    initRef.current = user.id;
    currentUserId = user.id;

    setState({ ...DEFAULT_STATE, loading: true });

    (async () => {
      const remote = await loadFromSupabase();
      if (remote.watchlists && remote.watchlists.length === 0 && remote.portfolio?.length === 0) {
        await seedDefaults();
        const refreshed = await loadFromSupabase();
        setState({ ...DEFAULT_STATE, ...refreshed, loading: false });
      } else {
        setState({ ...DEFAULT_STATE, ...remote, loading: false });
      }
    })();
  }, [user]);

  const setMarket = useCallback((market: Market) => {
    setState({ ...currentState, market });
    supabase.from('app_settings').upsert({
      id: currentState.settingsId,
      market,
      currency: currentState.currency,
      theme: currentState.theme,
    }).then();
  }, []);

  const setCurrency = useCallback((currency: Currency) => {
    setState({ ...currentState, currency });
    supabase.from('app_settings').upsert({
      id: currentState.settingsId,
      market: currentState.market,
      currency,
      theme: currentState.theme,
    }).then();
  }, []);

  const toggleTheme = useCallback(() => {
    const theme = currentState.theme === 'dark' ? 'light' : 'dark';
    setState({ ...currentState, theme });
    supabase.from('app_settings').upsert({
      id: currentState.settingsId,
      market: currentState.market,
      currency: currentState.currency,
      theme,
    }).then();
  }, []);

  const addToWatchlist = useCallback(async (watchlistId: string, symbol: string, type: AssetType) => {
    const wls = currentState.watchlists.map((wl) => {
      if (wl.id === watchlistId) {
        if (wl.symbols.some((s) => s.symbol === symbol && s.type === type)) return wl;
        return {
          ...wl,
          symbols: [...wl.symbols, { symbol, type, addedAt: new Date().toISOString() }],
        };
      }
      return wl;
    });
    setState({ ...currentState, watchlists: wls });
    await supabase.from('watchlist_items').insert({
      watchlist_id: watchlistId,
      symbol,
      asset_type: type,
    });
  }, []);

  const removeFromWatchlist = useCallback(async (watchlistId: string, symbol: string) => {
    const wls = currentState.watchlists.map((wl) =>
      wl.id === watchlistId
        ? { ...wl, symbols: wl.symbols.filter((s) => s.symbol !== symbol) }
        : wl
    );
    setState({ ...currentState, watchlists: wls });
    await supabase
      .from('watchlist_items')
      .delete()
      .eq('watchlist_id', watchlistId)
      .eq('symbol', symbol);
  }, []);

  const createWatchlist = useCallback(async (name: string) => {
    const { data } = await supabase.from('watchlists').insert({ name }).select().single();
    if (data) {
      const wl: Watchlist = {
        id: data.id,
        name: data.name,
        symbols: [],
        createdAt: data.created_at,
      };
      setState({ ...currentState, watchlists: [...currentState.watchlists, wl] });
    }
  }, []);

  const deleteWatchlist = useCallback(async (watchlistId: string) => {
    setState({
      ...currentState,
      watchlists: currentState.watchlists.filter((wl) => wl.id !== watchlistId),
    });
    await supabase.from('watchlists').delete().eq('id', watchlistId);
  }, []);

  const isInWatchlist = useCallback(
    (symbol: string) => {
      return currentState.watchlists.some((wl) =>
        wl.symbols.some((s) => s.symbol === symbol)
      );
    },
    []
  );

  const addPortfolioHolding = useCallback(async (holding: Omit<PortfolioHolding, 'id'>) => {
    const { data } = await supabase
      .from('portfolio_holdings')
      .insert({
        symbol: holding.symbol,
        name: holding.name,
        asset_type: holding.type,
        quantity: holding.quantity,
        purchase_price: holding.purchasePrice,
        purchase_date: holding.purchaseDate,
        transaction_costs: holding.transactionCosts,
        dividends: holding.dividends,
        currency: holding.currency,
      })
      .select()
      .single();

    if (data) {
      const h: PortfolioHolding = { ...holding, id: data.id };
      setState({ ...currentState, portfolio: [...currentState.portfolio, h] });
    }
  }, []);

  const removePortfolioHolding = useCallback(async (id: string) => {
    setState({
      ...currentState,
      portfolio: currentState.portfolio.filter((h) => h.id !== id),
    });
    await supabase.from('portfolio_holdings').delete().eq('id', id);
  }, []);

  const addPriceAlert = useCallback(async (alert: Omit<PriceAlert, 'id' | 'enabled' | 'triggered' | 'triggeredAt' | 'createdAt'>) => {
    const { data } = await supabase
      .from('price_alerts')
      .insert({
        symbol: alert.symbol,
        name: alert.name,
        direction: alert.direction,
        target_price: alert.targetPrice,
      })
      .select()
      .single();

    if (data) {
      const a: PriceAlert = mapAlertRow(data);
      setState({ ...currentState, priceAlerts: [a, ...currentState.priceAlerts] });
    }
  }, []);

  const togglePriceAlert = useCallback(async (id: string) => {
    const alert = currentState.priceAlerts.find((a) => a.id === id);
    if (!alert) return;
    const enabled = !alert.enabled;
    setState({
      ...currentState,
      priceAlerts: currentState.priceAlerts.map((a) =>
        a.id === id ? { ...a, enabled } : a
      ),
    });
    await supabase.from('price_alerts').update({ enabled }).eq('id', id);
  }, []);

  const resetPriceAlert = useCallback(async (id: string) => {
    setState({
      ...currentState,
      priceAlerts: currentState.priceAlerts.map((a) =>
        a.id === id ? { ...a, triggered: false, triggeredAt: null } : a
      ),
    });
    await supabase.from('price_alerts').update({ triggered: false, triggered_at: null }).eq('id', id);
  }, []);

  const removePriceAlert = useCallback(async (id: string) => {
    setState({
      ...currentState,
      priceAlerts: currentState.priceAlerts.filter((a) => a.id !== id),
    });
    await supabase.from('price_alerts').delete().eq('id', id);
  }, []);

  const markAlertTriggered = useCallback(async (id: string) => {
    const now = new Date().toISOString();
    setState({
      ...currentState,
      priceAlerts: currentState.priceAlerts.map((a) =>
        a.id === id ? { ...a, triggered: true, triggeredAt: now, enabled: false } : a
      ),
    });
    await supabase.from('price_alerts').update({ triggered: true, triggered_at: now, enabled: false }).eq('id', id);
  }, []);

  return {
    ...state,
    setMarket,
    setCurrency,
    toggleTheme,
    addToWatchlist,
    removeFromWatchlist,
    createWatchlist,
    deleteWatchlist,
    isInWatchlist,
    addPortfolioHolding,
    removePortfolioHolding,
    addPriceAlert,
    togglePriceAlert,
    resetPriceAlert,
    removePriceAlert,
    markAlertTriggered,
  };
}
