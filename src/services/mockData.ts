import type {
  Stock, ETF, MutualFund, MarketIndex, Sector, NewsItem,
  PricePoint, Market, Currency,
} from '@/types';

// Deterministic PRNG so data is stable across reloads
function seeded(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

function genHistory(seed: number, startPrice: number, days: number, volatility = 0.02, drift = 0.0004): PricePoint[] {
  const rng = seeded(seed);
  const points: PricePoint[] = [];
  const now = new Date();
  let price = startPrice * (0.6 + rng() * 0.3); // start lower so we have growth
  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    // random walk
    const dailyReturn = (rng() - 0.5) * 2 * volatility + drift;
    const open = price;
    price = price * (1 + dailyReturn);
    const high = Math.max(open, price) * (1 + rng() * 0.01);
    const low = Math.min(open, price) * (1 - rng() * 0.01);
    const volume = Math.floor((0.5 + rng()) * 5_000_000);
    points.push({
      date: date.toISOString().split('T')[0],
      open: +open.toFixed(2),
      high: +high.toFixed(2),
      low: +low.toFixed(2),
      close: +price.toFixed(2),
      volume,
      adjustedClose: +price.toFixed(2),
    });
  }
  // normalize so last price matches target
  const lastClose = points[points.length - 1].close;
  const ratio = startPrice / lastClose;
  points.forEach((p) => {
    p.open = +(p.open * ratio).toFixed(2);
    p.high = +(p.high * ratio).toFixed(2);
    p.low = +(p.low * ratio).toFixed(2);
    p.close = +(p.close * ratio).toFixed(2);
    p.adjustedClose = p.close;
  });
  return points;
}

function sparkline(history: PricePoint[], n = 30): number[] {
  return history.slice(-n).map((p) => p.close);
}

function calcChange(history: PricePoint[]) {
  const last = history[history.length - 1].close;
  const prev = history[history.length - 2].close;
  const change = +(last - prev).toFixed(2);
  const changePct = +((change / prev) * 100).toFixed(2);
  return { change, changePct, price: last, prevClose: prev };
}

interface StockSeed {
  ticker: string; name: string; exchange: Stock['exchange']; market: Market;
  sector: string; industry: string; price: number; marketCap: number; volume: number;
  pe: number | null; divYield: number | null; beta: number; currency: Currency;
  description: string; volatility?: number; drift?: number;
}

