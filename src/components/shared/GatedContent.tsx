import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGate } from '@/hooks/useGate';
import type { UserTier } from '@/types';

interface GatedContentProps {
  /** Minimum tier required to view the content. */
  requires: UserTier;
  children: ReactNode;
  /** Short label shown on the upgrade overlay, e.g. "Pricing Intelligence" */
  featureLabel?: string;
  /** How many blurred preview lines to show (default 3). Set 0 to hide preview. */
  previewLines?: number;
}

/**
 * Wraps content that requires a paid tier.
 * - Subscribers see the content normally.
 * - Free users see a blurred preview + upgrade CTA.
 */
export default function GatedContent({
  requires,
  children,
  featureLabel = 'Pro feature',
  previewLines = 3,
}: GatedContentProps) {
  const { canAccess, loading } = useGate();
  const navigate = useNavigate();

  // While auth is loading, render a skeleton-like placeholder
  if (loading) {
    return (
      <div className="space-y-2 animate-pulse">
        {Array.from({ length: previewLines || 3 }).map((_, i) => (
          <div key={i} className="h-8 rounded bg-muted" />
        ))}
      </div>
    );
  }

  // User has access — render normally
  if (canAccess(requires)) {
    return <>{children}</>;
  }

  // Free user — blurred preview + overlay
  return (
    <div className="relative rounded-xl overflow-hidden">
      {/* Blurred content preview */}
      {previewLines > 0 && (
        <div
          className="pointer-events-none select-none"
          style={{ filter: 'blur(6px)', opacity: 0.45 }}
          aria-hidden
        >
          {children}
        </div>
      )}

      {/* Overlay */}
      <div
        className={`
          ${previewLines > 0 ? 'absolute inset-0' : 'py-12'}
          flex flex-col items-center justify-center gap-3
          bg-background/70 backdrop-blur-sm
          rounded-xl border border-primary/20
        `}
      >
        <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10">
          <Crown className="h-5 w-5 text-primary" />
        </div>
        <div className="text-center px-4">
          <p className="text-sm font-semibold">{featureLabel}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Available on the Pro plan
          </p>
        </div>
        <Button
          size="sm"
          className="gap-1.5 mt-1"
          onClick={() => navigate('/pricing')}
        >
          <Lock className="h-3.5 w-3.5" />
          Upgrade to Pro
        </Button>
      </div>
    </div>
  );
}
