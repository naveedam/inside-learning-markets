import { useEffect, useState } from "react";
import { loadUniverse } from "@/lib/sheets";
import { fetchHistory } from "@/lib/yahoo";
import {
  rsi,
  macd,
  weekly,
  monthly,
  type StockSignal,
} from "@/lib/marketEngine";

export default function StockScreener() {

  const [stocks,setStocks]=useState<StockSignal[]>([]);
  const [loading,setLoading]=useState(true);

  useEffect(()=>{
    load();
  },[]);

  async function load(){

    setLoading(true);

    const universe=await loadUniverse();

    const results:StockSignal[]=[];

    for(const stock of universe){

      const daily=await fetchHistory(stock.ticker);

      if(daily.length<250) continue;

      const closes=daily.map(c=>c.close);

      const w=weekly(daily);
      const m=monthly(daily);

      const high52=Math.max(...daily.slice(-252).map(c=>c.high));
      const price=closes.at(-1)!;
      const pctHigh=+(price/high52*100).toFixed(1);

      const s:StockSignal={
        ticker:stock.ticker,
        name:stock.name,
        sector:stock.sector,
        price,
        high52,
        pctHigh,
        rsiD:rsi(closes),
        rsiW:rsi(w.map(x=>x.close)),
        rsiM:rsi(m.map(x=>x.close)),
        macdD:macd(closes),
        macdW:macd(w.map(x=>x.close)),
        macdM:macd(m.map(x=>x.close)),
        classification:"weak"
      };

      const buy=
        pctHigh<96 &&
        s.rsiD>60 &&
        s.rsiW>60 &&
        s.rsiM>60 &&
        s.macdD &&
        s.macdW &&
        s.macdM;

      s.classification=buy?"bullish":"weak";

      results.push(s);

    }

    setStocks(results);
    setLoading(false);
  }

  const bullish=stocks.filter(s=>s.classification==="bullish");

  return(
    <div className="space-y-4">

      <div className="rounded-xl border p-5">
        <div className="text-sm opacity-70">
          Fully Bullish
        </div>
        <div className="text-4xl font-bold">
          {bullish.length}
        </div>
      </div>

      {loading && (
        <div>Scanning market…</div>
      )}

      {!loading &&
        bullish.map(s=>(
          <div key={s.ticker} className="rounded-xl border p-4">
            <div className="flex justify-between">
              <div>
                <div className="font-bold text-xl">
                  {s.name}
                </div>
                <div className="text-sm opacity-70">
                  {s.ticker}
                </div>
              </div>

              <div className="text-right">
                <div className="text-xl font-bold">
                  ₹{s.price.toFixed(2)}
                </div>
                <div className="text-green-500 text-sm">
                  {s.pctHigh}% of 52W High
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-4 text-center">

              <div>
                <div className="text-xs opacity-60">Daily RSI</div>
                <div className="font-bold">{s.rsiD}</div>
              </div>

              <div>
                <div className="text-xs opacity-60">Weekly RSI</div>
                <div className="font-bold">{s.rsiW}</div>
              </div>

              <div>
                <div className="text-xs opacity-60">Monthly RSI</div>
                <div className="font-bold">{s.rsiM}</div>
              </div>

            </div>
          </div>
        ))
      }

    </div>
  );

}
