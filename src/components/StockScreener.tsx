import { useEffect, useState } from "react";
import { loadUniverse } from "@/lib/sheets";
import { screenUniverse, type StockSignal } from "@/lib/marketEngine";

export default function StockScreener() {
  const [signals, setSignals] = useState<StockSignal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function run() {
      const universe = await loadUniverse();
      const results = await screenUniverse(universe);
      setSignals(results);
      setLoading(false);
    }
    run();
  }, []);

  if (loading)
    return <div className="p-8 text-gray-400">Scanning NSE universe...</div>;

  const buys = signals.filter(s => s.isBuy);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-slate-900 rounded-xl p-5">
          <p className="text-gray-400 text-sm">Universe</p>
          <h2 className="text-3xl font-bold">{signals.length}</h2>
        </div>
        <div className="bg-green-950 rounded-xl p-5">
          <p className="text-green-300 text-sm">BUY Signals</p>
          <h2 className="text-3xl font-bold">{buys.length}</h2>
        </div>
        <div className="bg-slate-900 rounded-xl p-5">
          <p className="text-gray-400 text-sm">Scan Time</p>
          <h2 className="text-lg font-semibold">
            {new Date().toLocaleTimeString()}
          </h2>
        </div>
      </div>

      <div className="bg-slate-950 rounded-xl overflow-hidden border border-slate-800">
        <table className="w-full">
          <thead className="bg-slate-900">
            <tr className="text-left text-gray-400 text-sm">
              <th className="p-3">Stock</th>
              <th>Price</th>
              <th>52W%</th>
              <th>RSI</th>
              <th>MACD</th>
              <th>ADX</th>
              <th>Supertrend</th>
              <th>Signal</th>
            </tr>
          </thead>
          <tbody>
            {signals.map(stock => (
              <tr key={stock.ticker} className="border-t border-slate-800">
                <td className="p-3 font-semibold">{stock.name}</td>
                <td>₹{stock.price.toFixed(2)}</td>
                <td>{stock.high52Distance.toFixed(1)}%</td>
                <td>{stock.rsiDaily}</td>
                <td>{stock.macdDaily ? "Bullish" : "Bearish"}</td>
                <td>{stock.adx ? "Strong" : "Weak"}</td>
                <td>{stock.supertrend ? "Green" : "Red"}</td>
                <td>
                  {stock.isBuy ? (
                    <span className="px-2 py-1 rounded bg-green-600 text-xs font-bold">
                      BUY
                    </span>
                  ) : (
                    <span className="text-gray-500 text-xs">WAIT</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
