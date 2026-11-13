create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null check (char_length(username) between 1 and 40),
  email text not null,
  created_at timestamptz not null default now()
);

create or replace function public.validate_discussion_comment()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  parent_discussion_id uuid;
begin
  if new.parent_comment_id is not null then
    select discussion_id into parent_discussion_id
    from public.discussion_comments
    where id = new.parent_comment_id;
    if parent_discussion_id is null or parent_discussion_id <> new.discussion_id then
      raise exception 'Balasan harus berada di diskusi yang sama.';
    end if;
  end if;

  if (
    select count(*) from public.discussion_comments c
    where c.user_id = new.user_id and c.created_at > now() - interval '1 minute'
  ) >= 12 then
    raise exception 'Terlalu banyak komentar. Coba lagi sebentar lagi.';
  end if;
  return new;
end;
$$;

drop trigger if exists validate_discussion_comment on public.discussion_comments;
create trigger validate_discussion_comment
  before insert on public.discussion_comments
  for each row execute function public.validate_discussion_comment();

create or replace function public.limit_discussion_post_rate()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (
    select count(*) from public.discussions d
    where d.user_id = new.user_id and d.created_at > now() - interval '1 minute'
  ) >= 5 then
    raise exception 'Terlalu banyak diskusi baru. Coba lagi sebentar lagi.';
  end if;
  return new;
end;
$$;

drop trigger if exists limit_discussion_post_rate on public.discussions;
create trigger limit_discussion_post_rate
  before insert on public.discussions
  for each row execute function public.limit_discussion_post_rate();

revoke all on function public.create_profile_for_new_user() from public, anon, authenticated;
revoke all on function public.validate_discussion_comment() from public, anon, authenticated;
revoke all on function public.limit_discussion_post_rate() from public, anon, authenticated;

create or replace function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, username, email)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'username'), ''), split_part(new.email, '@', 1)),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.create_profile_for_new_user();

create table if not exists public.lessons (
  id text primary key,
  title text not null,
  description text not null,
  content jsonb not null default '{}'::jsonb,
  order_number integer not null unique
);

create table if not exists public.learning_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  lesson_id text not null references public.lessons(id) on delete cascade,
  completion_status text not null default 'in_progress' check (completion_status in ('not_started', 'in_progress', 'completed')),
  progress_percentage integer not null default 0 check (progress_percentage between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, lesson_id)
);

create table if not exists public.exercises (
  id text primary key,
  question text not null,
  question_type text not null check (question_type in ('multiple_choice', 'short_answer')),
  difficulty text not null check (difficulty in ('Mudah', 'Sedang', 'Sulit')),
  correct_answer text not null,
  explanation text not null
);

create table if not exists public.exercise_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  exercise_id text not null references public.exercises(id) on delete restrict,
  submitted_answer text not null check (char_length(submitted_answer) <= 500),
  score integer not null check (score in (0, 1)),
  created_at timestamptz not null default now()
);

create table if not exists public.reflections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  question text not null check (char_length(question) <= 500),
  answer text not null check (char_length(answer) between 1 and 1500),
  created_at timestamptz not null default now()
);

create table if not exists public.discussions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 5 and 120),
  content text not null check (char_length(content) between 10 and 2000),
  created_at timestamptz not null default now()
);

create table if not exists public.discussion_comments (
  id uuid primary key default gen_random_uuid(),
  discussion_id uuid not null references public.discussions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  parent_comment_id uuid references public.discussion_comments(id) on delete cascade,
  content text not null check (char_length(content) between 2 and 1000),
  created_at timestamptz not null default now()
);

create table if not exists public.discussion_likes (
  discussion_id uuid not null references public.discussions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (discussion_id, user_id)
);

create table if not exists public.discussion_reports (
  id uuid primary key default gen_random_uuid(),
  discussion_id uuid not null references public.discussions(id) on delete cascade,
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null check (char_length(reason) between 1 and 300),
  status text not null default 'pending' check (status in ('pending', 'reviewed', 'dismissed')),
  created_at timestamptz not null default now(),
  unique (discussion_id, reporter_id)
);

