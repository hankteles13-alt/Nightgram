create table if not exists public.moment_comments (
  id uuid primary key default gen_random_uuid(),
  moment_id uuid not null references public.nightgram_moments(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null check (char_length(trim(content)) between 1 and 500),
  created_at timestamptz not null default now()
);

create index if not exists moment_comments_moment_created_idx
  on public.moment_comments (moment_id, created_at asc);

alter table public.moment_comments enable row level security;

drop policy if exists "Users can read comments on visible active moments" on public.moment_comments;
create policy "Users can read comments on visible active moments"
  on public.moment_comments for select to authenticated
  using (
    exists (
      select 1 from public.nightgram_moments m
      where m.id = moment_comments.moment_id
        and m.expires_at > now()
    )
  );

drop policy if exists "Users can comment on visible active moments" on public.moment_comments;
create policy "Users can comment on visible active moments"
  on public.moment_comments for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.nightgram_moments m
      where m.id = moment_comments.moment_id
        and m.expires_at > now()
    )
  );

drop policy if exists "Users can delete their own moment comments" on public.moment_comments;
create policy "Users can delete their own moment comments"
  on public.moment_comments for delete to authenticated
  using (user_id = (select auth.uid()));

grant select, insert, delete on public.moment_comments to authenticated;
