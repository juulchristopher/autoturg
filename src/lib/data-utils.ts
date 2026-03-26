import { MonthEntry, CategoryKey, Database } from '@/types';

// Category labels and descriptions
export const CATEGORY_LABELS: Record<CategoryKey, string> = {
  jarelturg: 'Järelturg',
  newCars: 'Uued sõidukid',
  imports: 'Import',
  koguTurg: 'Kogu turg',
};

export const CATEGORY_DESC: Record<CategoryKey, string> = {
  jarelturg: 'Used car re-registrations in Estonia',
  newCars: 'First-time new vehicle registrations',
  imports: 'Imported used vehicles',
  koguTurg: 'All categories combined',
};

// Summary rows to skip
const SKIP = ['KOKKU', 'TOTAL', 'ZUSAMMEN', 'SUM'];

// Get months for a category (koguTurg merges all 3)
export function getMonthsForCategory(db: Database, cat: CategoryKey): MonthEntry[] {
  if (cat === 'koguTurg') {
    // Merge all 3 categories - combine rows from matching year/month entries
    const map = new Map<string, MonthEntry>();
    for (const key of ['jarelturg', 'newCars', 'imports'] as const) {
      for (const m of db[key]) {
        const k = `${m.year}-${m.month}`;
        if (!map.has(k)) {
          map.set(k, { ...m, rows: [...m.rows] });
        } else {
          map.get(k)!.rows = [...map.get(k)!.rows, ...m.rows];
        }
      }
    }
    return Array.from(map.values()).sort((a, b) => (a.year * 100 + a.month) - (b.year * 100 + b.month));
  }
  return db[cat] || [];
}

// Filter months by timeline range
export function filterByTimeline(
  months: MonthEntry[],
  from: { year: number; month: number } | null,
  to: { year: number; month: number } | null
): MonthEntry[] {
  return months.filter(m => {
    const val = m.year * 100 + m.month;
    if (from && val < from.year * 100 + from.month) return false;
    if (to && val > to.year * 100 + to.month) return false;
    return true;
  });
}

// Aggregate make totals across months, skip summary rows
export function aggregateMakes(months: MonthEntry[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const m of months) {
    for (const r of m.rows) {
      if (SKIP.includes(r.make)) continue;
      map.set(r.make, (map.get(r.make) || 0) + r.count);
    }
  }
  return map;
}

// Get top N makes by total transactions
export function topMakes(months: MonthEntry[], n: number): [string, number][] {
  const map = aggregateMakes(months);
  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, n);
}

// Get monthly series for a specific make
export function makeMonthSeries(months: MonthEntry[], make: string): number[] {
  return months.map(m =>
    m.rows.filter(r => r.make === make).reduce((s, r) => s + r.count, 0)
  );
}

// Rank all make/model combos across months
export function rankAllModels(months: MonthEntry[]): { make: string; model: string; total: number }[] {
  const map = new Map<string, number>();
  for (const m of months) {
    for (const r of m.rows) {
      if (SKIP.includes(r.make)) continue;
      const key = `${r.make}|||${r.model}`;
      map.set(key, (map.get(key) || 0) + r.count);
    }
  }
  return Array.from(map.entries())
    .map(([k, total]) => {
      const [make, model] = k.split('|||');
      return { make, model, total };
    })
    .sort((a, b) => b.total - a.total);
}

// Rank models within a specific make
export function rankModelsForMake(months: MonthEntry[], make: string): { model: string; total: number }[] {
  const map = new Map<string, number>();
  for (const m of months) {
    for (const r of m.rows) {
      if (r.make !== make) continue;
      map.set(r.model, (map.get(r.model) || 0) + r.count);
    }
  }
  return Array.from(map.entries())
    .map(([model, total]) => ({ model, total }))
    .sort((a, b) => b.total - a.total);
}

// Rank variants/configs for a model
export function rankConfigsForModel(months: MonthEntry[], make: string, model: string): { variant: string; total: number }[] {
  const map = new Map<string, number>();
  for (const m of months) {
    for (const r of m.rows) {
      if (r.make !== make || r.model !== model) continue;
      const v = r.variant || '(base)';
      map.set(v, (map.get(v) || 0) + r.count);
    }
  }
  return Array.from(map.entries())
    .map(([variant, total]) => ({ variant, total }))
    .sort((a, b) => b.total - a.total);
}

