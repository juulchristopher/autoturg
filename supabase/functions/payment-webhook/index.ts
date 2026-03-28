/**
 * payment-webhook — Supabase Edge Function
 *
 * Receives Stripe webhook events and updates the database.
 *
 * Handled events:
 *   checkout.session.completed        → activate subscription OR record report purchase
 *   customer.subscription.updated     → sync status / renewal date
 *   customer.subscription.deleted     → mark cancelled
 *
 * Secrets required:
 *   STRIPE_SECRET_KEY
 *   STRIPE_WEBHOOK_SECRET             (from Stripe Dashboard → Webhooks → signing secret)
 *   SUPABASE_URL                      (auto-injected)
 *   SUPABASE_SERVICE_ROLE_KEY         (auto-injected)
 *
 * Deploy:
 *   supabase functions deploy payment-webhook --no-verify-jwt
 *
 * Register in Stripe Dashboard:
 *   URL: https://<project>.supabase.co/functions/v1/payment-webhook
 *   Events: checkout.session.completed, customer.subscription.updated,
 *           customer.subscription.deleted
 */

// @deno-types="https://esm.sh/v135/stripe@14.21.0/types/index.d.ts"
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2024-04-10',
  httpClient: Stripe.createFetchHttpClient(),
});

const WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? '';

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const body = await req.text();
  const signature = req.headers.get('stripe-signature') ?? '';

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      WEBHOOK_SECRET,
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Webhook signature verification failed:', msg);
    return new Response(`Webhook error: ${msg}`, { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  /** Resolve Supabase user ID from email. Returns null if not found. */
  async function resolveUserId(email: string): Promise<string | null> {
    const { data: { users }, error } = await supabase.auth.admin.listUsers();
    if (error) {
      console.error('listUsers error:', error);
      return null;
    }
    return users.find((u) => u.email === email)?.id ?? null;
  }

  try {
    switch (event.type) {
      // ----------------------------------------------------------------
      // Checkout completed — subscription or one-off report
      // ----------------------------------------------------------------
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const email =
          session.customer_email ?? session.customer_details?.email ?? null;

        if (!email) {
          console.warn('checkout.session.completed: no email in session');
          break;
        }

        const userId = await resolveUserId(email);
        if (!userId) {
          console.warn('checkout.session.completed: no user for email', email);
          break;
        }

        if (session.mode === 'subscription' && session.subscription) {
          // Fetch the full subscription to get the period end date
          const sub = await stripe.subscriptions.retrieve(
            session.subscription as string,
          );
          await supabase.from('subscriptions').upsert(
            {
              user_id: userId,
              stripe_subscription_id: sub.id,
              status: sub.status, // 'active'
              expires_at: new Date(sub.current_period_end * 1000).toISOString(),
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'stripe_subscription_id' },
          );
        } else if (session.mode === 'payment') {
          const make = session.metadata?.make ?? '';
          const model = session.metadata?.model ?? '';
          await supabase.from('report_purchases').insert({
            user_id: userId,
            make,
            model,
            order_id: (session.payment_intent as string) ?? session.id,
            purchased_at: new Date().toISOString(),
          });
        }
        break;
      }

      // ----------------------------------------------------------------
      // Subscription updated (renewal, pause, unpause, plan change)
      // ----------------------------------------------------------------
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        await supabase
          .from('subscriptions')
          .update({
            status: sub.status,
            expires_at: new Date(sub.current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', sub.id);
        break;
      }

      // ----------------------------------------------------------------
      // Subscription cancelled / ended
      // ----------------------------------------------------------------
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        await supabase
          .from('subscriptions')
          .update({
            status: 'cancelled',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', sub.id);
        break;
      }

      default:
        // Return 200 for unhandled events — prevents Stripe from retrying
        break;
    }
  } catch (err) {
    console.error('Handler error:', err);
    return new Response('Internal error', { status: 500 });
  }

  return new Response('OK', { status: 200 });
});
