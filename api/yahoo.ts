import type { VercelRequest, VercelResponse } from "@vercel/node";

// Server-side proxy for Yahoo Finance chart data.
// The browser can't call query1.finance.yahoo.com directly (no CORS headers),
// so this function fetches on Yahoo's behalf and forwards the JSON as-is.
//
// Hardened against every failure mode that can otherwise surface as an
// opaque Vercel 500 with no body: network errors, non-JSON response
// bodies (Yahoo increasingly returns HTML/block pages with a 200 status
// when it's rate-limiting a request instead of an error status), and
// slow/hanging requests. Every code path below returns JSON with an
// explicit status — nothing is allowed to throw past this handler.
//
// IMPORTANT: maxDuration below caps how long Vercel lets this function
// run. If Yahoo hangs past that, Vercel kills the process outright —
// that kill happens at the platform level, bypasses this file's
// try/catch entirely, and is what renders as Vercel's own
// "FUNCTION_INVOCATION_FAILED" page with no JSON body. The internal
// abort timeout below must stay comfortably under maxDuration so our
// own code gets a chance to respond first.
export const config = {
  maxDuration: 10,
};

const YAHOO_TIMEOUT_MS = 6000;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const symbol = req.query.symbol;

    if (!symbol || typeof symbol !== "string") {
      res.status(400).json({ error: "Missing symbol query param" });
      return;
    }

    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
      symbol
    )}?range=2y&interval=1d`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), YAHOO_TIMEOUT_MS);

    let yahooRes: Response;
    try {
      yahooRes = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0",
          Accept: "application/json",
        },
        signal: controller.signal,
      });
    } catch (networkErr) {
      console.error(`[api/yahoo] network error for ${symbol}:`, networkErr);
      res.status(502).json({
        error: `Could not reach Yahoo Finance for ${symbol}`,
        detail: (networkErr as Error).message,
      });
      return;
    } finally {
      clearTimeout(timeout);
    }

    // Read as text first — Yahoo sometimes returns HTML/empty bodies
    // with a 200 status when rate-limiting, and .json() would throw
    // on that with no way to tell a network failure from a bad body.
    const rawBody = await yahooRes.text();

    if (!yahooRes.ok) {
      res.status(yahooRes.status).json({
        error: `Yahoo Finance returned ${yahooRes.status} for ${symbol}`,
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
    // opaque 500 with no body (which is what was happening before).
    console.error("[api/yahoo] unexpected error:", err);
    res.status(500).json({
      error: "Unexpected error in Yahoo Finance proxy",
      detail: (err as Error).message,
    });
  }
}
