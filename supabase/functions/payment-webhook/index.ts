/**
 * Lemon Squeezy → Supabase payment webhook
 *
 * Handles:
 *   subscription_created   → upsert active subscription
 *   subscription_updated   → update status / expiry
 *   subscription_cancelled → mark cancelled
 *   subscription_expired   → mark expired
 *   order_created          → record pay-per-report purchase
 *
 * Deploy:
 *   supabase functions deploy payment-webhook --no-verify-jwt
 *
 * Secrets required (set via Supabase dashboard or `supabase secrets set`):
 *   LEMON_SQUEEZY_WEBHOOK_SECRET
 *   SUPABASE_URL            (auto-injected)
 *   SUPABASE_SERVICE_ROLE_KEY (auto-injected)
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const WEBHOOK_SECRET = Deno.env.get('LEMON_SQUEEZY_WEBHOOK_SECRET') ?? '';

async function verifySignature(req: Request, body: string): Promise<boolean> {
  const signature = req.headers.get('x-signature');
  if (!signature || !WEBHOOK_SECRET) return false;

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(WEBHOOK_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify'],
  );

  const sigBytes = hexToBytes(signature);
  const bodyBytes = new TextEncoder().encode(body);
  return crypto.subtle.verify('HMAC', key, sigBytes, bodyBytes);
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const body = await req.text();

  const valid = await verifySignature(req, body);
  if (!valid) {
    return new Response('Invalid signature', { status: 400 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(body);
  } catch {
    return new Response('Bad JSON', { status: 400 });
  }

  const eventName = payload['meta'] && (payload['meta'] as Record<string, unknown>)['event_name'] as string;
  const data = payload['data'] as Record<string, unknown> | undefined;
  const attrs = data?.['attributes'] as Record<string, unknown> | undefined;

  if (!eventName || !attrs) {
    return new Response('Missing event_name or attributes', { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // ----------------------------------------------------------------
  // Subscription events
  // ----------------------------------------------------------------
  if (
    eventName === 'subscription_created' ||
    eventName === 'subscription_updated' ||
    eventName === 'subscription_cancelled' ||
    eventName === 'subscription_expired' ||
    eventName === 'subscription_resumed' ||
    eventName === 'subscription_paused'
  ) {
    const lsSubscriptionId = String(data!['id']);
    const customerEmail = attrs['user_email'] as string | undefined;
    const status = attrs['status'] as string; // active | paused | cancelled | expired | past_due | unpaid
    const endsAt = attrs['ends_at'] as string | null;
    const renewsAt = attrs['renews_at'] as string | null;

    if (!customerEmail) {
      return new Response('Missing user_email', { status: 400 });
    }

    // Resolve Supabase user ID from email
    const { data: userList, error: userErr } = await supabase
      .from('auth.users')
      .select('id')
      .eq('email', customerEmail)
      .limit(1);

    // auth.users isn't directly queryable via the JS client — use admin API instead
    const { data: { users }, error: adminErr } = await supabase.auth.admin.listUsers();
    if (adminErr) {
      console.error('Failed to list users:', adminErr);
      return new Response('Internal error', { status: 500 });
    }
    const matchedUser = users.find((u) => u.email === customerEmail);
    if (!matchedUser) {
      // User hasn't signed up yet — store subscription linked by email for later claim
      // For now, skip gracefully
      console.warn('No Supabase user found for email:', customerEmail);
      return new Response('OK (no user match)', { status: 200 });
    }

    const expiresAt = endsAt ?? renewsAt ?? null;

    const { error } = await supabase.from('subscriptions').upsert(
      {
        user_id: matchedUser.id,
        ls_subscription_id: lsSubscriptionId,
        status,
        expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'ls_subscription_id' },
    );

    if (error) {
      console.error('Upsert subscriptions error:', error);
      return new Response('DB error', { status: 500 });
    }

    return new Response('OK', { status: 200 });
  }

  // ----------------------------------------------------------------
  // One-off report purchase
  // ----------------------------------------------------------------
  if (eventName === 'order_created') {
    const orderId = String(data!['id']);
    const customerEmail = attrs['user_email'] as string | undefined;
    const customData = attrs['first_order_item'] as Record<string, unknown> | undefined;
    // Custom fields are in meta.custom_data
    const meta = payload['meta'] as Record<string, unknown> | undefined;
    const custom = meta?.['custom_data'] as Record<string, string> | undefined;
    const make = custom?.['make'];
    const model = custom?.['model'];

    if (!customerEmail) {
      return new Response('Missing user_email', { status: 400 });
    }

    const { data: { users }, error: adminErr } = await supabase.auth.admin.listUsers();
    if (adminErr) {
      return new Response('Internal error', { status: 500 });
    }
    const matchedUser = users.find((u) => u.email === customerEmail);
    if (!matchedUser) {
      console.warn('No Supabase user for report purchase:', customerEmail);
      return new Response('OK (no user match)', { status: 200 });
    }

    const { error } = await supabase.from('report_purchases').insert({
      user_id: matchedUser.id,
      make: make ?? '',
      model: model ?? '',
      order_id: orderId,
      purchased_at: new Date().toISOString(),
    });

    if (error) {
      console.error('Insert report_purchases error:', error);
      return new Response('DB error', { status: 500 });
    }

    return new Response('OK', { status: 200 });
  }

  // Unhandled event — return 200 so LS doesn't retry
  return new Response('Unhandled event', { status: 200 });
});
