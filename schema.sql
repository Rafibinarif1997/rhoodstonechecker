create table if not exists public.eligibility_checks (
  address text primary key,
  eligible boolean not null default false,
  successful_transactions integer not null default 0,
  checked_at timestamptz not null default now()
);

alter table public.eligibility_checks enable row level security;

-- No public SELECT/INSERT policies are created.
-- The Edge Function writes using the server-side service role key.
