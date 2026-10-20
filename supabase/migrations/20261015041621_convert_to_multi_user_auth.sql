/*
# Convert to multi-user schema with auth

## Changes
- Added user_id columns to watchlists, watchlist_items, portfolio_holdings, app_settings
- Replaced anon policies with authenticated owner-scoped policies
- user_id defaults to auth.uid() so inserts work without client passing it
*/
ALTER TABLE watchlists ADD COLUMN IF NOT EXISTS user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE watchlist_items ADD COLUMN IF NOT EXISTS user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE portfolio_holdings ADD COLUMN IF NOT EXISTS user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE UNIQUE INDEX IF NOT EXISTS idx_app_settings_user_id ON app_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_watchlists_user_id ON watchlists(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_holdings_user_id ON portfolio_holdings(user_id);

-- watchlists policies
DROP POLICY IF EXISTS "anon_select_watchlists" ON watchlists;
DROP POLICY IF EXISTS "anon_insert_watchlists" ON watchlists;
DROP POLICY IF EXISTS "anon_update_watchlists" ON watchlists;
DROP POLICY IF EXISTS "anon_delete_watchlists" ON watchlists;

CREATE POLICY "select_own_watchlists" ON watchlists FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_watchlists" ON watchlists FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_watchlists" ON watchlists FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_watchlists" ON watchlists FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- watchlist_items policies
DROP POLICY IF EXISTS "anon_select_watchlist_items" ON watchlist_items;
DROP POLICY IF EXISTS "anon_insert_watchlist_items" ON watchlist_items;
DROP POLICY IF EXISTS "anon_update_watchlist_items" ON watchlist_items;
DROP POLICY IF EXISTS "anon_delete_watchlist_items" ON watchlist_items;

CREATE POLICY "select_own_watchlist_items" ON watchlist_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM watchlists WHERE watchlists.id = watchlist_items.watchlist_id AND watchlists.user_id = auth.uid()));
CREATE POLICY "insert_own_watchlist_items" ON watchlist_items FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM watchlists WHERE watchlists.id = watchlist_items.watchlist_id AND watchlists.user_id = auth.uid()));
CREATE POLICY "delete_own_watchlist_items" ON watchlist_items FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM watchlists WHERE watchlists.id = watchlist_items.watchlist_id AND watchlists.user_id = auth.uid()));

-- portfolio_holdings policies
DROP POLICY IF EXISTS "anon_select_portfolio_holdings" ON portfolio_holdings;
DROP POLICY IF EXISTS "anon_insert_portfolio_holdings" ON portfolio_holdings;
DROP POLICY IF EXISTS "anon_update_portfolio_holdings" ON portfolio_holdings;
DROP POLICY IF EXISTS "anon_delete_portfolio_holdings" ON portfolio_holdings;

CREATE POLICY "select_own_portfolio_holdings" ON portfolio_holdings FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_portfolio_holdings" ON portfolio_holdings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_portfolio_holdings" ON portfolio_holdings FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_portfolio_holdings" ON portfolio_holdings FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- app_settings policies
DROP POLICY IF EXISTS "anon_select_app_settings" ON app_settings;
DROP POLICY IF EXISTS "anon_insert_app_settings" ON app_settings;
DROP POLICY IF EXISTS "anon_update_app_settings" ON app_settings;
DROP POLICY IF EXISTS "anon_delete_app_settings" ON app_settings;

CREATE POLICY "select_own_app_settings" ON app_settings FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_app_settings" ON app_settings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_app_settings" ON app_settings FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_app_settings" ON app_settings FOR DELETE TO authenticated USING (auth.uid() = user_id);
