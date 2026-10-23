create table if not exists public.nightgram_moments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  storage_path text not null unique,
  media_type text not null check (media_type in ('image', 'video')),
  caption text not null default '' check (char_length(caption) <= 300),
  visibility text not null default 'public' check (visibility in ('public', 'private')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '24 hours'),
  constraint nightgram_moments_expiry_after_creation check (expires_at > created_at)
);
create index if not exists nightgram_moments_active_idx on public.nightgram_moments (expires_at desc, created_at desc);
create index if not exists nightgram_moments_user_idx on public.nightgram_moments (user_id, created_at desc);
alter table public.nightgram_moments enable row level security;
drop policy if exists "Authenticated users view active public moments and own moments" on public.nightgram_moments;
create policy "Authenticated users view active public moments and own moments" on public.nightgram_moments for select to authenticated using (expires_at > now() and (visibility = 'public' or user_id = (select auth.uid())));
drop policy if exists "Users create own moments" on public.nightgram_moments;
create policy "Users create own moments" on public.nightgram_moments for insert to authenticated with check (user_id = (select auth.uid()) and expires_at > now() and expires_at <= now() + interval '24 hours 1 minute');
drop policy if exists "Users delete own moments" on public.nightgram_moments;
create policy "Users delete own moments" on public.nightgram_moments for delete to authenticated using (user_id = (select auth.uid()));
grant select, insert, delete on public.nightgram_moments to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('nightgram-moments', 'nightgram-moments', false, 52428800, array['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/webm','video/quicktime'])
on conflict (id) do update set public = false, file_size_limit = 52428800, allowed_mime_types = excluded.allowed_mime_types;
drop policy if exists "Users upload to own Nightgram moments folder" on storage.objects;
create policy "Users upload to own Nightgram moments folder" on storage.objects for insert to authenticated with check (bucket_id = 'nightgram-moments' and (storage.foldername(name))[1] = (select auth.uid())::text);
drop policy if exists "Users view active permitted Nightgram moment media" on storage.objects;
create policy "Users view active permitted Nightgram moment media" on storage.objects for select to authenticated using (bucket_id = 'nightgram-moments' and exists (select 1 from public.nightgram_moments m where m.storage_path = name and m.expires_at > now() and (m.visibility = 'public' or m.user_id = (select auth.uid()))));
drop policy if exists "Users delete own Nightgram moment media" on storage.objects;
create policy "Users delete own Nightgram moment media" on storage.objects for delete to authenticated using (bucket_id = 'nightgram-moments' and (storage.foldername(name))[1] = (select auth.uid())::text);
