-- Create chat_rooms table
create table if not exists public.chat_rooms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  type text default 'public' check (type in ('public', 'private')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.chat_rooms enable row level security;

-- RLS Policies for chat_rooms
create policy "chat_rooms_select_all"
  on public.chat_rooms for select
  using (true);

create policy "chat_rooms_insert_authenticated"
  on public.chat_rooms for insert
  with check (auth.uid() = created_by);

create policy "chat_rooms_update_creator"
  on public.chat_rooms for update
  using (auth.uid() = created_by);

create policy "chat_rooms_delete_creator"
  on public.chat_rooms for delete
  using (auth.uid() = created_by);
