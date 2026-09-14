const API = import.meta.env.VITE_SHEET_URL;

export interface Candle {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export async function fetchHistory(symbol: string): Promise<Candle[]> {
  const res = await fetch(`${API}?symbol=${encodeURIComponent(symbol)}`);

  if (!res.ok) throw new Error(`Failed to fetch ${symbol}`);

  const json = await res.json();
  const result = json.chart?.result?.[0];

  if (!result) throw new Error(`No Yahoo data for ${symbol}`);

  const q = result.indicators.quote[0];
  const adj = result.indicators.adjclose?.[0]?.adjclose;

  return result.timestamp.map((ts: number, i: number) => ({
    date: new Date(ts * 1000).toISOString().slice(0, 10),
    open: q.open[i] ?? 0,
    high: q.high[i] ?? 0,
    low: q.low[i] ?? 0,
    close: adj?.[i] ?? q.close[i] ?? 0,
    volume: q.volume[i] ?? 0,
  })).filter(c => c.close > 0);
}
