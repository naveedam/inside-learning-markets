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
//     aggregate totalDebt figure — Yahoo doesn't expose the split
//     Indian filings show.
//   - "Interest Income" is often missing/zero in the free Yahoo feed
//     for non-financial companies, since it's rarely broken out as
//     its own income-statement line.
//   - Missing data defaults to 0, which can make a rule look passed
//     when it's actually just unmeasured. failedRules only reflects
//     rules that were positively violated with the data available.
// ---------------------------------------------------------------------

const MIN_MARKET_CAP = 300_000_000; // ₹30 Cr, in INR
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
  // Financial data couldn't be retrieved — default to non-compliant
  // rather than silently passing a stock we couldn't actually screen.
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

/**
 * Runs the 5-rule financial-ratio Shariah screen for a single stock.
 * Purely quantitative — sector plays no role in the decision.
 */
export async function screenShariahCompliance(
  ticker: string
): Promise<ShariahResult> {
  let f;
  try {
    f = await fetchFundamentals(ticker);
  } catch (err) {
    return unavailableResult("Financial data unavailable");
  }

  const failedRules: string[] = [];

  // Rule 1: Market Capitalization > ₹30 Cr
  if (f.marketCap <= MIN_MARKET_CAP) {
    failedRules.push(
      `Market cap ₹${(f.marketCap / 1e7).toFixed(1)} Cr is at or below the ₹30 Cr minimum`
    );
  }

  // Rule 2: Debt to Equity < 0.33
  if (f.debtToEquity >= DEBT_TO_EQUITY_THRESHOLD) {
    failedRules.push(
      `Debt/Equity is ${f.debtToEquity.toFixed(2)} (limit 0.33)`
    );
  }

  // Rule 3: (Secured Debt + Unsecured Debt) / Market Cap < 0.33
  const debtToMarketCap = f.marketCap > 0 ? f.totalDebt / f.marketCap : 0;
  if (debtToMarketCap >= DEBT_TO_MARKET_CAP_THRESHOLD) {
    failedRules.push(
      `Debt/Market cap is ${(debtToMarketCap * 100).toFixed(1)}% (limit 33%)`
    );
  }

  // Rule 4: Interest Income / Sales < 0.05
  const interestToSales =
    f.totalRevenue > 0 ? f.interestIncome / f.totalRevenue : 0;
  if (interestToSales >= INTEREST_TO_SALES_THRESHOLD) {
    failedRules.push(
      `Interest income/Sales is ${(interestToSales * 100).toFixed(1)}% (limit 5%)`
    );
  }

  // Rule 5: Trade Receivables / Market Cap < 0.33
  const receivablesToMarketCap =
    f.marketCap > 0 ? f.netReceivables / f.marketCap : 0;
  if (receivablesToMarketCap >= RECEIVABLES_TO_MARKET_CAP_THRESHOLD) {
    failedRules.push(
      `Trade receivables/Market cap is ${(receivablesToMarketCap * 100).toFixed(1)}% (limit 33%)`
    );
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
