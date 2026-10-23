create table if not exists public.life_chapters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 80),
  description text not null default '' check (char_length(description) <= 2000),
  cover_url text,
  visibility text not null default 'private' check (visibility in ('private', 'public')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists life_chapters_user_created_idx
  on public.life_chapters (user_id, created_at desc);

alter table public.life_chapters enable row level security;

drop policy if exists "Users can view their own or public life chapters" on public.life_chapters;
create policy "Users can view their own or public life chapters"
  on public.life_chapters for select to authenticated
  using (user_id = (select auth.uid()) or visibility = 'public');

drop policy if exists "Users can create their own life chapters" on public.life_chapters;
create policy "Users can create their own life chapters"
  on public.life_chapters for insert to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists "Users can update their own life chapters" on public.life_chapters;
create policy "Users can update their own life chapters"
  on public.life_chapters for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "Users can delete their own life chapters" on public.life_chapters;
create policy "Users can delete their own life chapters"
  on public.life_chapters for delete to authenticated
  using (user_id = (select auth.uid()));

grant select, insert, update, delete on public.life_chapters to authenticated;
