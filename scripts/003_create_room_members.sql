-- Create room_members table (join table for users and rooms)
create table if not exists public.room_members (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references public.chat_rooms(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  role text default 'member' check (role in ('admin', 'moderator', 'member')),
  joined_at timestamp with time zone default now(),
  unique(room_id, user_id)
);

-- Enable RLS
alter table public.room_members enable row level security;

-- RLS Policies for room_members
create policy "room_members_select_all"
  on public.room_members for select
  using (true);

create policy "room_members_insert_own"
  on public.room_members for insert
  with check (auth.uid() = user_id);

create policy "room_members_delete_own"
  on public.room_members for delete
  using (auth.uid() = user_id);

-- Create index for faster queries
create index if not exists room_members_room_id_idx on public.room_members(room_id);
create index if not exists room_members_user_id_idx on public.room_members(user_id);
