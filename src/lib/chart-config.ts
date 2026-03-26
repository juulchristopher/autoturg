import { ChartOptions } from 'chart.js';

export function baseChartOptions(opts: {
  yLabel?: string;
  showLegend?: boolean;
  barMode?: boolean;
  stacked?: boolean;
  horizontal?: boolean;
}): ChartOptions<any> {
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        display: opts.showLegend ?? false,
        position: 'top' as const,
        labels: {
          font: { family: 'DM Mono', size: 11 },
          color: '#6b7280',
          padding: 16,
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
        titleFont: { family: 'DM Sans', size: 13, weight: '600' as const },
        bodyFont: { family: 'DM Mono', size: 12 },
        callbacks: opts.barMode ? undefined : {
          label: (ctx: any) => ` ${ctx.dataset.label}: ${ctx.parsed.y?.toLocaleString() ?? ctx.parsed.x?.toLocaleString()}`,
        },
      },
    },
    scales: {
      x: {
        stacked: opts.stacked,
        grid: { color: 'rgba(0,0,0,0.04)' },
        ticks: { font: { family: 'DM Mono', size: 11 }, color: '#9ca3af' },
      },
      y: {
        stacked: opts.stacked,
        grid: { color: 'rgba(0,0,0,0.04)' },
        title: opts.yLabel ? { display: true, text: opts.yLabel, color: '#9ca3af', font: { family: 'DM Sans', size: 12 } } : undefined,
        ticks: {
          font: { family: 'DM Mono', size: 11 },
          color: '#9ca3af',
          callback: (val: any) => typeof val === 'number' ? val.toLocaleString() : val,
        },
      },
    },
  };
}
