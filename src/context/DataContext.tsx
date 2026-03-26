import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { Database, PriceData, CategoryKey, MonthEntry } from '@/types';
import { getMonthsForCategory, filterByTimeline } from '@/lib/data-utils';

interface TimelinePoint {
  year: number;
  month: number;
}

interface DataContextType {
  db: Database;
  prices: PriceData | null;
  loading: boolean;
  pricesLoading: boolean;
  activeCategory: CategoryKey;
  setCategory: (cat: CategoryKey) => void;
  timelineFrom: TimelinePoint | null;
  timelineTo: TimelinePoint | null;
  setTimeline: (from: TimelinePoint | null, to: TimelinePoint | null) => void;
  resetTimeline: () => void;
  filteredMonths: MonthEntry[];
  allMonths: MonthEntry[];
  fetchPrices: () => Promise<void>;
}

const DataContext = createContext<DataContextType | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<Database>({ jarelturg: [], newCars: [], imports: [] });
  const [prices, setPrices] = useState<PriceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [pricesLoading, setPricesLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState<CategoryKey>('jarelturg');
  const [timelineFrom, setTimelineFrom] = useState<TimelinePoint | null>(null);
  const [timelineTo, setTimelineTo] = useState<TimelinePoint | null>(null);

  // Load main data
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('./data.json');
        const raw = await res.json();
        // Handle legacy format
        const data: Database = raw.jarelturg
          ? raw
          : { jarelturg: raw.months || [], newCars: [], imports: [] };
        // Sort each category
        for (const key of ['jarelturg', 'newCars', 'imports'] as const) {
          data[key].sort((a, b) => (a.year * 100 + a.month) - (b.year * 100 + b.month));
        }
        setDb(data);
      } catch (e) {
        console.error('Failed to load data:', e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Lazy load prices
  const fetchPricesData = useCallback(async () => {
    if (prices || pricesLoading) return;
    setPricesLoading(true);
    try {
      const res = await fetch('./prices.json');
      const data = await res.json();
      setPrices(data);
    } catch (e) {
      console.error('Failed to load prices:', e);
    } finally {
      setPricesLoading(false);
    }
  }, [prices, pricesLoading]);

  const setCategory = useCallback((cat: CategoryKey) => {
    setActiveCategory(cat);
    setTimelineFrom(null);
    setTimelineTo(null);
  }, []);

  const setTimeline = useCallback((from: TimelinePoint | null, to: TimelinePoint | null) => {
    setTimelineFrom(from);
    setTimelineTo(to);
  }, []);

  const resetTimeline = useCallback(() => {
    setTimelineFrom(null);
    setTimelineTo(null);
  }, []);

  const allMonths = useMemo(() => getMonthsForCategory(db, activeCategory), [db, activeCategory]);

  const filteredMonths = useMemo(() =>
    filterByTimeline(allMonths, timelineFrom, timelineTo),
    [allMonths, timelineFrom, timelineTo]
  );

  const value = useMemo(() => ({
    db, prices, loading, pricesLoading,
    activeCategory, setCategory,
    timelineFrom, timelineTo, setTimeline, resetTimeline,
    filteredMonths, allMonths,
    fetchPrices: fetchPricesData,
  }), [db, prices, loading, pricesLoading, activeCategory, setCategory, timelineFrom, timelineTo, setTimeline, resetTimeline, filteredMonths, allMonths, fetchPricesData]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
