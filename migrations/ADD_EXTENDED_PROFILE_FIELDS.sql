-- Add extended profile fields to user_profiles table
-- Migration: ADD_EXTENDED_PROFILE_FIELDS
-- Date: 2025-12-04

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS family_name TEXT,
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS gender TEXT,
ADD COLUMN IF NOT EXISTS country TEXT,
ADD COLUMN IF NOT EXISTS province TEXT,
ADD COLUMN IF NOT EXISTS country_of_birth TEXT,
ADD COLUMN IF NOT EXISTS category_of_member TEXT,
ADD COLUMN IF NOT EXISTS tithing TEXT,
ADD COLUMN IF NOT EXISTS marital_status TEXT,
ADD COLUMN IF NOT EXISTS education_status TEXT;

-- Add comments for documentation
COMMENT ON COLUMN user_profiles.family_name IS 'Family or surname of the user';
COMMENT ON COLUMN user_profiles.date_of_birth IS 'Date of birth of the user';
COMMENT ON COLUMN user_profiles.gender IS 'Gender of the user';
COMMENT ON COLUMN user_profiles.country IS 'Current country of residence';
COMMENT ON COLUMN user_profiles.province IS 'Current province/state of residence';
COMMENT ON COLUMN user_profiles.country_of_birth IS 'Country where the user was born';
COMMENT ON COLUMN user_profiles.category_of_member IS 'Membership category';
COMMENT ON COLUMN user_profiles.tithing IS 'Tithing information or status';
COMMENT ON COLUMN user_profiles.marital_status IS 'Marital status of the user';
COMMENT ON COLUMN user_profiles.education_status IS 'Education level or status';
