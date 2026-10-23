create table if not exists public.life_chapter_memories (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references public.life_chapters(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  storage_path text not null unique,
  media_type text not null check (media_type in ('image', 'video')),
  caption text not null default '' check (char_length(caption) <= 500),
  created_at timestamptz not null default now()
);
create index if not exists life_chapter_memories_chapter_created_idx
  on public.life_chapter_memories (chapter_id, created_at desc);
alter table public.life_chapter_memories enable row level security;
drop policy if exists "Users can view allowed chapter memories" on public.life_chapter_memories;
create policy "Users can view allowed chapter memories"
  on public.life_chapter_memories for select to authenticated
  using (user_id = (select auth.uid()) or exists (
    select 1 from public.life_chapters c where c.id = chapter_id and c.visibility = 'public'
  ));
drop policy if exists "Users can add memories to own chapters" on public.life_chapter_memories;
create policy "Users can add memories to own chapters"
  on public.life_chapter_memories for insert to authenticated
  with check (user_id = (select auth.uid()) and exists (
    select 1 from public.life_chapters c where c.id = chapter_id and c.user_id = (select auth.uid())
  ));
drop policy if exists "Users can update own chapter memories" on public.life_chapter_memories;
create policy "Users can update own chapter memories" on public.life_chapter_memories for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
drop policy if exists "Users can delete own chapter memories" on public.life_chapter_memories;
create policy "Users can delete own chapter memories" on public.life_chapter_memories for delete to authenticated
  using (user_id = (select auth.uid()));
grant select, insert, update, delete on public.life_chapter_memories to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('life-chapter-media', 'life-chapter-media', false, 52428800,
  array['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/webm','video/quicktime'])
on conflict (id) do update set public = false, file_size_limit = 52428800, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users upload to own life chapter folder" on storage.objects;
create policy "Users upload to own life chapter folder" on storage.objects for insert to authenticated
with check (bucket_id = 'life-chapter-media'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and exists (select 1 from public.life_chapters c
    where c.id::text = (storage.foldername(name))[2] and c.user_id = (select auth.uid())));
drop policy if exists "Users view permitted life chapter media" on storage.objects;
create policy "Users view permitted life chapter media" on storage.objects for select to authenticated
using (bucket_id = 'life-chapter-media' and (
  (storage.foldername(name))[1] = (select auth.uid())::text
  or exists (select 1 from public.life_chapters c
    where c.id::text = (storage.foldername(name))[2] and c.visibility = 'public')
));
drop policy if exists "Users delete own life chapter media" on storage.objects;
create policy "Users delete own life chapter media" on storage.objects for delete to authenticated
using (bucket_id = 'life-chapter-media' and (storage.foldername(name))[1] = (select auth.uid())::text);
