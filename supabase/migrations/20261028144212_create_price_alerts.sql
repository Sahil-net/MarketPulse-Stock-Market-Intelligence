/*
# Create price_alerts table

1. New Tables
- `price_alerts`
  - `id` (uuid, primary key)
  - `user_id` (uuid, not null, defaults to auth.uid(), references auth.users with cascade delete)
  - `symbol` (text, not null) — the stock ticker to watch
  - `name` (text, not null) — the stock name for display
  - `direction` (text, not null, check in 'above'/'below') — trigger when price goes above or below the threshold
  - `target_price` (numeric, not null) — the threshold price
  - `enabled` (boolean, default true) — whether the alert is active
  - `triggered` (boolean, default false) — whether the alert has fired since being created/reset
  - `triggered_at` (timestamptz, nullable) — when the alert last fired
  - `created_at` (timestamptz, default now())

2. Security
- Enable RLS on `price_alerts`.
- Grant CRUD to `authenticated` only (the app requires sign-in).
- Owner-scoped CRUD: each authenticated user can only access their own alerts.
- `user_id` defaults to `auth.uid()` so inserts omitting it still succeed.

3. Indexes
- Index on `user_id` for fast per-user queries.
- Index on `symbol` for batch price-checking across all alerts.
*/

CREATE TABLE IF NOT EXISTS price_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol text NOT NULL,
  name text NOT NULL,
  direction text NOT NULL CHECK (direction IN ('above', 'below')),
  target_price numeric NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  triggered boolean NOT NULL DEFAULT false,
  triggered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE price_alerts ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON price_alerts TO authenticated;

CREATE INDEX IF NOT EXISTS idx_price_alerts_user_id ON price_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_price_alerts_symbol ON price_alerts(symbol);

DROP POLICY IF EXISTS "select_own_alerts" ON price_alerts;
CREATE POLICY "select_own_alerts" ON price_alerts FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_alerts" ON price_alerts;
CREATE POLICY "insert_own_alerts" ON price_alerts FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_alerts" ON price_alerts;
CREATE POLICY "update_own_alerts" ON price_alerts FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_alerts" ON price_alerts;
CREATE POLICY "delete_own_alerts" ON price_alerts FOR DELETE
  TO authenticated USING (auth.uid() = user_id);
