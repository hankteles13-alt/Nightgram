alter table public.messages
  add column if not exists read_by uuid[] not null default '{}'::uuid[];

alter table public.conversations
  add column if not exists last_message_read_by uuid[] not null default '{}'::uuid[];

create or replace function public.mark_conversation_read(target_conversation_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if not exists (
    select 1
    from public.conversation_members cm
    where cm.conversation_id = target_conversation_id
      and cm.user_id = auth.uid()
  ) then
    raise exception 'Not a conversation member';
  end if;

  update public.messages m
  set read_by = case
    when auth.uid() = any(m.read_by) then m.read_by
    else array_append(m.read_by, auth.uid())
  end
  where m.conversation_id = target_conversation_id
    and m.sender_id <> auth.uid()
    and not (auth.uid() = any(m.read_by));

  update public.conversations c
  set unread_by = array_remove(c.unread_by, auth.uid()),
      last_message_read_by = case
        when c.last_sender_id is not null and c.last_sender_id <> auth.uid()
          and not (auth.uid() = any(c.last_message_read_by))
        then array_append(c.last_message_read_by, auth.uid())
        else c.last_message_read_by
      end
  where c.id = target_conversation_id;
end;
$$;

revoke execute on function public.mark_conversation_read(uuid) from public, anon;
grant execute on function public.mark_conversation_read(uuid) to authenticated;
