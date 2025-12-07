-- Consolidated Profile Updates Migration
-- Run this in your Supabase SQL Editor
-- Date: 2025-12-04

-- Step 1: Add extended profile fields
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

-- Step 2: Add marital status detail fields
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS single_category TEXT,
ADD COLUMN IF NOT EXISTS blessed_child_generation TEXT,
ADD COLUMN IF NOT EXISTS parents_blessing_group TEXT,
ADD COLUMN IF NOT EXISTS children_names TEXT[],
ADD COLUMN IF NOT EXISTS spouse_name TEXT,
ADD COLUMN IF NOT EXISTS date_of_marriage DATE,
ADD COLUMN IF NOT EXISTS blessing_group TEXT,
ADD COLUMN IF NOT EXISTS date_of_blessing DATE,
ADD COLUMN IF NOT EXISTS ascension_date TEXT,
ADD COLUMN IF NOT EXISTS seonghwa_date DATE;

-- Step 3: Add education degree fields
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS education_degree_status TEXT,
ADD COLUMN IF NOT EXISTS education_degree TEXT,
ADD COLUMN IF NOT EXISTS education_institution TEXT;

-- Step 4: Add tithing type field
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS tithing_type TEXT;

-- Step 5: Add phone country code field
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS phone_country_code TEXT DEFAULT '+27';

-- Add all column comments
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
COMMENT ON COLUMN user_profiles.single_category IS 'Single category: 1st Generation, Blessed Child, or Jacobs Child';
COMMENT ON COLUMN user_profiles.blessed_child_generation IS 'Generation for blessed children (2nd-5th)';
COMMENT ON COLUMN user_profiles.parents_blessing_group IS 'Parents blessing group for blessed children';
COMMENT ON COLUMN user_profiles.children_names IS 'Array of children names for previously married users';
COMMENT ON COLUMN user_profiles.spouse_name IS 'Spouse name for blessed, widowed, or previously married members';
COMMENT ON COLUMN user_profiles.date_of_marriage IS 'Date of marriage for previously married members';
COMMENT ON COLUMN user_profiles.blessing_group IS 'Blessing group information including generation if applicable';
COMMENT ON COLUMN user_profiles.date_of_blessing IS 'Date of blessing ceremony';
COMMENT ON COLUMN user_profiles.ascension_date IS 'Ascension date for widowed members';
COMMENT ON COLUMN user_profiles.seonghwa_date IS 'Seonghwa date for widowed members';
COMMENT ON COLUMN user_profiles.education_degree_status IS 'Degree status: Graduated, Currently Attending, or Taking a Break';
COMMENT ON COLUMN user_profiles.education_degree IS 'Name of the degree (e.g., Bachelor of Science)';
COMMENT ON COLUMN user_profiles.education_institution IS 'Name of the educational institution';
COMMENT ON COLUMN user_profiles.tithing_type IS 'Type of tithing contribution (Financial, Time, Holy Day Donation)';
COMMENT ON COLUMN user_profiles.phone_country_code IS 'Country code for phone number (e.g., +27 for South Africa)';
