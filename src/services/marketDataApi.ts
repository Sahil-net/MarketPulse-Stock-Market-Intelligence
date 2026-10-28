import { supabase } from '@/lib/supabase';
import type { PricePoint, NewsItem } from '@/types';

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

export async function fetchCandles(symbol: string, days: number = 365): Promise<PricePoint[] | null> {
  const data = await callMarketData({ action: 'candles', symbol, days: String(days), resolution: 'D' });
  if (!data?.candles || !data.candles.c || data.candles.c.length === 0) return null;
  const c = data.candles;
  const points: PricePoint[] = [];
  for (let i = 0; i < c.t.length; i++) {
    points.push({
      date: new Date(c.t[i] * 1000).toISOString().split('T')[0],
      open: +c.o[i].toFixed(2),
      high: +c.h[i].toFixed(2),
      low: +c.l[i].toFixed(2),
      close: +c.c[i].toFixed(2),
      volume: c.v ? c.v[i] : 0,
      adjustedClose: +c.c[i].toFixed(2),
    });
  }
  return points;
}

export async function fetchLiveNews(category: string = 'general'): Promise<NewsItem[] | null> {
  const data = await callMarketData({ action: 'news', category });
  if (!data?.news || !Array.isArray(data.news)) return null;
  return data.news.slice(0, 20).map((n: any, i: number): NewsItem => ({
    id: `live-${n.id ?? i}`,
    title: n.headline ?? n.title ?? '',
    summary: n.summary ?? '',
    source: n.source ?? 'Unknown',
    url: n.url ?? '#',
    publishedAt: new Date((n.datetime ?? Date.now() / 1000) * 1000).toISOString(),
    category: 'market',
    tickers: n.related ? n.related.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
    sentiment: 'neutral',
  }));
}

export async function fetchCompanyProfile(symbol: string): Promise<any | null> {
  const data = await callMarketData({ action: 'profile', symbol });
  return data?.profile ?? null;
}
