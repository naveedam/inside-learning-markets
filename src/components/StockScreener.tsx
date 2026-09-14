import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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

  if (loading)
    return <div className="p-8 text-slate-400">Scanning NSE universe...</div>;

  const score = (s: StockSignal) => {
    let x = 0;
    if (s.rsiDaily > 60) x += 25;
    else if (s.rsiDaily > 50) x += 15;
    if (s.macdDaily) x += 25;
    if (s.high52Distance > 95) x += 25;
    else if (s.high52Distance > 85) x += 15;
    if (s.adx) x += 5;
    if (s.supertrend) x += 5;
    return Math.min(100, x);
  };

  const aligned = stocks.filter(s => score(s) >= 70).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-slate-900 rounded-xl p-5">
          <p className="text-slate-400 text-sm">Universe</p>
          <h2 className="text-3xl font-bold">{stocks.length}</h2>
        </div>

        <div className="bg-emerald-950 rounded-xl p-5">
          <p className="text-emerald-300 text-sm">High Alignment</p>
          <h2 className="text-3xl font-bold">{aligned}</h2>
        </div>

        <div className="bg-slate-900 rounded-xl p-5">
          <p className="text-slate-400 text-sm">Last Updated</p>
          <h2 className="text-lg font-semibold">
            {new Date().toLocaleTimeString()}
          </h2>
        </div>
      </div>

      <div className="bg-slate-950 rounded-xl overflow-hidden border border-slate-800">
        <table className="w-full">
          <thead className="bg-slate-900">
            <tr className="text-left text-slate-400 text-sm">
              <th className="p-3">Company</th>
              <th>Score</th>
              <th>Price</th>
              <th>52W%</th>
              <th>RSI</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {stocks.map(s => (
              <tr
                key={s.ticker}
                className="border-t border-slate-800 hover:bg-slate-900/60"
              >
                <td className="p-3">
                  <Link
                    to={`/stock/${encodeURIComponent(s.ticker)}`}
                    className="font-semibold text-sky-400 hover:text-sky-300"
                  >
                    {s.name}
                  </Link>
                  <div className="text-xs text-slate-500">{s.ticker}</div>
                </td>

                <td className="font-semibold">{score(s)}</td>
                <td>₹{s.price.toFixed(2)}</td>
                <td>{s.high52Distance.toFixed(1)}%</td>
                <td>{s.rsiDaily.toFixed(1)}</td>

                <td>
                  {score(s) >= 70 ? (
                    <span className="px-2 py-1 rounded bg-emerald-600 text-xs font-bold">
                      High Alignment
                    </span>
                  ) : score(s) >= 40 ? (
                    <span className="px-2 py-1 rounded bg-amber-500 text-black text-xs font-bold">
                      Building
                    </span>
                  ) : (
                    <span className="text-slate-500 text-xs">Developing</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
        <p className="text-xs text-slate-400 leading-6">
          <span className="font-semibold text-slate-300">
            Educational Use Only.
          </span>{" "}
          MarketCompass is designed to help users learn technical market
          analysis. It does not provide investment advice, stock recommendations,
          or trading signals.
        </p>
      </div>
    </div>
  );
}
