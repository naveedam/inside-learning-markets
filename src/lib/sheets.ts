export type UniverseRow = {
  symbol: string;
  name: string;
  sector: string;
};

const SHEET_URL =
  "https://script.google.com/macros/s/AKfycbz7Xf29mRvH30K8N2_G6T5mkdZPNQ1UtDDZw8CbJFzn2liEEnqjcZzUua_Um5DPxVTN/exec";

export async function loadUniverse(): Promise<UniverseRow[]> {
  const res = await fetch(SHEET_URL);
  const data = await res.json();

  return data.map((r: any) => ({
    symbol: r.ticker ?? r.symbol ?? r.Symbol,
    name: r.name ?? r.Name,
    sector: r.sector ?? r.Sector,
  }));
}
