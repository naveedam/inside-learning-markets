export interface Stock {
  ticker: string;
  name: string;
  sector: string;
}

const SHEET_URL = import.meta.env.VITE_SHEET_URL;

export async function loadUniverse(): Promise<Stock[]> {
  const res = await fetch(SHEET_URL);

  if (!res.ok) {
    throw new Error(`Google Sheet returned ${res.status}`);
  }

  return await res.json();
}
