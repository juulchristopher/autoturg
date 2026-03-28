import { useState } from 'react';
import { Shield, RefreshCw } from 'lucide-react';
import PricingCard from '@/components/shared/PricingCard';
import { useAuth } from '@/context/AuthContext';
import { openSubscriptionCheckout, openReportCheckout, isLSConfigured } from '@/lib/lemonsqueezy';

export default function Pricing() {
  const { user, tier } = useAuth();
  const [loadingPro, setLoadingPro] = useState(false);
  const lsReady = isLSConfigured();

  function handleSubscribe() {
    if (!lsReady) return;
    setLoadingPro(true);
    try {
      openSubscriptionCheckout(user?.email);
    } finally {
      // Reset after a beat — LS overlay is async, loading state is just UX feedback
      setTimeout(() => setLoadingPro(false), 1500);
    }
  }

  function handleReport() {
    if (!lsReady) return;
    openReportCheckout(user?.email);
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

      {/* Trust signals */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Shield className="h-3.5 w-3.5 text-primary" />
          <span>Payments by Lemon Squeezy — EU VAT handled automatically</span>
        </div>
        <div className="flex items-center gap-1.5">
          <RefreshCw className="h-3.5 w-3.5 text-primary" />
          <span>Cancel subscription any time — no lock-in</span>
        </div>
      </div>

      {/* LS not configured notice (dev only) */}
      {!lsReady && (
        <div className="mt-8 rounded-lg border border-yellow-500/30 bg-yellow-500/5 px-4 py-3 text-xs text-yellow-600 dark:text-yellow-400 text-center">
          Payments not yet configured. Set <code>VITE_LS_STORE_SUBDOMAIN</code>,{' '}
          <code>VITE_LS_SUBSCRIPTION_VARIANT_ID</code>, and <code>VITE_LS_REPORT_VARIANT_ID</code> in{' '}
          <code>.env</code> to enable checkout.
        </div>
      )}
    </main>
  );
}
