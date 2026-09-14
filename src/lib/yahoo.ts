import { Candle } from "./marketEngine";

export async function fetchHistory(ticker: string): Promise<Candle[]> {
  const url =
    `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?range=2y&interval=1d`;

  const r = await fetch(url);
  const j = await r.json();

  const result = j.chart.result[0];

  const ts = result.timestamp;
  const q = result.indicators.quote[0];

  const out: Candle[] = [];

  ts.forEach((t: number, i: number) => {
    if (q.close[i] == null) return;

    out.push({
      date: new Date(t * 1000).toISOString().slice(0, 10),
      open: q.open[i],
      high: q.high[i],
      low: q.low[i],
      close: q.close[i],
      volume: q.volume[i] ?? 0
    });
  });

  return out;
}
