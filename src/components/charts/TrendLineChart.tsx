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

interface TrendLineChartProps {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    color: string;
  }[];
  yLabel?: string;
  height?: number;
}

export default function TrendLineChart({
  labels,
  datasets,
  yLabel,
  height = 300,
}: TrendLineChartProps) {
  const isSingle = datasets.length === 1;

  const chartData = {
    labels,
    datasets: datasets.map((ds) => {
      // Parse the color to extract r,g,b for the fill alpha
      const fillColor = hexToRgba(ds.color, 0.1);
      return {
        label: ds.label,
        data: ds.data,
        borderColor: ds.color,
        backgroundColor: fillColor,
        borderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 6,
        tension: 0.3,
        fill: isSingle,
      };
    }),
  };

  const options = baseChartOptions({
    yLabel,
    showLegend: datasets.length > 1,
  });

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
