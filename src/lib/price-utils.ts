import { PriceAggregate, PriceData, DepreciationResult } from '@/types';

export function findPriceAggregate(prices: PriceData | null, make: string, model: string, prodYear?: number): PriceAggregate | null {
  if (!prices) return null;
  return prices.aggregates.find(a =>
    a.make === make && a.model === model && (!prodYear || a.prodYear === prodYear)
  ) || null;
}

export function findPriceAggregatesForModel(prices: PriceData | null, make: string, model: string): PriceAggregate[] {
  if (!prices) return [];
  return prices.aggregates
    .filter(a => a.make === make && a.model === model)
    .sort((a, b) => b.prodYear - a.prodYear);
}

export function findListingsForModel(prices: PriceData | null, make: string, model: string, prodYear?: number) {
  if (!prices) return [];
  return prices.listings.filter(l =>
    l.make === make && l.model === model && (!prodYear || l.prodYear === prodYear)
  );
}

export function classifyPrice(price: number, agg: PriceAggregate): { className: string; label: string } {
  if (price <= agg.p25Price) return { className: 'text-app-green', label: 'Good deal' };
  if (price <= agg.p75Price) return { className: 'text-gold', label: 'Fair price' };
  return { className: 'text-app-red', label: 'Above market' };
}

export function computeDepreciation(prices: PriceData | null, make: string, model: string): DepreciationResult | null {
  const aggs = findPriceAggregatesForModel(prices, make, model);
  if (aggs.length < 3) return null;

  const currentYear = new Date().getFullYear();
  const dataPoints = aggs
    .map(a => ({
      ageYears: currentYear - a.prodYear,
      medianPrice: a.medianPrice,
      p25Price: a.p25Price,
      p75Price: a.p75Price,
      sampleSize: a.sampleSize,
    }))
    .sort((a, b) => a.ageYears - b.ageYears);

  // Calculate annual depreciation using first and last data points
  const newest = dataPoints[0];
  const oldest = dataPoints[dataPoints.length - 1];
  const yearSpan = oldest.ageYears - newest.ageYears;

  if (yearSpan <= 0 || newest.medianPrice <= 0) return null;

  const totalRetention = oldest.medianPrice / newest.medianPrice;
  const annualDepreciationPct = (1 - Math.pow(totalRetention, 1 / yearSpan)) * 100;

  return { make, model, dataPoints, annualDepreciationPct, totalRetention: totalRetention * 100 };
}

export function classifyRetention(annualPct: number): { label: string; className: string; desc: string } {
  if (annualPct < 8) return { label: 'Excellent', className: 'text-app-green', desc: 'Holds value very well' };
  if (annualPct < 15) return { label: 'Good', className: 'text-gold', desc: 'Average depreciation' };
  return { label: 'Poor', className: 'text-app-red', desc: 'Depreciates quickly' };
}

// Group listings by source for source comparison
export function listingsBySource(prices: PriceData | null, make: string, model: string): { source: string; median: number; count: number }[] {
  if (!prices) return [];
  const listings = prices.listings.filter(l => l.make === make && l.model === model);
  const bySource = new Map<string, number[]>();
  for (const l of listings) {
    if (!bySource.has(l.source)) bySource.set(l.source, []);
    bySource.get(l.source)!.push(l.price);
  }
  return Array.from(bySource.entries()).map(([source, prices]) => {
    prices.sort((a, b) => a - b);
    const median = prices[Math.floor(prices.length / 2)];
    return { source, median, count: prices.length };
  }).sort((a, b) => b.count - a.count);
}
