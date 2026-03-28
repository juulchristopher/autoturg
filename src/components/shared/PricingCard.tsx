import { Check, Crown, Zap, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { UserTier } from '@/types';

interface PricingFeature {
  text: string;
  included: boolean;
}

interface PricingCardProps {
  tier: 'free' | 'pro' | 'report';
  currentTier: UserTier;
  onAction: () => void;
  actionLoading?: boolean;
  /** For report card: which make/model this report is for */
  reportLabel?: string;
}

const FREE_FEATURES: PricingFeature[] = [
  { text: 'Market overview by make', included: true },
  { text: 'Monthly transaction trends', included: true },
  { text: 'Top makes ranking', included: true },
  { text: 'Side-by-side make comparison', included: true },
  { text: 'VIN decoder', included: true },
  { text: 'Model-level pricing insights', included: false },
  { text: 'Depreciation curves per model', included: false },
  { text: 'Price band analysis', included: false },
  { text: 'Market timing indicators', included: false },
];

const PRO_FEATURES: PricingFeature[] = [
  { text: 'Everything in Free', included: true },
  { text: 'Model-level pricing insights', included: true },
  { text: 'Depreciation curves per model', included: true },
  { text: 'Price band analysis (p25/p75)', included: true },
  { text: 'Market timing indicators', included: true },
  { text: 'Unlimited make/model comparisons', included: true },
  { text: 'Export data as CSV', included: true },
  { text: 'Priority data updates', included: true },
];

const REPORT_FEATURES: PricingFeature[] = [
  { text: 'Full model price history', included: true },
  { text: 'Depreciation curve + retention %', included: true },
  { text: 'Price distribution analysis', included: true },
  { text: 'Best time to buy/sell signal', included: true },
  { text: 'Comparable models snapshot', included: true },
  { text: 'Downloadable PDF report', included: true },
  { text: 'One-time purchase, keep forever', included: true },
];

export default function PricingCard({
  tier,
  currentTier,
  onAction,
  actionLoading = false,
  reportLabel,
}: PricingCardProps) {
  const isFree = tier === 'free';
  const isPro = tier === 'pro';
  const isReport = tier === 'report';

  const isCurrentPlan = (isPro && currentTier === 'subscriber') || (isFree && currentTier === 'free');
  const isHighlighted = isPro;

  const features = isFree ? FREE_FEATURES : isPro ? PRO_FEATURES : REPORT_FEATURES;

  const title = isFree ? 'Free' : isPro ? 'Pro' : 'Report';
  const price = isFree ? '€0' : isPro ? '€9' : '€4.90';
  const period = isFree ? 'forever' : isPro ? '/ month' : 'one-off';
  const description = isFree
    ? 'Market-level stats for everyone'
    : isPro
      ? 'Deep model insights for active buyers'
      : reportLabel
        ? `Full analysis for ${reportLabel}`
        : 'Full analysis for any single model';

  const ctaLabel = isFree
    ? 'Current plan'
    : isPro
      ? isCurrentPlan
        ? 'Your plan'
        : 'Subscribe'
      : 'Buy report';

  const Icon = isFree ? Zap : isPro ? Crown : FileText;

  return (
    <div
      className={cn(
        'relative flex flex-col rounded-xl border p-6 transition-shadow',
        isHighlighted
          ? 'border-primary bg-primary/[0.03] shadow-lg shadow-primary/10'
          : 'border-border bg-card',
      )}
    >
      {isHighlighted && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="rounded-full bg-primary px-3 py-0.5 text-xs font-semibold text-primary-foreground">
            Most popular
          </span>
        </div>
      )}

      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Icon className={cn('h-4 w-4', isHighlighted ? 'text-primary' : 'text-muted-foreground')} />
          <span className={cn('text-sm font-semibold', isHighlighted ? 'text-primary' : 'text-foreground')}>
            {title}
          </span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold tracking-tight">{price}</span>
          <span className="text-sm text-muted-foreground">{period}</span>
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground">{description}</p>
      </div>

      {/* CTA */}
      <Button
        variant={isHighlighted ? 'default' : 'outline'}
        size="sm"
        className="w-full mb-5"
        disabled={isCurrentPlan || actionLoading}
        onClick={onAction}
      >
        {actionLoading ? 'Opening...' : ctaLabel}
      </Button>

      {/* Features */}
      <ul className="flex-1 space-y-2.5">
        {features.map((f) => (
          <li key={f.text} className="flex items-start gap-2.5">
            <Check
              className={cn(
                'mt-0.5 h-3.5 w-3.5 shrink-0',
                f.included ? 'text-primary' : 'text-muted-foreground/30',
              )}
            />
            <span
              className={cn(
                'text-xs leading-relaxed',
                f.included ? 'text-foreground' : 'text-muted-foreground/50 line-through',
              )}
            >
              {f.text}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
