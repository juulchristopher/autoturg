/**
 * Lemon Squeezy checkout helpers.
 *
 * Uses the Lemon Squeezy overlay embed — no server-side call needed for checkout.
 * The LS embed script (loaded in index.html) exposes window.createLemonSqueezy()
 * which handles the overlay lifecycle.
 *
 * Env vars (Vite):
 *   VITE_LS_STORE_SUBDOMAIN   – your store subdomain, e.g. "autoturg"
 *   VITE_LS_SUBSCRIPTION_VARIANT_ID – LS variant ID for the subscription product
 *   VITE_LS_REPORT_VARIANT_ID        – LS variant ID for one-off reports
 */

const STORE = import.meta.env.VITE_LS_STORE_SUBDOMAIN as string | undefined;
const SUBSCRIPTION_VARIANT = import.meta.env.VITE_LS_SUBSCRIPTION_VARIANT_ID as string | undefined;
const REPORT_VARIANT = import.meta.env.VITE_LS_REPORT_VARIANT_ID as string | undefined;

declare global {
  interface Window {
    createLemonSqueezy?: () => void;
    LemonSqueezy?: {
      Setup: (options: { eventHandler: (event: { event: string }) => void }) => void;
      Url: {
        Open: (url: string) => void;
        Close: () => void;
      };
    };
  }
}

/** Ensure the LS overlay is initialised. */
function ensureLS() {
  if (typeof window !== 'undefined' && window.createLemonSqueezy) {
    window.createLemonSqueezy();
  }
}

/** Build a Lemon Squeezy checkout URL for the overlay embed. */
function checkoutUrl(variantId: string, params: Record<string, string> = {}): string {
  if (!STORE) throw new Error('VITE_LS_STORE_SUBDOMAIN is not set');
  const base = `https://${STORE}.lemonsqueezy.com/buy/${variantId}`;
  const qs = new URLSearchParams({ embed: '1', ...params });
  return `${base}?${qs}`;
}

/**
 * Opens the Lemon Squeezy subscription checkout overlay.
 * @param email Pre-fill the customer email (optional).
 */
export function openSubscriptionCheckout(email?: string): void {
  if (!SUBSCRIPTION_VARIANT) {
    console.warn('VITE_LS_SUBSCRIPTION_VARIANT_ID is not set — cannot open checkout');
    return;
  }
  ensureLS();
  const params: Record<string, string> = {};
  if (email) params['checkout[email]'] = email;
  const url = checkoutUrl(SUBSCRIPTION_VARIANT, params);
  window.LemonSqueezy?.Url.Open(url);
}

/**
 * Opens the Lemon Squeezy pay-per-report checkout overlay.
 * @param email  Pre-fill the customer email.
 * @param make   Car make for custom field (stored in order metadata).
 * @param model  Car model for custom field.
 */
export function openReportCheckout(email?: string, make?: string, model?: string): void {
  if (!REPORT_VARIANT) {
    console.warn('VITE_LS_REPORT_VARIANT_ID is not set — cannot open checkout');
    return;
  }
  ensureLS();
  const params: Record<string, string> = {};
  if (email) params['checkout[email]'] = email;
  if (make) params['checkout[custom][make]'] = make;
  if (model) params['checkout[custom][model]'] = model;
  const url = checkoutUrl(REPORT_VARIANT, params);
  window.LemonSqueezy?.Url.Open(url);
}

/** Returns true if Lemon Squeezy env vars are configured. */
export function isLSConfigured(): boolean {
  return Boolean(STORE && SUBSCRIPTION_VARIANT && REPORT_VARIANT);
}
