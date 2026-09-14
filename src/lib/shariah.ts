import { fetchFundamentals } from "./yahoo";

// ---------------------------------------------------------------------
// Educational, AAOIFI-style Shariah screen. Two stages:
//   1. Business activity screen (sector exclusion)
//   2. Financial ratio screen (debt, cash, non-permissible income)
//
// This is a simplified, best-effort implementation built on free Yahoo
// Finance data — it is NOT a substitute for a certified Shariah board
// review. Treat results as educational, not a fatwa or investment
// advice.
// ---------------------------------------------------------------------

const PROHIBITED_SECTORS = ["Banking", "Insurance", "Financial Services"];

// AAOIFI-style thresholds (commonly used approximations)
const DEBT_RATIO_THRESHOLD = 0.33;
const CASH_RATIO_THRESHOLD = 0.33;
const INTEREST_INCOME_THRESHOLD = 0.05;

export interface ShariahResult {
  compliant: boolean;
  businessScreen: boolean;
  debtRatio: number;
  cashRatio: number;
  interestIncomeRatio: number;
  reasons: string[];
}

function excludedByBusinessScreen(sector: string): ShariahResult {
  return {
    compliant: false,
    businessScreen: false,
    debtRatio: 0,
    cashRatio: 0,
    interestIncomeRatio: 0,
    reasons: [`Sector "${sector}" is not a permissible business activity`],
  };
}

function unavailableResult(reason: string): ShariahResult {
  // Financial data couldn't be retrieved — default to non-compliant
  // rather than silently passing a stock we couldn't actually screen.
  return {
    compliant: false,
    businessScreen: true,
    debtRatio: 0,
    cashRatio: 0,
    interestIncomeRatio: 0,
    reasons: [reason],
  };
}

/**
 * Runs the full two-stage Shariah screen for a single stock.
 * Stage 1 (sector) is synchronous and short-circuits before any
 * network call. Stage 2 (ratios) only runs for stocks that pass stage 1.
 */
export async function screenShariahCompliance(
  ticker: string,
  sector: string
): Promise<ShariahResult> {
  if (PROHIBITED_SECTORS.includes(sector)) {
    return excludedByBusinessScreen(sector);
  }

  let f;
  try {
    f = await fetchFundamentals(ticker);
  } catch (err) {
    return unavailableResult("Financial data unavailable for ratio screen");
  }

  if (f.marketCap <= 0) {
    return unavailableResult("Market cap unavailable — cannot compute ratios");
  }

  const debtRatio = f.totalDebt / f.marketCap;
  const cashRatio = (f.totalCash + f.shortTermInvestments) / f.marketCap;
  const interestIncomeRatio =
    f.totalRevenue > 0 ? f.interestIncome / f.totalRevenue : 0;

  const reasons: string[] = [];

  if (debtRatio > DEBT_RATIO_THRESHOLD) {
    reasons.push(
      `Interest-bearing debt is ${(debtRatio * 100).toFixed(1)}% of market cap (limit 33%)`
    );
  }
  if (cashRatio > CASH_RATIO_THRESHOLD) {
    reasons.push(
      `Cash & interest-bearing securities are ${(cashRatio * 100).toFixed(1)}% of market cap (limit 33%)`
    );
  }
  if (interestIncomeRatio > INTEREST_INCOME_THRESHOLD) {
    reasons.push(
      `Non-permissible income is ${(interestIncomeRatio * 100).toFixed(1)}% of revenue (limit 5%)`
    );
  }

  return {
    compliant: reasons.length === 0,
    businessScreen: true,
    debtRatio,
    cashRatio,
    interestIncomeRatio,
    reasons,
  };
}

// Sector-only check, kept for any lightweight use that doesn't need
// the full async ratio screen (e.g. a quick pre-filter).
export function isShariahCompliant(sector: string): boolean {
  return !PROHIBITED_SECTORS.includes(sector);
}
