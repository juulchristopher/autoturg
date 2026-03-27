import { useMemo } from 'react';
import { useData } from '@/context/DataContext';
import { CATEGORY_LABELS } from '@/lib/data-utils';
import { PageTransition, StaggerList, StaggerItem } from '@/lib/motion';
import Topbar from '@/components/layout/Topbar';
import CategoryTabs from '@/components/shared/CategoryTabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CalendarDays, ExternalLink, BarChart2 } from 'lucide-react';

const SKIP = ['KOKKU', 'TOTAL', 'ZUSAMMEN', 'SUM'];

export default function DataStatus() {
  const { filteredMonths, activeCategory, loading, db } = useData();
  const months = filteredMonths;

  const tableData = useMemo(
    () =>
      months.map((m) => ({
        label: m.label,
        rows: m.rows.length,
        totalTx: m.rows
          .filter((r) => !SKIP.includes(r.make))
          .reduce((s, r) => s + r.count, 0),
        sheet: m.sheetUsed || '\u2014',
      })),
    [months]
  );

  const totalTxAll = tableData.reduce((s, m) => s + m.totalTx, 0);
  const totalRows = tableData.reduce((s, m) => s + m.rows, 0);

  const officialRows = useMemo(() => {
    const stats = db.officialStats;
    if (!stats) return [];
    return Object.entries(stats)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, s]) => ({ month, ...s }));
  }, [db.officialStats]);

  if (loading) {
    return (
      <main className="flex-1 overflow-y-auto">
        <Topbar title="Data Status" />
        <CategoryTabs />
        <div className="px-6 py-6 space-y-6">
          <Skeleton className="h-20 rounded-lg" />
          <Skeleton className="h-96 rounded-lg" />
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-y-auto">
      <Topbar title="Data Status" subtitle="Data source overview and loaded months" />
      <CategoryTabs />

      <PageTransition>
        <StaggerList className="px-6 py-6 space-y-6">
        {/* Schedule banner */}
        <StaggerItem>
        <Card className="overflow-hidden" style={{ borderLeft: '3px solid #c8960a' }}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <CalendarDays className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium">
                  Data updates automatically on the 20th of each month via GitHub
                  Actions.
                </p>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                  Source:{' '}
                  <a
                    href="https://www.transpordiamet.ee"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    transpordiamet.ee
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        </StaggerItem>

        {/* Loaded months section */}
        <StaggerItem>
        <div>
          <div className="flex items-center gap-3 mb-4">
            <Badge variant="secondary" className="text-xs font-mono uppercase">
              {months.length} months &middot; {CATEGORY_LABELS[activeCategory]}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {totalRows.toLocaleString()} rows &middot;{' '}
              {totalTxAll.toLocaleString()} total transactions
            </span>
          </div>

          <Card>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Month</TableHead>
                    <TableHead className="text-right">Rows</TableHead>
                    <TableHead className="text-right">Total Tx</TableHead>
                    <TableHead>Sheet</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tableData.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="h-24 text-center text-muted-foreground"
                      >
                        No months loaded for this category.
                      </TableCell>
                    </TableRow>
                  ) : (
                    tableData.map((row) => (
                      <TableRow key={row.label}>
                        <TableCell className="font-medium text-sm">
                          {row.label}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm tabular-nums">
                          {row.rows.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm tabular-nums">
                          {row.totalTx.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground font-mono">
                          {row.sheet}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>

          {/* Summary footer */}
          {tableData.length > 0 && (
            <div className="flex items-center justify-end gap-4 mt-3 text-xs text-muted-foreground">
              <span>
                Avg rows/month:{' '}
                <span className="font-mono tabular-nums">
                  {Math.round(totalRows / tableData.length).toLocaleString()}
                </span>
              </span>
              <span>
                Avg tx/month:{' '}
                <span className="font-mono tabular-nums">
                  {Math.round(totalTxAll / tableData.length).toLocaleString()}
                </span>
              </span>
            </div>
          )}
        </div>
        </StaggerItem>

        {/* Official Statistikaamet market totals */}
        {officialRows.length > 0 && (
        <StaggerItem>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <BarChart2 className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm font-semibold">
                  Official Market Totals — Statistikaamet TS322
                </CardTitle>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Monthly passenger car first registrations in Estonia. Imported = total − new. Source:{' '}
                <a href="https://andmed.stat.ee/et/stat/TS322" target="_blank" rel="noopener noreferrer"
                   className="text-primary hover:underline inline-flex items-center gap-1">
                  andmed.stat.ee <ExternalLink className="h-3 w-3" />
                </a>
              </p>
            </CardHeader>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Month</TableHead>
                    <TableHead className="text-right">Total registered</TableHead>
                    <TableHead className="text-right">New cars</TableHead>
                    <TableHead className="text-right">Imported (est.)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {officialRows.map((row) => (
                    <TableRow key={row.month}>
                      <TableCell className="font-mono text-sm">{row.month}</TableCell>
                      <TableCell className="text-right font-mono text-sm tabular-nums">
                        {row.total.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm tabular-nums text-emerald-500">
                        {row.new.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm tabular-nums text-amber-500">
                        {row.imported.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </StaggerItem>
        )}

        </StaggerList>
      </PageTransition>
    </main>
  );
}