const US_STOCK_SEEDS: StockSeed[] = [
  { ticker: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ', market: 'US', sector: 'Technology', industry: 'Consumer Electronics', price: 228.54, marketCap: 3480e9, volume: 45.2e6, pe: 34.2, divYield: 0.44, beta: 1.25, currency: 'USD', description: 'Designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide.' },
  { ticker: 'MSFT', name: 'Microsoft Corporation', exchange: 'NASDAQ', market: 'US', sector: 'Technology', industry: 'Software', price: 418.36, marketCap: 3110e9, volume: 18.3e6, pe: 36.1, divYield: 0.73, beta: 0.91, currency: 'USD', description: 'Develops, licenses, and supports software, services, devices, and solutions worldwide.' },
  { ticker: 'NVDA', name: 'NVIDIA Corporation', exchange: 'NASDAQ', market: 'US', sector: 'Technology', industry: 'Semiconductors', price: 134.72, marketCap: 3300e9, volume: 220e6, pe: 65.3, divYield: 0.03, beta: 1.68, currency: 'USD', description: 'Provides graphics, compute, and networking solutions and the leading AI accelerator platform.', volatility: 0.035, drift: 0.0015 },
  { ticker: 'GOOGL', name: 'Alphabet Inc.', exchange: 'NASDAQ', market: 'US', sector: 'Communication', industry: 'Internet Content', price: 166.89, marketCap: 2050e9, volume: 22.1e6, pe: 24.3, divYield: 0.0, beta: 1.04, currency: 'USD', description: 'Parent of Google, providing online advertising, cloud computing, search, and other technologies.' },
  { ticker: 'AMZN', name: 'Amazon.com, Inc.', exchange: 'NASDAQ', market: 'US', sector: 'Consumer Cyclical', industry: 'Internet Retail', price: 185.38, marketCap: 1940e9, volume: 35.6e6, pe: 43.8, divYield: 0.0, beta: 1.15, currency: 'USD', description: 'Engages in the retail sale of goods and services and offers cloud infrastructure through AWS.' },
  { ticker: 'META', name: 'Meta Platforms, Inc.', exchange: 'NASDAQ', market: 'US', sector: 'Communication', industry: 'Internet Content', price: 578.32, marketCap: 1460e9, volume: 14.8e6, pe: 27.5, divYield: 0.34, beta: 1.21, currency: 'USD', description: 'Develops products that enable people to connect through devices and the metaverse.' },
  { ticker: 'TSLA', name: 'Tesla, Inc.', exchange: 'NASDAQ', market: 'US', sector: 'Consumer Cyclical', industry: 'Auto Manufacturers', price: 243.84, marketCap: 777e9, volume: 95.2e6, pe: 71.2, divYield: 0.0, beta: 2.05, currency: 'USD', description: 'Designs, develops, manufactures, and sells electric vehicles and energy generation/storage systems.', volatility: 0.04, drift: 0.0008 },
  { ticker: 'BRK.B', name: 'Berkshire Hathaway Inc.', exchange: 'NYSE', market: 'US', sector: 'Financial', industry: 'Insurance—Diversified', price: 462.15, marketCap: 1000e9, volume: 3.2e6, pe: 9.1, divYield: 0.0, beta: 0.86, currency: 'USD', description: 'Holding company with subsidiaries in insurance, rail transportation, energy, manufacturing, and retail.' },
  { ticker: 'JPM', name: 'JPMorgan Chase & Co.', exchange: 'NYSE', market: 'US', sector: 'Financial', industry: 'Banks—Diversified', price: 218.45, marketCap: 615e9, volume: 8.1e6, pe: 12.3, divYield: 2.15, beta: 1.10, currency: 'USD', description: 'Global financial services firm providing investment banking, asset management, and retail banking.' },
  { ticker: 'V', name: 'Visa Inc.', exchange: 'NYSE', market: 'US', sector: 'Financial', industry: 'Credit Services', price: 278.91, marketCap: 560e9, volume: 6.5e6, pe: 31.0, divYield: 0.76, beta: 0.96, currency: 'USD', description: 'Operates as a payments technology company connecting consumers, merchants, and financial institutions.' },
  { ticker: 'WMT', name: 'Walmart Inc.', exchange: 'NYSE', market: 'US', sector: 'Consumer Defensive', industry: 'Discount Stores', price: 82.34, marketCap: 661e9, volume: 15.3e6, pe: 36.8, divYield: 1.12, beta: 0.51, currency: 'USD', description: 'Engages in retail and wholesale operations worldwide through supercenters and e-commerce.' },
  { ticker: 'XOM', name: 'Exxon Mobil Corporation', exchange: 'NYSE', market: 'US', sector: 'Energy', industry: 'Oil & Gas Integrated', price: 108.76, marketCap: 482e9, volume: 12.4e6, pe: 14.5, divYield: 3.28, beta: 0.88, currency: 'USD', description: 'Explores, produces, transports, and sells crude oil, natural gas, and petroleum products.' },
  { ticker: 'JNJ', name: 'Johnson & Johnson', exchange: 'NYSE', market: 'US', sector: 'Healthcare', industry: 'Drug Manufacturers', price: 160.52, marketCap: 387e9, volume: 6.8e6, pe: 22.7, divYield: 3.15, beta: 0.54, currency: 'USD', description: 'Researches, develops, and sells pharmaceuticals, medical devices, and consumer health products.' },
  { ticker: 'DIS', name: 'The Walt Disney Company', exchange: 'NYSE', market: 'US', sector: 'Communication', industry: 'Entertainment', price: 94.18, marketCap: 171e9, volume: 9.2e6, pe: 38.5, divYield: 0.85, beta: 1.39, currency: 'USD', description: 'Operates as an entertainment company with theme parks, media networks, streaming, and film production.' },
  { ticker: 'PG', name: 'Procter & Gamble Company', exchange: 'NYSE', market: 'US', sector: 'Consumer Defensive', industry: 'Household Products', price: 168.42, marketCap: 398e9, volume: 5.1e6, pe: 28.1, divYield: 2.28, beta: 0.41, currency: 'USD', description: 'Provides branded consumer packaged goods including beauty, grooming, health care, and fabric care.' },
  { ticker: 'KO', name: 'The Coca-Cola Company', exchange: 'NYSE', market: 'US', sector: 'Consumer Defensive', industry: 'Beverages', price: 62.87, marketCap: 271e9, volume: 11.7e6, pe: 26.8, divYield: 2.85, beta: 0.58, currency: 'USD', description: 'Beverage company that manufactures, markets, and sells nonalcoholic beverages worldwide.' },
  { ticker: 'AMD', name: 'Advanced Micro Devices, Inc.', exchange: 'NASDAQ', market: 'US', sector: 'Technology', industry: 'Semiconductors', price: 152.18, marketCap: 246e9, volume: 42.3e6, pe: 45.6, divYield: 0.0, beta: 1.70, currency: 'USD', description: 'Operates as a semiconductor company providing CPUs, GPUs, and chipsets for computing and data centers.', volatility: 0.035, drift: 0.001 },
  { ticker: 'NFLX', name: 'Netflix, Inc.', exchange: 'NASDAQ', market: 'US', sector: 'Communication', industry: 'Entertainment', price: 689.74, marketCap: 295e9, volume: 4.2e6, pe: 42.1, divYield: 0.0, beta: 1.28, currency: 'USD', description: 'Provides entertainment services with TV series, documentaries, feature films, and games across 190+ countries.' },
  { ticker: 'BAC', name: 'Bank of America Corporation', exchange: 'NYSE', market: 'US', sector: 'Financial', industry: 'Banks—Diversified', price: 40.12, marketCap: 312e9, volume: 28.4e6, pe: 13.8, divYield: 2.58, beta: 1.32, currency: 'USD', description: 'Provides banking and financial products and services to individual consumers and businesses.' },
  { ticker: 'CVX', name: 'Chevron Corporation', exchange: 'NYSE', market: 'US', sector: 'Energy', industry: 'Oil & Gas Integrated', price: 152.63, marketCap: 284e9, volume: 7.9e6, pe: 15.2, divYield: 4.12, beta: 1.12, currency: 'USD', description: 'Engages in integrated energy, chemicals, and petroleum operations worldwide.' },
  { ticker: 'PFE', name: 'Pfizer Inc.', exchange: 'NYSE', market: 'US', sector: 'Healthcare', industry: 'Drug Manufacturers', price: 28.91, marketCap: 164e9, volume: 22.1e6, pe: 11.4, divYield: 5.88, beta: 0.62, currency: 'USD', description: 'Discovers, develops, and supplies medicines and vaccines across various therapeutic areas.' },
  { ticker: 'INTC', name: 'Intel Corporation', exchange: 'NASDAQ', market: 'US', sector: 'Technology', industry: 'Semiconductors', price: 23.45, marketCap: 101e9, volume: 38.6e6, pe: 0, divYield: 1.50, beta: 1.05, currency: 'USD', description: 'Designs and manufactures computer products and technologies worldwide.', volatility: 0.03, drift: -0.0005 },
];

const IN_STOCK_SEEDS: StockSeed[] = [
  { ticker: 'RELIANCE', name: 'Reliance Industries Ltd.', exchange: 'NSE', market: 'IN', sector: 'Energy', industry: 'Oil & Gas Refining', price: 2945.30, marketCap: 19920e9, volume: 5.8e6, pe: 28.5, divYield: 0.45, beta: 1.15, currency: 'INR', description: 'India\'s largest private-sector company with businesses in energy, petrochemicals, retail, telecom, and digital services.' },
  { ticker: 'TCS', name: 'Tata Consultancy Services Ltd.', exchange: 'NSE', market: 'IN', sector: 'Technology', industry: 'IT Services', price: 4185.60, marketCap: 15120e9, volume: 1.8e6, pe: 29.8, divYield: 1.58, beta: 0.85, currency: 'INR', description: 'Leading global IT services, consulting, and business solutions organization serving Fortune 500 companies.' },
  { ticker: 'HDFCBANK', name: 'HDFC Bank Ltd.', exchange: 'NSE', market: 'IN', sector: 'Financial', industry: 'Banks', price: 1718.25, marketCap: 13050e9, volume: 8.2e6, pe: 19.2, divYield: 1.12, beta: 0.82, currency: 'INR', description: 'India\'s largest private-sector bank providing banking and financial services to millions of customers.' },
  { ticker: 'INFY', name: 'Infosys Ltd.', exchange: 'NSE', market: 'IN', sector: 'Technology', industry: 'IT Services', price: 1842.10, marketCap: 7640e9, volume: 4.5e6, pe: 26.3, divYield: 2.15, beta: 0.95, currency: 'INR', description: 'Global digital services and consulting company helping enterprises navigate digital transformation.' },
  { ticker: 'BHARTIARTL', name: 'Bharti Airtel Ltd.', exchange: 'NSE', market: 'IN', sector: 'Communication', industry: 'Telecom', price: 1658.40, marketCap: 9820e9, volume: 3.1e6, pe: 68.5, divYield: 0.50, beta: 1.05, currency: 'INR', description: 'Leading telecommunications company serving India and South Asia with mobile, broadband, and enterprise services.' },
  { ticker: 'ITC', name: 'ITC Ltd.', exchange: 'NSE', market: 'IN', sector: 'Consumer Defensive', industry: 'Tobacco & FMCG', price: 468.75, marketCap: 5860e9, volume: 12.4e6, pe: 27.5, divYield: 3.18, beta: 0.70, currency: 'INR', description: 'Diversified conglomerate in FMCG, hotels, paperboards, packaging, and agribusiness.' },
  { ticker: 'SBIN', name: 'State Bank of India', exchange: 'NSE', market: 'IN', sector: 'Financial', industry: 'Banks', price: 812.30, marketCap: 7240e9, volume: 15.6e6, pe: 10.5, divYield: 1.62, beta: 1.20, currency: 'INR', description: 'India\'s largest public-sector bank providing comprehensive banking services nationwide.' },
  { ticker: 'LT', name: 'Larsen & Toubro Ltd.', exchange: 'NSE', market: 'IN', sector: 'Industrials', industry: 'Engineering & Construction', price: 3585.20, marketCap: 4930e9, volume: 2.1e6, pe: 35.2, divYield: 0.85, beta: 1.35, currency: 'INR', description: 'Indian multinational engaged in engineering, construction, manufacturing, and technology services.' },
  { ticker: 'AXISBANK', name: 'Axis Bank Ltd.', exchange: 'NSE', market: 'IN', sector: 'Financial', industry: 'Banks', price: 1148.65, marketCap: 3540e9, volume: 6.8e6, pe: 13.8, divYield: 0.15, beta: 1.25, currency: 'INR', description: 'Private-sector bank offering comprehensive financial services across India.' },
  { ticker: 'MARUTI', name: 'Maruti Suzuki India Ltd.', exchange: 'NSE', market: 'IN', sector: 'Consumer Cyclical', industry: 'Auto Manufacturers', price: 12420.50, marketCap: 39000e9, volume: 0.4e6, pe: 27.8, divYield: 1.05, beta: 1.10, currency: 'INR', description: 'India\'s largest car manufacturer producing a wide range of passenger vehicles.' },
  { ticker: 'SUNPHARMA', name: 'Sun Pharmaceutical Industries Ltd.', exchange: 'NSE', market: 'IN', sector: 'Healthcare', industry: 'Drug Manufacturers', price: 1782.90, marketCap: 4270e9, volume: 1.5e6, pe: 38.5, divYield: 0.58, beta: 0.88, currency: 'INR', description: 'Largest pharmaceutical company in India with global presence in specialty generics and APIs.' },
  { ticker: 'WIPRO', name: 'Wipro Ltd.', exchange: 'NSE', market: 'IN', sector: 'Technology', industry: 'IT Services', price: 538.42, marketCap: 2820e9, volume: 5.3e6, pe: 24.5, divYield: 0.32, beta: 1.00, currency: 'INR', description: 'Global IT services company providing digital transformation, consulting, and business process services.' },
  { ticker: 'TATAMOTORS', name: 'Tata Motors Ltd.', exchange: 'NSE', market: 'IN', sector: 'Consumer Cyclical', industry: 'Auto Manufacturers', price: 935.80, marketCap: 3450e9, volume: 9.2e6, pe: 11.2, divYield: 0.42, beta: 1.75, currency: 'INR', description: 'Automotive manufacturer producing cars, utility vehicles, trucks, buses, and luxury vehicles (JLR).' },
  { ticker: 'HINDUNILVR', name: 'Hindustan Unilever Ltd.', exchange: 'NSE', market: 'IN', sector: 'Consumer Defensive', industry: 'Household Products', price: 2485.60, marketCap: 5840e9, volume: 1.2e6, pe: 55.8, divYield: 1.68, beta: 0.52, currency: 'INR', description: 'FMCG company with products in home care, personal care, and foods & refreshment segments.' },
  { ticker: 'BAJFINANCE', name: 'Bajaj Finance Ltd.', exchange: 'NSE', market: 'IN', sector: 'Financial', industry: 'Credit Services', price: 7185.40, marketCap: 4460e9, volume: 1.8e6, pe: 32.5, divYield: 0.52, beta: 1.45, currency: 'INR', description: 'Non-banking financial company providing consumer and commercial lending across India.' },
  { ticker: 'HCLTECH', name: 'HCL Technologies Ltd.', exchange: 'NSE', market: 'IN', sector: 'Technology', industry: 'IT Services', price: 1845.30, marketCap: 5000e9, volume: 3.2e6, pe: 27.2, divYield: 3.25, beta: 0.90, currency: 'INR', description: 'Global technology company providing IT and business process outsourcing services.' },
  { ticker: 'ADANIENT', name: 'Adani Enterprises Ltd.', exchange: 'NSE', market: 'IN', sector: 'Industrials', industry: 'Conglomerate', price: 2845.70, marketCap: 3290e9, volume: 3.5e6, pe: 65.8, divYield: 0.08, beta: 1.95, currency: 'INR', description: 'Diversified conglomerate with businesses in trading, resources, logistics, energy, and agri products.', volatility: 0.035 },
  { ticker: 'ASIANPAINT', name: 'Asian Paints Ltd.', exchange: 'NSE', market: 'IN', sector: 'Consumer Cyclical', industry: 'Building Materials', price: 2895.15, marketCap: 2775e9, volume: 1.3e6, pe: 52.3, divYield: 1.15, beta: 0.78, currency: 'INR', description: 'Largest paint company in India and Asia\'s third largest, providing decorative and industrial coatings.' },
  { ticker: 'TITAN', name: 'Titan Company Ltd.', exchange: 'NSE', market: 'IN', sector: 'Consumer Cyclical', industry: 'Luxury Goods', price: 3385.80, marketCap: 3005e9, volume: 1.6e6, pe: 88.5, divYield: 0.32, beta: 1.08, currency: 'INR', description: 'India\'s leading manufacturer of watches, jewelry (Tanishq), and eyewear.' },
  { ticker: 'ULTRACEMCO', name: 'UltraTech Cement Ltd.', exchange: 'NSE', market: 'IN', sector: 'Industrials', industry: 'Building Materials', price: 11245.60, marketCap: 32450e9, volume: 0.3e6, pe: 48.2, divYield: 0.42, beta: 1.15, currency: 'INR', description: 'Largest manufacturer of grey cement, ready-mix concrete, and white cement in India.' },
];

function buildStock(s: StockSeed, seed: number): Stock {
  const history = genHistory(seed, s.price, 1825, s.volatility ?? 0.025, s.drift ?? 0.0004);
  const { change, changePct, price, prevClose } = calcChange(history);
  const sp = sparkline(history);
  const high52 = Math.max(...history.slice(-252).map((p) => p.high));
  const low52 = Math.min(...history.slice(-252).map((p) => p.low));
  const avgVolume = Math.floor(s.volume * 0.85);
  return {
    id: `${s.market}-${s.ticker}`,
    ticker: s.ticker,
    name: s.name,
    exchange: s.exchange,
    market: s.market,
    sector: s.sector,
    industry: s.industry,
    price: +price.toFixed(2),
    prevClose: +prevClose.toFixed(2),
    change,
    changePct,
    marketCap: s.marketCap,
    volume: s.volume,
    avgVolume,
    peRatio: s.pe !== null && s.pe > 0 ? s.pe : null,
    dividendYield: s.divYield,
    high52: +high52.toFixed(2),
    low52: +low52.toFixed(2),
    beta: s.beta,
    currency: s.currency,
    description: s.description,
    sparkline: sp,
    history,
    eps: s.pe !== null && s.pe > 0 ? +(s.price / s.pe).toFixed(2) : null,
    bookValue: +(s.price * (0.3 + Math.random() * 0.5)).toFixed(2),
    roce: +(10 + Math.random() * 25).toFixed(2),
    roe: +(8 + Math.random() * 20).toFixed(2),
    debtToEquity: +(Math.random() * 1.5).toFixed(2),
  };
}

// Generate stocks
const allStockSeeds = [...US_STOCK_SEEDS, ...IN_STOCK_SEEDS];
const stocks: Stock[] = allStockSeeds.map((s, i) => buildStock(s, 1000 + i * 7));

// ETF seeds
interface ETFSeed {
  ticker: string; name: string; exchange: ETF['exchange']; market: Market;
  issuer: string; price: number; aum: number; expenseRatio: number;
  trackingIndex: string; category: string; yield: number | null;
  inceptionDate: string; currency: Currency; volume: number;
  holdings: { name: string; weight: number }[];
  sectors: { sector: string; weight: number }[];
}

const ETF_SEEDS: ETFSeed[] = [
  { ticker: 'SPY', name: 'SPDR S&P 500 ETF Trust', exchange: 'NYSE', market: 'US', issuer: 'State Street', price: 568.35, aum: 580e9, expenseRatio: 0.094, trackingIndex: 'S&P 500', category: 'Broad Market', yield: 1.32, inceptionDate: '1993-01-22', currency: 'USD', volume: 35e6, holdings: [
    { name: 'Apple Inc.', weight: 6.8 }, { name: 'Microsoft Corp.', weight: 6.2 }, { name: 'NVIDIA Corp.', weight: 6.5 }, { name: 'Amazon.com', weight: 3.9 }, { name: 'Meta Platforms', weight: 2.9 }, { name: 'Alphabet Inc.', weight: 4.1 }
  ], sectors: [{ sector: 'Technology', weight: 31.2 }, { sector: 'Financial', weight: 13.1 }, { sector: 'Healthcare', weight: 11.5 }, { sector: 'Consumer Cyclical', weight: 10.8 }] },
  { ticker: 'QQQ', name: 'Invesco QQQ Trust', exchange: 'NASDAQ', market: 'US', issuer: 'Invesco', price: 485.20, aum: 320e9, expenseRatio: 0.20, trackingIndex: 'NASDAQ-100', category: 'Broad Market', yield: 0.56, inceptionDate: '1999-03-10', currency: 'USD', volume: 28e6, holdings: [
    { name: 'Apple Inc.', weight: 8.5 }, { name: 'Microsoft Corp.', weight: 8.2 }, { name: 'NVIDIA Corp.', weight: 8.8 }, { name: 'Amazon.com', weight: 4.5 }, { name: 'Meta Platforms', weight: 3.8 }
  ], sectors: [{ sector: 'Technology', weight: 52.5 }, { sector: 'Communication', weight: 15.2 }, { sector: 'Consumer Cyclical', weight: 12.8 }, { sector: 'Healthcare', weight: 7.5 }] },
  { ticker: 'VOO', name: 'Vanguard S&P 500 ETF', exchange: 'NYSE', market: 'US', issuer: 'Vanguard', price: 522.10, aum: 440e9, expenseRatio: 0.03, trackingIndex: 'S&P 500', category: 'Broad Market', yield: 1.28, inceptionDate: '2010-09-07', currency: 'USD', volume: 4.2e6, holdings: [
    { name: 'Apple Inc.', weight: 6.8 }, { name: 'Microsoft Corp.', weight: 6.2 }, { name: 'NVIDIA Corp.', weight: 6.5 }, { name: 'Amazon.com', weight: 3.9 }
  ], sectors: [{ sector: 'Technology', weight: 31.2 }, { sector: 'Financial', weight: 13.1 }, { sector: 'Healthcare', weight: 11.5 }] },
  { ticker: 'VTI', name: 'Vanguard Total Stock Market ETF', exchange: 'NYSE', market: 'US', issuer: 'Vanguard', price: 278.45, aum: 170e9, expenseRatio: 0.03, trackingIndex: 'CRSP US Total Market', category: 'Broad Market', yield: 1.35, inceptionDate: '2001-05-24', currency: 'USD', volume: 3.1e6, holdings: [
    { name: 'Apple Inc.', weight: 5.2 }, { name: 'Microsoft Corp.', weight: 4.8 }, { name: 'NVIDIA Corp.', weight: 5.0 }, { name: 'Amazon.com', weight: 3.0 }
  ], sectors: [{ sector: 'Technology', weight: 28.5 }, { sector: 'Financial', weight: 14.2 }, { sector: 'Healthcare', weight: 12.1 }] },
  { ticker: 'XLK', name: 'Technology Select Sector SPDR', exchange: 'NYSE', market: 'US', issuer: 'State Street', price: 232.18, aum: 72e9, expenseRatio: 0.09, trackingIndex: 'Technology Select Sector', category: 'Sector', yield: 0.68, inceptionDate: '1998-12-16', currency: 'USD', volume: 5.5e6, holdings: [
    { name: 'Microsoft Corp.', weight: 21.5 }, { name: 'Apple Inc.', weight: 21.8 }, { name: 'NVIDIA Corp.', weight: 18.2 }, { name: 'Broadcom', weight: 5.1 }
  ], sectors: [{ sector: 'Software', weight: 42.5 }, { sector: 'Semiconductors', weight: 38.2 }, { sector: 'IT Services', weight: 12.1 }] },
  { ticker: 'XLE', name: 'Energy Select Sector SPDR', exchange: 'NYSE', market: 'US', issuer: 'State Street', price: 92.34, aum: 12e9, expenseRatio: 0.09, trackingIndex: 'Energy Select Sector', category: 'Sector', yield: 3.45, inceptionDate: '1998-12-16', currency: 'USD', volume: 8.2e6, holdings: [
    { name: 'Exxon Mobil', weight: 22.5 }, { name: 'Chevron Corp.', weight: 15.8 }, { name: 'ConocoPhillips', weight: 8.2 }
  ], sectors: [{ sector: 'Integrated Oil', weight: 42.5 }, { sector: 'E&P', weight: 28.2 }, { sector: 'Midstream', weight: 18.1 }] },
  { ticker: 'VYM', name: 'Vanguard High Dividend Yield ETF', exchange: 'NYSE', market: 'US', issuer: 'Vanguard', price: 122.85, aum: 55e9, expenseRatio: 0.06, trackingIndex: 'FTSE High Dividend Yield', category: 'Dividend', yield: 2.85, inceptionDate: '2006-11-10', currency: 'USD', volume: 1.8e6, holdings: [
    { name: 'JPMorgan Chase', weight: 3.2 }, { name: 'Exxon Mobil', weight: 3.1 }, { name: 'Johnson & Johnson', weight: 2.8 }
  ], sectors: [{ sector: 'Financial', weight: 20.5 }, { sector: 'Consumer Defensive', weight: 15.2 }, { sector: 'Healthcare', weight: 13.8 }] },
  { ticker: 'NIFTYBEES', name: 'Nippon India Nifty 50 ETF', exchange: 'NSE', market: 'IN', issuer: 'Nippon Life', price: 285.45, aum: 420e9, expenseRatio: 0.05, trackingIndex: 'NIFTY 50', category: 'Broad Market', yield: 1.15, inceptionDate: '2009-01-08', currency: 'INR', volume: 2.5e6, holdings: [
    { name: 'Reliance Industries', weight: 9.2 }, { name: 'HDFC Bank', weight: 13.8 }, { name: 'Infosys', weight: 7.5 }, { name: 'TCS', weight: 4.2 }
  ], sectors: [{ sector: 'Financial', weight: 28.5 }, { sector: 'Technology', weight: 18.2 }, { sector: 'Energy', weight: 12.5 }] },
  { ticker: 'GOLDBEES', name: 'Nippon India Gold ETF', exchange: 'NSE', market: 'IN', issuer: 'Nippon Life', price: 62.18, aum: 180e9, expenseRatio: 0.50, trackingIndex: 'Domestic Gold Price', category: 'Commodity', yield: null, inceptionDate: '2007-03-15', currency: 'INR', volume: 8.5e6, holdings: [
    { name: 'Gold (Physical)', weight: 99.5 }
  ], sectors: [{ sector: 'Gold', weight: 99.5 }] },
  { ticker: 'BANKBEES', name: 'Nippon India Bank ETF', exchange: 'NSE', market: 'IN', issuer: 'Nippon Life', price: 525.30, aum: 95e9, expenseRatio: 0.07, trackingIndex: 'NIFTY Bank', category: 'Sector', yield: 1.25, inceptionDate: '2011-06-22', currency: 'INR', volume: 1.8e6, holdings: [
    { name: 'HDFC Bank', weight: 28.5 }, { name: 'ICICI Bank', weight: 22.8 }, { name: 'State Bank of India', weight: 12.5 }
  ], sectors: [{ sector: 'Private Banks', weight: 65.2 }, { sector: 'Public Banks', weight: 28.5 }] },
  { ticker: 'LIQUIDBEES', name: 'Nippon India Liquid ETF', exchange: 'NSE', market: 'IN', issuer: 'Nippon Life', price: 1000.15, aum: 250e9, expenseRatio: 0.05, trackingIndex: 'Nifty 1D Rate', category: 'Bond', yield: 6.85, inceptionDate: '2009-11-09', currency: 'INR', volume: 0.5e6, holdings: [
    { name: 'Treasury Bills', weight: 85.2 }, { name: 'Commercial Paper', weight: 14.8 }
  ], sectors: [{ sector: 'Government Securities', weight: 85.2 }, { sector: 'Corporate', weight: 14.8 }] },
];

const etfs: ETF[] = ETF_SEEDS.map((e, i) => {
  const history = genHistory(5000 + i * 13, e.price, 1825, 0.018, 0.0005);
  const { change, changePct, price, prevClose } = calcChange(history);
  const sp = sparkline(history);
  return {
    id: `etf-${e.ticker}`,
    ticker: e.ticker,
    name: e.name,
    exchange: e.exchange,
    market: e.market,
    issuer: e.issuer,
    price: +price.toFixed(2),
    nav: +price.toFixed(2),
    change,
    changePct,
    aum: e.aum,
    expenseRatio: e.expenseRatio,
    volume: e.volume,
    trackingIndex: e.trackingIndex,
    yield: e.yield,
    inceptionDate: e.inceptionDate,
    category: e.category,
    topHoldings: e.holdings,
    sectorAllocation: e.sectors,
    sparkline: sp,
    history,
    currency: e.currency,
  };
});

// Mutual Fund seeds
interface MFSeed {
  name: string; amc: string; category: MutualFund['category']; plan: MutualFund['plan'];
  option: MutualFund['option']; nav: number; expenseRatio: number; aum: number;
  benchmark: string; riskLevel: MutualFund['riskLevel']; inceptionDate: string;
  holdings: { name: string; weight: number }[];
  sectors: { sector: string; weight: number }[];
}

const MF_SEEDS: MFSeed[] = [
  { name: 'SBI Small Cap Fund', amc: 'SBI Mutual Fund', category: 'Equity', plan: 'Direct', option: 'Growth', nav: 178.32, expenseRatio: 0.68, aum: 28000e7, benchmark: 'NIFTY Smallcap 250', riskLevel: 'Very High', inceptionDate: '2009-11-09', holdings: [
    { name: 'CMC Ltd', weight: 2.8 }, { name: 'Electronics Mart', weight: 2.5 }, { name: 'APL Apollo', weight: 2.2 }
  ], sectors: [{ sector: 'Industrials', weight: 22.5 }, { sector: 'Consumer Cyclical', weight: 18.2 }, { sector: 'Technology', weight: 15.8 }] },
  { name: 'HDFC Mid-Cap Opportunities Fund', amc: 'HDFC Mutual Fund', category: 'Equity', plan: 'Direct', option: 'Growth', nav: 168.45, expenseRatio: 0.85, aum: 76000e7, benchmark: 'NIFTY Midcap 150', riskLevel: 'High', inceptionDate: '2007-06-25', holdings: [
    { name: 'Max Healthcare', weight: 3.5 }, { name: 'ICICI Bank', weight: 3.2 }, { name: 'Crompton Greaves', weight: 2.8 }
  ], sectors: [{ sector: 'Financial', weight: 18.5 }, { sector: 'Healthcare', weight: 12.8 }, { sector: 'Industrials', weight: 12.2 }] },
  { name: 'Axis Bluechip Fund', amc: 'Axis Mutual Fund', category: 'Equity', plan: 'Direct', option: 'Growth', nav: 62.18, expenseRatio: 0.52, aum: 55000e7, benchmark: 'NIFTY 50', riskLevel: 'High', inceptionDate: '2010-11-26', holdings: [
    { name: 'HDFC Bank', weight: 8.5 }, { name: 'Reliance Industries', weight: 7.2 }, { name: 'TCS', weight: 5.8 }
  ], sectors: [{ sector: 'Financial', weight: 28.5 }, { sector: 'Technology', weight: 15.2 }, { sector: 'Energy', weight: 10.8 }] },
  { name: 'Mirae Asset Large Cap Fund', amc: 'Mirae Asset Mutual Fund', category: 'Equity', plan: 'Direct', option: 'Growth', nav: 98.55, expenseRatio: 0.53, aum: 36500e7, benchmark: 'NIFTY 100', riskLevel: 'High', inceptionDate: '2008-04-28', holdings: [
    { name: 'HDFC Bank', weight: 7.8 }, { name: 'Reliance Industries', weight: 6.5 }, { name: 'Infosys', weight: 5.2 }
  ], sectors: [{ sector: 'Financial', weight: 25.8 }, { sector: 'Technology', weight: 16.5 }, { sector: 'Consumer Defensive', weight: 11.2 }] },
  { name: 'ICICI Prudential Equity & Debt Fund', amc: 'ICICI Prudential MF', category: 'Hybrid', plan: 'Direct', option: 'Growth', nav: 285.60, expenseRatio: 0.78, aum: 32000e7, benchmark: 'NIFTY 50 Hybrid Composite', riskLevel: 'High', inceptionDate: '1999-10-22', holdings: [
    { name: 'ICICI Bank', weight: 5.2 }, { name: 'HDFC Bank', weight: 4.8 }, { name: 'Reliance Industries', weight: 3.5 }
  ], sectors: [{ sector: 'Equity—Financial', weight: 22.5 }, { sector: 'Equity—Technology', weight: 12.8 }, { sector: 'Debt—Government', weight: 35.2 }] },
  { name: 'SBI Equity Hybrid Fund', amc: 'SBI Mutual Fund', category: 'Hybrid', plan: 'Direct', option: 'Growth', nav: 215.40, expenseRatio: 0.72, aum: 45000e7, benchmark: 'NIFTY 50 Hybrid Composite', riskLevel: 'High', inceptionDate: '1995-05-17', holdings: [
    { name: 'HDFC Bank', weight: 4.5 }, { name: 'Reliance Industries', weight: 3.8 }, { name: 'ICICI Bank', weight: 3.2 }
  ], sectors: [{ sector: 'Equity—Financial', weight: 18.5 }, { sector: 'Debt—Corporate', weight: 32.8 }, { sector: 'Equity—Technology', weight: 10.2 }] },
  { name: 'ICICI Prudential Liquid Fund', amc: 'ICICI Prudential MF', category: 'Liquid', plan: 'Direct', option: 'Growth', nav: 3785.25, expenseRatio: 0.20, aum: 280000e7, benchmark: 'CRISIL Liquid Fund Index', riskLevel: 'Low', inceptionDate: '1999-04-09', holdings: [
    { name: 'T-Bills', weight: 45.2 }, { name: 'Commercial Paper', weight: 28.5 }, { name: 'Certificates of Deposit', weight: 18.8 }
  ], sectors: [{ sector: 'Government Securities', weight: 45.2 }, { sector: 'Corporate Debt', weight: 47.3 }] },
  { name: 'Nippon India Nifty 50 Index Fund', amc: 'Nippon Life Mutual Fund', category: 'Index', plan: 'Direct', option: 'Growth', nav: 285.18, expenseRatio: 0.20, aum: 18500e7, benchmark: 'NIFTY 50', riskLevel: 'High', inceptionDate: '2001-09-26', holdings: [
    { name: 'HDFC Bank', weight: 13.8 }, { name: 'Reliance Industries', weight: 9.2 }, { name: 'Infosys', weight: 7.5 }
  ], sectors: [{ sector: 'Financial', weight: 28.5 }, { sector: 'Technology', weight: 18.2 }, { sector: 'Energy', weight: 12.5 }] },
  { name: 'HDFC Index Fund—Nifty 50 Plan', amc: 'HDFC Mutual Fund', category: 'Index', plan: 'Direct', option: 'Growth', nav: 195.82, expenseRatio: 0.20, aum: 12000e7, benchmark: 'NIFTY 50', riskLevel: 'High', inceptionDate: '2002-07-15', holdings: [
    { name: 'HDFC Bank', weight: 13.5 }, { name: 'Reliance Industries', weight: 9.0 }, { name: 'Infosys', weight: 7.8 }
  ], sectors: [{ sector: 'Financial', weight: 28.2 }, { sector: 'Technology', weight: 18.5 }, { sector: 'Energy', weight: 12.8 }] },
  { name: 'Mirae Asset Tax Saver Fund', amc: 'Mirae Asset Mutual Fund', category: 'ELSS', plan: 'Direct', option: 'Growth', nav: 42.15, expenseRatio: 0.56, aum: 28000e7, benchmark: 'NIFTY 50', riskLevel: 'High', inceptionDate: '2015-12-28', holdings: [
    { name: 'HDFC Bank', weight: 6.8 }, { name: 'Reliance Industries', weight: 5.5 }, { name: 'Axis Bank', weight: 4.2 }
  ], sectors: [{ sector: 'Financial', weight: 25.5 }, { sector: 'Technology', weight: 14.8 }, { sector: 'Consumer Cyclical', weight: 12.5 }] },
  { name: 'ICICI Prudential Corporate Bond Fund', amc: 'ICICI Prudential MF', category: 'Debt', plan: 'Direct', option: 'Growth', nav: 28.92, expenseRatio: 0.30, aum: 85000e7, benchmark: 'CRISIL Corporate Bond Index', riskLevel: 'Moderate', inceptionDate: '2014-01-09', holdings: [
    { name: 'HDFC Bank NCDs', weight: 8.5 }, { name: 'Reliance Industries NCDs', weight: 6.2 }, { name: 'Tata Capital NCDs', weight: 5.8 }
  ], sectors: [{ sector: 'AAA Corporate', weight: 72.5 }, { sector: 'AA+ Corporate', weight: 15.8 }, { sector: 'Government', weight: 8.2 }] },
  { name: 'SBI Magnum Gilt Fund', amc: 'SBI Mutual Fund', category: 'Debt', plan: 'Direct', option: 'Growth', nav: 88.45, expenseRatio: 0.79, aum: 3200e7, benchmark: 'CRISIL Gilt Index', riskLevel: 'Moderate', inceptionDate: '1992-12-28', holdings: [
    { name: 'Government of India Securities', weight: 68.5 }, { name: 'State Government Securities', weight: 18.2 }, { name: 'T-Bills', weight: 12.5 }
  ], sectors: [{ sector: 'Central Government', weight: 68.5 }, { sector: 'State Government', weight: 18.2 }] },
];

const mutualFunds: MutualFund[] = MF_SEEDS.map((m, i) => {
  const rng = seeded(7000 + i * 17);
  const navHistory: { date: string; nav: number }[] = [];
  const now = new Date();
  let nav = m.nav * 0.5;
  const returns = { '1M': 0, '3M': 0, '6M': 0, '1Y': 0, '3Y': 0, '5Y': 0 };
  for (let d = 1825; d >= 0; d--) {
    const date = new Date(now);
    date.setDate(date.getDate() - d);
    nav = nav * (1 + (rng() - 0.45) * 0.02);
    navHistory.push({ date: date.toISOString().split('T')[0], nav: +nav.toFixed(4) });
  }
  // normalize
  const ratio = m.nav / navHistory[navHistory.length - 1].nav;
  navHistory.forEach((p) => (p.nav = +(p.nav * ratio).toFixed(4)));

  const getNavAt = (days: number) => {
    const idx = navHistory.length - 1 - days;
    return idx >= 0 ? navHistory[idx].nav : navHistory[0].nav;
  };
  const current = m.nav;
  returns['1M'] = +((current / getNavAt(30) - 1) * 100).toFixed(2);
  returns['3M'] = +((current / getNavAt(90) - 1) * 100).toFixed(2);
  returns['6M'] = +((current / getNavAt(180) - 1) * 100).toFixed(2);
  returns['1Y'] = +((current / getNavAt(365) - 1) * 100).toFixed(2);
  returns['3Y'] = +((Math.pow(current / getNavAt(1095), 1 / 3) - 1) * 100).toFixed(2);
  returns['5Y'] = +((Math.pow(current / getNavAt(1825), 1 / 5) - 1) * 100).toFixed(2);

  return {
    id: `mf-${i}`,
    schemeCode: `SC${100000 + i}`,
    name: m.name,
    amc: m.amc,
    category: m.category,
    plan: m.plan,
    option: m.option,
    nav: m.nav,
    navDate: now.toISOString().split('T')[0],
    expenseRatio: m.expenseRatio,
    aum: m.aum,
    benchmark: m.benchmark,
    riskLevel: m.riskLevel,
    inceptionDate: m.inceptionDate,
    returns,
    navHistory,
    topHoldings: m.holdings,
    sectorAllocation: m.sectors,
  };
});

// Market Indices
interface IndexSeed {
  name: string; symbol: string; market: Market; value: number;
  sessionStatus: MarketIndex['sessionStatus'];
}

const INDEX_SEEDS: IndexSeed[] = [
  { name: 'NIFTY 50', symbol: 'NIFTY', market: 'IN', value: 24995.75, sessionStatus: 'closed' },
  { name: 'NIFTY Bank', symbol: 'BANKNIFTY', market: 'IN', value: 51832.40, sessionStatus: 'closed' },
  { name: 'NIFTY Next 50', symbol: 'NIFTYNEXT', market: 'IN', value: 65420.30, sessionStatus: 'closed' },
  { name: 'S&P BSE SENSEX', symbol: 'SENSEX', market: 'IN', value: 81588.56, sessionStatus: 'closed' },
  { name: 'S&P 500', symbol: 'SPX', market: 'US', value: 5685.45, sessionStatus: 'closed' },
  { name: 'NASDAQ Composite', symbol: 'IXIC', market: 'US', value: 18285.20, sessionStatus: 'closed' },
  { name: 'NASDAQ-100', symbol: 'NDX', market: 'US', value: 20145.80, sessionStatus: 'closed' },
  { name: 'Dow Jones Industrial Average', symbol: 'DJI', market: 'US', value: 42015.35, sessionStatus: 'closed' },
];

const indices: MarketIndex[] = INDEX_SEEDS.map((idx, i) => {
  const history = genHistory(8000 + i * 11, idx.value, 365, 0.012, 0.0006);
  const { change, changePct, price, prevClose } = calcChange(history);
  const sp = sparkline(history, 30);
  return {
    id: `idx-${idx.symbol}`,
    name: idx.name,
    symbol: idx.symbol,
    market: idx.market,
    value: +price.toFixed(2),
    change,
    changePct,
    sessionStatus: idx.sessionStatus,
    lastUpdated: new Date().toISOString(),
    sparkline: sp,
    history,
  };
});

// Sectors
function buildSectors(market: Market): Sector[] {
  const sectorStocks = stocks.filter((s) => s.market === market);
  const sectorMap = new Map<string, Stock[]>();
  sectorStocks.forEach((s) => {
    const arr = sectorMap.get(s.sector) || [];
    arr.push(s);
    sectorMap.set(s.sector, arr);
  });
  const sectors: Sector[] = [];
  sectorMap.forEach((stockList, name) => {
    const avgChange = stockList.reduce((sum, s) => sum + s.changePct, 0) / stockList.length;
    const totalCap = stockList.reduce((sum, s) => sum + s.marketCap, 0);
    const rng = seeded(name.charCodeAt(0) * 100 + name.length);
    const sp: number[] = [];
    for (let i = 0; i < 30; i++) sp.push(100 + (rng() - 0.5) * 10 + i * 0.2);
    sectors.push({
      name,
      market,
      changePct: +avgChange.toFixed(2),
      marketCap: totalCap,
      stockCount: stockList.length,
      topStocks: stockList
        .sort((a, b) => b.changePct - a.changePct)
        .slice(0, 3)
        .map((s) => ({ ticker: s.ticker, changePct: s.changePct })),
      sparkline: sp,
    });
  });
  return sectors.sort((a, b) => b.changePct - a.changePct);
}

const allSectors: Sector[] = [...buildSectors('US'), ...buildSectors('IN')];

// News
const NEWS_SEEDS: Omit<NewsItem, 'id'>[] = [
  { title: 'NVIDIA hits new record high on surging AI chip demand', summary: 'NVIDIA shares reached an all-time high as data center revenue exceeded analyst expectations, driven by enterprise AI adoption.', source: 'Reuters', url: '#', publishedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), category: 'market', tickers: ['NVDA'], sentiment: 'positive' },
  { title: 'Reliance Industries announces Q2 results tomorrow', summary: 'India\'s largest company by market cap is set to report quarterly earnings, with analysts expecting strong performance in telecom and retail.', source: 'Economic Times', url: '#', publishedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(), category: 'earnings', tickers: ['RELIANCE'], sentiment: 'neutral' },
  { title: 'Federal Reserve holds interest rates steady', summary: 'The Fed maintained its benchmark rate, signaling potential cuts later in the year if inflation continues to cool.', source: 'Bloomberg', url: '#', publishedAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(), category: 'economic', tickers: [], sentiment: 'positive' },
  { title: 'Apple announces new dividend and buyback program', summary: 'Apple declared a quarterly dividend and authorized a new share repurchase program worth $110 billion.', source: 'CNBC', url: '#', publishedAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString(), category: 'dividend', tickers: ['AAPL'], sentiment: 'positive' },
  { title: 'Tesla deliveries miss estimates in Q3', summary: 'Tesla reported fewer-than-expected vehicle deliveries, sending shares lower in after-hours trading.', source: 'MarketWatch', url: '#', publishedAt: new Date(Date.now() - 8 * 3600 * 1000).toISOString(), category: 'earnings', tickers: ['TSLA'], sentiment: 'negative' },
  { title: 'RBI maintains repo rate at 6.5%', summary: 'The Reserve Bank of India kept the policy rate unchanged while revising GDP growth projection upward for the fiscal year.', source: 'Business Standard', url: '#', publishedAt: new Date(Date.now() - 10 * 3600 * 1000).toISOString(), category: 'economic', tickers: [], sentiment: 'neutral' },
  { title: 'Microsoft cloud revenue surges 22% on AI adoption', summary: 'Azure and other cloud services drove strong quarterly growth as enterprise customers ramp up AI workloads.', source: 'Reuters', url: '#', publishedAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(), category: 'earnings', tickers: ['MSFT'], sentiment: 'positive' },
  { title: 'HDFC Bank completes merger with HDFC Ltd', summary: 'The merger creates one of the world\'s largest banks by market capitalization, combining lending and banking operations.', source: 'Economic Times', url: '#', publishedAt: new Date(Date.now() - 18 * 3600 * 1000).toISOString(), category: 'corporate', tickers: ['HDFCBANK'], sentiment: 'neutral' },
  { title: 'Oil prices rise on OPEC+ production cuts', summary: 'Crude oil futures gained as OPEC+ extended voluntary production cuts through the next quarter.', source: 'Bloomberg', url: '#', publishedAt: new Date(Date.now() - 20 * 3600 * 1000).toISOString(), category: 'market', tickers: ['XOM', 'CVX'], sentiment: 'positive' },
  { title: 'Infosys raises FY guidance on strong deal wins', summary: 'India\'s second-largest IT services firm raised its revenue growth guidance citing large contract signings.', source: 'LiveMint', url: '#', publishedAt: new Date(Date.now() - 22 * 3600 * 1000).toISOString(), category: 'earnings', tickers: ['INFY'], sentiment: 'positive' },
  { title: 'Amazon invests $4B in AI startup Anthropic', summary: 'Amazon deepens its AI strategy with a major investment in Anthropic, boosting AWS cloud adoption.', source: 'CNBC', url: '#', publishedAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(), category: 'corporate', tickers: ['AMZN'], sentiment: 'positive' },
  { title: 'Indian markets hit record highs on foreign inflows', summary: 'NIFTY 50 and SENSEX reached new all-time highs as foreign institutional investors continued buying.', source: 'Business Standard', url: '#', publishedAt: new Date(Date.now() - 26 * 3600 * 1000).toISOString(), category: 'market', tickers: [], sentiment: 'positive' },
];

