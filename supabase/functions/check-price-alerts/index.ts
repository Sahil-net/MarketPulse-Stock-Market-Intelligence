import { createClient } from "npm:@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface AlertRow {
  id: string;
  user_id: string;
  symbol: string;
  name: string;
  direction: "above" | "below";
  target_price: number;
}

interface QuoteResponse {
  c?: number;
}

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function sendEmail(to: string, alert: AlertRow, currentPrice: number): Promise<void> {
  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (!resendKey) throw new Error("Email provider is not configured");

  const direction = alert.direction === "above" ? "risen above" : "fallen below";
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "MarketPulse Alerts <alerts@marketpulse.app>",
      to: [to],
      subject: `${alert.symbol} price alert reached`,
      text: `${alert.name} (${alert.symbol}) has ${direction} $${alert.target_price.toFixed(2)}. The current price is $${currentPrice.toFixed(2)}.`,
    }),
  });

  if (!response.ok) throw new Error("Email provider rejected the message");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });

  try {
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const finnhubKey = Deno.env.get("FINNHUB_API_KEY");
    if (!serviceKey || !supabaseUrl || !finnhubKey) return json({ error: "Notification service is not configured" }, 503);

    const internalKey = Deno.env.get("PRICE_ALERTS_CRON_KEY");
    const authorization = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!internalKey || authorization !== internalKey) return json({ error: "Unauthorized" }, 401);

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: alerts, error: alertError } = await admin
      .from("price_alerts")
      .select("id, user_id, symbol, name, direction, target_price")
      .eq("enabled", true)
      .eq("triggered", false)
      .is("notification_claimed_at", null);
    if (alertError) throw alertError;

    let notified = 0;
    for (const alert of (alerts ?? []) as AlertRow[]) {
      const quoteResponse = await fetch(`https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(alert.symbol)}&token=${finnhubKey}`);
      if (!quoteResponse.ok) continue;
      const quote = await quoteResponse.json() as QuoteResponse;
      const currentPrice = quote.c;
      if (typeof currentPrice !== "number") continue;

      const crossed = alert.direction === "above" ? currentPrice >= alert.target_price : currentPrice <= alert.target_price;
      if (!crossed) continue;

      const { data: claimed, error: claimError } = await admin
        .from("price_alerts")
        .update({ notification_claimed_at: new Date().toISOString() })
        .eq("id", alert.id)
        .eq("triggered", false)
        .is("notification_claimed_at", null)
        .select("id")
        .maybeSingle();
      if (claimError || !claimed) continue;

      const { data: userData, error: userError } = await admin.auth.admin.getUserById(alert.user_id);
      const email = userData.user?.email;
      if (userError || !email) {
        await admin.from("price_alerts").update({ notification_claimed_at: null }).eq("id", alert.id);
        continue;
      }

      try {
        await sendEmail(email, alert, currentPrice);
        await admin.from("price_alerts").update({
          triggered: true,
          triggered_at: new Date().toISOString(),
          notification_sent_at: new Date().toISOString(),
        }).eq("id", alert.id);
        notified += 1;
      } catch {
        await admin.from("price_alerts").update({ notification_claimed_at: null }).eq("id", alert.id);
      }
    }

    return json({ checked: alerts?.length ?? 0, notified });
  } catch {
    return json({ error: "Unable to check price alerts" }, 500);
  }
});
