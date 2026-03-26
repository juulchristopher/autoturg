import * as React from 'react';
import { Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InsightCardProps {
  children: React.ReactNode;
  icon?: React.ReactNode;
}

export default function InsightCard({ children, icon }: InsightCardProps) {
  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-lg border-l-[3px] border-l-primary px-4 py-3'
      )}
      style={{ backgroundColor: 'rgba(200,150,10,0.06)' }}
    >
      <div className="mt-0.5 shrink-0 text-primary">
        {icon ?? <Lightbulb className="h-4 w-4" />}
      </div>
      <div className="text-sm leading-relaxed">{children}</div>
    </div>
  );
}
