-- Fix infinite recursion in conversation_members RLS policy
-- Solution: Create a helper function to avoid recursion

-- Drop ALL existing policies on conversation_members
DROP POLICY IF EXISTS "Users can view their own memberships" ON conversation_members;
DROP POLICY IF EXISTS "Users can view members of their conversations" ON conversation_members;
DROP POLICY IF EXISTS "Users can only insert themselves as members" ON conversation_members;
DROP POLICY IF EXISTS "Users can insert themselves as members" ON conversation_members;
DROP POLICY IF EXISTS "Users can remove themselves from conversations" ON conversation_members;

-- Create a function that checks if user is member (avoids recursion by using SECURITY DEFINER)
CREATE OR REPLACE FUNCTION is_conversation_member(conversation_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM conversation_members
    WHERE conversation_id = conversation_uuid
    AND user_id = user_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Now use the function in the policy (no recursion!)
CREATE POLICY "Users can view members of their conversations"
ON conversation_members
FOR SELECT
USING (is_conversation_member(conversation_id, auth.uid()));

-- Allow inserting members if you are already a member of the conversation
CREATE POLICY "Users can insert members to their conversations"
ON conversation_members
FOR INSERT
WITH CHECK (is_conversation_member(conversation_id, auth.uid()));

-- Allow removing yourself from conversations
CREATE POLICY "Users can remove themselves from conversations"
ON conversation_members
FOR DELETE
USING (user_id = auth.uid());
