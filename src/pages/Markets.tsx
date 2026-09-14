import { useEffect, useState } from "react";
import { loadUniverse, type Stock } from "@/lib/sheets";

export default function Markets() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUniverse()
      .then(setStocks)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#0B1120] text-white">
      <header className="border-b border-slate-800 px-6 py-5">
        <h1 className="text-3xl font-bold">
          Inside Learning Markets
        </h1>
        <p className="mt-1 text-slate-400">
          Institutional Stock Signal Generator
        </p>
      </header>

      <main className="p-6">
        <div className="mb-6 rounded-xl border border-slate-800 bg-slate-900 p-4">
          <div className="text-sm text-slate-400">Stocks in Universe</div>
          <div className="mt-1 text-4xl font-bold">{stocks.length}</div>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-800">
          <table className="w-full">
            <thead className="bg-slate-900 text-left text-sm">
              <tr>
                <th className="p-3">Ticker</th>
                <th className="p-3">Company</th>
                <th className="p-3">Sector</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={3} className="p-6 text-center text-slate-400">
                    Loading Google Sheet...
                  </td>
                </tr>
              ) : (
                stocks.map((s) => (
                  <tr
                    key={s.ticker}
                    className="border-t border-slate-800 hover:bg-slate-900/50"
                  >
                    <td className="p-3 font-mono">{s.ticker}</td>
                    <td className="p-3">{s.name}</td>
                    <td className="p-3 text-slate-400">{s.sector}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
