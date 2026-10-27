export type Market = 'US';
export type Currency = 'USD';

export type AssetType = 'stock' | 'etf' | 'index';

export interface PricePoint {
  date: string; // ISO date
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  adjustedClose?: number;
}

export interface Stock {
  id: string;
  ticker: string;
  name: string;
  exchange: 'NASDAQ' | 'NYSE';
  market: Market;
  sector: string;
  industry: string;
  price: number;
  prevClose: number;
  change: number;
  changePct: number;
  marketCap: number;
  volume: number;
  avgVolume: number;
  peRatio: number | null;
  dividendYield: number | null;
  high52: number;
  low52: number;
  beta: number;
  currency: Currency;
  description: string;
  sparkline: number[];
  history: PricePoint[];
  eps: number | null;
  bookValue: number | null;
  roce: number | null;
  roe: number | null;
  debtToEquity: number | null;
}

export interface ETF {
  id: string;
  ticker: string;
  name: string;
  exchange: 'NASDAQ' | 'NYSE';
  market: Market;
  issuer: string;
  price: number;
  nav: number | null;
  change: number;
  changePct: number;
  aum: number;
  expenseRatio: number;
  volume: number;
  trackingIndex: string;
  yield: number | null;
  inceptionDate: string;
  category: string;
  topHoldings: { name: string; weight: number }[];
  sectorAllocation: { sector: string; weight: number }[];
  sparkline: number[];
  history: PricePoint[];
  currency: Currency;
}

export interface MarketIndex {
  id: string;
  name: string;
  symbol: string;
  market: Market;
  value: number;
  change: number;
  changePct: number;
  sessionStatus: 'open' | 'closed' | 'pre-open';
  lastUpdated: string;
  sparkline: number[];
  history: PricePoint[];
}

export interface Sector {
  name: string;
  market: Market;
  changePct: number;
  marketCap: number;
  stockCount: number;
  topStocks: { ticker: string; changePct: number }[];
  sparkline: number[];
}

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  url: string;
  publishedAt: string;
  category: 'market' | 'company' | 'earnings' | 'dividend' | 'corporate' | 'economic';
  tickers: string[];
  sentiment: 'positive' | 'negative' | 'neutral';
}

export interface PortfolioHolding {
  id: string;
  symbol: string;
  name: string;
  type: AssetType;
  quantity: number;
  purchasePrice: number;
  purchaseDate: string;
  transactionCosts: number;
  dividends: number;
  currentPrice: number;
  currency: Currency;
}

export interface Watchlist {
  id: string;
  name: string;
  symbols: { symbol: string; type: AssetType; addedAt: string }[];
  createdAt: string;
}

export type PeriodKey =
  | '1D' | '1W' | '1M' | '3M' | '6M' | 'YTD' | '1Y' | '3Y' | '5Y';

export interface RankingResult {
  symbol: string;
  name: string;
  type: AssetType;
  exchange: string;
  startPrice: number;
  endPrice: number;
  returnPct: number;
  annualizedReturn: number | null;
  volume: number;
  volatility: number;
}

export interface TechnicalIndicators {
  sma20: number | null;
  sma50: number | null;
  sma100: number | null;
  sma200: number | null;
  ema12: number | null;
  ema26: number | null;
  ema50: number | null;
  rsi14: number | null;
  macd: number | null;
  macdSignal: number | null;
  macdHistogram: number | null;
  bollingerUpper: number | null;
  bollingerMiddle: number | null;
  bollingerLower: number | null;
  atr: number | null;
  historicalVolatility: number | null;
}
