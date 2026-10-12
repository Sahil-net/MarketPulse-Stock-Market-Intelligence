# MarketPulse — Stock Market Intelligence Platform

A premium financial analytics dashboard for discovering and analyzing stocks, ETFs, mutual funds, sectors, and market indices across US and Indian markets.

## Features

- **Market Overview**: Index cards with sparklines, interactive price charts, market statistics, top gainers/losers
- **Stocks Explorer**: Searchable table with filters by sector, exchange, market cap; sortable columns; CSV export
- **Stock Detail**: Price history chart, fundamentals, technical indicators (SMA, EMA, RSI, MACD, Bollinger Bands, ATR), historical returns, related news
- **Top Gainers / Losers**: Dynamic rankings across stocks, ETFs, funds, and sectors for multiple time periods
- **Performance Rankings**: 14 ranking types including best/worst performers, highest volume, volatility, momentum, 52-week highs/lows
- **ETFs Explorer**: ETF discovery with holdings, sector allocation, expense ratios, multi-ETF comparison
- **Mutual Funds Explorer**: Indian mutual funds with NAV history, returns (1M–5Y), CAGR calculations, category/plan/option filters
- **Sector Analysis**: Sector performance bar chart, individual sector cards with top performers
- **Stock Screener**: Multiple simultaneous filters (market cap, P/E, dividend yield, volume, SMA technical filters)
- **Fund Screener**: Filter mutual funds by category, plan, NAV, expense ratio, AUM, returns, risk level
- **Asset Comparison**: Compare 2–5 assets with normalized performance chart and risk metrics (volatility, max drawdown, Sharpe ratio)
- **Watchlists**: Create multiple watchlists, add/remove assets, view daily performance
- **Portfolio Tracker**: Add holdings manually, track market value, unrealized P&L, asset allocation
- **Market News**: Categorized news feed with sentiment indicators and ticker links
- **Settings**: Market/currency selectors, dark/light theme toggle, data provider configuration

## Technology Stack

- React 18 + TypeScript
- Vite
- Tailwind CSS (custom dark financial theme)
- shadcn/ui components
- Lucide React icons
- Recharts for visualizations
- Supabase (available for auth and persistence)
- Zod for validation

## Getting Started

```bash
npm install
npm run dev
```

## Data Source

The app runs in **demo mode** with realistic sample data generated deterministically. To connect a real financial data provider:

1. Copy `.env.example` to `.env`
2. Add your API key (Alpha Vantage, Finnhub, Twelve Data, etc.)
3. Configure the provider in `src/services/`

All demo data is clearly labeled with a "Demo Data" badge throughout the app.

## Project Structure

```
src/
  components/     Reusable UI components
    layouts/      App shell (sidebar, top bar)
    shared/       Domain components (DataTable, Sparkline, ChangeBadge, States)
    ui/           shadcn/ui primitives
  hooks/          Custom React hooks
  lib/            Utilities (formatting, CSV export, cn)
  pages/          Route-level page components
  services/       Data services (mock data, technical analysis)
  types/          TypeScript type definitions
```

## Building

```bash
npm run build    # Type-check and build for production
npm run typecheck # Type-check only
```
