import { useEffect, useState } from "react";
import { loadUniverse } from "@/lib/sheets";
import { screenUniverse, type StockSignal } from "@/lib/marketEngine";

export default function StockScreener() {
  const [stocks, setStocks] = useState<StockSignal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const universe = await loadUniverse();
      const results = await screenUniverse(universe);
      setStocks(results);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="p-10 text-slate-400 text-lg">
        Scanning NSE universe...
      </div>
    );
  }

  const learningScore = (s: StockSignal) => {
    let score = 0;

    if (s.rsiDaily > 60) score += 25;
    else if (s.rsiDaily > 50) score += 15;
    else if (s.rsiDaily > 40) score += 8;

    if (s.macdDaily) score += 25;

    if (s.high52Distance > 95) score += 25;
    else if (s.high52Distance > 85) score += 18;
    else if (s.high52Distance > 70) score += 12;

    if (s.adx) score += 15;
    if (s.supertrend) score += 10;

    return Math.min(100, score);
  };

  const aligned = stocks.filter(s => learningScore(s) >= 70).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-slate-900 rounded-xl p-5">
          <p className="text-slate-400 text-sm">Universe</p>
          <h2 className="text-4xl font-bold">{stocks.length}</h2>
        </div>

        <div className="bg-emerald-950 rounded-xl p-5">
          <p className="text-emerald-300 text-sm">High Alignment</p>
          <h2 className="text-4xl font-bold">{aligned}</h2>
        </div>

        <div className="bg-slate-900 rounded-xl p-5">
          <p className="text-slate-400 text-sm">Last Updated</p>
          <h2 className="text-xl font-semibold">
            {new Date().toLocaleTimeString()}
          </h2>
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-900 text-slate-400 text-sm">
            <tr>
              <th className="p-3 text-left">Stock</th>
              <th className="text-left">Learning Score</th>
              <th className="text-left">Price</th>
              <th className="text-left">52W%</th>
              <th className="text-left">RSI</th>
              <th className="text-left">MACD</th>
              <th className="text-left">Status</th>
            </tr>
          </thead>

          <tbody>
            {stocks.map(stock => {
              const score = learningScore(stock);

              return (
                <tr
                  key={stock.ticker}
                  className="border-t border-slate-800 hover:bg-slate-900/40"
                >
                  <td className="p-3 font-semibold">{stock.name}</td>

                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 rounded bg-slate-700 overflow-hidden">
                        <div
                          className={`h-full ${
                            score >= 70
                              ? "bg-emerald-500"
                              : score >= 40
                              ? "bg-amber-400"
                              : "bg-slate-500"
                          }`}
                          style={{ width: `${score}%` }}
                        />
                      </div>
                      <span className="font-semibold">{score}</span>
                    </div>
                  </td>

                  <td>₹{stock.price.toFixed(2)}</td>
                  <td>{stock.high52Distance.toFixed(1)}%</td>
                  <td>{stock.rsiDaily.toFixed(1)}</td>

                  <td>
                    <span
                      className={
                        stock.macdDaily
                          ? "text-emerald-400"
                          : "text-amber-400"
                      }
                    >
                      {stock.macdDaily ? "Bullish" : "Bearish"}
                    </span>
                  </td>

                  <td>
                    {score >= 70 ? (
                      <span className="px-2 py-1 rounded bg-emerald-600 text-xs font-bold">
                        High Alignment
                      </span>
                    ) : score >= 40 ? (
                      <span className="px-2 py-1 rounded bg-amber-500 text-black text-xs font-bold">
                        Building
                      </span>
                    ) : (
                      <span className="text-slate-400 text-xs">
                        Developing
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
        <p className="text-xs text-slate-400 leading-6">
          <span className="font-semibold text-slate-300">
            Educational Use Only.
          </span>{" "}
          MarketCompass is designed to help users learn technical market
          analysis. It does not provide investment advice, stock
          recommendations, or trading signals. Users should conduct their own
          research before making financial decisions.
        </p>
      </div>
    </div>
  );
}
