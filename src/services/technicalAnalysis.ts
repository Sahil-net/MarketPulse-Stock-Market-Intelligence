import type { PricePoint, TechnicalIndicators } from '@/types';

function sma(data: number[], period: number): number | null {
  if (data.length < period) return null;
  const slice = data.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

function ema(data: number[], period: number): number | null {
  if (data.length < period) return null;
  const k = 2 / (period + 1);
  let emaVal = data.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < data.length; i++) {
    emaVal = data[i] * k + emaVal * (1 - k);
  }
  return emaVal;
}

function rsi(data: number[], period = 14): number | null {
  if (data.length < period + 1) return null;
  let gains = 0;
  let losses = 0;
  for (let i = data.length - period; i < data.length; i++) {
    const diff = data[i] - data[i - 1];
    if (diff > 0) gains += diff;
    else losses -= diff;
  }
  const avgGain = gains / period;
  const avgLoss = losses / period;
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

function macd(data: number[]): { macd: number | null; signal: number | null; histogram: number | null } {
  if (data.length < 35) return { macd: null, signal: null, histogram: null };
  const ema12Arr: number[] = [];
  const ema26Arr: number[] = [];
  const k12 = 2 / 13;
  const k26 = 2 / 27;
  let e12 = data.slice(0, 12).reduce((a, b) => a + b, 0) / 12;
  let e26 = data.slice(0, 26).reduce((a, b) => a + b, 0) / 26;
  ema12Arr.push(e12);
  ema26Arr.push(e26);
  for (let i = 12; i < data.length; i++) {
    e12 = data[i] * k12 + e12 * (1 - k12);
    ema12Arr.push(e12);
  }
  for (let i = 26; i < data.length; i++) {
    e26 = data[i] * k26 + e26 * (1 - k26);
    ema26Arr.push(e26);
  }
  const macdArr: number[] = [];
  const offset = ema12Arr.length - ema26Arr.length;
  for (let i = 0; i < ema26Arr.length; i++) {
    macdArr.push(ema12Arr[i + offset] - ema26Arr[i]);
  }
  const macdVal = macdArr[macdArr.length - 1];
  // signal = EMA9 of MACD
  if (macdArr.length < 9) return { macd: macdVal, signal: null, histogram: null };
  let sig = macdArr.slice(0, 9).reduce((a, b) => a + b, 0) / 9;
  const k9 = 2 / 10;
  for (let i = 9; i < macdArr.length; i++) {
    sig = macdArr[i] * k9 + sig * (1 - k9);
  }
  return { macd: macdVal, signal: sig, histogram: macdVal - sig };
}

function bollingerBands(data: number[], period = 20, stdDev = 2): { upper: number | null; middle: number | null; lower: number | null } {
  if (data.length < period) return { upper: null, middle: null, lower: null };
  const slice = data.slice(-period);
  const mean = slice.reduce((a, b) => a + b, 0) / period;
  const variance = slice.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / period;
  const sd = Math.sqrt(variance);
  return {
    upper: mean + stdDev * sd,
    middle: mean,
    lower: mean - stdDev * sd,
  };
}

function atr(history: PricePoint[], period = 14): number | null {
  if (history.length < period + 1) return null;
  const trs: number[] = [];
  for (let i = history.length - period; i < history.length; i++) {
    const h = history[i];
    const prevClose = history[i - 1].close;
    const tr = Math.max(h.high - h.low, Math.abs(h.high - prevClose), Math.abs(h.low - prevClose));
    trs.push(tr);
  }
  return trs.reduce((a, b) => a + b, 0) / period;
}

function historicalVolatility(data: number[], period = 30): number | null {
  if (data.length < period + 1) return null;
  const returns: number[] = [];
  for (let i = data.length - period; i < data.length; i++) {
    returns.push(Math.log(data[i] / data[i - 1]));
  }
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length;
  return Math.sqrt(variance) * Math.sqrt(252) * 100;
}

export function calculateTechnicalIndicators(history: PricePoint[]): TechnicalIndicators {
  const closes = history.map((p) => p.close);
  const { macd: macdVal, signal, histogram } = macd(closes);
  const bb = bollingerBands(closes);
  return {
    sma20: sma(closes, 20),
    sma50: sma(closes, 50),
    sma100: sma(closes, 100),
    sma200: sma(closes, 200),
    ema12: ema(closes, 12),
    ema26: ema(closes, 26),
    ema50: ema(closes, 50),
    rsi14: rsi(closes, 14),
    macd: macdVal,
    macdSignal: signal,
    macdHistogram: histogram,
    bollingerUpper: bb.upper,
    bollingerMiddle: bb.middle,
    bollingerLower: bb.lower,
    atr: atr(history),
    historicalVolatility: historicalVolatility(closes),
  };
}

export function calculateReturn(history: PricePoint[], days: number): number | null {
  if (history.length < days + 1) return null;
  const endPrice = history[history.length - 1].close;
  const startPrice = history[history.length - 1 - days].close;
  if (startPrice === 0) return null;
  return ((endPrice - startPrice) / startPrice) * 100;
}

export function calculateMaxDrawdown(data: number[]): number {
  let maxDD = 0;
  let peak = data[0];
  for (const val of data) {
    if (val > peak) peak = val;
    const dd = (val - peak) / peak;
    if (dd < maxDD) maxDD = dd;
  }
  return maxDD * 100;
}

export function calculateVolatility(data: number[]): number {
  if (data.length < 2) return 0;
  const returns: number[] = [];
  for (let i = 1; i < data.length; i++) {
    if (data[i - 1] !== 0) returns.push((data[i] - data[i - 1]) / data[i - 1]);
  }
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length;
  return Math.sqrt(variance) * Math.sqrt(252) * 100;
}

export function calculateSharpeRatio(data: number[], riskFreeRate = 4.5): number | null {
  if (data.length < 30) return null;
  const returns: number[] = [];
  for (let i = 1; i < data.length; i++) {
    if (data[i - 1] !== 0) returns.push((data[i] - data[i - 1]) / data[i - 1]);
  }
  const meanDaily = returns.reduce((a, b) => a + b, 0) / returns.length;
  const meanAnnual = meanDaily * 252 * 100;
  const variance = returns.reduce((a, b) => a + Math.pow(b - meanDaily, 2), 0) / returns.length;
  const stdAnnual = Math.sqrt(variance) * Math.sqrt(252) * 100;
  if (stdAnnual === 0) return null;
  return (meanAnnual - riskFreeRate) / stdAnnual;
}
