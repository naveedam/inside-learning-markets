export interface YahooCandle {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export async function fetchHistory(symbol: string): Promise<YahooCandle[]> {
  const res = await fetch(`/api/yahoo?symbol=${encodeURIComponent(symbol)}`);

  if (!res.ok) throw new Error(`Failed to fetch ${symbol}`);

  const json = await res.json();
  const result = json.chart?.result?.[0];

  if (!result) throw new Error(`No Yahoo data for ${symbol}`);

  const q = result.indicators.quote[0];

  return result.timestamp.map((t: number, i: number) => ({
    date: new Date(t * 1000).toISOString().slice(0, 10),
    open: q.open[i],
    high: q.high[i],
    low: q.low[i],
    close: q.close[i],
    volume: q.volume[i]
  })).filter((c: YahooCandle) => c.close != null);
}

export interface Fundamentals {
  marketCap: number;
  totalDebt: number;
  totalCash: number;
  // Yahoo's quoteSummary doesn't reliably break out interest-bearing
  // securities separately from cash, so this is folded into totalCash
  // above (kept as its own field for clarity if a better source is
  // wired in later).
  shortTermInvestments: number;
  totalRevenue: number;
  // Best-effort: non-financial companies rarely report a dedicated
  // "interest income" line in the free Yahoo feed. Defaults to 0 when
  // absent rather than guessing — see shariah.ts for how this affects
  // the ratio.
  interestIncome: number;
}

export async function fetchFundamentals(symbol: string): Promise<Fundamentals> {
  const res = await fetch(`/api/fundamentals?symbol=${encodeURIComponent(symbol)}`);

  if (!res.ok) throw new Error(`Failed to fetch fundamentals for ${symbol}`);

  const json = await res.json();
  const result = json.quoteSummary?.result?.[0];

  if (!result) throw new Error(`No fundamentals data for ${symbol}`);

  const price = result.price ?? {};
  const fin = result.financialData ?? {};
  const incomeHistory =
    result.incomeStatementHistory?.incomeStatementHistory?.[0] ?? {};

  return {
    marketCap: price.marketCap?.raw ?? 0,
    totalDebt: fin.totalDebt?.raw ?? 0,
    totalCash: fin.totalCash?.raw ?? 0,
    shortTermInvestments: 0,
    totalRevenue: fin.totalRevenue?.raw ?? 0,
    interestIncome: incomeHistory.interestIncome?.raw ?? 0,
  };
}
