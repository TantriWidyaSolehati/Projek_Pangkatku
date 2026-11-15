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

create or replace function public.get_exercises()
returns table (
  id text,
  question text,
  difficulty text,
  choices text[],
  hints text[]
)
language sql
security definer
set search_path = ''
as $$
  select
    e.id,
    e.question,
    e.difficulty,
    e.choices,
    coalesce(e.hints, array[]::text[]) as hints
  from public.exercises e
  order by e.id;
$$;

create or replace function public.check_exercise_answer(p_exercise_id text, p_user_answer text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_exercise record;
  v_is_correct boolean;
begin
  if auth.uid() is null then
    raise exception 'Harus login untuk mengirim jawaban latihan.';
  end if;

  select * into v_exercise
  from public.exercises
  where id = p_exercise_id;

  if not found then
    return jsonb_build_object('success', false, 'message', 'Soal latihan tidak ditemukan.');
  end if;

  v_is_correct := lower(trim(p_user_answer)) = lower(trim(v_exercise.correct_answer));

  insert into public.exercise_attempts (user_id, exercise_id, submitted_answer, score)
  values (auth.uid(), p_exercise_id, p_user_answer, case when v_is_correct then 1 else 0 end);

  return jsonb_build_object(
    'success', true,
    'is_correct', v_is_correct,
    'explanation', v_exercise.explanation,
    'message', case when v_is_correct then 'Jawaban benar.' else 'Jawaban belum benar. Periksa kembali langkahnya.' end
  );
end;
$$;

grant execute on function public.get_exercises() to authenticated, anon;
grant execute on function public.check_exercise_answer(text, text) to authenticated, anon;

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
  choices text[] not null check (array_length(choices, 1) >= 2),
  hints text[] not null default '{}'::text[],
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

insert into public.exercises (id, question, question_type, difficulty, choices, hints, correct_answer, explanation) values
  ('q1', 'Sebuah laboratorium meneliti dua jenis bakteri, yaitu Bakteri P dan Bakteri Q. Bakteri P membelah diri menjadi 2 kali lipat setiap 1 jam. Bakteri Q membelah diri menjadi 3 kali lipat setiap 2 jam. Pada awal pengamatan, jumlah keduanya sama, yaitu 1.000 sel. Setelah 4 jam, bakteri manakah yang lebih banyak?', 'multiple_choice', 'Sedang', array['Bakteri Q, karena 1.000 × 3² = 9.000 lebih besar dari 1.000 × 2⁴ = 16.000.', 'Bakteri P, karena 1.000 × 2⁴ = 16.000 dan 1.000 × 3² = 9.000.', 'Keduanya sama, karena sama-sama dimulai dari 1.000 sel.', 'Tidak dapat ditentukan tanpa data jam ke-0.'], array['Bakteri P tumbuh dengan faktor 2 setiap 1 jam, jadi setelah 4 jam ia membelah 4 kali.', 'Bakteri Q tumbuh dengan faktor 3 setiap 2 jam, jadi dalam 4 jam ada 2 siklus pembelahan.', 'Hitung hasilnya: 1.000 × 2⁴ = 16.000 dan 1.000 × 3² = 9.000.', 'Karena 16.000 > 9.000, Bakteri P lebih banyak setelah 4 jam.'], 'Bakteri P, karena 1.000 × 2⁴ = 16.000 dan 1.000 × 3² = 9.000.', 'Bakteri P lebih banyak karena 1.000 × 2⁴ = 16.000 sel, sedangkan Bakteri Q = 1.000 × 3² = 9.000 sel. Jadi, 16.000 > 9.000 dan Bakteri P unggul.'),
  ('q2', 'Sebuah startup mencatat jumlah pengguna aktif bulanan pada bulan pertama sebanyak 500 orang. Setiap bulan, jumlah pengguna meningkat menjadi 4 kali lipat dari bulan sebelumnya. Berapa jumlah pengguna pada bulan ke-4?', 'multiple_choice', 'Mudah', array['500 × 4³ = 32.000', '500 × 4² = 8.000', '500 × 4⁴ = 128.000', '500 × 3⁴ = 40.500'], array['Nilai awal adalah 500, rasio pengali adalah 4, dan n = 4.', 'Bentuk pola bulan ke-4 adalah 500 × 4³.', '4³ = 64 dan 500 × 64 = 32.000.', 'Jadi jumlah pengguna pada bulan ke-4 adalah 32.000 orang.'], '500 × 4³ = 32.000', 'Model matematika yang tepat adalah Uₙ = 500 × 4⁽ⁿ⁻¹⁾. Untuk bulan ke-4, U₄ = 500 × 4³ = 500 × 64 = 32.000 orang.'),
  ('q3', 'Sebuah kotak penyimpanan berbentuk kubus memiliki panjang sisi 3 × 10² milimeter. Berapa volume kotak tersebut dalam bentuk bilangan berpangkat dan bentuk biasa?', 'multiple_choice', 'Sedang', array['V = (3 × 10²)³ = 27 × 10⁶ = 27.000.000 mm³', 'V = 3 × 10² = 300 mm³', 'V = 3³ × 10² = 27 × 100 = 2.700 mm³', 'V = (3 × 10²)² = 9 × 10⁴ = 90.000 mm³'], array['Rumus volume kubus adalah V = s × s × s = s³.', 'Substitusikan s = 3 × 10², sehingga V = (3 × 10²)³.', 'Gunakan sifat (a × b)ⁿ = aⁿ × bⁿ, maka V = 3³ × (10²)³ = 27 × 10⁶.', 'Ubah ke bentuk biasa: 27 × 1.000.000 = 27.000.000 mm³.'], 'V = (3 × 10²)³ = 27 × 10⁶ = 27.000.000 mm³', 'Volume kubus adalah V = s³ = (3 × 10²)³ = 3³ × (10²)³ = 27 × 10⁶ = 27.000.000 mm³.'),
  ('q4', 'Sebuah zat radioaktif bermassa awal 1.000 gram mengalami peluruhan sehingga massanya menjadi setengah dari massa sebelumnya setiap 3 hari. Jika setelah 9 hari, seorang siswa menyimpulkan bahwa massa zat tersisa adalah 333,33 gram, apakah kesimpulan tersebut benar?', 'multiple_choice', 'Sulit', array['Tidak benar. Massa yang sebenarnya adalah 1.000 × (1/2)³ = 125 gram.', 'Benar, karena 1.000 dibagi 3 periode sama dengan 333,33 gram.', 'Tidak benar. Massa yang sebenarnya adalah 1.000 × (1/2)² = 250 gram.', 'Benar, karena peluruhan dilakukan secara proporsional dengan 3 periode.'], array['9 hari dibagi 3 hari per periode sama dengan 3 periode.', 'Persamaan peluruhan adalah M = 1.000 × (1/2)ᵗ, dengan t = 3.', 'M = 1.000 × (1/2)³ = 1.000 × 1/8 = 125.', 'Kesimpulan 333,33 gram salah karena peluruhan dilakukan secara berulang bukan linear.'], 'Tidak benar. Massa yang sebenarnya adalah 1.000 × (1/2)³ = 125 gram.', 'Kesimpulan siswa tidak benar. Peluruhan mengikuti pola eksponensial, bukan pembagian linear. Setelah 3 periode, massa = 1.000 × (1/2)³ = 125 gram.')
on conflict (id) do update set
  question = excluded.question, question_type = excluded.question_type,
  difficulty = excluded.difficulty, choices = excluded.choices,
  hints = excluded.hints, correct_answer = excluded.correct_answer,
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
revoke all on public.lessons, public.exercises from anon, authenticated;
grant select on public.lessons to authenticated;
revoke insert on public.exercise_attempts from authenticated;

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
grant select on public.exercise_attempts to authenticated;
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
