import { useMemo } from 'react';
import { useData } from '@/context/DataContext';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface TopbarProps {
  title: string;
  subtitle?: string;
}

export default function Topbar({ title, subtitle }: TopbarProps) {
  const { allMonths, timelineFrom, timelineTo, setTimeline, resetTimeline } =
    useData();

  const hasMonths = allMonths.length > 0;

  const monthOptions = useMemo(
    () =>
      allMonths.map((m) => ({
        value: `${m.year}-${m.month}`,
        label: m.label,
        year: m.year,
        month: m.month,
      })),
    [allMonths]
  );

  const fromValue = timelineFrom
    ? `${timelineFrom.year}-${timelineFrom.month}`
    : '';

  const toValue = timelineTo
    ? `${timelineTo.year}-${timelineTo.month}`
    : '';

  const handleFromChange = (val: string) => {
    const [y, m] = val.split('-').map(Number);
    setTimeline({ year: y, month: m }, timelineTo);
  };

  const handleToChange = (val: string) => {
    const [y, m] = val.split('-').map(Number);
    setTimeline(timelineFrom, { year: y, month: m });
  };

  const handlePreset = (preset: 'lastMonth' | 'thisYear' | 'lastYear' | 'all') => {
    if (!hasMonths) return;

    const now = new Date();
    const currentYear = now.getFullYear();

    switch (preset) {
      case 'lastMonth': {
        const last = allMonths[allMonths.length - 1];
        if (last) {
          const point = { year: last.year, month: last.month };
          setTimeline(point, point);
        }
        break;
      }
      case 'thisYear': {
        const latest = allMonths[allMonths.length - 1];
        setTimeline(
          { year: currentYear, month: 1 },
          latest ? { year: latest.year, month: latest.month } : null
        );
        break;
      }
      case 'lastYear': {
        const prevYear = currentYear - 1;
        setTimeline(
          { year: prevYear, month: 1 },
          { year: prevYear, month: 12 }
        );
        break;
      }
      case 'all':
        resetTimeline();
        break;
    }
  };

  return (
    <div className="sticky top-0 z-40 bg-background/80 backdrop-blur border-b px-6 py-3">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Left: title */}
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>

        {/* Right: timeline controls */}
        {hasMonths && (
          <div className="flex flex-wrap items-center gap-2">
            {/* From */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">From</span>
              <Select value={fromValue} onValueChange={handleFromChange}>
                <SelectTrigger className="h-8 w-[140px] text-xs">
                  <SelectValue placeholder="Start" />
                </SelectTrigger>
                <SelectContent>
                  {monthOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} className="text-xs">
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* To */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">To</span>
              <Select value={toValue} onValueChange={handleToChange}>
                <SelectTrigger className="h-8 w-[140px] text-xs">
                  <SelectValue placeholder="End" />
                </SelectTrigger>
                <SelectContent>
                  {monthOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} className="text-xs">
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Presets */}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs"
                onClick={() => handlePreset('lastMonth')}
              >
                Last month
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs"
                onClick={() => handlePreset('thisYear')}
              >
                This year
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs"
                onClick={() => handlePreset('lastYear')}
              >
                Last year
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs"
                onClick={() => handlePreset('all')}
              >
                All
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
