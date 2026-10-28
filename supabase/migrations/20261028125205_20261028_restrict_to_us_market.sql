/*
# Restrict MarketPulse to US market only

1. Purpose
   The app has been narrowed to US equities and ETFs only. India (IN)
   market data, INR currency, and the mutual-fund asset type have been
   removed from the frontend. This migration tightens the database
   CHECK constraints so the schema matches the app's new scope and
   prevents future writes of the removed values.

2. Changes
   - watchlist_items.asset_type: drop 'mutualfund' from the allowed set.
   - portfolio_holdings.asset_type: drop 'mutualfund' from the allowed set.
   - portfolio_holdings.currency: drop 'INR', allow only 'USD'.
   - app_settings.market: drop 'IN', allow only 'US'.
   - app_settings.currency: drop 'INR', allow only 'USD'.
   - Existing rows with the dropped values are normalized to the
     closest remaining value so the constraint change does not fail:
       'mutualfund' -> 'etf'
       'INR'       -> 'USD'
       'IN'        -> 'US'

3. Security
   No RLS or grant changes. Existing policies and privileges are
   unchanged.

4. Idempotency
   Constraint names are dropped before recreate so the migration is
   safe to re-run.
*/

-- Normalize any existing rows that would violate the new constraints.
UPDATE watchlist_items   SET asset_type = 'etf'  WHERE asset_type = 'mutualfund';
UPDATE portfolio_holdings SET asset_type = 'etf'  WHERE asset_type = 'mutualfund';
UPDATE portfolio_holdings SET currency   = 'USD' WHERE currency   = 'INR';
UPDATE app_settings       SET market     = 'US'  WHERE market     = 'IN';
UPDATE app_settings       SET currency   = 'USD' WHERE currency   = 'INR';

-- watchlist_items.asset_type
ALTER TABLE watchlist_items DROP CONSTRAINT IF EXISTS watchlist_items_asset_type_check;
ALTER TABLE watchlist_items ADD CONSTRAINT watchlist_items_asset_type_check
  CHECK (asset_type IN ('stock', 'etf', 'index'));

-- portfolio_holdings.asset_type
ALTER TABLE portfolio_holdings DROP CONSTRAINT IF EXISTS portfolio_holdings_asset_type_check;
ALTER TABLE portfolio_holdings ADD CONSTRAINT portfolio_holdings_asset_type_check
  CHECK (asset_type IN ('stock', 'etf', 'index'));

-- portfolio_holdings.currency
ALTER TABLE portfolio_holdings DROP CONSTRAINT IF EXISTS portfolio_holdings_currency_check;
ALTER TABLE portfolio_holdings ADD CONSTRAINT portfolio_holdings_currency_check
  CHECK (currency IN ('USD'));

-- app_settings.market
ALTER TABLE app_settings DROP CONSTRAINT IF EXISTS app_settings_market_check;
ALTER TABLE app_settings ADD CONSTRAINT app_settings_market_check
  CHECK (market IN ('US'));

-- app_settings.currency
ALTER TABLE app_settings DROP CONSTRAINT IF EXISTS app_settings_currency_check;
ALTER TABLE app_settings ADD CONSTRAINT app_settings_currency_check
  CHECK (currency IN ('USD'));
