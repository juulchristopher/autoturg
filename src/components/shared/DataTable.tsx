import * as React from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Column<T> {
  key: string;
  header: string;
  render: (item: T, index: number) => React.ReactNode;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  defaultSortKey?: string;
  defaultSortDir?: 'asc' | 'desc';
  className?: string;
}

export default function DataTable<T>({
  columns,
  data,
  defaultSortKey,
  defaultSortDir = 'desc',
  className,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = React.useState<string | undefined>(defaultSortKey);
  const [sortDir, setSortDir] = React.useState<'asc' | 'desc'>(defaultSortDir);

  const handleSort = React.useCallback(
    (key: string) => {
      if (sortKey === key) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortKey(key);
        setSortDir('desc');
      }
    },
    [sortKey]
  );

  const sortedData = React.useMemo(() => {
    if (!sortKey) return data;

    const col = columns.find((c) => c.key === sortKey);
    if (!col) return data;

    return [...data].sort((a, b) => {
      const aVal = col.render(a, 0);
      const bVal = col.render(b, 0);

      // Extract sortable values
      const aNum = typeof aVal === 'number' ? aVal : typeof aVal === 'string' ? aVal : String(aVal ?? '');
      const bNum = typeof bVal === 'number' ? bVal : typeof bVal === 'string' ? bVal : String(bVal ?? '');

      let comparison = 0;
      if (typeof aNum === 'number' && typeof bNum === 'number') {
        comparison = aNum - bNum;
      } else {
        comparison = String(aNum).localeCompare(String(bNum));
      }

      return sortDir === 'asc' ? comparison : -comparison;
    });
  }, [data, sortKey, sortDir, columns]);

  const alignClass = (align?: 'left' | 'center' | 'right') => {
    switch (align) {
      case 'center':
        return 'text-center';
      case 'right':
        return 'text-right';
      default:
        return 'text-left';
    }
  };

  const SortIcon = ({ colKey }: { colKey: string }) => {
    if (sortKey !== colKey) return <ArrowUpDown className="ml-1 h-3 w-3 inline opacity-40" />;
    if (sortDir === 'asc') return <ArrowUp className="ml-1 h-3 w-3 inline text-primary" />;
    return <ArrowDown className="ml-1 h-3 w-3 inline text-primary" />;
  };

  return (
    <div className={cn('overflow-x-auto rounded-md border', className)}>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {columns.map((col) => (
              <TableHead
                key={col.key}
                className={cn(
                  alignClass(col.align),
                  col.sortable && 'cursor-pointer select-none',
                  col.className
                )}
                onClick={col.sortable ? () => handleSort(col.key) : undefined}
              >
                {col.header}
                {col.sortable && <SortIcon colKey={col.key} />}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedData.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="h-24 text-center text-muted-foreground"
              >
                No data available.
              </TableCell>
            </TableRow>
          ) : (
            sortedData.map((item, idx) => (
              <TableRow
                key={idx}
                className={cn(idx % 2 === 1 && 'bg-muted/30')}
              >
                {columns.map((col) => (
                  <TableCell
                    key={col.key}
                    className={cn(alignClass(col.align), col.className)}
                  >
                    {col.render(item, idx)}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export type { Column, DataTableProps };
