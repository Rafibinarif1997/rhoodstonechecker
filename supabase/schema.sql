-- RHOODSTONE GTD PRODUCTION SCHEMA
-- Run this in Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.project_submissions (
 id uuid primary key default gen_random_uuid(),
 project_name text not null,
 website text,
 chain text,
 gtd_quantity integer not null default 0 check(gtd_quantity >= 0),
 claim_method text,
 claim_link text,
 instructions text,
 expiry timestamptz,
 contact text,
 submitted_by text,
 status text not null default 'pending' check(status in ('pending','approved','rejected')),
 created_at timestamptz not null default now()
);

create table if not exists public.gtd_inventory (
 id uuid primary key default gen_random_uuid(),
 project_submission_id uuid references public.project_submissions(id) on delete set null,
 project_name text not null,
 total_gtd integer not null default 0 check(total_gtd >= 0),
 assigned_gtd integer not null default 0 check(assigned_gtd >= 0),
 claimed_gtd integer not null default 0 check(claimed_gtd >= 0),
 claim_method text,
 claim_link text,
 claim_instructions text,
 expires_at timestamptz,
 status text not null default 'available' check(status in ('available','exhausted','expired','paused')),
 created_at timestamptz not null default now()
);

create table if not exists public.campaigns (
 id uuid primary key default gen_random_uuid(),
 name text not null,
 description text,
 status text not null default 'draft' check(status in ('draft','live','paused','ended')),
 gtd_pool integer not null default 0 check(gtd_pool >= 0),
 points_pool integer not null default 0 check(points_pool >= 0),
 gtd_remaining integer not null default 0 check(gtd_remaining >= 0),
 points_remaining integer not null default 0 check(points_remaining >= 0),
 better_luck_slots integer not null default 0 check(better_luck_slots >= 0),
 created_at timestamptz not null default now()
);

create table if not exists public.claims (
 id uuid primary key default gen_random_uuid(),
 campaign_id uuid not null references public.campaigns(id) on delete cascade,
 wallet text not null,
 reward_type text not null check(reward_type in ('gtd','points','better_luck')),
 reward_value integer not null default 0,
 status text not null default 'assigned' check(status in ('assigned','claimed','cancelled')),
 claim_code text,
 claimed_at timestamptz,
 created_at timestamptz not null default now(),
 unique(campaign_id,wallet)
);

alter table public.project_submissions enable row level security;
alter table public.gtd_inventory enable row level security;
alter table public.campaigns enable row level security;
alter table public.claims enable row level security;

-- Public/holder read access to live campaigns.
drop policy if exists "live campaigns readable" on public.campaigns;
create policy "live campaigns readable" on public.campaigns
for select using (status='live');

-- A wallet can submit a project; admin review is still required.
drop policy if exists "anyone can submit" on public.project_submissions;
create policy "anyone can submit" on public.project_submissions
for insert with check (true);

-- Claim RPC: atomic one-claim-per-wallet/campaign.
create or replace function public.open_campaign_box(p_campaign_id uuid,p_wallet text)
returns table(reward_type text,reward_value integer,message text)
language plpgsql
security definer
set search_path=public
as $$
declare c campaigns%rowtype; r int; existing claims%rowtype;
begin
  p_wallet:=lower(trim(p_wallet));
  select * into c from campaigns where id=p_campaign_id and status='live' for update;
  if not found then raise exception 'Campaign is not live'; end if;

  select * into existing from claims where campaign_id=p_campaign_id and lower(wallet)=p_wallet;
  if found then
    return query select existing.reward_type,existing.reward_value,
      case when existing.reward_type='gtd' then 'GTD spot already assigned.'
           when existing.reward_type='points' then 'Points reward already assigned.'
           else 'Better luck next time.' end;
    return;
  end if;

  -- Free holder-only box. Randomness is only for selecting among configured reward buckets.
  r:=floor(random()*100)::int;
  if c.gtd_remaining>0 and r<50 then
    insert into claims(campaign_id,wallet,reward_type,reward_value) values(c.id,p_wallet,'gtd',1);
    update campaigns set gtd_remaining=gtd_remaining-1 where id=c.id;
    return query select 'gtd'::text,1,'GTD spot assigned. Claim instructions will appear here.';
  elsif c.points_remaining>0 and r<85 then
    insert into claims(campaign_id,wallet,reward_type,reward_value) values(c.id,p_wallet,'points',1);
    update campaigns set points_remaining=points_remaining-1 where id=c.id;
    return query select 'points'::text,1,'Points reward assigned.';
  else
    insert into claims(campaign_id,wallet,reward_type,reward_value) values(c.id,p_wallet,'better_luck',0);
    return query select 'better_luck'::text,0,'Better luck next time.';
  end if;
end $$;

grant execute on function public.open_campaign_box(uuid,text) to anon,authenticated;

-- IMPORTANT SECURITY NOTE:
-- For a real production deployment, create an admin role/profile table and
-- replace broad insert/read policies with authenticated admin policies.