create table if not exists public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 70),
  created_at timestamptz not null default now()
);

create table if not exists public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.ai_conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null check (char_length(content) between 1 and 5000),
  created_at timestamptz not null default now()
);

insert into public.lessons (id, title, description, content, order_number) values
  ('prereq-multiply', 'Perkalian bilangan bulat', 'Ulangi perkalian bilangan bulat.', '{"type":"prerequisite"}', 1),
  ('prereq-divide', 'Pembagian bilangan bulat', 'Ulangi pembagian bilangan bulat.', '{"type":"prerequisite"}', 2),
  ('prereq-fraction', 'Mengenal pecahan', 'Kenali pembilang dan penyebut.', '{"type":"prerequisite"}', 3),
  ('prereq-fraction-multiply', 'Perkalian pecahan', 'Latih perkalian pecahan.', '{"type":"prerequisite"}', 4),
  ('prereq-fraction-divide', 'Pembagian pecahan', 'Latih pembagian pecahan.', '{"type":"prerequisite"}', 5),
  ('prereq-pattern', 'Pola perkalian berulang', 'Hubungkan perkalian berulang dengan pangkat.', '{"type":"prerequisite"}', 6),
  ('lesson-intro', 'Mengenal bilangan berpangkat', 'Bilangan pokok, pangkat, dan perkalian berulang.', '{"chapter":1}', 7),
  ('lesson-positive', 'Pangkat bulat positif', 'Menghitung perpangkatan positif.', '{"chapter":2}', 8),
  ('lesson-negative', 'Pangkat bulat negatif', 'Pangkat negatif sebagai kebalikan.', '{"chapter":3}', 9),
  ('lesson-laws', 'Sifat-sifat perpangkatan', 'Aturan operasi bilangan berpangkat.', '{"chapter":4}', 10)
on conflict (id) do update set
  title = excluded.title, description = excluded.description,
  content = excluded.content, order_number = excluded.order_number;

insert into public.exercises (id, question, question_type, difficulty, correct_answer, explanation) values
  ('q1', 'Pada bentuk 7⁴, berapakah bilangan pokoknya?', 'multiple_choice', 'Mudah', '7', 'Pada 7⁴, 7 adalah bilangan pokok dan 4 adalah pangkat.'),
  ('q2', 'Hitung nilai 2³.', 'multiple_choice', 'Mudah', '8', '2³ = 2 × 2 × 2 = 8.'),
  ('q3', 'Bentuk pecahan dari 3⁻² adalah …', 'multiple_choice', 'Mudah', '1/9', '3⁻² = 1/3² = 1/9. Hasilnya bukan negatif.'),
  ('q4', 'Sederhanakan 5² × 5³.', 'multiple_choice', 'Sedang', '5⁵', '5² × 5³ = 5²⁺³ = 5⁵.'),
  ('q5', 'Sederhanakan 2⁴ ÷ 2⁶.', 'multiple_choice', 'Sedang', '2⁻²', '2⁴ ÷ 2⁶ = 2⁴⁻⁶ = 2⁻² = 1/4.'),
  ('q6', 'Hitung (3²)³.', 'multiple_choice', 'Sedang', '3⁶', '(3²)³ = 3²×³ = 3⁶ = 729.'),
  ('q7', 'Sederhanakan 2⁻³ × 2⁵.', 'multiple_choice', 'Sulit', '2²', '2⁻³ × 2⁵ = 2⁻³⁺⁵ = 2² = 4.'),
  ('q8', 'Bakteri membelah dua setiap jam. Berapa jumlah setelah 5 jam dari 1 bakteri?', 'multiple_choice', 'Sulit', '2⁵ = 32', 'Setelah 5 jam ada 1 × 2⁵ = 32 bakteri.')
