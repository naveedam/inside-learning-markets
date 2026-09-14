const API = import.meta.env.VITE_SHEET_URL;

export interface YahooCandle {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export async function fetchHistory(symbol: string): Promise<YahooCandle[]> {
  const res = await fetch(`${API}?symbol=${encodeURIComponent(symbol)}`);

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
