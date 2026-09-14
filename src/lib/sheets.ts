const SHEET_URL =
  "https://script.google.com/macros/s/AKfycbz7Xf29mRvH30K8N2_G6T5mkdZPNQ1UtDDZw8CbJFzn2liEEnqjcZzUua_Um5DPxVTN/exec";

export type UniverseRow = {
  ticker: string;
  symbol: string;
  name: string;
  sector: string;
};

type SheetRow = {
  ticker: string;
  name: string;
  sector: string;
};

export async function loadUniverse(): Promise<UniverseRow[]> {
  const rows: SheetRow[] = await fetch(SHEET_URL).then(r => r.json());

  return rows.map(r => ({
    ticker: r.ticker,
    symbol: r.ticker,
    name: r.name,
    sector: r.sector,
  }));
}
