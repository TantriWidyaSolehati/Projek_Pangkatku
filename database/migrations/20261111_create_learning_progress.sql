begin;

create extension if not exists pgcrypto;

create table if not exists public.learning_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  lesson_id text not null references public.lessons(id) on delete cascade,
  completion_status text not null default 'in_progress'
    check (completion_status in ('not_started', 'in_progress', 'completed')),
  progress_percentage integer not null default 0
    check (progress_percentage between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, lesson_id)
);

alter table public.learning_progress
  add column if not exists created_at timestamptz not null default now();

alter table public.learning_progress enable row level security;

revoke all on public.learning_progress from public, anon, authenticated;
grant select, insert, update on public.learning_progress to authenticated;

do $$
declare
  existing_policy record;
begin
  for existing_policy in
    select policyname
    from pg_policies
    where schemaname = 'public' and tablename = 'learning_progress'
  loop
    execute format('drop policy if exists %I on public.learning_progress', existing_policy.policyname);
  end loop;
end;
$$;

create policy "Users can view their learning progress" on public.learning_progress
  for select to authenticated using (auth.uid() = user_id);
create policy "Users can create their learning progress" on public.learning_progress
  for insert to authenticated with check (auth.uid() = user_id);
create policy "Users can update their learning progress" on public.learning_progress
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists learning_progress_user_idx
  on public.learning_progress(user_id);

notify pgrst, 'reload schema';

commit;
