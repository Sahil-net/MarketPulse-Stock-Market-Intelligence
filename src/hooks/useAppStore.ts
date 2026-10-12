import { useState, useEffect, useCallback } from 'react';
import type { Market, Currency, Watchlist, PortfolioHolding, AssetType } from '@/types';

const STORAGE_KEY = 'marketpulse-state';

interface AppState {
  market: Market;
  currency: Currency;
  theme: 'dark' | 'light';
  watchlists: Watchlist[];
  portfolio: PortfolioHolding[];
}

const DEFAULT_STATE: AppState = {
  market: 'US',
  currency: 'USD',
  theme: 'dark',
  watchlists: [
    {
      id: 'wl-default',
      name: 'My Watchlist',
      symbols: [
        { symbol: 'AAPL', type: 'stock' as AssetType, addedAt: new Date().toISOString() },
        { symbol: 'NVDA', type: 'stock' as AssetType, addedAt: new Date().toISOString() },
        { symbol: 'TSLA', type: 'stock' as AssetType, addedAt: new Date().toISOString() },
      ],
      createdAt: new Date().toISOString(),
    },
  ],
  portfolio: [],
};

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_STATE, ...parsed };
    }
  } catch {
    // ignore
  }
  return DEFAULT_STATE;
}

let listeners: (() => void)[] = [];
let currentState: AppState = loadState();

function setState(newState: AppState) {
  currentState = newState;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
  } catch {
    // ignore
  }
  listeners.forEach((l) => l());
}

export function useAppStore() {
  const [state, setLocalState] = useState(currentState);

  useEffect(() => {
    const listener = () => setLocalState({ ...currentState });
    listeners.push(listener);
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  }, []);

  const setMarket = useCallback((market: Market) => {
    const currency = market === 'IN' ? 'INR' : 'USD';
    setState({ ...currentState, market, currency });
  }, []);

  const setCurrency = useCallback((currency: Currency) => {
    setState({ ...currentState, currency });
  }, []);

  const toggleTheme = useCallback(() => {
    const theme = currentState.theme === 'dark' ? 'light' : 'dark';
    setState({ ...currentState, theme });
  }, []);

  const addToWatchlist = useCallback((watchlistId: string, symbol: string, type: AssetType) => {
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
  }, []);

  const removeFromWatchlist = useCallback((watchlistId: string, symbol: string) => {
    const wls = currentState.watchlists.map((wl) =>
      wl.id === watchlistId
        ? { ...wl, symbols: wl.symbols.filter((s) => s.symbol !== symbol) }
        : wl
    );
    setState({ ...currentState, watchlists: wls });
  }, []);

  const createWatchlist = useCallback((name: string) => {
    const wl: Watchlist = {
      id: `wl-${Date.now()}`,
      name,
      symbols: [],
      createdAt: new Date().toISOString(),
    };
    setState({ ...currentState, watchlists: [...currentState.watchlists, wl] });
  }, []);

  const deleteWatchlist = useCallback((watchlistId: string) => {
    setState({
      ...currentState,
      watchlists: currentState.watchlists.filter((wl) => wl.id !== watchlistId),
    });
  }, []);

  const isInWatchlist = useCallback(
    (symbol: string) => {
      return currentState.watchlists.some((wl) =>
        wl.symbols.some((s) => s.symbol === symbol)
      );
    },
    []
  );

  const addPortfolioHolding = useCallback((holding: Omit<PortfolioHolding, 'id'>) => {
    const h: PortfolioHolding = { ...holding, id: `ph-${Date.now()}` };
    setState({ ...currentState, portfolio: [...currentState.portfolio, h] });
  }, []);

  const removePortfolioHolding = useCallback((id: string) => {
    setState({
      ...currentState,
      portfolio: currentState.portfolio.filter((h) => h.id !== id),
    });
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
  };
}
