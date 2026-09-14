import type { VercelRequest, VercelResponse } from "@vercel/node";

// Server-side proxy for Yahoo Finance fundamentals (quoteSummary).
// Used by the Shariah financial-ratio screen: market cap, debt, cash, revenue.
// Cached longer than price history since fundamentals only change quarterly.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const symbol = req.query.symbol;

  if (!symbol || typeof symbol !== "string") {
    res.status(400).json({ error: "Missing symbol query param" });
    return;
  }

  const modules = "price,financialData,incomeStatementHistory";
  const url = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(
    symbol
  )}?modules=${modules}`;

  try {
    const yahooRes = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });

    if (!yahooRes.ok) {
      res
        .status(yahooRes.status)
        .json({ error: `Yahoo Finance returned ${yahooRes.status} for ${symbol}` });
      return;
    }

    const data = await yahooRes.json();
    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=300");
    res.status(200).json(data);
  } catch (err) {
    res.status(502).json({ error: `Failed to reach Yahoo Finance for ${symbol}` });
  }
}
