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

interface MonthlyBarChartProps {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    color: string;
  }[];
  stacked?: boolean;
  yLabel?: string;
  height?: number;
}

export default function MonthlyBarChart({
  labels,
  datasets,
  stacked = false,
  yLabel,
  height = 300,
}: MonthlyBarChartProps) {
  const defaultColor = COLORS[0]; // gold

  const chartData = {
    labels,
    datasets: datasets.map((ds) => {
      const color = ds.color || defaultColor;
      return {
        label: ds.label,
        data: ds.data,
        backgroundColor: hexToRgba(color, 0.85),
        borderColor: color,
        borderWidth: 1,
        borderRadius: 4,
      };
    }),
  };

  const options = baseChartOptions({
    yLabel,
    showLegend: datasets.length > 1,
    barMode: true,
    stacked,
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
