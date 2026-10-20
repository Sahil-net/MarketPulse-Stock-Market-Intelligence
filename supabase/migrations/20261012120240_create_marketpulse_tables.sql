/*
# Create MarketPulse database tables

## Purpose
This is a single-tenant financial dashboard app with no sign-in screen.
Market data (stocks, ETFs, mutual funds, indices, sectors, news) is generated
from deterministic mock data in the frontend. The database stores only
user-created data that should persist across sessions and devices:
watchlists, portfolio holdings, and app settings.

## New Tables

### watchlists
- `id` (uuid, primary key) — unique watchlist identifier
- `name` (text, not null) — user-given name for the watchlist
- `created_at` (timestamptz, default now()) — when the watchlist was created

### watchlist_items
- `id` (uuid, primary key) — unique item identifier
- `watchlist_id` (uuid, foreign key to watchlists.id, cascade delete) — parent watchlist
- `symbol` (text, not null) — ticker symbol (e.g. AAPL, NVDA)
- `asset_type` (text, not null) — one of: stock, etf, mutualfund, index
- `added_at` (timestamptz, default now()) — when the item was added

### portfolio_holdings
- `id` (uuid, primary key) — unique holding identifier
- `symbol` (text, not null) — ticker symbol
- `name` (text, not null) — asset name at time of purchase
- `asset_type` (text, not null) — one of: stock, etf, mutualfund, index
- `quantity` (numeric, not null) — number of shares/units
- `purchase_price` (numeric, not null) — price per unit at purchase
- `purchase_date` (date, not null) — date of purchase
- `transaction_costs` (numeric, default 0) — broker fees, taxes, etc.
- `dividends` (numeric, default 0) — cumulative dividends received
- `currency` (text, not null, default 'USD') — INR or USD

### app_settings
- `id` (uuid, primary key) — singleton row id
- `market` (text, not null, default 'US') — IN or US
- `currency` (text, not null, default 'USD') — INR or USD
- `theme` (text, not null, default 'dark') — dark or light

## Security
- RLS enabled on all tables.
- Policies allow anon + authenticated full CRUD since this is a single-tenant
  app with no sign-in — all data is intentionally shared/public.
- No user_id columns or auth.uid() checks because there is no auth flow.

## Indexes
- watchlist_items.watchlist_id — for joining items to their parent watchlist
- portfolio_holdings.symbol — for looking up holdings by ticker
*/

-- Watchlists table
CREATE TABLE IF NOT EXISTS watchlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE watchlists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_watchlists" ON watchlists;
CREATE POLICY "anon_select_watchlists" ON watchlists FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_watchlists" ON watchlists;
CREATE POLICY "anon_insert_watchlists" ON watchlists FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_watchlists" ON watchlists;
CREATE POLICY "anon_update_watchlists" ON watchlists FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_watchlists" ON watchlists;
CREATE POLICY "anon_delete_watchlists" ON watchlists FOR DELETE
  TO anon, authenticated USING (true);

-- Watchlist items table
CREATE TABLE IF NOT EXISTS watchlist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  watchlist_id uuid NOT NULL REFERENCES watchlists(id) ON DELETE CASCADE,
  symbol text NOT NULL,
  asset_type text NOT NULL CHECK (asset_type IN ('stock', 'etf', 'mutualfund', 'index')),
  added_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE watchlist_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_watchlist_items" ON watchlist_items;
CREATE POLICY "anon_select_watchlist_items" ON watchlist_items FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_watchlist_items" ON watchlist_items;
CREATE POLICY "anon_insert_watchlist_items" ON watchlist_items FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_watchlist_items" ON watchlist_items;
CREATE POLICY "anon_update_watchlist_items" ON watchlist_items FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_watchlist_items" ON watchlist_items;
CREATE POLICY "anon_delete_watchlist_items" ON watchlist_items FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_watchlist_items_watchlist_id ON watchlist_items(watchlist_id);

-- Portfolio holdings table
CREATE TABLE IF NOT EXISTS portfolio_holdings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol text NOT NULL,
  name text NOT NULL,
  asset_type text NOT NULL CHECK (asset_type IN ('stock', 'etf', 'mutualfund', 'index')),
  quantity numeric NOT NULL,
  purchase_price numeric NOT NULL,
  purchase_date date NOT NULL,
  transaction_costs numeric NOT NULL DEFAULT 0,
  dividends numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD' CHECK (currency IN ('USD', 'INR'))
);

ALTER TABLE portfolio_holdings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_portfolio_holdings" ON portfolio_holdings;
CREATE POLICY "anon_select_portfolio_holdings" ON portfolio_holdings FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_portfolio_holdings" ON portfolio_holdings;
CREATE POLICY "anon_insert_portfolio_holdings" ON portfolio_holdings FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_portfolio_holdings" ON portfolio_holdings;
CREATE POLICY "anon_update_portfolio_holdings" ON portfolio_holdings FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_portfolio_holdings" ON portfolio_holdings;
CREATE POLICY "anon_delete_portfolio_holdings" ON portfolio_holdings FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_portfolio_holdings_symbol ON portfolio_holdings(symbol);

-- App settings table (singleton)
CREATE TABLE IF NOT EXISTS app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  market text NOT NULL DEFAULT 'US' CHECK (market IN ('US', 'IN')),
  currency text NOT NULL DEFAULT 'USD' CHECK (currency IN ('USD', 'INR')),
  theme text NOT NULL DEFAULT 'dark' CHECK (theme IN ('dark', 'light'))
);

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_app_settings" ON app_settings;
CREATE POLICY "anon_select_app_settings" ON app_settings FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_app_settings" ON app_settings;
CREATE POLICY "anon_insert_app_settings" ON app_settings FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_app_settings" ON app_settings;
CREATE POLICY "anon_update_app_settings" ON app_settings FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_app_settings" ON app_settings;
CREATE POLICY "anon_delete_app_settings" ON app_settings FOR DELETE
  TO anon, authenticated USING (true);
