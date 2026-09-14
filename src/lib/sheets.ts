const SHEET_URL =
  "https://script.google.com/macros/s/AKfycbz7Xf29mRvH30K8N2_G6T5mkdZPNQ1UtDDZw8CbJFzn2liEEnqjcZzUua_Um5DPxVTN/exec";

export type UniverseRow = {
  symbol: string;
  name: string;
  sector: string;
};

type SheetRow = {
  Symbol: string;
  Name: string;
  Sector: string;
};

export async function loadUniverse(): Promise<UniverseRow[]> {
  const rows: SheetRow[] = await fetch(SHEET_URL).then(r => r.json());

  return rows.map(r => ({
    symbol: r.Symbol,
    name: r.Name,
    sector: r.Sector,
  }));
}
