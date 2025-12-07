-- Add tithing_type column to user_profiles table
ALTER TABLE user_profiles
ADD COLUMN tithing_type TEXT;

-- Add comment to the column
COMMENT ON COLUMN user_profiles.tithing_type IS 'Type of tithing contribution (Financial, Time, Holy Day Donation)';
