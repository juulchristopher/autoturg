/**
 * Stripe checkout helpers (client-side).
 *
 * Uses Stripe-hosted Checkout — no Stripe.js embed needed.
 * Calls the `create-checkout` Supabase Edge Function to create a session
 * server-side (keeps the secret key off the client), then redirects.
 *
 * Env vars (Vite):
 *   VITE_SUPABASE_URL  — already set for auth; reused to derive functions base URL
 *
 * Edge Function secrets (set via `supabase secrets set`):
 *   STRIPE_SECRET_KEY
 *   STRIPE_SUBSCRIPTION_PRICE_ID
 *   STRIPE_REPORT_PRICE_ID
 */

import { supabase } from '@/lib/supabase';

function functionsUrl(): string | null {
  const base = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  return base ? `${base}/functions/v1` : null;
}

async function createCheckoutSession(
  payload: Record<string, string>,
): Promise<void> {
  const base = functionsUrl();
  if (!base) {
    console.warn('VITE_SUPABASE_URL not set — cannot create checkout session');
    return;
  }

  // Attach the user's JWT so the Edge Function can verify identity
  const { data: { session } } = await supabase.auth.getSession();

  const successUrl =
    window.location.origin +
    window.location.pathname +
    '#/pricing?checkout=success';
  const cancelUrl =
    window.location.origin + window.location.pathname + '#/pricing';

  const res = await fetch(`${base}/create-checkout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(session?.access_token
        ? { Authorization: `Bearer ${session.access_token}` }
        : {}),
    },
    body: JSON.stringify({ ...payload, successUrl, cancelUrl }),
  });

  if (!res.ok) {
    const msg = await res.text();
    throw new Error(`Stripe checkout error: ${msg}`);
  }

  const { url } = (await res.json()) as { url: string };
  window.location.href = url;
}

/** Redirect to Stripe Checkout for the monthly subscription. */
export async function openSubscriptionCheckout(email?: string): Promise<void> {
  await createCheckoutSession({
    type: 'subscription',
    ...(email ? { email } : {}),
  });
}

/** Redirect to Stripe Checkout for a one-off market report. */
export async function openReportCheckout(
  email?: string,
  make?: string,
  model?: string,
): Promise<void> {
  await createCheckoutSession({
    type: 'report',
    ...(email ? { email } : {}),
    ...(make ? { make } : {}),
    ...(model ? { model } : {}),
  });
}

/** True once VITE_SUPABASE_URL is configured (functions base available). */
export function isStripeConfigured(): boolean {
  return Boolean(functionsUrl());
}
