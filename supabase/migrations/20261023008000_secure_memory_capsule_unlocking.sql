drop policy if exists "Users can view their own memory capsules" on public.memory_capsules;
drop policy if exists "Users can create their own memory capsules" on public.memory_capsules;
drop policy if exists "Users can update their own memory capsules" on public.memory_capsules;
drop policy if exists "Users can delete their own memory capsules" on public.memory_capsules;
revoke all on public.memory_capsules from anon, authenticated;

create or replace function public.create_memory_capsule(p_title text, p_message text, p_open_at timestamptz)
returns uuid language plpgsql security definer set search_path = ''
as $$
declare new_id uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if char_length(trim(coalesce(p_title, ''))) not between 1 and 100 then raise exception 'Title must be 1 to 100 characters'; end if;
  if char_length(coalesce(p_message, '')) not between 1 and 5000 then raise exception 'Message must be 1 to 5000 characters'; end if;
  if p_open_at is null or p_open_at <= now() then raise exception 'Choose a future opening date and time'; end if;
  insert into public.memory_capsules(user_id, title, message, open_at)
  values (auth.uid(), trim(p_title), p_message, p_open_at)
  returning id into new_id;
  return new_id;
end;
$$;

create or replace function public.list_my_memory_capsules()
returns table(id uuid, title text, open_at timestamptz, created_at timestamptz, opened_at timestamptz, is_ready boolean)
language sql security definer set search_path = ''
as $$
  select c.id, c.title, c.open_at, c.created_at, c.opened_at, (c.open_at <= now())
  from public.memory_capsules c
  where c.user_id = (select auth.uid())
  order by c.open_at asc;
$$;

create or replace function public.open_memory_capsule(p_capsule_id uuid)
returns table(id uuid, title text, message text, open_at timestamptz)
language plpgsql security definer set search_path = ''
as $$
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  return query
  update public.memory_capsules c
  set opened_at = coalesce(c.opened_at, now())
  where c.id = p_capsule_id and c.user_id = auth.uid() and c.open_at <= now()
  returning c.id, c.title, c.message, c.open_at;
  if not found then raise exception 'Capsule is not available yet or does not exist'; end if;
end;
$$;

create or replace function public.delete_memory_capsule(p_capsule_id uuid)
returns boolean language plpgsql security definer set search_path = ''
as $$
declare deleted_count integer;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  delete from public.memory_capsules where id = p_capsule_id and user_id = auth.uid();
  get diagnostics deleted_count = row_count;
  return deleted_count = 1;
end;
$$;

revoke all on function public.create_memory_capsule(text, text, timestamptz) from public, anon;
revoke all on function public.list_my_memory_capsules() from public, anon;
revoke all on function public.open_memory_capsule(uuid) from public, anon;
revoke all on function public.delete_memory_capsule(uuid) from public, anon;
grant execute on function public.create_memory_capsule(text, text, timestamptz) to authenticated;
grant execute on function public.list_my_memory_capsules() to authenticated;
grant execute on function public.open_memory_capsule(uuid) to authenticated;
grant execute on function public.delete_memory_capsule(uuid) to authenticated;
