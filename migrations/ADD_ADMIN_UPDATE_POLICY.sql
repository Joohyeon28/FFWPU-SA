-- Add policy to allow admins to update any user profile

-- The is_admin function already exists and is used by other policies
-- No need to recreate it

-- Drop existing update policy if it exists
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON user_profiles;

-- Create policy for users to update their own profiles
CREATE POLICY "Users can update own profile"
ON user_profiles
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Create policy for admins to update any profile
CREATE POLICY "Admins can update any profile"
ON user_profiles
FOR UPDATE
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Also ensure admins can read all profiles (if not already set)
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
CREATE POLICY "Admins can view all profiles"
ON user_profiles
FOR SELECT
USING (is_admin(auth.uid()));
