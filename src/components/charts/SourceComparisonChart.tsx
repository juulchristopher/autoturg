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
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { baseChartOptions } from '@/lib/chart-config';
import { COLORS } from '@/lib/colors';

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

interface SourceComparisonChartProps {
  data: { source: string; median: number; count: number }[];
  height?: number;
}

export default function SourceComparisonChart({
  data,
  height = 300,
}: SourceComparisonChartProps) {
  const labels = data.map((d) => d.source);
  const medians = data.map((d) => d.median);
  const counts = data.map((d) => d.count);
  const barColors = data.map((_, idx) => COLORS[idx % COLORS.length]);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Median Price',
        data: medians,
        backgroundColor: barColors.map((c) => hexToRgba(c, 0.85)),
        borderColor: barColors,
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  const base = baseChartOptions({
    showLegend: false,
    barMode: true,
    horizontal: true,
  });

  const options = {
    ...base,
    indexAxis: 'y' as const,
    plugins: {
      ...base.plugins,
      legend: {
        display: false,
      },
      tooltip: {
        ...((base.plugins?.tooltip as any) ?? {}),
        callbacks: {
          label: (ctx: any) => {
            const idx = ctx.dataIndex;
            const median = medians[idx];
            const count = counts[idx];
            return [
              ` Median: \u20AC${median.toLocaleString()}`,
              ` Listings: ${count.toLocaleString()}`,
            ];
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
          text: 'Median Price (\u20AC)',
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
      y: {
        ...((base.scales as any)?.y ?? {}),
        title: undefined,
        ticks: {
          font: { family: 'DM Mono', size: 11 },
          color: '#9ca3af',
        },
      },
    },
  };

  return (
    <div style={{ height }}>
      <Bar data={chartData} options={options} />
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
