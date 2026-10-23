alter table public.life_chapter_memories
  add column if not exists memory_date date not null default current_date;
update public.life_chapter_memories
set memory_date = created_at::date
where memory_date = current_date and created_at::date <> current_date;
create index if not exists life_chapter_memories_timeline_idx
  on public.life_chapter_memories (user_id, memory_date desc, created_at desc);