const newsItems: NewsItem[] = NEWS_SEEDS.map((n, i) => ({ ...n, id: `news-${i}` }));

// --- Public API ---
const dataStore = {
  stocks,
  etfs,
  mutualFunds,
  indices,
  sectors: allSectors,
  news: newsItems,
};

export function getStocks(market?: Market): Stock[] {
  return market ? stocks.filter((s) => s.market === market) : stocks;
}

export function getStock(ticker: string): Stock | undefined {
  return stocks.find((s) => s.ticker === ticker);
}

export function getETFs(market?: Market): ETF[] {
  return market ? etfs.filter((e) => e.market === market) : etfs;
}

export function getETF(ticker: string): ETF | undefined {
  return etfs.find((e) => e.ticker === ticker);
}

export function getMutualFunds(): MutualFund[] {
  return mutualFunds;
}

export function getMutualFund(id: string): MutualFund | undefined {
  return mutualFunds.find((m) => m.id === id);
}

export function getIndices(market?: Market): MarketIndex[] {
  return market ? indices.filter((i) => i.market === market) : indices;
}

export function getIndex(symbol: string): MarketIndex | undefined {
  return indices.find((i) => i.symbol === symbol);
}

export function getSectors(market?: Market): Sector[] {
  return market ? allSectors.filter((s) => s.market === market) : allSectors;
}

