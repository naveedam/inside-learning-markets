import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const symbol = req.query.symbol;

  if (!symbol || typeof symbol !== "string") {
    res.status(400).json({ error: "Missing symbol query param" });
    return;
  }

  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=2y&interval=1d`;

  try {
    const yahooRes = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });

    if (!yahooRes.ok) {
      res.status(yahooRes.status).json({
        error: `Yahoo Finance returned ${yahooRes.status} for ${symbol}`,
      });
      return;
    }

    const data = await yahooRes.json();
    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=60");
    res.status(200).json(data);
  } catch {
    res.status(502).json({
      error: `Failed to reach Yahoo Finance for ${symbol}`,
    });
  }
}
