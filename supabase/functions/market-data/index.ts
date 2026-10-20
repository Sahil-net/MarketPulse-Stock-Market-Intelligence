import { createClient } from "npm:@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const FINNHUB_API_KEY = Deno.env.get("FINNHUB_API_KEY");
const FINNHUB_BASE = "https://finnhub.io/api/v1";

interface QuoteData {
  c: number; // current price
  d: number; // change
  dp: number; // percent change
  h: number; // high
  l: number; // low
  o: number; // open
  pc: number; // previous close
}

async function fetchQuote(symbol: string): Promise<QuoteData | null> {
  if (!FINNHUB_API_KEY) return null;
  try {
    const res = await fetch(`${FINNHUB_BASE}/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (!data || data.c === 0) return null;
    return data as QuoteData;
  } catch {
    return null;
  }
}

async function fetchCompanyProfile(symbol: string) {
  if (!FINNHUB_API_KEY) return null;
  try {
    const res = await fetch(`${FINNHUB_BASE}/stock/profile2?symbol=${symbol}&token=${FINNHUB_API_KEY}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function fetchCandles(symbol: string, resolution: string, from: number, to: number) {
  if (!FINNHUB_API_KEY) return null;
  try {
    const res = await fetch(
      `${FINNHUB_BASE}/stock/candle?symbol=${symbol}&resolution=${resolution}&from=${from}&to=${to}&token=${FINNHUB_API_KEY}`
    );
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function fetchMarketNews(category: string = "general") {
  if (!FINNHUB_API_KEY) return null;
  try {
    const res = await fetch(`${FINNHUB_BASE}/news?category=${category}&token=${FINNHUB_API_KEY}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    const action = url.searchParams.get("action") || "quote";
    const symbol = url.searchParams.get("symbol") || "";

    if (!FINNHUB_API_KEY) {
      return new Response(JSON.stringify({ error: "Finnhub API key not configured. Add FINNHUB_API_KEY to edge function secrets." }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    switch (action) {
      case "quote": {
        if (!symbol) {
          return new Response(JSON.stringify({ error: "Missing symbol parameter" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const [quote, profile] = await Promise.all([
          fetchQuote(symbol),
          fetchCompanyProfile(symbol),
        ]);
        return new Response(JSON.stringify({ quote, profile }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "quotes": {
        const symbols = url.searchParams.get("symbols") || "";
        if (!symbols) {
          return new Response(JSON.stringify({ error: "Missing symbols parameter" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const symList = symbols.split(",").filter(Boolean);
        const results: Record<string, QuoteData | null> = {};
        await Promise.all(symList.map(async (s) => {
          results[s] = await fetchQuote(s.trim());
        }));
        return new Response(JSON.stringify({ quotes: results }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "candles": {
        if (!symbol) {
          return new Response(JSON.stringify({ error: "Missing symbol parameter" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const resolution = url.searchParams.get("resolution") || "D";
        const days = parseInt(url.searchParams.get("days") || "365");
        const to = Math.floor(Date.now() / 1000);
        const from = to - days * 86400;
        const candles = await fetchCandles(symbol, resolution, from, to);
        return new Response(JSON.stringify({ candles }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "news": {
        const category = url.searchParams.get("category") || "general";
        const news = await fetchMarketNews(category);
        return new Response(JSON.stringify({ news }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "profile": {
        if (!symbol) {
          return new Response(JSON.stringify({ error: "Missing symbol parameter" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const profile = await fetchCompanyProfile(symbol);
        return new Response(JSON.stringify({ profile }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        return new Response(JSON.stringify({ error: "Unknown action" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
