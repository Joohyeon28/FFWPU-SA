-- Add education degree status fields to user_profiles table
ALTER TABLE user_profiles
ADD COLUMN education_degree_status TEXT,
ADD COLUMN education_degree TEXT,
ADD COLUMN education_institution TEXT;

-- Add comment to explain the fields
COMMENT ON COLUMN user_profiles.education_degree_status IS 'Degree status: Graduated, Currently Attending, or Taking a Break';
COMMENT ON COLUMN user_profiles.education_degree IS 'Name of the degree (e.g., Bachelor of Science)';
COMMENT ON COLUMN user_profiles.education_institution IS 'Name of the educational institution';
