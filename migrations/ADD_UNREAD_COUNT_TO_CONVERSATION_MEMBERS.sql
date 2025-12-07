-- Add unread_count to conversation_members to persist per-user unread counts
BEGIN;

ALTER TABLE IF EXISTS public.conversation_members
ADD COLUMN IF NOT EXISTS unread_count integer DEFAULT 0 NOT NULL;

-- Backfill unread_count using messages table: count messages per conversation not sent by member and not read
DO $$
DECLARE
  rec RECORD;
  cnt integer;
BEGIN
  FOR rec IN SELECT conversation_id, user_id FROM public.conversation_members LOOP
    SELECT COUNT(*) INTO cnt
    FROM public.messages m
    WHERE m.conversation_id = rec.conversation_id
      AND m.sender_id <> rec.user_id
      AND (m.is_read IS DISTINCT FROM TRUE OR m.is_read = FALSE);

    UPDATE public.conversation_members
    SET unread_count = cnt
    WHERE conversation_id = rec.conversation_id AND user_id = rec.user_id;
  END LOOP;
END$$;

COMMIT;