on conflict (id) do update set
  question = excluded.question, question_type = excluded.question_type,
  difficulty = excluded.difficulty, correct_answer = excluded.correct_answer,
  explanation = excluded.explanation;

alter table public.profiles enable row level security;
alter table public.lessons enable row level security;
alter table public.learning_progress enable row level security;
alter table public.exercises enable row level security;
alter table public.exercise_attempts enable row level security;
alter table public.reflections enable row level security;
alter table public.discussions enable row level security;
alter table public.discussion_comments enable row level security;
alter table public.discussion_likes enable row level security;
alter table public.discussion_reports enable row level security;
alter table public.ai_conversations enable row level security;
alter table public.ai_messages enable row level security;

drop policy if exists "Authenticated users can view public profile names" on public.profiles;
create policy "Authenticated users can view public profile names" on public.profiles
  for select to authenticated using (true);
drop policy if exists "Users can create their own profile" on public.profiles;
create policy "Users can create their own profile" on public.profiles
  for insert to authenticated with check (auth.uid() = id);
drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile" on public.profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
revoke all on public.profiles from anon, authenticated;
grant select (id, username), insert (id, username, email), update (username) on public.profiles to authenticated;

drop policy if exists "Authenticated users can read lessons" on public.lessons;
create policy "Authenticated users can read lessons" on public.lessons
  for select to authenticated using (true);
drop policy if exists "Authenticated users can read exercise prompts" on public.exercises;
create policy "Authenticated users can read exercise prompts" on public.exercises
  for select to authenticated using (true);
revoke all on public.lessons, public.exercises from anon, authenticated;
grant select on public.lessons to authenticated;
grant select (id, question, question_type, difficulty, explanation) on public.exercises to authenticated;

drop policy if exists "Users can view their learning progress" on public.learning_progress;
create policy "Users can view their learning progress" on public.learning_progress
  for select to authenticated using (auth.uid() = user_id);
drop policy if exists "Users can create their learning progress" on public.learning_progress;
create policy "Users can create their learning progress" on public.learning_progress
  for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "Users can update their learning progress" on public.learning_progress;
create policy "Users can update their learning progress" on public.learning_progress
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can view their exercise attempts" on public.exercise_attempts;
create policy "Users can view their exercise attempts" on public.exercise_attempts
  for select to authenticated using (auth.uid() = user_id);
drop policy if exists "Users can create their exercise attempts" on public.exercise_attempts;
create policy "Users can create their exercise attempts" on public.exercise_attempts
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "Users can view their reflections" on public.reflections;
create policy "Users can view their reflections" on public.reflections
  for select to authenticated using (auth.uid() = user_id);
drop policy if exists "Users can create their reflections" on public.reflections;
create policy "Users can create their reflections" on public.reflections
  for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "Users can delete their reflections" on public.reflections;
create policy "Users can delete their reflections" on public.reflections
  for delete to authenticated using (auth.uid() = user_id);

drop policy if exists "Authenticated users can read discussions" on public.discussions;
create policy "Authenticated users can read discussions" on public.discussions
  for select to authenticated using (true);
drop policy if exists "Users can create discussions as themselves" on public.discussions;
create policy "Users can create discussions as themselves" on public.discussions
  for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "Authors can update their discussions" on public.discussions;
create policy "Authors can update their discussions" on public.discussions
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "Authors can delete their discussions" on public.discussions;
create policy "Authors can delete their discussions" on public.discussions
  for delete to authenticated using (
    auth.uid() = user_id or (auth.jwt() -> 'app_metadata' ->> 'role') in ('admin', 'teacher')
  );

drop policy if exists "Authenticated users can read comments" on public.discussion_comments;
create policy "Authenticated users can read comments" on public.discussion_comments
  for select to authenticated using (true);
