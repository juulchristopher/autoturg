import { useState } from 'react';
import { Shield, RefreshCw } from 'lucide-react';
import PricingCard from '@/components/shared/PricingCard';
import { useAuth } from '@/context/AuthContext';
import { openSubscriptionCheckout, openReportCheckout } from '@/lib/stripe';

export default function Pricing() {
  const { user, tier } = useAuth();
  const [loadingPro, setLoadingPro] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubscribe() {
    setError(null);
    setLoadingPro(true);
    try {
      await openSubscriptionCheckout(user?.email);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoadingPro(false);
    }
  }

  async function handleReport() {
    setError(null);
    try {
      await openReportCheckout(user?.email);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    }
  }

  return (
    <main className="flex-1 px-4 py-8 md:px-8 md:py-10 max-w-5xl mx-auto w-full">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">
          Simple, transparent pricing
        </h1>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          Free market intelligence for everyone. Deep model insights for serious buyers.
          One-off reports when you need a specific answer.
        </p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start mb-10">
        <PricingCard
          tier="free"
          currentTier={tier}
          onAction={() => {}}
        />
        <PricingCard
          tier="pro"
          currentTier={tier}
          onAction={handleSubscribe}
          actionLoading={loadingPro}
        />
        <PricingCard
          tier="report"
          currentTier={tier}
          onAction={handleReport}
        />
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive text-center">
          {error}
        </div>
      )}

      {/* Trust signals */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Shield className="h-3.5 w-3.5 text-primary" />
          <span>Payments by Stripe — EU VAT handled automatically via Stripe Tax</span>
        </div>
        <div className="flex items-center gap-1.5">
          <RefreshCw className="h-3.5 w-3.5 text-primary" />
          <span>Cancel subscription any time — no lock-in</span>
        </div>
      </div>
    </main>
  );
}
