-- Rebuild messaging schema and RLS to align with src/hooks/useMessages.tsx
-- WARNING: This DROPS existing messaging tables and policies. Run in Supabase SQL editor.
-- Tables: conversations, conversation_members, messages
-- Also ensures user_profiles is selectable by authenticated users.

begin;

-- Use uuid generation via extensions.gen_random_uuid()
create extension if not exists "pgcrypto" with schema extensions;

-- Drop in dependency order
drop table if exists messages cascade;
drop table if exists conversation_members cascade;
drop table if exists conversations cascade;

-- Conversations table
create table public.conversations (
  id uuid primary key default extensions.gen_random_uuid(),
  name text not null,
  is_group boolean not null default false,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger trg_conversations_set_updated_at
before update on public.conversations
for each row execute function public.set_updated_at();

-- Conversation members (composite PK)
create table public.conversation_members (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

-- Messages
create table public.messages (
  id uuid primary key default extensions.gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- Helpful indexes
create index if not exists idx_conversations_created_by on public.conversations(created_by);
create index if not exists idx_conversations_updated_at on public.conversations(updated_at desc);
create index if not exists idx_conv_members_user on public.conversation_members(user_id);
create index if not exists idx_conv_members_conv on public.conversation_members(conversation_id);
create index if not exists idx_messages_conv_created on public.messages(conversation_id, created_at);
create index if not exists idx_messages_sender on public.messages(sender_id);

-- Helper functions to avoid RLS recursion (defined after tables exist)
-- Check if current user is a member of a conversation
create or replace function public.is_conversation_member(p_conversation_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.conversation_members cm
    where cm.conversation_id = p_conversation_id
      and cm.user_id = auth.uid()
  );
$$;

-- Check if current user is the creator of a conversation
create or replace function public.is_conversation_creator(p_conversation_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.conversations c
    where c.id = p_conversation_id
      and c.created_by = auth.uid()
  );
$$;

grant execute on function public.is_conversation_member(uuid) to authenticated;
grant execute on function public.is_conversation_creator(uuid) to authenticated;

-- Enable RLS
alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;

-- Conversations RLS
-- Visible if requester is a member or the creator
drop policy if exists "conversations_select" on public.conversations;
create policy "conversations_select"
  on public.conversations
  for select
  to authenticated
  using (
    public.is_conversation_member(conversations.id)
    or created_by = auth.uid()
  );

-- Insert allowed only if created_by = auth.uid()
drop policy if exists "conversations_insert" on public.conversations;
create policy "conversations_insert"
  on public.conversations
  for insert
  to authenticated
  with check (created_by = auth.uid());

-- Update allowed to members or creator (for updated_at, name changes, etc.)
drop policy if exists "conversations_update" on public.conversations;
create policy "conversations_update"
  on public.conversations
  for update
  to authenticated
  using (
    public.is_conversation_member(conversations.id)
    or created_by = auth.uid()
  )
  with check (
    public.is_conversation_member(conversations.id)
    or created_by = auth.uid()
  );

-- Delete allowed only by creator (optional)
drop policy if exists "conversations_delete" on public.conversations;
create policy "conversations_delete"
  on public.conversations
  for delete
  to authenticated
  using (created_by = auth.uid());

-- Conversation members RLS
-- Read membership of conversations you belong to or created
drop policy if exists "conv_members_select" on public.conversation_members;
create policy "conv_members_select"
  on public.conversation_members
  for select
  to authenticated
  using (
    user_id = auth.uid()
    or public.is_conversation_creator(conversation_members.conversation_id)
  );

-- Allow users to insert their own membership OR the creator to add others
drop policy if exists "conv_members_insert" on public.conversation_members;
create policy "conv_members_insert"
  on public.conversation_members
  for insert
  to authenticated
  with check (
    user_id = auth.uid()
    or public.is_conversation_creator(conversation_members.conversation_id)
  );

-- Allow deletion by self or creator (optional)
drop policy if exists "conv_members_delete" on public.conversation_members;
create policy "conv_members_delete"
  on public.conversation_members
  for delete
  to authenticated
  using (
    user_id = auth.uid()
    or public.is_conversation_creator(conversation_members.conversation_id)
  );

-- Messages RLS
-- Read messages in conversations you belong to
drop policy if exists "messages_select" on public.messages;
create policy "messages_select"
  on public.messages
  for select
  to authenticated
  using (
    public.is_conversation_member(messages.conversation_id)
  );

-- Insert messages only from yourself and only in conversations you belong to
drop policy if exists "messages_insert" on public.messages;
create policy "messages_insert"
  on public.messages
  for insert
  to authenticated
  with check (
    sender_id = auth.uid()
    and exists (
      select 1
      from conversation_members cm
      where cm.conversation_id = messages.conversation_id
      and cm.user_id = auth.uid()
    )
  );

-- Update messages allowed to any member (needed for markAsRead in useMessages.tsx)
drop policy if exists "messages_update" on public.messages;
create policy "messages_update"
  on public.messages
  for update
  to authenticated
  using (
    public.is_conversation_member(messages.conversation_id)
  )
  with check (
    public.is_conversation_member(messages.conversation_id)
  );

-- Optional: do not allow deletes by default (omit delete policy)

-- Ensure authenticated role has base privileges (Supabase often manages this)
grant select, insert, update, delete on public.conversations to authenticated;
grant select, insert, delete on public.conversation_members to authenticated;
grant select, insert, update on public.messages to authenticated;

-- Ensure profiles are readable for suggestions
alter table if exists public.user_profiles enable row level security;
-- Replace existing generic select policy if desired
do $$
begin
  if exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'user_profiles' and policyname = 'profiles_select_authenticated'
  ) then
    execute 'drop policy "profiles_select_authenticated" on public.user_profiles';
  end if;
end $$;

create policy "profiles_select_authenticated"
  on public.user_profiles
  for select
  to authenticated
  using (true);

-- Create a view for conversation summaries
CREATE OR REPLACE VIEW conversation_summaries AS
SELECT
  c.id AS conversation_id,
  c.name AS conversation_name,
  c.is_group,
  c.created_by,
  c.created_at,
  c.updated_at,
  (
    SELECT COUNT(*)
    FROM conversation_members cm
    WHERE cm.conversation_id = c.id
  ) AS member_count,
  (
    SELECT content
    FROM messages m
    WHERE m.conversation_id = c.id
    ORDER BY m.created_at DESC
    LIMIT 1
  ) AS last_message,
  (
    SELECT created_at
    FROM messages m
    WHERE m.conversation_id = c.id
    ORDER BY m.created_at DESC
    LIMIT 1
  ) AS last_message_time
FROM
  conversations c;

-- Grant permissions to authenticated users
GRANT SELECT ON conversation_summaries TO authenticated;

commit;