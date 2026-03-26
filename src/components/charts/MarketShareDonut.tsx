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
import { Doughnut } from 'react-chartjs-2';
import { colorFor } from '@/lib/colors';

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

interface MarketShareDonutProps {
  data: [string, number][];
  maxSlices?: number;
  height?: number;
}

export default function MarketShareDonut({
  data,
  maxSlices = 10,
  height = 300,
}: MarketShareDonutProps) {
  const top = data.slice(0, maxSlices);
  const rest = data.slice(maxSlices);
  const othersTotal = rest.reduce((sum, [, count]) => sum + count, 0);

  const sliceLabels = top.map(([make]) => make);
  const sliceValues = top.map(([, count]) => count);
  const sliceColors = top.map(([make], idx) => colorFor(make, idx));

  if (othersTotal > 0) {
    sliceLabels.push('Others');
    sliceValues.push(othersTotal);
    sliceColors.push('#d1d5db');
  }

  const total = sliceValues.reduce((sum, v) => sum + v, 0);

  const chartData = {
    labels: sliceLabels,
    datasets: [
      {
        data: sliceValues,
        backgroundColor: sliceColors,
        borderColor: '#ffffff',
        borderWidth: 2,
        hoverOffset: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '60%',
    plugins: {
      legend: {
        display: true,
        position: 'right' as const,
        labels: {
          font: { family: 'DM Mono', size: 11 },
          color: '#6b7280',
          padding: 12,
          usePointStyle: true,
          pointStyleWidth: 8,
        },
      },
      tooltip: {
        backgroundColor: '#fff',
        titleColor: '#1a1f2e',
        bodyColor: '#4b5563',
        borderColor: '#dde1e8',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12,
        titleFont: { family: 'DM Sans', size: 13, weight: 600 as const },
        bodyFont: { family: 'DM Mono', size: 12 },
        callbacks: {
          label: (ctx: any) => {
            const value = ctx.parsed as number;
            const pct = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
            return ` ${ctx.label}: ${value.toLocaleString()} (${pct}%)`;
          },
        },
      },
    },
  };

  return (
    <div style={{ height }}>
      <Doughnut data={chartData} options={options} />
    </div>
  );
}
