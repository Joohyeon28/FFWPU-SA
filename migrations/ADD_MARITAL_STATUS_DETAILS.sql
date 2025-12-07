-- Add marital status detail fields to user_profiles table
-- Migration: ADD_MARITAL_STATUS_DETAILS
-- Date: 2025-12-04

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS single_category TEXT,
ADD COLUMN IF NOT EXISTS blessed_child_generation TEXT,
ADD COLUMN IF NOT EXISTS children_names TEXT[],
ADD COLUMN IF NOT EXISTS spouse_name TEXT,
ADD COLUMN IF NOT EXISTS date_of_marriage DATE,
ADD COLUMN IF NOT EXISTS blessing_group TEXT,
ADD COLUMN IF NOT EXISTS date_of_blessing DATE,
ADD COLUMN IF NOT EXISTS ascension_date TEXT,
ADD COLUMN IF NOT EXISTS seonghwa_date DATE;

-- Add comments for documentation
COMMENT ON COLUMN user_profiles.single_category IS 'Single category: 1st Generation, Blessed Child, or Jacobs Child';
COMMENT ON COLUMN user_profiles.blessed_child_generation IS 'Generation for blessed children (2nd-5th)';
COMMENT ON COLUMN user_profiles.children_names IS 'Array of children names for previously married users';
COMMENT ON COLUMN user_profiles.spouse_name IS 'Spouse name for blessed, widowed, or previously married members';
COMMENT ON COLUMN user_profiles.date_of_marriage IS 'Date of marriage for previously married members';
COMMENT ON COLUMN user_profiles.blessing_group IS 'Blessing group information including generation if applicable';
COMMENT ON COLUMN user_profiles.date_of_blessing IS 'Date of blessing ceremony';
COMMENT ON COLUMN user_profiles.ascension_date IS 'Ascension date for widowed members';
COMMENT ON COLUMN user_profiles.seonghwa_date IS 'Seonghwa date for widowed members';