// Get unique makes from months (for combobox options)
export function uniqueMakes(months: MonthEntry[]): string[] {
  const set = new Set<string>();
  for (const m of months) {
    for (const r of m.rows) {
      if (!SKIP.includes(r.make)) set.add(r.make);
    }
  }
  return Array.from(set).sort();
}

// Get unique models for a make
export function uniqueModels(months: MonthEntry[], make: string): string[] {
  const set = new Set<string>();
  for (const m of months) {
    for (const r of m.rows) {
      if (r.make === make) set.add(r.model);
    }
  }
  return Array.from(set).sort();
}

// Get unique variants for a make+model
export function uniqueVariants(months: MonthEntry[], make: string, model: string): string[] {
  const set = new Set<string>();
  for (const m of months) {
    for (const r of m.rows) {
      if (r.make === make && r.model === model && r.variant) {
        set.add(r.variant);
      }
    }
  }
  return Array.from(set).sort();
}

// Monthly series for a specific make+model+variant combo
export function modelMonthSeries(months: MonthEntry[], make: string, model: string, variant?: string): number[] {
  return months.map(m =>
    m.rows
      .filter(r => r.make === make && r.model === model && (!variant || r.variant === variant))
      .reduce((s, r) => s + r.count, 0)
  );
}

// Production year distribution for a make+model
export function prodYearDistribution(months: MonthEntry[], make: string, model: string, variant?: string): Map<number, number> {
  const map = new Map<number, number>();
  for (const m of months) {
    for (const r of m.rows) {
      if (r.make !== make || r.model !== model) continue;
      if (variant && r.variant !== variant) continue;
      if (r.prodYear) {
        map.set(r.prodYear, (map.get(r.prodYear) || 0) + r.count);
      }
    }
  }
  return map;
}

// Get total transactions across months
export function totalTransactions(months: MonthEntry[]): number {
  return months.reduce((sum, m) =>
    sum + m.rows.filter(r => !SKIP.includes(r.make)).reduce((s, r) => s + r.count, 0), 0
  );
}

// Get all unique month labels
export function monthLabels(months: MonthEntry[]): string[] {
  return months.map(m => m.label);
}

// Monthly totals
export function monthlyTotals(months: MonthEntry[]): number[] {
  return months.map(m =>
    m.rows.filter(r => !SKIP.includes(r.make)).reduce((s, r) => s + r.count, 0)
  );
}

// Get make options with counts for combobox
export function makeOptionsWithCounts(months: MonthEntry[]): [string, number][] {
  const map = aggregateMakes(months);
  return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
}

// Get model options with counts for combobox
export function modelOptionsWithCounts(months: MonthEntry[], make: string): [string, number][] {
  const map = new Map<string, number>();
  for (const m of months) {
    for (const r of m.rows) {
      if (r.make !== make) continue;
      map.set(r.model, (map.get(r.model) || 0) + r.count);
    }
  }
  return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
}

// Get variant options with counts for combobox
export function variantOptionsWithCounts(months: MonthEntry[], make: string, model: string): [string, number][] {
  const map = new Map<string, number>();
  for (const m of months) {
    for (const r of m.rows) {
      if (r.make !== make || r.model !== model) continue;
      const v = r.variant || '(base)';
      map.set(v, (map.get(v) || 0) + r.count);
    }
  }
  return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
}

// Cross-category data for vehicle lookup
export function crossCategoryData(db: Database, make: string, model?: string): { labels: string[]; jarelturg: number[]; newCars: number[]; imports: number[] } | null {
  const cats = ['jarelturg', 'newCars', 'imports'] as const;
  const hasMultiple = cats.filter(c => {
    return db[c].some(m => m.rows.some(r => r.make === make && (!model || r.model === model)));
  }).length >= 2;

  if (!hasMultiple) return null;

  // Build merged month labels
  const allMonths = new Set<string>();
  for (const c of cats) {
    for (const m of db[c]) allMonths.add(m.label);
  }
  const labels = Array.from(allMonths).sort();

  const series: Record<string, number[]> = { jarelturg: [], newCars: [], imports: [] };
  for (const c of cats) {
    const monthMap = new Map(db[c].map(m => [m.label, m]));
    series[c] = labels.map(label => {
      const month = monthMap.get(label);
      if (!month) return 0;
      return month.rows
        .filter(r => r.make === make && (!model || r.model === model))
        .reduce((s, r) => s + r.count, 0);
    });
  }

  return { labels, jarelturg: series.jarelturg, newCars: series.newCars, imports: series.imports };
}
