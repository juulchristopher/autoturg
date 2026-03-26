import * as React from 'react';
import { motion } from 'framer-motion';
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
    <motion.div
      whileHover={{ y: -2, boxShadow: '0 8px 24px -4px rgba(0,0,0,0.08)' }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      <Card
        className={cn('relative overflow-hidden p-4 transition-colors')}
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
    </motion.div>
  );
}
