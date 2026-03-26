import { useMemo } from 'react';
import { useData } from '@/context/DataContext';
import { CATEGORY_LABELS } from '@/lib/data-utils';
import { colorFor } from '@/lib/colors';
import { CategoryKey } from '@/types';
import Topbar from '@/components/layout/Topbar';
import CategoryTabs from '@/components/shared/CategoryTabs';
import StatPill from '@/components/shared/StatPill';
import InsightCard from '@/components/shared/InsightCard';
import ChartCard from '@/components/shared/ChartCard';
import TrendLineChart from '@/components/charts/TrendLineChart';
import MarketShareDonut from '@/components/charts/MarketShareDonut';
import MonthlyBarChart from '@/components/charts/MonthlyBarChart';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TrendingUp, Award, Activity, Layers } from 'lucide-react';

const SKIP = ['KOKKU', 'TOTAL', 'ZUSAMMEN', 'SUM'];

export default function Overview() {
  const { filteredMonths, activeCategory, loading, db } = useData();
  const months = filteredMonths;

  // Aggregate makes
  const { sortedMakes, total } = useMemo(() => {
    const makeMap = new Map<string, number>();
    months.forEach((m) =>
      m.rows.forEach((r) => {
        if (SKIP.includes(r.make)) return;
        makeMap.set(r.make, (makeMap.get(r.make) || 0) + r.count);
      })
    );
    const sorted = Array.from(makeMap.entries()).sort((a, b) => b[1] - a[1]);
    const t = sorted.reduce((s, [, v]) => s + v, 0);
    return { sortedMakes: sorted, total: t };
  }, [months]);

  const top5 = sortedMakes.slice(0, 5);

  // Line chart datasets
  const labels = months.map((m) => m.label);
  const lineDatasets = useMemo(
    () =>
      top5.map(([make], i) => ({
        label: make,
        data: months.map((m) =>
          m.rows
            .filter((r) => r.make === make)
            .reduce((s, r) => s + r.count, 0)
        ),
        color: colorFor(make, i),
      })),
    [top5, months]
  );

  // Bar chart datasets
  const barDatasets = useMemo(() => {
    if (activeCategory === 'koguTurg') {
      return (['jarelturg', 'newCars', 'imports'] as const).map((cat, i) => ({
        label: CATEGORY_LABELS[cat as CategoryKey],
        data: months.map((m) => {
          const catMonths = db[cat] || [];
          const match = catMonths.find(
            (cm) => cm.year === m.year && cm.month === m.month
          );
          return match
            ? match.rows
                .filter((r) => !SKIP.includes(r.make))
                .reduce((s, r) => s + r.count, 0)
            : 0;
        }),
        color: ['#c8960a', '#2563eb', '#16a34a'][i],
      }));
    }
    return [
      {
        label: 'Transactions',
        data: months.map((m) =>
          m.rows
            .filter((r) => !SKIP.includes(r.make))
            .reduce((s, r) => s + r.count, 0)
        ),
        color: '#c8960a',
      },
    ];
  }, [activeCategory, months, db]);

  // Stats
  const avgPerMonth =
    months.length > 0 ? Math.round(total / months.length) : 0;
  const uniqueMakesCount = sortedMakes.length;

  if (loading) {
    return (
      <main className="flex-1 overflow-y-auto">
        <Topbar title="Monthly Overview" />
        <CategoryTabs />
        <div className="px-6 py-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </div>
          <Skeleton className="h-80 rounded-lg" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-80 rounded-lg" />
            <Skeleton className="h-80 rounded-lg" />
          </div>
        </div>
      </main>
    );
  }

  if (months.length === 0) {
    return (
      <main className="flex-1 overflow-y-auto">
        <Topbar title="Monthly Overview" />
        <CategoryTabs />
        <div className="px-6 py-20 text-center">
          <p className="text-muted-foreground text-sm">
            No data available for the selected category and timeline.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-y-auto">
      <Topbar
        title="Monthly Overview"
        subtitle={`${CATEGORY_LABELS[activeCategory]} -- ${months.length} months loaded`}
      />
      <CategoryTabs />

      <div className="px-6 py-6 space-y-6">
        {/* Stats grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatPill
            label="Total Transactions"
            value={total}
            color="#c8960a"
            icon={<TrendingUp className="h-5 w-5" />}
          />
          <StatPill
            label="Top Make"
            value={top5[0]?.[0] || '--'}
            color="#2563eb"
            subtitle={
              top5[0]
                ? `${top5[0][1].toLocaleString()} tx (${((top5[0][1] / total) * 100).toFixed(1)}%)`
                : undefined
            }
            icon={<Award className="h-5 w-5" />}
          />
          <StatPill
            label="Avg / Month"
            value={avgPerMonth}
            color="#16a34a"
            icon={<Activity className="h-5 w-5" />}
          />
          <StatPill
            label="Unique Makes"
            value={uniqueMakesCount}
            color="#7c3aed"
            icon={<Layers className="h-5 w-5" />}
          />
        </div>

        {/* Insight card */}
        {sortedMakes.length >= 3 && (
          <InsightCard>
            <span
              dangerouslySetInnerHTML={{
                __html: `<strong>${top5[0][0]}</strong> leads the Estonian ${CATEGORY_LABELS[activeCategory].toLowerCase()} market with ${top5[0][1].toLocaleString()} transactions (${((top5[0][1] / total) * 100).toFixed(1)}%), followed by <strong>${top5[1][0]}</strong> and <strong>${top5[2][0]}</strong>.`,
              }}
            />
          </InsightCard>
        )}

        {/* Trend line chart - full width */}
        <ChartCard
          title="Top 5 Makes -- Monthly Trend"
          subtitle="Transaction volume over time"
          className="col-span-full"
        >
          <TrendLineChart
            labels={labels}
            datasets={lineDatasets}
            yLabel="Transactions"
            height={320}
          />
        </ChartCard>

        {/* Charts grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ChartCard title="Market Share" subtitle="Top makes by volume">
            <MarketShareDonut data={sortedMakes} maxSlices={10} height={300} />
          </ChartCard>

          <ChartCard
            title="Monthly Totals"
            subtitle={
              activeCategory === 'koguTurg'
                ? 'Stacked by category'
                : 'Total transactions per month'
            }
          >
            <MonthlyBarChart
              labels={labels}
              datasets={barDatasets}
              stacked={activeCategory === 'koguTurg'}
              yLabel="Transactions"
              height={300}
            />
          </ChartCard>
        </div>

        {/* Ranked makes table */}
        <ChartCard title="All Makes Ranked" subtitle="Sorted by transaction volume">
          <div className="overflow-x-auto -mx-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 text-center">#</TableHead>
                  <TableHead>Make</TableHead>
                  <TableHead className="text-right">Transactions</TableHead>
                  <TableHead className="text-right w-20">Share</TableHead>
                  <TableHead className="w-40 hidden sm:table-cell">
                    Distribution
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedMakes.map(([make, count], idx) => {
                  const pct = total > 0 ? (count / total) * 100 : 0;
                  const maxCount = sortedMakes[0]?.[1] || 1;
                  const barWidth = (count / maxCount) * 100;

                  return (
                    <TableRow key={make}>
                      <TableCell className="text-center font-mono text-xs text-muted-foreground">
                        {idx + 1}
                      </TableCell>
                      <TableCell className="font-medium text-sm">
                        {make}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm tabular-nums">
                        {count.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs text-muted-foreground tabular-nums">
                        {pct.toFixed(1)}%
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${barWidth}%`,
                              backgroundColor: colorFor(make, idx),
                            }}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </ChartCard>
      </div>
    </main>
  );
}
