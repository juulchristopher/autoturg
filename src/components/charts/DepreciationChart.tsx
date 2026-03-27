import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { baseChartOptions } from '@/lib/chart-config';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface DepreciationChartProps {
  datasets: {
    label: string;
    dataPoints: {
      ageYears: number;
      medianPrice: number;
      p25Price: number;
      p75Price: number;
    }[];
    color: string;
  }[];
  height?: number;
}

export default function DepreciationChart({
  datasets,
  height = 300,
}: DepreciationChartProps) {
  // Collect all unique age values across all datasets, sorted ascending
  const allAges = Array.from(
    new Set(datasets.flatMap((ds) => ds.dataPoints.map((dp) => dp.ageYears)))
  ).sort((a, b) => a - b);

  const labels = allAges.map((age) => String(age));

  // Build chart datasets: for each input dataset, create 3 lines (p75, median, p25)
  const chartDatasets: any[] = [];

  datasets.forEach((ds) => {
    // Build lookup map for quick access
    const lookup = new Map(
      ds.dataPoints.map((dp) => [dp.ageYears, dp])
    );

    const medianData = allAges.map((age) => lookup.get(age)?.medianPrice ?? null);
    const p75Data = allAges.map((age) => lookup.get(age)?.p75Price ?? null);
    const p25Data = allAges.map((age) => lookup.get(age)?.p25Price ?? null);

    // P75 line (top of band) - fills down to its paired P25 line
    chartDatasets.push({
      label: `${ds.label} P75`,
      data: p75Data,
      borderColor: hexToRgba(ds.color, 0.3),
      backgroundColor: hexToRgba(ds.color, 0.08),
      borderWidth: 1,
      borderDash: [4, 4],
      pointRadius: 0,
      pointHoverRadius: 0,
      tension: 0.3,
      fill: '+2', // fill to the P25 line (2 datasets ahead)
      _isBand: true,
    });

    // Median line (main visible line)
    chartDatasets.push({
      label: ds.label,
      data: medianData,
      borderColor: ds.color,
      backgroundColor: ds.color,
      borderWidth: 2.5,
      pointRadius: 3,
      pointHoverRadius: 6,
      tension: 0.3,
      fill: false,
      _isBand: false,
    });

    // P25 line (bottom of band)
    chartDatasets.push({
      label: `${ds.label} P25`,
      data: p25Data,
      borderColor: hexToRgba(ds.color, 0.3),
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderDash: [4, 4],
      pointRadius: 0,
      pointHoverRadius: 0,
      tension: 0.3,
      fill: false,
      _isBand: true,
    });
  });

  const base = baseChartOptions({
    yLabel: 'Price (\u20AC)',
    showLegend: true,
  });

  const options: ChartOptions<'line'> = {
    ...base,
    plugins: {
      ...base.plugins,
      legend: {
        ...((base.plugins?.legend as any) ?? {}),
        display: true,
        labels: {
          ...((base.plugins?.legend as any)?.labels ?? {}),
          font: { family: 'DM Mono', size: 11 },
          color: '#6b7280',
          padding: 16,
          usePointStyle: true,
          pointStyleWidth: 8,
          filter: (item: any) => {
            // Only show median lines in legend, not band lines
            const ds = chartDatasets[item.datasetIndex];
            return !ds?._isBand;
          },
        },
      },
      tooltip: {
        ...((base.plugins?.tooltip as any) ?? {}),
        filter: (item: any) => {
          // Only show median values in tooltip
          const ds = chartDatasets[item.datasetIndex];
          return !ds?._isBand;
        },
        callbacks: {
          label: (ctx: any) => {
            const value = ctx.parsed.y;
            if (value == null) return '';
            return ` ${ctx.dataset.label}: \u20AC${value.toLocaleString()}`;
          },
        },
      },
    },
    scales: {
      ...base.scales,
      x: {
        ...((base.scales as any)?.x ?? {}),
        title: {
          display: true,
          text: 'Vehicle Age (years)',
          color: '#9ca3af',
          font: { family: 'DM Sans', size: 12 },
        },
      },
      y: {
        ...((base.scales as any)?.y ?? {}),
        title: {
          display: true,
          text: 'Price (\u20AC)',
          color: '#9ca3af',
          font: { family: 'DM Sans', size: 12 },
        },
        ticks: {
          font: { family: 'DM Mono', size: 11 },
          color: '#9ca3af',
          callback: (val: any) =>
            typeof val === 'number' ? `\u20AC${val.toLocaleString()}` : val,
        },
      },
    },
  };

  const chartData = {
    labels,
    datasets: chartDatasets,
  };

  return (
    <div style={{ height }}>
      <Line data={chartData} options={options} />
    </div>
  );
}

function hexToRgba(hex: string, alpha: number): string {
  const cleaned = hex.replace('#', '');
  const r = parseInt(cleaned.substring(0, 2), 16);
  const g = parseInt(cleaned.substring(2, 4), 16);
  const b = parseInt(cleaned.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