drop policy if exists "Users can create comments as themselves" on public.discussion_comments;
create policy "Users can create comments as themselves" on public.discussion_comments
  for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "Authors can delete their comments" on public.discussion_comments;
create policy "Authors can delete their comments" on public.discussion_comments
  for delete to authenticated using (
    auth.uid() = user_id or (auth.jwt() -> 'app_metadata' ->> 'role') in ('admin', 'teacher')
  );

drop policy if exists "Authenticated users can view discussion likes" on public.discussion_likes;
create policy "Authenticated users can view discussion likes" on public.discussion_likes
  for select to authenticated using (true);
drop policy if exists "Users can like as themselves" on public.discussion_likes;
create policy "Users can like as themselves" on public.discussion_likes
  for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "Users can remove their own likes" on public.discussion_likes;
create policy "Users can remove their own likes" on public.discussion_likes
  for delete to authenticated using (auth.uid() = user_id);

drop policy if exists "Users can report discussions" on public.discussion_reports;
create policy "Users can report discussions" on public.discussion_reports
  for insert to authenticated with check (auth.uid() = reporter_id);
drop policy if exists "Users can view own reports and admins can moderate" on public.discussion_reports;
create policy "Users can view own reports and admins can moderate" on public.discussion_reports
  for select to authenticated using (
    auth.uid() = reporter_id or (auth.jwt() -> 'app_metadata' ->> 'role') in ('admin', 'teacher')
  );
drop policy if exists "Admins can moderate reports" on public.discussion_reports;
create policy "Admins can moderate reports" on public.discussion_reports
  for update to authenticated using ((auth.jwt() -> 'app_metadata' ->> 'role') in ('admin', 'teacher'))
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') in ('admin', 'teacher'));

drop policy if exists "Users can manage their conversations" on public.ai_conversations;
create policy "Users can manage their conversations" on public.ai_conversations
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "Users can read messages in their conversations" on public.ai_messages;
create policy "Users can read messages in their conversations" on public.ai_messages
  for select to authenticated using (
    exists (select 1 from public.ai_conversations c where c.id = conversation_id and c.user_id = auth.uid())
  );
drop policy if exists "Users can create messages in their conversations" on public.ai_messages;
create policy "Users can create messages in their conversations" on public.ai_messages
  for insert to authenticated with check (
    exists (select 1 from public.ai_conversations c where c.id = conversation_id and c.user_id = auth.uid())
  );

grant select, insert, update on public.learning_progress to authenticated;
grant select, insert on public.exercise_attempts to authenticated;
grant select, insert, delete on public.reflections to authenticated;
grant select, insert, update, delete on public.discussions to authenticated;
grant select, insert, delete on public.discussion_comments to authenticated;
grant select, insert, delete on public.discussion_likes to authenticated;
grant select, insert, update on public.discussion_reports to authenticated;
grant select, insert, update, delete on public.ai_conversations to authenticated;
grant select, insert on public.ai_messages to authenticated;

create index if not exists learning_progress_user_idx on public.learning_progress(user_id);
create index if not exists exercise_attempts_user_created_idx on public.exercise_attempts(user_id, created_at desc);
create index if not exists reflections_user_created_idx on public.reflections(user_id, created_at desc);
create index if not exists discussions_created_idx on public.discussions(created_at desc);
create index if not exists discussions_user_created_idx on public.discussions(user_id, created_at desc);
create index if not exists discussion_comments_discussion_created_idx on public.discussion_comments(discussion_id, created_at);
create index if not exists discussion_comments_user_created_idx on public.discussion_comments(user_id, created_at desc);
create index if not exists ai_conversations_user_created_idx on public.ai_conversations(user_id, created_at desc);
create index if not exists ai_messages_conversation_created_idx on public.ai_messages(conversation_id, created_at);

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'discussions'
  ) then
    alter publication supabase_realtime add table public.discussions;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'discussion_comments'
  ) then
    alter publication supabase_realtime add table public.discussion_comments;
  end if;
end;
$$;
