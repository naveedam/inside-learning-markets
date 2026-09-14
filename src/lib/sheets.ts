export type UniverseStock = {
  symbol: string;
  name: string;
  sector: string;
};

const SHEET =
  "PASTE YOUR EXISTING APPS SCRIPT URL HERE";

export async function loadUniverse(): Promise<UniverseStock[]> {
  const res = await fetch(SHEET);
  const rows = await res.json();

  return rows.map((r: any) => ({
    symbol: r.Symbol,
    name: r.Name,
    sector: r.Sector,
  }));
}
