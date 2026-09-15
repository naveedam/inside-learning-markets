import type { VercelRequest, VercelResponse } from "@vercel/node";

// Server-side proxy for Yahoo Finance chart data.
// The browser can't call query1.finance.yahoo.com directly (no CORS headers),
// so this function fetches on Yahoo's behalf and forwards the JSON as-is.
//
// Duration limit lives in vercel.json ("functions" block) rather than a
// file-level `export const config` — that export is more of a Next.js
// convention and isn't guaranteed to be honored for a plain Vite + /api
// setup, so vercel.json is the one method guaranteed to be respected.
//
// The core logic below never awaits Yahoo directly. Instead it races the
// real work against a manual timeout promise. This is deliberately more
// paranoid than AbortController alone: if anything in the work path hangs
// or misbehaves in a way that doesn't respect the abort signal, the race
// still resolves and we still send a JSON response — nothing depends on
// fetch/AbortController cooperating correctly.
const YAHOO_TIMEOUT_MS = 6000;

function timeoutAfter(ms: number): Promise<{ timedOut: true }> {
  return new Promise(resolve => {
    setTimeout(() => resolve({ timedOut: true }), ms);
  });
}

async function fetchYahoo(symbol: string) {
  const res = await fetch(
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
      symbol
    )}?range=2y&interval=1d`,
    {
      headers: {
        "User-Agent": "Mozilla/5.0",
        Accept: "application/json",
      },
    }
  );

  const rawBody = await res.text();
  return { status: res.status, ok: res.ok, rawBody };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const symbol = req.query.symbol;

    if (!symbol || typeof symbol !== "string") {
      res.status(400).json({ error: "Missing symbol query param" });
      return;
    }

    const outcome = await Promise.race([
      fetchYahoo(symbol).then(r => ({ timedOut: false as const, ...r })),
      timeoutAfter(YAHOO_TIMEOUT_MS),
    ]).catch(networkErr => ({
      timedOut: false as const,
      networkError: (networkErr as Error).message,
    }));

    if ("timedOut" in outcome && outcome.timedOut) {
      res.status(504).json({
        error: `Yahoo Finance did not respond for ${symbol} within ${YAHOO_TIMEOUT_MS}ms`,
      });
      return;
    }

    if ("networkError" in outcome) {
      console.error(`[api/yahoo] network error for ${symbol}:`, outcome.networkError);
      res.status(502).json({
        error: `Could not reach Yahoo Finance for ${symbol}`,
        detail: outcome.networkError,
      });
      return;
    }

    const { status, ok, rawBody } = outcome;

    if (!ok) {
      res.status(status).json({
        error: `Yahoo Finance returned ${status} for ${symbol}`,
        detail: rawBody.slice(0, 300),
      });
      return;
    }

    let data: { chart?: { error?: unknown } };
    try {
      data = JSON.parse(rawBody);
    } catch (parseErr) {
      console.error(`[api/yahoo] non-JSON body for ${symbol}:`, rawBody.slice(0, 300));
      res.status(502).json({
        error: `Yahoo Finance returned a non-JSON response for ${symbol} (likely rate-limited)`,
        detail: rawBody.slice(0, 300),
      });
      return;
    }

    // Yahoo reports unresolvable/bad symbols as a 200 with an error
    // object inside the body rather than a non-2xx status.
    const chartError = data?.chart?.error;
    if (chartError) {
      res.status(404).json({
        error: `Yahoo Finance has no chart data for ${symbol}`,
        detail: chartError,
      });
      return;
    }

    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=60");
    res.status(200).json(data);
  } catch (err) {
    // Final safety net — nothing above should reach here, but if it
    // does, return JSON instead of letting the platform synthesize an
    // opaque 500 with no body.
    console.error("[api/yahoo] unexpected error:", err);
    res.status(500).json({
      error: "Unexpected error in Yahoo Finance proxy",
      detail: (err as Error).message,
    });
  }
}
