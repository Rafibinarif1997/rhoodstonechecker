-- RHOODSTONE ADMIN SETUP
-- First create your admin user in Supabase Dashboard > Authentication > Users.
-- Then replace YOUR_ADMIN_EMAIL@example.com below and run this SQL.

update auth.users
set raw_app_meta_data =
  coalesce(raw_app_meta_data, '{}'::jsonb) || '{"is_admin": true}'::jsonb
where email = 'YOUR_ADMIN_EMAIL@example.com';

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'is_admin') = 'true', false);
$$;

alter table public.campaigns enable row level security;
alter table public.project_submissions enable row level security;

drop policy if exists "live campaigns readable" on public.campaigns;
create policy "live campaigns readable"
on public.campaigns for select
to anon, authenticated
using (status = 'live' or public.is_admin());

drop policy if exists "admins manage campaigns" on public.campaigns;
create policy "admins manage campaigns"
on public.campaigns for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "public can submit projects" on public.project_submissions;
create policy "public can submit projects"
on public.project_submissions for insert
to anon, authenticated
with check (status = 'pending');

drop policy if exists "admins read submissions" on public.project_submissions;
create policy "admins read submissions"
on public.project_submissions for select
to authenticated
using (public.is_admin());

drop policy if exists "admins update submissions" on public.project_submissions;
create policy "admins update submissions"
on public.project_submissions for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "admins delete submissions" on public.project_submissions;
create policy "admins delete submissions"
on public.project_submissions for delete
to authenticated
using (public.is_admin());
