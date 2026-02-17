-- Drop existing tables to ensure a clean slate (WARNING: This will delete existing wallet data)
drop table if exists public.transactions cascade;
drop table if exists public.wallets cascade;
drop table if exists public.system_settings cascade;

-- Drop existing functions to allow parameter name changes
drop function if exists public.handle_new_user_wallet() cascade;
drop function if exists public.add_credits(uuid, numeric, text);
drop function if exists public.deduct_credits(uuid, numeric, text, text);

-- Create wallets table
create table public.wallets (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null unique,
  balance numeric default 0.00 not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create transactions table
create table public.transactions (
  id uuid default gen_random_uuid() primary key,
  wallet_id uuid references public.wallets(id) on delete cascade not null,
  amount numeric not null,
  type text not null check (type in ('deposit', 'purchase', 'refund', 'payout', 'consultation_credit', 'manual_adjustment')),
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create system_settings table
create table public.system_settings (
  key text primary key,
  value jsonb not null
);

-- Initialize conversion rate (1 credit = 1 currency unit by default, admin can change)
insert into public.system_settings (key, value) values ('credit_conversion_rate', '1.0');

-- Enable RLS
alter table public.wallets enable row level security;
alter table public.transactions enable row level security;
alter table public.system_settings enable row level security;

-- RLS Policies
-- Wallets: Users can view their own wallet. Admin can view all.
create policy "Users can view own wallet" on public.wallets
  for select using (auth.uid() = user_id);

create policy "Admins can view all wallets" on public.wallets
  for select using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- Transactions: Users can view their own transactions (via wallet_id). Admin all.
create policy "Users can view own transactions" on public.transactions
  for select using (
    exists (
      select 1 from public.wallets
      where wallets.id = transactions.wallet_id and wallets.user_id = auth.uid()
    )
  );

create policy "Admins can view all transactions" on public.transactions
  for select using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- System Settings: Read for all authenticated users (to see rates), Write for Admin
create policy "Authenticated users can view settings" on public.system_settings
  for select using (auth.role() = 'authenticated');

create policy "Admins can update settings" on public.system_settings
  for update using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );


-- Functions

-- 1. Create wallet for new user (Trigger)
create or replace function public.handle_new_user_wallet()
returns trigger as $$
begin
  insert into public.wallets (user_id, balance)
  values (new.id, 0.00);
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to create wallet when a profile is created (assuming profiles are created on signup)
-- Note: You might already have a handle_new_user trigger on auth.users. 
-- If profiles triggers are used, attach to profiles. If auth.users, attach there.
-- Let's attach to public.profiles assuming it exists and is populated.
create trigger on_profile_created_create_wallet
  after insert on public.profiles
  for each row execute procedure public.handle_new_user_wallet();


-- 2. Add Credits (Atomic)
create or replace function public.add_credits(
  target_user_id uuid, 
  credit_amount numeric, 
  txn_description text
)
returns void as $$
declare
  target_wallet_id uuid;
begin
  -- Get wallet id
  select id into target_wallet_id from public.wallets where user_id = target_user_id;
  
  if target_wallet_id is null then
    raise exception 'Wallet not found for user';
  end if;

  -- Update balance
  update public.wallets
  set balance = balance + credit_amount,
      updated_at = now()
  where id = target_wallet_id;

  -- Log transaction
  insert into public.transactions (wallet_id, amount, type, description)
  values (target_wallet_id, credit_amount, 'deposit', txn_description);
end;
$$ language plpgsql security definer;


-- 3. Deduct Credits (Atomic with check)
create or replace function public.deduct_credits(
  target_user_id uuid,
  deduct_amount numeric,
  txn_description text,
  txn_type text default 'purchase'
)
returns void as $$
declare
  target_wallet_id uuid;
  current_bal numeric;
begin
  select id, balance into target_wallet_id, current_bal 
  from public.wallets where user_id = target_user_id;

  if target_wallet_id is null then
    raise exception 'Wallet not found for user';
  end if;

  if current_bal < deduct_amount then
    raise exception 'Insufficient funds';
  end if;

  update public.wallets
  set balance = balance - deduct_amount,
      updated_at = now()
  where id = target_wallet_id;

  insert into public.transactions (wallet_id, amount, type, description)
  values (target_wallet_id, -deduct_amount, txn_type, txn_description);
end;
$$ language plpgsql security definer;
