import React from 'react';

interface PriceBoxPlotProps {
  min: number;
  p25: number;
  median: number;
  p75: number;
  max: number;
  checkedPrice?: number;
  className?: string;
}

export default function PriceBoxPlot({
  min,
  p25,
  median,
  p75,
  max,
  checkedPrice,
  className = '',
}: PriceBoxPlotProps) {
  const range = max - min;

  function percentPos(value: number): number {
    if (range === 0) return 50;
    return ((value - min) / range) * 100;
  }

  // Classify checked price relative to IQR
  function classifyPrice(price: number): 'low' | 'fair' | 'high' {
    if (price < p25) return 'low';
    if (price > p75) return 'high';
    return 'fair';
  }

  const markerColorMap: Record<string, string> = {
    low: '#16a34a',   // green - good deal
    fair: '#c8960a',  // gold - fair price
    high: '#dc2626',  // red - expensive
  };

  const p25Pos = percentPos(p25);
  const p75Pos = percentPos(p75);
  const medianPos = percentPos(median);
  const iqrWidth = p75Pos - p25Pos;

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Box plot container */}
      <div className="relative h-16 w-full bg-muted rounded-lg overflow-hidden">
        {/* Whisker line: min to max */}
        <div
          className="absolute top-1/2 -translate-y-1/2 h-0.5 bg-gray-400"
          style={{ left: '2%', right: '2%' }}
        />

        {/* IQR box */}
        <div
          className="absolute top-2 bottom-2 rounded"
          style={{
            left: `${clamp(p25Pos, 0, 100)}%`,
            width: `${clamp(iqrWidth, 0, 100 - p25Pos)}%`,
            backgroundColor: 'rgba(200, 150, 10, 0.25)',
            border: '1px solid rgba(200, 150, 10, 0.5)',
          }}
        />

        {/* Median line */}
        <div
          className="absolute top-2 bottom-2 w-0.5"
          style={{
            left: `${clamp(medianPos, 0, 100)}%`,
            backgroundColor: '#c8960a',
          }}
        />

        {/* Min whisker cap */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-px h-4 bg-gray-400"
          style={{ left: `${percentPos(min)}%` }}
        />

        {/* Max whisker cap */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-px h-4 bg-gray-400"
          style={{ left: `${percentPos(max)}%` }}
        />

        {/* Checked price marker (triangle) */}
        {checkedPrice != null && (
          <div
            className="absolute bottom-0"
            style={{
              left: `${clamp(percentPos(checkedPrice), 0, 100)}%`,
              transform: 'translateX(-50%)',
            }}
          >
            <div
              style={{
                width: 0,
                height: 0,
                borderLeft: '6px solid transparent',
                borderRight: '6px solid transparent',
                borderBottom: `10px solid ${markerColorMap[classifyPrice(checkedPrice)]}`,
              }}
            />
          </div>
        )}
      </div>

      {/* Labels */}
      <div className="relative w-full h-5">
        <PosLabel value={min} pos={percentPos(min)} label={formatCurrency(min)} />
        <PosLabel value={p25} pos={p25Pos} label={`P25: ${formatCurrency(p25)}`} />
        <PosLabel value={median} pos={medianPos} label={`Med: ${formatCurrency(median)}`} />
        <PosLabel value={p75} pos={p75Pos} label={`P75: ${formatCurrency(p75)}`} />
        <PosLabel value={max} pos={percentPos(max)} label={formatCurrency(max)} />
      </div>
    </div>
  );
}

function PosLabel({ pos, label }: { value: number; pos: number; label: string }) {
  return (
    <span
      className="absolute font-mono text-xs text-muted-foreground whitespace-nowrap"
      style={{
        left: `${clamp(pos, 0, 100)}%`,
        transform: 'translateX(-50%)',
      }}
    >
      {label}
    </span>
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function formatCurrency(value: number): string {
  return `\u20AC${value.toLocaleString()}`;
}
