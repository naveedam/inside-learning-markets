export interface Candle {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface StockSignal {
  ticker: string;
  name: string;
  sector: string;
  price: number;
  high52: number;
  pctHigh: number;
  rsiD: number;
  rsiW: number;
  rsiM: number;
  macdD: boolean;
  macdW: boolean;
  macdM: boolean;
  classification: "bullish" | "watch" | "weak";
}

const RSI_PERIOD = 14;

export function rsi(values: number[]) {
  if (values.length < RSI_PERIOD + 1) return 0;

  let gain = 0;
  let loss = 0;

  for (let i = 1; i <= RSI_PERIOD; i++) {
    const diff = values[i] - values[i - 1];
    if (diff > 0) gain += diff;
    else loss -= diff;
  }

  let avgGain = gain / RSI_PERIOD;
  let avgLoss = loss / RSI_PERIOD;

  for (let i = RSI_PERIOD + 1; i < values.length; i++) {
    const diff = values[i] - values[i - 1];
    const g = diff > 0 ? diff : 0;
    const l = diff < 0 ? -diff : 0;

    avgGain = (avgGain * 13 + g) / 14;
    avgLoss = (avgLoss * 13 + l) / 14;
  }

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return +(100 - 100 / (1 + rs)).toFixed(2);
}

function ema(values: number[], period: number) {
  const k = 2 / (period + 1);
  let prev = values[0];
  const out = [prev];

  for (let i = 1; i < values.length; i++) {
    prev = values[i] * k + prev * (1 - k);
    out.push(prev);
  }

  return out;
}

export function macd(closes: number[]) {
  const e12 = ema(closes, 12);
  const e26 = ema(closes, 26);

  const line = e12.map((v, i) => v - e26[i]);
  const signal = ema(line, 9);

  return line.at(-1)! > signal.at(-1)!;
}

export function weekly(c: Candle[]) {
  const map = new Map<string, Candle[]>();

  c.forEach(x => {
    const d = new Date(x.date);
    const yr = d.getFullYear();
    const wk = Math.floor((d.getDate() - 1) / 7);
    const key = `${yr}-${d.getMonth()}-${wk}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(x);
  });

  return [...map.values()].map(rows => ({
    date: rows.at(-1)!.date,
    open: rows[0].open,
    high: Math.max(...rows.map(r => r.high)),
    low: Math.min(...rows.map(r => r.low)),
    close: rows.at(-1)!.close,
    volume: rows.reduce((s, r) => s + r.volume, 0)
  }));
}

export function monthly(c: Candle[]) {
  const map = new Map<string, Candle[]>();

  c.forEach(x => {
    const d = new Date(x.date);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(x);
  });

  return [...map.values()].map(rows => ({
    date: rows.at(-1)!.date,
    open: rows[0].open,
    high: Math.max(...rows.map(r => r.high)),
    low: Math.min(...rows.map(r => r.low)),
    close: rows.at(-1)!.close,
    volume: rows.reduce((s, r) => s + r.volume, 0)
  }));
}

import { fetchHistory } from "./yahoo";
import type { Stock } from "./sheets";

export async function screenUniverse(
  universe: Stock[]
): Promise<StockSignal[]> {

  const results: StockSignal[] = [];

  for (const stock of universe) {

    const daily = await fetchHistory(stock.ticker);

    if (daily.length < 250) continue;

    const closes = daily.map(c => c.close);

    const w = weekly(daily);
    const m = monthly(daily);

    const high52 = Math.max(...daily.slice(-252).map(c => c.high));
    const price = closes.at(-1)!;
    const high52Distance = +(price / high52 * 100).toFixed(1);

    const rsiDaily = rsi(closes);
    const rsiWeekly = rsi(w.map(x => x.close));
    const rsiMonthly = rsi(m.map(x => x.close));

    const macdDaily = macd(closes);
    const macdWeekly = macd(w.map(x => x.close));
    const macdMonthly = macd(m.map(x => x.close));

    const isBuy =
      high52Distance < 96 &&
      rsiDaily > 60 &&
      rsiWeekly > 60 &&
      rsiMonthly > 60 &&
      macdDaily &&
      macdWeekly &&
      macdMonthly;

    results.push({
      ticker: stock.ticker,
      name: stock.name,
      sector: stock.sector,
      price,
      high52,
      pctHigh: high52Distance,
      rsiD: rsiDaily,
      rsiW: rsiWeekly,
      rsiM: rsiMonthly,
      macdD: macdDaily,
      macdW: macdWeekly,
      macdM: macdMonthly,
      classification: isBuy ? "bullish" : "weak",

      // aliases expected by StockScreener
      high52Distance,
      rsiDaily,
      rsiWeekly,
      rsiMonthly,
      macdDaily,
      macdWeekly,
      macdMonthly,
      adx: false,
      supertrend: false,
      isBuy
    } as any);

  }

  return results;
}
