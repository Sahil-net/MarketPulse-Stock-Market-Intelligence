import { supabase } from '@/lib/supabase';

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/market-data`;

async function getAuthToken(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? '';
}

async function callMarketData(params: Record<string, string>): Promise<any | null> {
  try {
    const token = await getAuthToken();
    const url = new URL(FUNCTION_URL);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) return null;
    const data = await res.json();
    if (data.error) return null;
    return data;
  } catch {
    return null;
  }
}

export interface RealtimeQuote {
  currentPrice: number;
  change: number;
  changePct: number;
  high: number;
  low: number;
  open: number;
  prevClose: number;
}

export async function fetchQuote(symbol: string): Promise<RealtimeQuote | null> {
  const data = await callMarketData({ action: 'quote', symbol });
  if (!data?.quote) return null;
  const q = data.quote;
  return {
    currentPrice: q.c,
    change: q.d,
    changePct: q.dp,
    high: q.h,
    low: q.l,
    open: q.o,
    prevClose: q.pc,
  };
}

export async function fetchQuotes(symbols: string[]): Promise<Record<string, RealtimeQuote | null>> {
  const data = await callMarketData({ action: 'quotes', symbols: symbols.join(',') });
  if (!data?.quotes) return {};
  const result: Record<string, RealtimeQuote | null> = {};
  for (const [sym, q] of Object.entries(data.quotes)) {
    if (q && (q as any).c) {
      const quote = q as any;
      result[sym] = {
        currentPrice: quote.c,
        change: quote.d,
        changePct: quote.dp,
        high: quote.h,
        low: quote.l,
        open: quote.o,
        prevClose: quote.pc,
      };
    } else {
      result[sym] = null;
    }
  }
  return result;
}

export async function fetchCandles(symbol: string, days: number = 365): Promise<any | null> {
  return callMarketData({ action: 'candles', symbol, days: String(days), resolution: 'D' });
}

export async function fetchNews(category: string = 'general'): Promise<any[] | null> {
  const data = await callMarketData({ action: 'news', category });
  return data?.news ?? null;
}

export async function fetchCompanyProfile(symbol: string): Promise<any | null> {
  const data = await callMarketData({ action: 'profile', symbol });
  return data?.profile ?? null;
}
