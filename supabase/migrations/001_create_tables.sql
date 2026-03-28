-- Autoturg: subscriptions and report purchases
-- Run in Supabase SQL editor: https://supabase.com/dashboard/project/cofazeizbmwdwlsofubm/sql

create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  stripe_subscription_id text unique not null,
  status text not null default 'active',  -- active | past_due | cancelled | unpaid | paused
  expires_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists report_purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  order_id text unique not null,  -- Stripe payment_intent id
  make text not null,
  model text not null,
  purchased_at timestamptz default now()
);

-- Row-level security: users can only read their own data
alter table subscriptions enable row level security;
alter table report_purchases enable row level security;

create policy "Users can read own subscriptions"
  on subscriptions for select using (auth.uid() = user_id);

create policy "Users can read own report purchases"
  on report_purchases for select using (auth.uid() = user_id);

-- Service role can write (used by payment-webhook edge function)
create policy "Service role can manage subscriptions"
  on subscriptions for all using (auth.role() = 'service_role');

create policy "Service role can manage report purchases"
  on report_purchases for all using (auth.role() = 'service_role');
