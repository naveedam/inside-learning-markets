import StockScreener from "@/components/StockScreener";

export default function Markets() {
  return (
    <main className="min-h-screen bg-[#030B1A] text-white">
      <div className="mx-auto max-w-7xl p-8">
        <div className="mb-8">
          <h1 className="text-5xl font-bold">MarketCompass</h1>
          <p className="mt-2 text-lg text-slate-400">
            Multi-Timeframe Market Analysis & Learning Platform
          </p>
        </div>

        <StockScreener />
      </div>
    </main>
  );
}
