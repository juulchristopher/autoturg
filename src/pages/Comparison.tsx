import { useState, useMemo, useCallback } from 'react';
import { useData } from '@/context/DataContext';
import {
  makeOptionsWithCounts,
  modelOptionsWithCounts,
  variantOptionsWithCounts,
  modelMonthSeries,
  prodYearDistribution,
} from '@/lib/data-utils';
import { COLORS } from '@/lib/colors';
import { ComparisonSlot } from '@/types';
import { computeDepreciation } from '@/lib/price-utils';
import Topbar from '@/components/layout/Topbar';
import CategoryTabs from '@/components/shared/CategoryTabs';
import ChartCard from '@/components/shared/ChartCard';
import TrendLineChart from '@/components/charts/TrendLineChart';
import MonthlyBarChart from '@/components/charts/MonthlyBarChart';
import DepreciationChart from '@/components/charts/DepreciationChart';
import VehicleCombobox from '@/components/shared/VehicleCombobox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { X, Plus, Download, BarChart3 } from 'lucide-react';

const MAX_SLOTS = 5;

function slotLabel(s: ComparisonSlot): string {
  return [s.make, s.model, s.variant].filter(Boolean).join(' ');
}

export default function Comparison() {
  const { filteredMonths, activeCategory, loading, prices } = useData();
  const months = filteredMonths;

  const [slots, setSlots] = useState<(ComparisonSlot | null)[]>([null, null]);
  const [visibleCount, setVisibleCount] = useState(2);

  const makeOpts = useMemo(() => makeOptionsWithCounts(months), [months]);

  const updateSlot = useCallback(
    (idx: number, update: Partial<ComparisonSlot>) => {
      setSlots((prev) => {
        const next = [...prev];
        const current = next[idx] || { make: '', model: '', variant: '' };
        next[idx] = { ...current, ...update };
        return next;
      });
    },
    []
  );

  const clearSlot = useCallback(
    (idx: number) => {
      setSlots((prev) => {
        const next = [...prev];
        next[idx] = null;
        return next;
      });
    },
    []
  );

  const addSlot = useCallback(() => {
    if (visibleCount >= MAX_SLOTS) return;
    setSlots((prev) => [...prev, null]);
    setVisibleCount((c) => c + 1);
  }, [visibleCount]);

  const activeSlots = useMemo(
    () =>
      slots
        .map((s, i) => (s && s.make ? { slot: s, idx: i } : null))
        .filter(Boolean) as { slot: ComparisonSlot; idx: number }[],
    [slots]
  );

  // Labels
  const labels = months.map((m) => m.label);

  // Trend line datasets
  const trendDatasets = useMemo(
    () =>
      activeSlots.map(({ slot, idx }) => ({
        label: slotLabel(slot),
        data: modelMonthSeries(
          months,
          slot.make,
          slot.model || '',
          slot.variant || undefined
        ),
        color: COLORS[idx % COLORS.length],
      })),
    [activeSlots, months]
  );

  // Production year datasets (grouped bar)
  const prodYearData = useMemo(() => {
    const allYears = new Set<number>();
    const slotMaps = activeSlots.map(({ slot }) => {
      const dist = prodYearDistribution(
        months,
        slot.make,
        slot.model || '',
        slot.variant || undefined
      );
      dist.forEach((_, y) => allYears.add(y));
      return dist;
    });

    const sortedYears = Array.from(allYears).sort((a, b) => a - b);
    const yearLabels = sortedYears.map(String);

    const datasets = activeSlots.map(({ slot, idx }, i) => ({
      label: slotLabel(slot),
      data: sortedYears.map((y) => slotMaps[i].get(y) || 0),
      color: COLORS[idx % COLORS.length],
    }));

    return { labels: yearLabels, datasets };
  }, [activeSlots, months]);

  // Summary data
  const summaryData = useMemo(
    () =>
      activeSlots.map(({ slot, idx }) => {
        const series = modelMonthSeries(
          months,
          slot.make,
          slot.model || '',
          slot.variant || undefined
        );
        const totalTx = series.reduce((s, v) => s + v, 0);
        const avgMonth =
          series.length > 0 ? Math.round(totalTx / series.length) : 0;
        const peakVol = Math.max(...series, 0);
        const peakIdx = series.indexOf(peakVol);
        const peakMonth = peakIdx >= 0 ? labels[peakIdx] || '--' : '--';

        return {
          label: slotLabel(slot),
          color: COLORS[idx % COLORS.length],
          totalTx,
          avgMonth,
          peakMonth,
          peakVol,
        };
      }),
    [activeSlots, months, labels]
  );

  // Depreciation datasets
  const depreciationDatasets = useMemo(() => {
    if (!prices) return [];
    return activeSlots
      .map(({ slot, idx }) => {
        if (!slot.model) return null;
        const dep = computeDepreciation(prices, slot.make, slot.model);
        if (!dep || dep.dataPoints.length < 3) return null;
        return {
          label: `${slot.make} ${slot.model}`,
          dataPoints: dep.dataPoints,
          color: COLORS[idx % COLORS.length],
        };
      })
      .filter(Boolean) as {
      label: string;
      dataPoints: {
        ageYears: number;
        medianPrice: number;
        p25Price: number;
        p75Price: number;
      }[];
      color: string;
    }[];
  }, [activeSlots, prices]);

  // By-year table data
  const byYearTable = useMemo(() => {
    const allYears = new Set<number>();
    const slotMaps = activeSlots.map(({ slot }) => {
      const dist = prodYearDistribution(
        months,
        slot.make,
        slot.model || '',
        slot.variant || undefined
      );
      dist.forEach((_, y) => allYears.add(y));
      return dist;
    });

    const sortedYears = Array.from(allYears).sort((a, b) => b - a);
    return { years: sortedYears, slotMaps };
  }, [activeSlots, months]);

  // CSV export
  function exportCSV() {
    const filled = activeSlots.map(({ slot }) => slot);
    if (filled.length === 0) return;

    const headers = [
      'Month',
      ...filled.map((s) =>
        [s.make, s.model, s.variant].filter(Boolean).join(' ')
      ),
    ];
    const rows = months.map((m) => {
      const cols = filled.map((s) =>
        m.rows
          .filter(
            (r) =>
              r.make === s.make &&
              (!s.model || r.model === s.model) &&
              (!s.variant || r.variant === s.variant)
          )
          .reduce((sum, r) => sum + r.count, 0)
      );
      return [m.label, ...cols];
    });
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `autoturg-comparison-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <main className="flex-1 overflow-y-auto">
        <Topbar title="Model Comparison" />
        <CategoryTabs />
        <div className="px-6 py-6 space-y-6">
          <Skeleton className="h-48 rounded-lg" />
          <Skeleton className="h-80 rounded-lg" />
        </div>
      </main>
    );
  }

  if (months.length === 0) {
    return (
      <main className="flex-1 overflow-y-auto">
        <Topbar title="Model Comparison" />
        <CategoryTabs />
        <div className="px-6 py-20 text-center">
          <p className="text-muted-foreground text-sm">
            No data available for the selected category.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-y-auto">
      <Topbar title="Model Comparison" subtitle="Compare up to 5 models side by side" />
      <CategoryTabs />

      <div className="px-6 py-6 space-y-6">
        {/* Model picker */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Select Models</CardTitle>
              <div className="flex items-center gap-2">
                {activeSlots.length > 0 && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1.5"
                      onClick={exportCSV}
                    >
                      <Download className="h-3.5 w-3.5" />
                      Export CSV
                    </Button>
                  </>
                )}
                {visibleCount < MAX_SLOTS && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5"
                    onClick={addSlot}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add slot
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {slots.slice(0, visibleCount).map((slot, idx) => {
                const modelOpts = slot?.make
                  ? modelOptionsWithCounts(months, slot.make)
                  : [];
                const variantOpts =
                  slot?.make && slot?.model
                    ? variantOptionsWithCounts(months, slot.make, slot.model)
                    : [];

                return (
                  <Card
                    key={idx}
                    className="relative overflow-hidden"
                    style={{ borderTop: `3px solid ${COLORS[idx % COLORS.length]}` }}
                  >
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">
                          Slot {idx + 1}
                        </span>
                        {slot && slot.make && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => clearSlot(idx)}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>

                      <VehicleCombobox
                        placeholder="Make"
                        options={makeOpts}
                        value={slot?.make || ''}
                        onSelect={(v) =>
                          updateSlot(idx, { make: v, model: '', variant: '' })
                        }
                      />
                      <VehicleCombobox
                        placeholder="Model"
                        options={modelOpts}
                        value={slot?.model || ''}
                        onSelect={(v) =>
                          updateSlot(idx, { model: v, variant: '' })
                        }
                        disabled={!slot?.make}
                      />
                      <VehicleCombobox
                        placeholder="Variant"
                        options={variantOpts}
                        value={slot?.variant || ''}
                        onSelect={(v) => updateSlot(idx, { variant: v })}
                        disabled={!slot?.make || !slot?.model}
                        allLabel="All variants"
                      />
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Charts section - only if slots are filled */}
        {activeSlots.length > 0 && (
          <>
            {/* Trend chart */}
            <ChartCard
              title="Monthly Transaction Volume"
              subtitle="Selected models over time"
            >
              <TrendLineChart
                labels={labels}
                datasets={trendDatasets}
                yLabel="Transactions"
                height={320}
              />
            </ChartCard>

            {/* Production year bar chart */}
            {prodYearData.labels.length > 0 && (
              <ChartCard
                title="Transactions by Production Year"
                subtitle="Grouped by model"
              >
                <MonthlyBarChart
                  labels={prodYearData.labels}
                  datasets={prodYearData.datasets}
                  yLabel="Transactions"
                  height={300}
                />
              </ChartCard>
            )}

            {/* Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {summaryData.map((d, i) => (
                <Card
                  key={i}
                  className="overflow-hidden"
                  style={{ borderLeft: `3px solid ${d.color}` }}
                >
                  <CardContent className="p-4">
                    <p className="text-xs font-medium text-muted-foreground truncate">
                      {d.label}
                    </p>
                    <p className="text-2xl font-bold font-mono tabular-nums mt-1">
                      {d.totalTx.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      total transactions
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Transaction summary table */}
            <ChartCard title="Transaction Summary" subtitle="Key metrics per selection">
              <div className="overflow-x-auto -mx-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Make / Model</TableHead>
                      <TableHead className="text-right">Total Tx</TableHead>
                      <TableHead className="text-right">Avg/Month</TableHead>
                      <TableHead>Peak Month</TableHead>
                      <TableHead className="text-right">Peak Vol</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {summaryData.map((d, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div
                              className="h-3 w-3 rounded-full shrink-0"
                              style={{ backgroundColor: d.color }}
                            />
                            <span className="font-medium text-sm truncate">
                              {d.label}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm tabular-nums">
                          {d.totalTx.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm tabular-nums">
                          {d.avgMonth.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-sm">
                          {d.peakMonth}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm tabular-nums">
                          {d.peakVol.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </ChartCard>

            {/* By-year table */}
            {byYearTable.years.length > 0 && (
              <ChartCard title="By Production Year" subtitle="Transaction count per year">
                <div className="overflow-x-auto -mx-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Year</TableHead>
                        {activeSlots.map(({ slot, idx }) => (
                          <TableHead key={idx} className="text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <div
                                className="h-2.5 w-2.5 rounded-full shrink-0"
                                style={{
                                  backgroundColor: COLORS[idx % COLORS.length],
                                }}
                              />
                              <span className="truncate max-w-[120px]">
                                {slotLabel(slot)}
                              </span>
                            </div>
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {byYearTable.years.map((year) => (
                        <TableRow key={year}>
                          <TableCell className="font-mono text-sm">
                            {year}
                          </TableCell>
                          {byYearTable.slotMaps.map((m, i) => (
                            <TableCell
                              key={i}
                              className="text-right font-mono text-sm tabular-nums"
                            >
                              {(m.get(year) || 0).toLocaleString()}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </ChartCard>
            )}

            {/* Depreciation chart */}
            {depreciationDatasets.length > 0 && (
              <ChartCard
                title="Depreciation Comparison"
                subtitle="Median price by vehicle age (years)"
              >
                <DepreciationChart
                  datasets={depreciationDatasets}
                  height={320}
                />
              </ChartCard>
            )}
          </>
        )}

        {/* Empty state when no slots filled */}
        {activeSlots.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <BarChart3 className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground text-sm">
              Select at least one make above to start comparing.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
