-- Create messages table
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references public.chat_rooms(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  content text not null,
  type text default 'text' check (type in ('text', 'image', 'file')),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.messages enable row level security;

-- RLS Policies for messages
create policy "messages_select_room_members"
  on public.messages for select
  using (
    exists (
      select 1 from public.room_members
      where room_members.room_id = messages.room_id
      and room_members.user_id = auth.uid()
    )
  );

create policy "messages_insert_own"
  on public.messages for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.room_members
      where room_members.room_id = messages.room_id
      and room_members.user_id = auth.uid()
    )
  );

create policy "messages_update_own"
  on public.messages for update
  using (auth.uid() = user_id);

create policy "messages_delete_own"
  on public.messages for delete
  using (auth.uid() = user_id);

-- Create indexes for faster queries
create index if not exists messages_room_id_idx on public.messages(room_id);
create index if not exists messages_user_id_idx on public.messages(user_id);
create index if not exists messages_created_at_idx on public.messages(created_at desc);
