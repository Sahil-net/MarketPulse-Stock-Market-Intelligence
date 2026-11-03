/*
# Add price alert notification tracking

1. Modified Tables
- `price_alerts`
- `notification_claimed_at` records when the server temporarily claims an alert for email delivery.
- `notification_sent_at` records when the email provider confirms delivery submission.

2. Security
- No new client access is granted.
- Existing owner-scoped policies remain unchanged.
- The server-side notification function uses the service role and performs an atomic claim so concurrent scheduled runs cannot send duplicates.

3. Important Notes
- Alerts remain eligible for checking until their email is successfully submitted.
- A failed email attempt releases the temporary claim so a later scheduled run can retry.
*/

ALTER TABLE price_alerts
  ADD COLUMN IF NOT EXISTS notification_claimed_at timestamptz,
  ADD COLUMN IF NOT EXISTS notification_sent_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_price_alerts_notification_claim
  ON price_alerts (notification_claimed_at)
  WHERE enabled = true AND triggered = false;
