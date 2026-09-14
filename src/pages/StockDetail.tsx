import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchHistory } from "@/lib/yahoo";

export default function StockDetail() {
  const { ticker = "" } = useParams();
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    fetchHistory(ticker).then(setRows).catch(console.error);
  }, [ticker]);

  const last = rows.at(-1);

  return (
    <main className="min-h-screen bg-[#030B1A] text-white">
      <div className="mx-auto max-w-6xl p-8">

        <a href="/" className="text-sky-400 text-sm">
          ← Back to MarketCompass
        </a>

        <h1 className="text-4xl font-bold mt-4">{ticker}</h1>
        <p className="text-slate-400">
          Educational Market Structure Explorer
        </p>

        {last && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">

            <div className="bg-slate-900 rounded-xl p-4">
              <div className="text-slate-400 text-sm">Current Price</div>
              <div className="text-2xl font-bold">
                ₹{last.close.toFixed(2)}
              </div>
            </div>

            <div className="bg-slate-900 rounded-xl p-4">
              <div className="text-slate-400 text-sm">2 Year High</div>
              <div className="text-2xl font-bold">
                ₹{Math.max(...rows.map(r=>r.high)).toFixed(2)}
              </div>
            </div>

            <div className="bg-slate-900 rounded-xl p-4">
              <div className="text-slate-400 text-sm">2 Year Low</div>
              <div className="text-2xl font-bold">
                ₹{Math.min(...rows.map(r=>r.low)).toFixed(2)}
              </div>
            </div>

            <div className="bg-slate-900 rounded-xl p-4">
              <div className="text-slate-400 text-sm">Sessions</div>
              <div className="text-2xl font-bold">{rows.length}</div>
            </div>

          </div>
        )}

        <div className="bg-slate-900 rounded-xl p-6 mt-8">
          <h2 className="text-xl font-semibold mb-4">
            Latest 20 Trading Sessions
          </h2>

          <div className="space-y-2">
            {rows.slice(-20).reverse().map(r=>(
              <div
                key={r.date}
                className="flex justify-between border-b border-slate-800 pb-2 text-sm"
              >
                <span>{r.date}</span>
                <span>₹{r.close.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-900 rounded-xl p-6 mt-8">
          <h3 className="font-semibold mb-2">
            Educational Use Only
          </h3>
          <p className="text-slate-400 text-sm leading-6">
            MarketCompass helps learners understand price structure,
            momentum and trend behaviour. It does not provide investment
            advice, recommendations or trading signals.
          </p>
        </div>

      </div>
    </main>
  );
}
