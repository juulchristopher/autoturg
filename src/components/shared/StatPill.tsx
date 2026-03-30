import * as React from 'react';
import { motion } from 'framer-motion';
import { Info } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface StatPillProps {
  label: string;
  value: string | number;
  color?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  tooltip?: React.ReactNode;
}

export default function StatPill({
  label,
  value,
  color = '#c8960a',
  subtitle,
  icon,
  tooltip,
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
        <div className="absolute right-3 top-3 flex items-center gap-1.5">
          {tooltip && (
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3.5 w-3.5 text-muted-foreground/50 hover:text-muted-foreground cursor-default transition-colors" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs text-xs leading-relaxed">
                  {tooltip}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {icon && (
            <span className="text-muted-foreground/40">{icon}</span>
          )}
        </div>
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
