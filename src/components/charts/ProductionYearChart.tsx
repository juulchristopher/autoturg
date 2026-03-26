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

interface ProductionYearChartProps {
  data: Map<number, number> | [number, number][];
  color?: string;
  height?: number;
}

export default function ProductionYearChart({
  data,
  color,
  height = 300,
}: ProductionYearChartProps) {
  const barColor = color || COLORS[0]; // default gold

  // Convert Map or array to sorted entries
  const entries: [number, number][] = data instanceof Map
    ? Array.from(data.entries())
    : [...data];

  entries.sort((a, b) => a[0] - b[0]);

  const labels = entries.map(([year]) => String(year));
  const values = entries.map(([, count]) => count);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Transactions',
        data: values,
        backgroundColor: hexToRgba(barColor, 0.85),
        borderColor: barColor,
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  const options = baseChartOptions({
    yLabel: 'Transactions',
    showLegend: false,
    barMode: true,
  });

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
