/**
 * create-checkout — Supabase Edge Function
 *
 * Creates a Stripe Checkout Session and returns the hosted URL.
 * Called client-side; keeps STRIPE_SECRET_KEY off the browser.
 *
 * POST body:
 *   { type: 'subscription' | 'report', email?, make?, model?, successUrl, cancelUrl }
 *
 * Secrets required:
 *   STRIPE_SECRET_KEY
 *   STRIPE_SUBSCRIPTION_PRICE_ID
 *   STRIPE_REPORT_PRICE_ID
 *
 * Deploy:
 *   supabase functions deploy create-checkout
 */

// @deno-types="https://esm.sh/v135/stripe@14.21.0/types/index.d.ts"
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2024-04-10',
  httpClient: Stripe.createFetchHttpClient(),
});

const SUBSCRIPTION_PRICE_ID = Deno.env.get('STRIPE_SUBSCRIPTION_PRICE_ID') ?? '';
const REPORT_PRICE_ID = Deno.env.get('STRIPE_REPORT_PRICE_ID') ?? '';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS });
  }

  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405, headers: CORS });
  }

  let body: {
    type: 'subscription' | 'report';
    email?: string;
    make?: string;
    model?: string;
    successUrl: string;
    cancelUrl: string;
  };

  try {
    body = await req.json();
  } catch {
    return new Response('Invalid JSON', { status: 400, headers: CORS });
  }

  const { type, email, make, model, successUrl, cancelUrl } = body;

  if (!successUrl || !cancelUrl) {
    return new Response('Missing successUrl or cancelUrl', {
      status: 400,
      headers: CORS,
    });
  }

  const priceId = type === 'subscription' ? SUBSCRIPTION_PRICE_ID : REPORT_PRICE_ID;
  if (!priceId) {
    return new Response(`STRIPE_${type.toUpperCase()}_PRICE_ID secret not set`, {
      status: 500,
      headers: CORS,
    });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: type === 'subscription' ? 'subscription' : 'payment',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      ...(email ? { customer_email: email } : {}),
      automatic_tax: { enabled: true },
      // Store make/model for report purchases so webhook can record them
      metadata: {
        type,
        make: make ?? '',
        model: model ?? '',
      },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(message, { status: 500, headers: CORS });
  }
});
