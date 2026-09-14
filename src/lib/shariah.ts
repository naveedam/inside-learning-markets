const prohibited = [
  "Banking",
  "Insurance",
  "Financial Services"
];

export function isShariahCompliant(sector: string): boolean {
  return !prohibited.includes(sector);
}
