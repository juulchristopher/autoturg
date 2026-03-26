export interface TransactionRow {
  make: string;
  model: string;
  variant: string;
  fullModel: string;
  prodYear: number;
  count: number;
}

export interface MonthEntry {
  year: number;
  month: number;
  label: string;
  sheetUsed: string;
  rows: TransactionRow[];
}

export interface Database {
  jarelturg: MonthEntry[];
  newCars: MonthEntry[];
  imports: MonthEntry[];
}

export interface PriceAggregate {
  make: string;
  model: string;
  variant: string;
  prodYear: number;
  sampleSize: number;
  medianPrice: number;
  p25Price: number;
  p75Price: number;
  minPrice: number;
  maxPrice: number;
  avgMileage: number;
  lastUpdated: string;
}

export interface PriceListing {
  make: string;
  model: string;
  prodYear: number;
  price: number;
  source: string;
  mileage?: number;
}

export interface PriceData {
  aggregates: PriceAggregate[];
  listings: PriceListing[];
}

export type CategoryKey = 'jarelturg' | 'newCars' | 'imports' | 'koguTurg';

export interface ComparisonSlot {
  make: string;
  model: string;
  variant: string;
}

export interface DepreciationResult {
  make: string;
  model: string;
  dataPoints: DepreciationDataPoint[];
  annualDepreciationPct: number;
  totalRetention: number;
}

export interface DepreciationDataPoint {
  ageYears: number;
  medianPrice: number;
  p25Price: number;
  p75Price: number;
  sampleSize: number;
}

export interface VINResult {
  isValid: boolean;
  error?: string;
  vin?: string;
  wmi?: string;
  vds?: string;
  make?: string;
  modelYear?: number;
  yearCode?: string;
  plant?: string;
  serial?: string;
}
