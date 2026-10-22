-- Replace the owner ID value below with the admin user's Supabase Auth UUID.
-- The UUID is public; the password is never stored in this table or site files.
create table if not exists public.portfolio_settings (
  id text primary key,
  projects jsonb not null default '{}'::jsonb,
  resume jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.portfolio_settings
  add column if not exists resume jsonb not null default '{}'::jsonb;

alter table public.portfolio_settings enable row level security;
grant select on public.portfolio_settings to anon, authenticated;
grant insert, update on public.portfolio_settings to authenticated;

do $$
begin
  alter publication supabase_realtime add table public.portfolio_settings;
exception
  when duplicate_object then null;
end $$;

drop policy if exists "Public can read project destinations" on public.portfolio_settings;
create policy "Public can read project destinations"
  on public.portfolio_settings for select to anon, authenticated
  using (id = 'projects');

drop policy if exists "Admin can insert project destinations" on public.portfolio_settings;
create policy "Admin can insert project destinations"
  on public.portfolio_settings for insert to authenticated
  with check (id = 'projects' and (select auth.uid())::text = '515b81c9-421d-479b-8fdb-407761b5f384');

drop policy if exists "Admin can update project destinations" on public.portfolio_settings;
create policy "Admin can update project destinations"
  on public.portfolio_settings for update to authenticated
  using (id = 'projects' and (select auth.uid())::text = '515b81c9-421d-479b-8fdb-407761b5f384')
  with check (id = 'projects' and (select auth.uid())::text = '515b81c9-421d-479b-8fdb-407761b5f384');

insert into public.portfolio_settings (id, projects)
values (
  'projects',
  '{"hiveHiring":"","ctrlCrm":"https://ctrlcrm.pythonanywhere.com/","stockPrediction":"","sapAutomation":"","documentProcessor":"","bewellMedical":""}'::jsonb
)
on conflict (id) do nothing;