export function getNews(ticker?: string): NewsItem[] {
  if (ticker) return newsItems.filter((n) => n.tickers.includes(ticker));
  return newsItems;
}

export function searchAllAssets(query: string): { type: string; ticker: string; name: string; exchange?: string }[] {
  const q = query.toLowerCase();
  const results: { type: string; ticker: string; name: string; exchange?: string }[] = [];
  stocks.forEach((s) => {
    if (s.ticker.toLowerCase().includes(q) || s.name.toLowerCase().includes(q))
      results.push({ type: 'stock', ticker: s.ticker, name: s.name, exchange: s.exchange });
  });
  etfs.forEach((e) => {
    if (e.ticker.toLowerCase().includes(q) || e.name.toLowerCase().includes(q))
      results.push({ type: 'etf', ticker: e.ticker, name: e.name, exchange: e.exchange });
  });
  mutualFunds.forEach((m) => {
    if (m.name.toLowerCase().includes(q) || m.amc.toLowerCase().includes(q))
      results.push({ type: 'mutualfund', ticker: m.id, name: m.name });
  });
  indices.forEach((i) => {
    if (i.name.toLowerCase().includes(q) || i.symbol.toLowerCase().includes(q))
      results.push({ type: 'index', ticker: i.symbol, name: i.name });
  });
  return results.slice(0, 10);
}

export function getAllSectors(): string[] {
  return [...new Set(stocks.map((s) => s.sector))].sort();
}

export function getExchanges(): string[] {
  return [...new Set(stocks.map((s) => s.exchange))].sort();
}

export default dataStore;
