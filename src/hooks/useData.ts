import { useMemo, useState, useEffect } from 'react';
import {
  getStocks, getETFs, getIndices, getSectors, getNews,
  searchAllAssets, getStock, getETF, getAllSectors, getExchanges,
} from '@/services/mockData';
import { fetchQuote, fetchQuotes, fetchCandles, fetchLiveNews, type RealtimeQuote } from '@/services/marketDataApi';
import type { Market, Stock, PricePoint, NewsItem } from '@/types';

export function useStocks(market?: Market) {
  const [liveQuotes, setLiveQuotes] = useState<Record<string, RealtimeQuote | null>>({});
  const stocks = useMemo(() => getStocks(market), [market]);

  useEffect(() => {
    if (stocks.length === 0) return;
    const tickers = stocks.map((s) => s.ticker);
    let active = true;
    fetchQuotes(tickers).then((quotes) => {
      if (active) setLiveQuotes(quotes);
    });
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stocks.map((s) => s.ticker).join(',')]);

  const merged = useMemo(() => {
    return stocks.map((s) => {
      const live = liveQuotes[s.ticker];
      if (live) {
        return {
          ...s,
          price: live.currentPrice,
          change: live.change,
          changePct: live.changePct,
          prevClose: live.prevClose,
          high52: Math.max(s.high52, live.high),
          low52: Math.min(s.low52, live.low),
        };
      }
      return s;
    });
  }, [stocks, liveQuotes]);

  return merged;
}

export function useStock(ticker: string) {
  const [liveQuote, setLiveQuote] = useState<RealtimeQuote | null>(null);
  const [liveHistory, setLiveHistory] = useState<PricePoint[] | null>(null);
  const stock = useMemo(() => getStock(ticker), [ticker]);

  useEffect(() => {
    let active = true;
    setLiveQuote(null);
    setLiveHistory(null);
    fetchQuote(ticker).then((q) => {
      if (active) setLiveQuote(q);
    });
    fetchCandles(ticker, 365).then((candles) => {
      if (active) setLiveHistory(candles);
    });
    return () => { active = false; };
  }, [ticker]);

  return useMemo<Stock | null>(() => {
    if (!stock) return null;
    const history = liveHistory && liveHistory.length > 0 ? liveHistory : stock.history;
    const base: Stock = { ...stock, history };
    if (liveQuote) {
      return {
        ...base,
        price: liveQuote.currentPrice,
        change: liveQuote.change,
        changePct: liveQuote.changePct,
        prevClose: liveQuote.prevClose,
        high52: Math.max(stock.high52, liveQuote.high),
        low52: Math.min(stock.low52, liveQuote.low),
      };
    }
    return base;
  }, [stock, liveQuote, liveHistory]);
}

export function useETFs(market?: Market) {
  return useMemo(() => getETFs(market), [market]);
}

export function useETF(ticker: string) {
  return useMemo(() => getETF(ticker), [ticker]);
}

export function useIndices(market?: Market) {
  return useMemo(() => getIndices(market), [market]);
}

export function useSectors(market?: Market) {
  return useMemo(() => getSectors(market), [market]);
}

export function useNews(ticker?: string) {
  const mock = useMemo(() => getNews(ticker), [ticker]);
  const [liveNews, setLiveNews] = useState<NewsItem[] | null>(null);

  useEffect(() => {
    let active = true;
    setLiveNews(null);
    fetchLiveNews('general').then((news) => {
      if (!active) return;
      if (news && news.length > 0) {
        const filtered = ticker
          ? news.filter((n) => n.tickers.includes(ticker))
          : news;
        setLiveNews(filtered.length > 0 ? filtered : news);
      }
    });
    return () => { active = false; };
  }, [ticker]);

  return useMemo<NewsItem[]>(() => {
    if (liveNews && liveNews.length > 0) return liveNews;
    return mock;
  }, [mock, liveNews]);
}

export function useSearch(query: string) {
  return useMemo(() => {
    if (!query || query.length < 1) return [];
    return searchAllAssets(query);
  }, [query]);
}

export function useAllSectors() {
  return useMemo(() => getAllSectors(), []);
}

export function useExchanges() {
  return useMemo(() => getExchanges(), []);
}
