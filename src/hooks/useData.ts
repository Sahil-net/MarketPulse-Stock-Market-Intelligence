import { useMemo } from 'react';
import {
  getStocks, getETFs, getMutualFunds, getIndices, getSectors, getNews,
  searchAllAssets, getStock, getETF, getMutualFund, getAllSectors, getExchanges,
} from '@/services/mockData';
import type { Market } from '@/types';

export function useStocks(market?: Market) {
  return useMemo(() => getStocks(market), [market]);
}

export function useStock(ticker: string) {
  return useMemo(() => getStock(ticker), [ticker]);
}

export function useETFs(market?: Market) {
  return useMemo(() => getETFs(market), [market]);
}

export function useETF(ticker: string) {
  return useMemo(() => getETF(ticker), [ticker]);
}

export function useMutualFunds() {
  return useMemo(() => getMutualFunds(), []);
}

export function useMutualFund(id: string) {
  return useMemo(() => getMutualFund(id), [id]);
}

export function useIndices(market?: Market) {
  return useMemo(() => getIndices(market), [market]);
}

export function useSectors(market?: Market) {
  return useMemo(() => getSectors(market), [market]);
}

export function useNews(ticker?: string) {
  return useMemo(() => getNews(ticker), [ticker]);
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
