-- =============================================
-- Wave Music — Supabase Database Schema
-- Run once in: Dashboard → SQL Editor → New Query
-- =============================================

create extension if not exists "uuid-ossp";

-- ── Profiles ──────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id          uuid references auth.users(id) on delete cascade primary key,
  display_name text,
  avatar_url   text,
  created_at   timestamptz default now()
);

-- auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── Playlists ──────────────────────────────────────────────────────────────
create table if not exists public.playlists (
  id          uuid default uuid_generate_v4() primary key,
  user_id     uuid references auth.users(id) on delete cascade not null,
  name        text not null,
  description text,
  tracks      jsonb default '[]'::jsonb,
  thumbnail   text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ── Liked Songs ────────────────────────────────────────────────────────────
create table if not exists public.liked_songs (
  id               uuid default uuid_generate_v4() primary key,
  user_id          uuid references auth.users(id) on delete cascade not null,
  video_id         text not null,
  title            text not null,
  artist           text,
  thumbnail        text,
  duration_text    text,
  duration_seconds int,
  liked_at         timestamptz default now(),
  unique(user_id, video_id)
);

-- ── Listen History ─────────────────────────────────────────────────────────
create table if not exists public.listen_history (
  id           uuid default uuid_generate_v4() primary key,
  user_id      uuid references auth.users(id) on delete cascade not null,
  video_id     text not null,
  title        text not null,
  artist       text,
  thumbnail    text,
  listened_at  timestamptz default now()
);

-- ── Row Level Security ─────────────────────────────────────────────────────
alter table public.profiles        enable row level security;
alter table public.playlists       enable row level security;
alter table public.liked_songs     enable row level security;
alter table public.listen_history  enable row level security;

-- Drop old policies if re-running
drop policy if exists "profiles_all"       on public.profiles;
drop policy if exists "playlists_all"      on public.playlists;
drop policy if exists "liked_songs_all"    on public.liked_songs;
drop policy if exists "history_all"        on public.listen_history;

create policy "profiles_all"      on public.profiles       for all using (auth.uid() = id);
create policy "playlists_all"     on public.playlists      for all using (auth.uid() = user_id);
create policy "liked_songs_all"   on public.liked_songs    for all using (auth.uid() = user_id);
create policy "history_all"       on public.listen_history for all using (auth.uid() = user_id);

-- ── Indexes ────────────────────────────────────────────────────────────────
create index if not exists idx_playlists_user      on public.playlists(user_id);
create index if not exists idx_liked_user          on public.liked_songs(user_id);
create index if not exists idx_history_user_time   on public.listen_history(user_id, listened_at desc);

-- done
select 'Wave Music schema installed successfully ✅' as status;
