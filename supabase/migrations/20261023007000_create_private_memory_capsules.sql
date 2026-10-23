create table if not exists public.memory_capsules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 100),
  message text not null check (char_length(message) between 1 and 5000),
  open_at timestamptz not null,
  created_at timestamptz not null default now(),
  opened_at timestamptz,
  constraint memory_capsules_open_at_future check (open_at > created_at)
);

alter table public.memory_capsules enable row level security;

create policy "Users can view their own memory capsules"
on public.memory_capsules for select to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create their own memory capsules"
on public.memory_capsules for insert to authenticated
with check ((select auth.uid()) = user_id and open_at > now());

create policy "Users can update their own memory capsules"
on public.memory_capsules for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete their own memory capsules"
on public.memory_capsules for delete to authenticated
using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.memory_capsules to authenticated;
revoke all on public.memory_capsules from anon;
