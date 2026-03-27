export const COLORS = ['#c8960a', '#2563eb', '#16a34a', '#dc2626', '#7c3aed'];

export const MAKE_COLORS: Record<string, string> = {
  'VOLKSWAGEN': '#1e40af',
  'TOYOTA': '#dc2626',
  'BMW': '#0891b2',
  'AUDI': '#000000',
  'MERCEDES-BENZ': '#6b7280',
  'VOLVO': '#1e3a5f',
  'FORD': '#2563eb',
  'OPEL': '#f59e0b',
  'ŠKODA': '#16a34a',
  'NISSAN': '#c2185b',
  'HYUNDAI': '#002c5f',
  'KIA': '#7c3aed',
  'MAZDA': '#991b1b',
  'PEUGEOT': '#1d4ed8',
  'HONDA': '#ef4444',
  'RENAULT': '#eab308',
  'CITROËN': '#9f1239',
  'MITSUBISHI': '#e11d48',
  'SUBARU': '#1e40af',
  'LEXUS': '#1f2937',
  'TESLA': '#dc2626',
  'PORSCHE': '#b91c1c',
};

export function colorFor(make: string, idx: number): string {
  return MAKE_COLORS[make] || COLORS[idx % COLORS.length];
}
