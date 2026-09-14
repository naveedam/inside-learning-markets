import { fetchFundamentals } from "./yahoo";

// ---------------------------------------------------------------------
// Educational, ratio-based Shariah screen — 5 rules, all computed from
// live financial data. Sector is NOT used to decide compliance; Google
// Sheets still stores Symbol/Name/Sector, but Sector is display-only
// here. This is a simplified, best-effort implementation built on free
// Yahoo Finance data — it is NOT a substitute for a certified Shariah
// board review. Treat results as educational, not a fatwa or
// investment advice.
//
// Data-quality caveats (documented, not hidden):
//   - "Secured + Unsecured Debt" is approximated with Yahoo's single
//     aggregate totalDebt figure.
//   - "Interest Income" is often missing in Yahoo's free feed.
//   - Missing data defaults to 0.
// ---------------------------------------------------------------------

const MIN_MARKET_CAP = 300_000_000;
const DEBT_TO_EQUITY_THRESHOLD = 0.33;
const DEBT_TO_MARKET_CAP_THRESHOLD = 0.33;
const INTEREST_TO_SALES_THRESHOLD = 0.05;
const RECEIVABLES_TO_MARKET_CAP_THRESHOLD = 0.33;

export interface ShariahResult {
  compliant: boolean;
  marketCap: number;
  debtToEquity: number;
  debtToMarketCap: number;
  interestToSales: number;
  receivablesToMarketCap: number;
  failedRules: string[];
}

function unavailableResult(reason: string): ShariahResult {
  return {
    compliant: false,
    marketCap: 0,
    debtToEquity: 0,
    debtToMarketCap: 0,
    interestToSales: 0,
    receivablesToMarketCap: 0,
    failedRules: [reason],
  };
}

export async function screenShariahCompliance(
  ticker: string
): Promise<ShariahResult> {
  let f;
  try {
    f = await fetchFundamentals(ticker);
  } catch {
    return unavailableResult("Financial data unavailable");
  }

  const failedRules: string[] = [];

  if (f.marketCap <= MIN_MARKET_CAP) {
    failedRules.push(`Market cap below ₹30 Cr`);
  }

  if (f.debtToEquity >= DEBT_TO_EQUITY_THRESHOLD) {
    failedRules.push(`Debt/Equity ${f.debtToEquity.toFixed(2)} > 0.33`);
  }

  const debtToMarketCap =
    f.marketCap > 0 ? f.totalDebt / f.marketCap : 0;

  if (debtToMarketCap >= DEBT_TO_MARKET_CAP_THRESHOLD) {
    failedRules.push(`Debt/Market Cap above 33%`);
  }

  const interestToSales =
    f.totalRevenue > 0 ? f.interestIncome / f.totalRevenue : 0;

  if (interestToSales >= INTEREST_TO_SALES_THRESHOLD) {
    failedRules.push(`Interest Income/Sales above 5%`);
  }

  const receivablesToMarketCap =
    f.marketCap > 0 ? f.netReceivables / f.marketCap : 0;

  if (receivablesToMarketCap >= RECEIVABLES_TO_MARKET_CAP_THRESHOLD) {
    failedRules.push(`Receivables/Market Cap above 33%`);
  }

  return {
    compliant: failedRules.length === 0,
    marketCap: f.marketCap,
    debtToEquity: f.debtToEquity,
    debtToMarketCap,
    interestToSales,
    receivablesToMarketCap,
    failedRules,
  };
}
