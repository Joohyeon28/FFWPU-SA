-- Add phone_country_code column to user_profiles table
ALTER TABLE user_profiles
ADD COLUMN phone_country_code TEXT DEFAULT '+27';

-- Add comment to the column
COMMENT ON COLUMN user_profiles.phone_country_code IS 'Country code for phone number (e.g., +27 for South Africa)';
