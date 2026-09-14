import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchHistory } from "@/lib/yahoo";

type Candle={
  date:string; open:number; high:number; low:number; close:number; volume:number;
};


const calculateRSI = (values: number[], period = 14) => {
  if (values.length < period + 1) return 0;
  let gain = 0, loss = 0;
  for (let i = 1; i <= period; i++) {
    const d = values[i] - values[i - 1];
    if (d > 0) gain += d;
    else loss -= d;
  }
  let avgGain = gain / period;
  let avgLoss = loss / period;
  for (let i = period + 1; i < values.length; i++) {
    const d = values[i] - values[i - 1];
    const g = d > 0 ? d : 0;
    const l = d < 0 ? -d : 0;
    avgGain = (avgGain * 13 + g) / 14;
    avgLoss = (avgLoss * 13 + l) / 14;
  }
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return +(100 - 100 / (1 + rs)).toFixed(1);
};

export default function StockDetail(){
  const { ticker="" }=useParams();
  const [rows,setRows]=useState<Candle[]>([]);
  const [tf,setTf]=useState<"D"|"W"|"M">("D");

  useEffect(()=>{
    fetchHistory(ticker).then(setRows).catch(console.error);
  },[ticker]);

  const weekly=(c:Candle[])=>{
    const m=new Map<string,Candle[]>();
    c.forEach(r=>{
      const d=new Date(r.date);
      const k=`${d.getFullYear()}-${d.getMonth()}-${Math.floor((d.getDate()-1)/7)}`;
      if(!m.has(k)) m.set(k,[]);
      m.get(k)!.push(r);
    });
    return [...m.values()].map(g=>({
      date:g.at(-1)!.date,
      open:g[0].open,
      high:Math.max(...g.map(x=>x.high)),
      low:Math.min(...g.map(x=>x.low)),
      close:g.at(-1)!.close,
      volume:g.reduce((a,b)=>a+b.volume,0)
    }));
  };

  const monthly=(c:Candle[])=>{
    const m=new Map<string,Candle[]>();
    c.forEach(r=>{
      const d=new Date(r.date);
      const k=`${d.getFullYear()}-${d.getMonth()}`;
      if(!m.has(k)) m.set(k,[]);
      m.get(k)!.push(r);
    });
    return [...m.values()].map(g=>({
      date:g.at(-1)!.date,
      open:g[0].open,
      high:Math.max(...g.map(x=>x.high)),
      low:Math.min(...g.map(x=>x.low)),
      close:g.at(-1)!.close,
      volume:g.reduce((a,b)=>a+b.volume,0)
    }));
  };

  const data=useMemo(()=>{
    if(tf==="D") return rows;
    if(tf==="W") return weekly(rows);
    return monthly(rows);
  },[rows,tf]);

  const last=data.at(-1);

  const points=useMemo(()=>{
    if(data.length===0) return "";
    const w=820,h=260,p=20;
    const vals=data.map(x=>x.close);
    const min=Math.min(...vals);
    const max=Math.max(...vals);
    return data.map((c,i)=>{
      const x=p+i*((w-2*p)/(data.length-1||1));
      const y=h-p-((c.close-min)/(max-min||1))*(h-2*p);
      return `${x},${y}`;
    }).join(" ");
  },[data]);

  const minClose=data.length?Math.min(...data.map(x=>x.close)):0;
  const maxClose=data.length?Math.max(...data.map(x=>x.close)):0;

  return(
    <main className="min-h-screen bg-[#030B1A] text-white">
      <div className="max-w-6xl mx-auto p-8">

        <a href="/" className="text-sky-400 text-sm">
          ← Back to MarketCompass
        </a>

        <h1 className="text-5xl font-bold mt-4">{ticker}</h1>
        <p className="text-slate-400 mt-2">
          Educational Market Structure Explorer
        </p>

        {last && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">

            <div className="bg-slate-900 rounded-xl p-4">
              <div className="text-slate-400 text-sm">Current Price</div>
              <div className="text-3xl font-bold">
                ₹{last.close.toFixed(2)}
              </div>
            </div>

            <div className="bg-slate-900 rounded-xl p-4">
              <div className="text-slate-400 text-sm">2 Year High</div>
              <div className="text-3xl font-bold">
                ₹{Math.max(...rows.map(r=>r.high)).toFixed(2)}
              </div>
            </div>

            <div className="bg-slate-900 rounded-xl p-4">
              <div className="text-slate-400 text-sm">2 Year Low</div>
              <div className="text-3xl font-bold">
                ₹{Math.min(...rows.map(r=>r.low)).toFixed(2)}
              </div>
            </div>

            <div className="bg-slate-900 rounded-xl p-4">
              <div className="text-slate-400 text-sm">Observations

      {/* ===== Learning Summary ===== */}
      <div className="mt-6 rounded-xl bg-slate-900 p-5 border border-slate-800">
        <h2 className="text-xl font-semibold mb-4">Learning Summary</h2>

        <div className="grid md:grid-cols-3 gap-4">

          <div className="rounded-lg bg-slate-800 p-4">
            <div className="text-xs text-slate-400">Momentum</div>
            <div className="mt-1 text-lg font-semibold">
              RSI helps measure the strength of recent price movement.
            </div>
          </div>

          <div className="rounded-lg bg-slate-800 p-4">
            <div className="text-xs text-slate-400">Trend</div>
            <div className="mt-1 text-lg font-semibold">
              Study whether price is building higher highs and higher lows.
            </div>
          </div>

          <div className="rounded-lg bg-slate-800 p-4">
            <div className="text-xs text-slate-400">Structure</div>
            <div className="mt-1 text-lg font-semibold">
              Compare Daily, Weekly and Monthly views before drawing conclusions.
            </div>
          </div>

        </div>

        <p className="mt-4 text-xs text-slate-500">
          Educational note: This page is designed to help learners interpret market structure.
          It does not provide investment advice or trading recommendations.
        </p>
      </div></div>
          </div>

        <div className="bg-slate-900 rounded-xl p-6 mt-8">

          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">
              Price Structure
            </h2>

            <div className="flex gap-2">
              {["D","W","M"].map(x=>(
                <button
                  key={x}
                  onClick={()=>setTf(x as any)}
                  className={`px-4 py-2 rounded-lg text-sm ${
                    tf===x
                    ? "bg-sky-500 text-white"
                    : "bg-slate-800 text-slate-300"
                  }`}
                >
                  {x==="D"?"Daily":x==="W"?"Weekly":"Monthly"}
                </button>
              ))}
            </div>
          </div>

          <svg viewBox="0 0 820 260" className="w-full">
            {[0,1,2,3,4].map(i=>(
              <line
                key={i}
                x1="20"
                x2="800"
                y1={20+i*55}
                y2={20+i*55}
                stroke="#233047"
                strokeDasharray="4 6"
              />
            ))}

            <polyline
              fill="none"
              stroke="#38BDF8"
              strokeWidth="3"
              points={points}
            />

            <text x="10" y="20" fill="#94A3B8" fontSize="10">
              ₹{maxClose.toFixed(0)}
            </text>

            <text x="10" y="245" fill="#94A3B8" fontSize="10">
              ₹{minClose.toFixed(0)}
            </text>
          </svg>

          <div className="flex justify-between text-xs text-slate-500 mt-2">
            <span>{data[0]?.date}</span>
            <span>{data.at(-1)?.date}</span>
          </div>

        </div>

        <div className="grid md:grid-cols-2 gap-6 mt-8">

          <div className="bg-slate-900 rounded-xl p-5">
            <h3 className="font-semibold mb-3">
              Momentum (RSI)
            </h3>

              <div className="grid md:grid-cols-3 gap-4 my-6">

                <div className="rounded-xl bg-slate-800/60 border border-cyan-500/20 p-4">
                  <div className="text-cyan-400 text-xs font-semibold uppercase tracking-wide mb-2">Momentum</div>
                  <div className="text-xl font-bold text-white mb-2">RSI</div>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    RSI measures the strength of recent price movement and helps identify improving or weakening momentum.
                  </p>
                </div>

                <div className="rounded-xl bg-slate-800/60 border border-emerald-500/20 p-4">
                  <div className="text-emerald-400 text-xs font-semibold uppercase tracking-wide mb-2">Trend</div>
                  <div className="text-xl font-bold text-white mb-2">Higher Highs</div>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    Study whether price is building higher highs and higher lows to understand trend development.
                  </p>
                </div>

                <div className="rounded-xl bg-slate-800/60 border border-amber-500/20 p-4">
                  <div className="text-amber-400 text-xs font-semibold uppercase tracking-wide mb-2">Structure</div>
                  <div className="text-xl font-bold text-white mb-2">Multi-Timeframe</div>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    Compare Daily, Weekly and Monthly structure before forming an educational market view.
                  </p>
                </div>

              </div>

              <div className="rounded-xl bg-gradient-to-r from-cyan-900/20 to-emerald-900/20 border border-cyan-500/20 p-4 mb-6">
                <div className="font-semibold text-cyan-300 mb-2">📘 How to read this page</div>
                <p className="text-slate-300 text-sm leading-relaxed">
                  Start with price structure, then evaluate momentum, and finally compare higher timeframes. MarketCompass is designed for learning—not investment advice.
                </p>
              </div>

            <div className="text-5xl font-bold text-sky-400">
              {last ? Math.round((last.close-minClose)/(maxClose-minClose||1)*100) : 0}
            </div>
            <p className="text-sm text-slate-400 mt-3 leading-6">
              RSI helps learners understand the strength of recent price
              movement. Values above 70 often indicate strong momentum,
              while values below 30 suggest weak momentum.
            </p>
          </div>

          <div className="bg-slate-900 rounded-xl p-5">
            <h3 className="font-semibold mb-3">
              Trend Structure
            </h3>
            <div className="text-5xl font-bold text-emerald-400">
              {last && last.close>data[0]?.close ? "↗" : "↘"}
            </div>
            <p className="text-sm text-slate-400 mt-3 leading-6">
              This visual compares the beginning and end of the selected
              timeframe to illustrate overall trend direction. It is an
              educational observation rather than a recommendation.
            </p>
          </div>

        </div>

        <div className="bg-slate-900 rounded-xl p-6 mt-8">
          <h3 className="font-semibold mb-2">
            What changed?
          </h3>
          <p className="text-slate-300 leading-7">
            Switching between Daily, Weekly and Monthly compresses the same
            market data into different perspectives. The objective is to learn
            how trend structure changes across timeframes—not to generate
            trading signals.
          </p>
        </div>

      </div>
    </main>
  );
}
<div className="rounded-xl border border-slate-700 bg-slate-900/70 p-5">
  <h3 className="text-xl font-bold text-white mb-4">
    Learning Summary
  </h3>

  <div className="grid grid-cols-1 gap-3">
    <div className="rounded-lg bg-cyan-500/10 border border-cyan-500/20 p-3">
      <div className="text-cyan-300 text-xs font-semibold uppercase tracking-wider mb-1">Momentum</div>
      <div className="text-base font-semibold text-white mb-1">RSI</div>
      <p className="text-slate-300 text-xs leading-5">
        Measures the strength of recent price movement.
      </p>
    </div>

    <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3">
      <div className="text-red-300 text-xs font-semibold uppercase tracking-wider mb-1">Trend</div>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-red-400 text-lg">↘</span>
        <span className="text-base font-semibold text-white">Lower Highs</span>
      </div>
      <p className="text-slate-300 text-xs leading-5">
        The current structure is bearish until higher highs begin forming.
      </p>
    </div>

    <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3">
      <div className="text-amber-300 text-xs font-semibold uppercase tracking-wider mb-1">Structure</div>
      <div className="text-base font-semibold text-white mb-1">Daily · Weekly · Monthly</div>
      <p className="text-slate-300 text-xs leading-5">
        Compare multiple timeframes before drawing conclusions.
      </p>
    </div>
  </div>

  <div className="mt-4 pt-3 border-t border-slate-700">
    <p className="text-[11px] text-slate-400 leading-5">
      Educational note: MarketCompass teaches market structure and momentum.
      It does not provide investment advice or buy/sell recommendations.
    </p>
  </div>
</div>

              <div className="text-3xl font-bold">{data.length}</div>
            </div>

          </div>
        )}

        <div className="bg-slate-900 rounded-xl p-6 mt-8">

          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">
              Price Structure
            </h2>

            <div className="flex gap-2">
              {["D","W","M"].map(x=>(
                <button
                  key={x}
                  onClick={()=>setTf(x as any)}
                  className={`px-4 py-2 rounded-lg text-sm ${
                    tf===x
                    ? "bg-sky-500 text-white"
                    : "bg-slate-800 text-slate-300"
                  }`}
                >
                  {x==="D"?"Daily":x==="W"?"Weekly":"Monthly"}
                </button>
              ))}
            </div>
          </div>

          <svg viewBox="0 0 820 260" className="w-full">
            {[0,1,2,3,4].map(i=>(
              <line
                key={i}
                x1="20"
                x2="800"
                y1={20+i*55}
                y2={20+i*55}
                stroke="#233047"
                strokeDasharray="4 6"
              />
            ))}

            <polyline
              fill="none"
              stroke="#38BDF8"
              strokeWidth="3"
              points={points}
            />

            <text x="10" y="20" fill="#94A3B8" fontSize="10">
              ₹{maxClose.toFixed(0)}
            </text>

            <text x="10" y="245" fill="#94A3B8" fontSize="10">
              ₹{minClose.toFixed(0)}
            </text>
          </svg>

          <div className="flex justify-between text-xs text-slate-500 mt-2">
            <span>{data[0]?.date}</span>
            <span>{data.at(-1)?.date}</span>
          </div>

        </div>

        <div className="grid md:grid-cols-2 gap-6 mt-8">

          <div className="bg-slate-900 rounded-xl p-5">
            <h3 className="font-semibold mb-3">
              Momentum (RSI)
            </h3>

              <div className="grid md:grid-cols-3 gap-4 my-6">

                <div className="rounded-xl bg-slate-800/60 border border-cyan-500/20 p-4">
                  <div className="text-cyan-400 text-xs font-semibold uppercase tracking-wide mb-2">Momentum</div>
                  <div className="text-xl font-bold text-white mb-2">RSI</div>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    RSI measures the strength of recent price movement and helps identify improving or weakening momentum.
                  </p>
                </div>

                <div className="rounded-xl bg-slate-800/60 border border-emerald-500/20 p-4">
                  <div className="text-emerald-400 text-xs font-semibold uppercase tracking-wide mb-2">Trend</div>
                  <div className="text-xl font-bold text-white mb-2">Higher Highs</div>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    Study whether price is building higher highs and higher lows to understand trend development.
                  </p>
                </div>

                <div className="rounded-xl bg-slate-800/60 border border-amber-500/20 p-4">
                  <div className="text-amber-400 text-xs font-semibold uppercase tracking-wide mb-2">Structure</div>
                  <div className="text-xl font-bold text-white mb-2">Multi-Timeframe</div>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    Compare Daily, Weekly and Monthly structure before forming an educational market view.
                  </p>
                </div>

              </div>

              <div className="rounded-xl bg-gradient-to-r from-cyan-900/20 to-emerald-900/20 border border-cyan-500/20 p-4 mb-6">
                <div className="font-semibold text-cyan-300 mb-2">📘 How to read this page</div>
                <p className="text-slate-300 text-sm leading-relaxed">
                  Start with price structure, then evaluate momentum, and finally compare higher timeframes. MarketCompass is designed for learning—not investment advice.
                </p>
              </div>

            <div className="text-5xl font-bold text-sky-400">
              {last ? Math.round((last.close-minClose)/(maxClose-minClose||1)*100) : 0}
            </div>
            <p className="text-sm text-slate-400 mt-3 leading-6">
              RSI helps learners understand the strength of recent price
              movement. Values above 70 often indicate strong momentum,
              while values below 30 suggest weak momentum.
            </p>
          </div>

          <div className="bg-slate-900 rounded-xl p-5">
            <h3 className="font-semibold mb-3">
              Trend Structure
            </h3>
            <div className="text-5xl font-bold text-emerald-400">
              {last && last.close>data[0]?.close ? "↗" : "↘"}
            </div>
            <p className="text-sm text-slate-400 mt-3 leading-6">
              This visual compares the beginning and end of the selected
              timeframe to illustrate overall trend direction. It is an
              educational observation rather than a recommendation.
            </p>
          </div>

        </div>

        <div className="bg-slate-900 rounded-xl p-6 mt-8">
          <h3 className="font-semibold mb-2">
            What changed?
          </h3>
          <p className="text-slate-300 leading-7">
            Switching between Daily, Weekly and Monthly compresses the same
            market data into different perspectives. The objective is to learn
            how trend structure changes across timeframes—not to generate
            trading signals.
          </p>
        </div>

      </div>
    </main>
  );
}
