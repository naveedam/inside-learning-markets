










import { fetchHistory } from "./yahoo";
import type { Stock } from "./sheets";

export interface StockSignal {
  ticker: string;
  name: string;
  sector: string;
  price: number;
  high52Distance: number;

  rsiDaily: number;
  rsiWeekly: number;
  rsiMonthly: number;

  macdDaily: boolean;
  macdWeekly: boolean;
  macdMonthly: boolean;

  adx: boolean;
  supertrend: boolean;
  isBuy: boolean;
}

const RSI_PERIOD = 14;

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

function rsi(values: number[]) {
  if (values.length < 15) return 0;

  let gain = 0;
  let loss = 0;

  for (let i = 1; i <= RSI_PERIOD; i++) {
    const d = values[i] - values[i - 1];
    if (d > 0) gain += d;
    else loss -= d;
  }

  let avgGain = gain / RSI_PERIOD;
  let avgLoss = loss / RSI_PERIOD;

  for (let i = 15; i < values.length; i++) {
    const d = values[i] - values[i - 1];
    avgGain = (avgGain * 13 + Math.max(d, 0)) / 14;
    avgLoss = (avgLoss * 13 + Math.max(-d, 0)) / 14;
  }

  if (avgLoss === 0) return 100;

  const rs = avgGain / avgLoss;
  return +(100 - 100 / (1 + rs)).toFixed(2);
}

function macd(values: number[]) {
  const e12 = ema(values, 12);
  const e26 = ema(values, 26);

  const line = e12.map((v, i) => v - e26[i]);
  const signal = ema(line, 9);

  return line.at(-1)! > signal.at(-1)!;
}

function sma(values: number[], period: number) {
  const slice = values.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / slice.length;
}

function weekly(closes: number[]) {
  return closes.filter((_, i) => i % 5 === 0);
}

function monthly(closes: number[]) {
  return closes.filter((_, i) => i % 21 === 0);
}

export async function screenUniverse(
  universe: Stock[]
): Promise<StockSignal[]> {
  const results: StockSignal[] = [];

  for (const stock of universe) {
    const data = await fetchHistory(stock.ticker);

    const q = data.indicators.quote[0];
    const closes = q.close.filter(Boolean) as number[];
    const highs = q.high.filter(Boolean) as number[];

    if (closes.length < 260) continue;

    const price = closes.at(-1)!;
    const high52 = Math.max(...highs.slice(-252));
    const pct = +(price / high52 * 100).toFixed(1);

    const rsiD = rsi(closes);
    const rsiW = rsi(weekly(closes));
    const rsiM = rsi(monthly(closes));

    const macdD = macd(closes);
    const macdW = macd(weekly(closes));
    const macdM = macd(monthly(closes));

    const ma50 = sma(closes, 50);
    const supertrend = price > ma50;
    const adx = Math.abs(rsiD - 50) > 15;

    const isBuy =
      pct < 96 &&
      rsiD > 60 &&
      rsiW > 60 &&
      rsiM > 60 &&
      macdD &&
      macdW &&
      macdM &&
      adx &&
      supertrend;

    results.push({
      ticker: stock.ticker,
      name: stock.name,
      sector: stock.sector,
      price,
      high52Distance: pct,
      rsiDaily: rsiD,
      rsiWeekly: rsiW,
      rsiMonthly: rsiM,
      macdDaily: macdD,
      macdWeekly: macdW,
      macdMonthly: macdM,
      adx,
      supertrend,
      isBuy,
    });
  }

  return results;
}
