const API = import.meta.env.VITE_SHEET_URL;

export async function fetchHistory(symbol: string) {
  const res = await fetch(`${API}?symbol=${encodeURIComponent(symbol)}`);

  if (!res.ok) {
    throw new Error(`Failed to fetch ${symbol}`);
  }

  const json = await res.json();
  return json.chart.result[0];
}
