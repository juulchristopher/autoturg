import * as React from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatPillProps {
  label: string;
  value: string | number;
  color?: string;
  subtitle?: string;
  icon?: React.ReactNode;
}

export default function StatPill({
  label,
  value,
  color = '#c8960a',
  subtitle,
  icon,
}: StatPillProps) {
  return (
    <Card
      className={cn('relative overflow-hidden p-4')}
      style={{ borderLeft: `3px solid ${color}` }}
    >
      {icon && (
        <div className="absolute right-3 top-3 text-muted-foreground/40">
          {icon}
        </div>
      )}
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold font-mono tabular-nums">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
      {subtitle && (
        <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
      )}
    </Card>
  );
}
