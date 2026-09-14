import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchHistory } from "@/lib/yahoo";

type Candle = {
  date:string;
  open:number;
  high:number;
  low:number;
  close:number;
  volume:number;
};

export default function StockDetail(){
  const { ticker="" } = useParams();
  const [rows,setRows] = useState<Candle[]>([]);
  const [tf,setTf] = useState<"D"|"W"|"M">("D");

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

  const data = useMemo(()=>{
    if(tf==="D") return rows;
    if(tf==="W") return weekly(rows);
    return monthly(rows);
  },[rows,tf]);

  const current=data.at(-1)?.close??0;
  const high=rows.length?Math.max(...rows.map(r=>r.high)):0;
  const low=rows.length?Math.min(...rows.map(r=>r.low)):0;

  const min=Math.min(...data.map(x=>x.close),current);
  const max=Math.max(...data.map(x=>x.close),current);

  const points=data.map((c,i)=>{
    const x=20+i*(780/Math.max(1,data.length-1));
    const y=240-((c.close-min)/(max-min||1))*200;
    return `${x},${y}`;
  }).join(" ");

  const trend=current>=data[0]?.close;

  return(
    <main className="min-h-screen bg-[#030B1A] text-white">
      <div className="max-w-6xl mx-auto p-8">

        <Link to="/" className="text-sky-400 text-sm">
          ← Back to MarketCompass
        </Link>

        <h1 className="text-5xl font-bold mt-4">{ticker}</h1>
        <p className="text-slate-400 mt-2">
          Educational Market Structure Explorer
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">

          <div className="bg-slate-900 rounded-xl p-5">
            <div className="text-slate-400 text-sm">Current Price</div>
            <div className="text-3xl font-bold mt-1">₹{current.toFixed(2)}</div>
          </div>

          <div className="bg-slate-900 rounded-xl p-5">
            <div className="text-slate-400 text-sm">2Y High</div>
            <div className="text-3xl font-bold mt-1">₹{high.toFixed(0)}</div>
          </div>

          <div className="bg-slate-900 rounded-xl p-5">
            <div className="text-slate-400 text-sm">2Y Low</div>
            <div className="text-3xl font-bold mt-1">₹{low.toFixed(0)}</div>
          </div>

          <div className="bg-slate-900 rounded-xl p-5">
            <div className="text-slate-400 text-sm">Observations</div>
            <div className="text-3xl font-bold mt-1">{data.length}</div>
          </div>

        </div>

        <div className="bg-slate-900 rounded-xl p-6 mt-8">

          <div className="flex justify-between items-center mb-5">
            <h2 className="text-2xl font-bold">Price Structure</h2>

            <div className="flex gap-2">
              {["D","W","M"].map(x=>(
                <button
                  key={x}
                  onClick={()=>setTf(x as any)}
                  className={`px-3 py-2 rounded-lg text-sm ${
                    tf===x
                    ?"bg-sky-500 text-white"
                    :"bg-slate-800 text-slate-300"
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
                stroke="#22304A"
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
              ₹{max.toFixed(0)}
            </text>

            <text x="10" y="245" fill="#94A3B8" fontSize="10">
              ₹{min.toFixed(0)}
            </text>

          </svg>

          <div className="flex justify-between text-xs text-slate-500 mt-2">
            <span>{data[0]?.date}</span>
            <span>{data.at(-1)?.date}</span>
          </div>

        </div>

        <div className="grid md:grid-cols-2 gap-6 mt-8">

          <div className="bg-slate-900 rounded-xl p-5">
            <div className="text-cyan-400 text-xs uppercase tracking-wider mb-2">
              Momentum
            </div>

            <div className="text-4xl font-bold">
              {Math.round((current-low)/(high-low||1)*100)}
            </div>

            <div className="text-slate-400 text-sm mt-2">
              Position within the 2-year range
            </div>
          </div>

          <div className="bg-slate-900 rounded-xl p-5">
            <div className="text-emerald-400 text-xs uppercase tracking-wider mb-2">
              Trend Structure
            </div>

            <div className={`text-5xl font-bold ${trend?"text-emerald-400":"text-red-400"}`}>
              {trend?"↗":"↘"}
            </div>

            <div className="text-slate-300 font-medium mt-2">
              {trend?"Bullish Structure":"Bearish Structure"}
            </div>

            <p className="text-slate-400 text-sm mt-2 leading-6">
              Compare Daily, Weekly and Monthly views before forming an educational conclusion.
            </p>
          </div>

        </div>

        <div className="bg-slate-900 rounded-xl p-6 mt-8">
          <h2 className="text-2xl font-bold mb-5">
            Learning Summary
          </h2>

          <div className="grid md:grid-cols-3 gap-4">

            <div className="rounded-xl bg-cyan-500/10 border border-cyan-500/20 p-4">
              <div className="text-cyan-300 text-xs uppercase font-semibold mb-2">
                Momentum
              </div>
              <div className="font-semibold text-lg mb-2">RSI Concept</div>
              <p className="text-sm text-slate-300 leading-6">
                Momentum studies how strongly price is advancing or weakening over time.
              </p>
            </div>

            <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4">
              <div className="text-emerald-300 text-xs uppercase font-semibold mb-2">
                Trend
              </div>
              <div className="font-semibold text-lg mb-2">Higher Highs</div>
              <p className="text-sm text-slate-300 leading-6">
                Sustainable uptrends usually develop through higher highs and higher lows.
              </p>
            </div>

            <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-4">
              <div className="text-amber-300 text-xs uppercase font-semibold mb-2">
                Structure
              </div>
              <div className="font-semibold text-lg mb-2">Multiple Timeframes</div>
              <p className="text-sm text-slate-300 leading-6">
                Compare Daily, Weekly and Monthly charts to understand market structure.
              </p>
            </div>

          </div>

          <div className="mt-6 rounded-xl bg-slate-800/60 border border-slate-700 p-4">
            <div className="font-semibold text-cyan-300 mb-2">
              📘 Educational Use Only
            </div>
            <p className="text-sm text-slate-300 leading-6">
              MarketCompass is a learning platform for understanding price structure,
              momentum and trend behaviour. It does not provide investment advice,
              stock recommendations or trading signals.
            </p>
          </div>

        </div>

      </div>
    </main>
  );
}
