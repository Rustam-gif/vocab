-- Supabase/PostgreSQL schema for the vocab app
-- Run this once in Supabase SQL editor (or as a migration).

-- Core dictionary
create table if not exists public.words (
  id bigserial primary key,
  term text not null unique,
  part_of_speech text,
  difficulty_level smallint not null default 1,
  created_at timestamptz not null default now()
);

create table if not exists public.word_definitions (
  id bigserial primary key,
  word_id bigint not null references public.words(id) on delete cascade,
  definition text not null,
  source text,
  created_at timestamptz not null default now()
);

create table if not exists public.word_synonyms (
  id bigserial primary key,
  word_id bigint not null references public.words(id) on delete cascade,
  synonym text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.word_examples (
  id bigserial primary key,
  word_id bigint not null references public.words(id) on delete cascade,
  example_sentence text not null,
  language text not null default 'en',
  created_at timestamptz not null default now()
);

create table if not exists public.word_translations (
  id bigserial primary key,
  word_id bigint not null references public.words(id) on delete cascade,
  language text not null,
  translation text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_word_definitions_word_id on public.word_definitions(word_id);
create index if not exists idx_word_synonyms_word_id on public.word_synonyms(word_id);
create index if not exists idx_word_examples_word_id on public.word_examples(word_id);
create index if not exists idx_word_translations_word_id on public.word_translations(word_id);

-- User vocabulary and spaced repetition
create table if not exists public.user_vocabulary (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  word_id bigint not null references public.words(id) on delete cascade,
  status text not null check (status in ('learning', 'mastered', 'review')),
  times_seen integer not null default 0,
  times_correct integer not null default 0,
  times_wrong integer not null default 0,
  next_review_date date,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (user_id, word_id)
);

create index if not exists idx_user_vocab_user on public.user_vocabulary(user_id);
create index if not exists idx_user_vocab_word on public.user_vocabulary(word_id);
create index if not exists idx_user_vocab_next_review on public.user_vocabulary(next_review_date);

-- Exercises
create table if not exists public.exercises (
  id bigserial primary key,
  kind text not null check (kind in ('multiple_choice', 'fill_in_the_blank', 'dialogue')),
  creator_id uuid references auth.users(id) on delete set null,
  instructions text,
  created_at timestamptz not null default now()
);

create table if not exists public.exercise_words (
  id bigserial primary key,
  exercise_id bigint not null references public.exercises(id) on delete cascade,
  word_id bigint not null references public.words(id) on delete cascade,
  position integer not null default 1,
  unique (exercise_id, word_id)
);

create table if not exists public.exercise_users (
  id bigserial primary key,
  exercise_id bigint not null references public.exercises(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  completed boolean not null default false,
  score integer,
  time_spent_seconds integer not null default 0,
  completed_at timestamptz,
  unique (exercise_id, user_id)
);

create index if not exists idx_exercise_words_exercise on public.exercise_words(exercise_id);
create index if not exists idx_exercise_words_word on public.exercise_words(word_id);
create index if not exists idx_exercise_users_user on public.exercise_users(user_id);
create index if not exists idx_exercise_users_exercise on public.exercise_users(exercise_id);

-- User progress
create table if not exists public.user_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  daily_xp integer not null default 0,
  streak integer not null default 0,
  total_words_mastered integer not null default 0,
  time_spent integer not null default 0, -- seconds
  last_updated timestamptz not null default now()
);

-- AI-generated stories
create table if not exists public.ai_stories (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  story_text text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_ai_stories_user on public.ai_stories(user_id);
create index if not exists idx_ai_stories_created on public.ai_stories(created_at);

-- User settings
create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  language_preference text not null default 'en',
  dark_mode boolean not null default false,
  notifications boolean not null default true,
  difficulty_mode text not null default 'medium' check (difficulty_mode in ('easy', 'medium', 'hard')),
  updated_at timestamptz not null default now()
);

-- Subscriptions
create table if not exists public.subscriptions (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  plan text not null check (plan in ('free', 'premium')),
  valid_until date,
  created_at timestamptz not null default now(),
  status text not null default 'active' check (status in ('active', 'canceled', 'expired')),
  unique (user_id)
);

create index if not exists idx_subscriptions_user on public.subscriptions(user_id);
create index if not exists idx_subscriptions_valid on public.subscriptions(valid_until);

-- Helper RPCs for atomic updates
create or replace function public.increment_vocab_stats(
  p_user_id uuid,
  p_word_id bigint,
  p_correct_inc integer default 0,
  p_wrong_inc integer default 0,
  p_next_review date default null
) returns void
language plpgsql
as $$
begin
  insert into public.user_vocabulary (user_id, word_id, status, times_seen, times_correct, times_wrong, next_review_date, updated_at)
  values (p_user_id, p_word_id, 'learning', 1, p_correct_inc, p_wrong_inc, p_next_review, now())
  on conflict (user_id, word_id) do update
  set times_seen = public.user_vocabulary.times_seen + 1,
      times_correct = public.user_vocabulary.times_correct + p_correct_inc,
      times_wrong = public.user_vocabulary.times_wrong + p_wrong_inc,
      next_review_date = coalesce(p_next_review, public.user_vocabulary.next_review_date),
      updated_at = now();
end;
$$;

create or replace function public.add_xp_and_time(
  p_user_id uuid,
  p_xp integer,
  p_time integer
) returns void
language plpgsql
as $$
begin
  insert into public.user_progress (user_id, daily_xp, streak, total_words_mastered, time_spent, last_updated)
  values (p_user_id, p_xp, 0, 0, p_time, now())
  on conflict (user_id) do update
  set daily_xp = public.user_progress.daily_xp + excluded.daily_xp,
      time_spent = public.user_progress.time_spent + excluded.time_spent,
      last_updated = now();
end;
$$;

create or replace function public.create_ai_story(
  p_story_text text,
  p_metadata jsonb default '{}'::jsonb
) returns public.ai_stories
language plpgsql
set search_path = public
as $$
declare
  new_story public.ai_stories;
begin
  insert into public.ai_stories (user_id, story_text, metadata)
  values (auth.uid(), coalesce(p_story_text, ''), coalesce(p_metadata, '{}'::jsonb))
  returning * into new_story;
  return new_story;
end;
$$;

create policy "ai_stories_insert_own" on public.ai_stories
  for insert
  with check (user_id = auth.uid());

create policy "ai_stories_select_own" on public.ai_stories
  for select
  using (user_id = auth.uid());
