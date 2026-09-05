create table if not exists public.legacy_documents (
  id text primary key,
  collection_name text not null,
  doc_id text not null,
  parent_path text not null default '',
  owner_id uuid references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists legacy_documents_collection_idx on public.legacy_documents(collection_name);
create index if not exists legacy_documents_owner_idx on public.legacy_documents(owner_id);
create index if not exists legacy_documents_created_idx on public.legacy_documents(created_at desc);

alter table public.legacy_documents enable row level security;

drop policy if exists legacy_select on public.legacy_documents;
drop policy if exists legacy_insert on public.legacy_documents;
drop policy if exists legacy_update on public.legacy_documents;
drop policy if exists legacy_delete on public.legacy_documents;

create policy legacy_select on public.legacy_documents for select to authenticated using (
  collection_name in ('posts','stories','users')
  or owner_id = auth.uid()
  or (collection_name = 'chats' and (data->'participants') ? (auth.uid()::text))
  or (collection_name = 'chats_messages' and exists (
    select 1 from public.legacy_documents c
    where c.id = split_part(legacy_documents.id, '/messages/', 1)
      and c.collection_name = 'chats'
      and (c.data->'participants') ? (auth.uid()::text)
  ))
);

create policy legacy_insert on public.legacy_documents for insert to authenticated with check (
  owner_id = auth.uid()
  or (collection_name = 'chats_messages' and exists (
    select 1 from public.legacy_documents c
    where c.id = split_part(legacy_documents.id, '/messages/', 1)
      and c.collection_name = 'chats'
      and (c.data->'participants') ? (auth.uid()::text)
  ))
);

create policy legacy_update on public.legacy_documents for update to authenticated using (
  owner_id = auth.uid()
  or (collection_name = 'chats' and (data->'participants') ? (auth.uid()::text))
) with check (
  owner_id = auth.uid()
  or (collection_name = 'chats' and (data->'participants') ? (auth.uid()::text))
);

create policy legacy_delete on public.legacy_documents for delete to authenticated using (
  owner_id = auth.uid()
  or (collection_name = 'chats' and (data->'participants') ? (auth.uid()::text))
);

create or replace function public.set_legacy_documents_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists legacy_documents_updated_at on public.legacy_documents;
create trigger legacy_documents_updated_at before update on public.legacy_documents for each row execute function public.set_legacy_documents_updated_at();

alter publication supabase_realtime add table public.legacy_documents;
