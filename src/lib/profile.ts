import { supabaseFetch } from "@/lib/supabase";

export interface UserProfile {
  id: string;
  user_id: string;
  full_name?: string | null;
  family_name?: string | null;
  email?: string | null;
  phone_number?: string | null;
  phone_country_code?: string | null;
  avatar_url?: string | null;
  family_photo_url?: string | null;
  bio?: string | null;
  date_of_birth?: string | null;
  gender?: string | null;
  country?: string | null;
  province?: string | null;
  country_of_birth?: string | null;
  category_of_member?: string | null;
  tithing?: string | null;
  tithing_type?: string | null;
  marital_status?: string | null;
  single_category?: string | null;
  blessed_child_generation?: string | null;
  parents_blessing_group?: string | null;
  children_names?: string[] | null;
  spouse_name?: string | null;
  date_of_marriage?: string | null;
  blessing_group?: string | null;
  date_of_blessing?: string | null;
  ascension_date?: string | null;
  seonghwa_date?: string | null;
  education_status?: string | null;
  education_degree_status?: string | null;
  education_degree?: string | null;
  education_institution?: string | null;
  extra_fields?: Array<{ title: string; value: string }> | null;
  profile_completed: boolean;
  created_at: string;
  updated_at: string;
}

export const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    const response = await supabaseFetch(`user_profiles?user_id=eq.${userId}&select=*`);
    
    if (!response.ok) {
      console.error("Error fetching profile:", response.status);
      return null;
    }
    
    const data = await response.json();
    return Array.isArray(data) && data.length > 0 ? data[0] : null;
  } catch (err) {
    console.error("Exception in fetchUserProfile:", err);
    return null;
  }
};

export const createUserProfile = async (userId: string): Promise<UserProfile> => {
  const response = await supabaseFetch('user_profiles', {
    method: 'POST',
    headers: { 'Prefer': 'return=representation' },
    body: JSON.stringify({
      user_id: userId,
      profile_completed: false,
    }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create profile');
  }
  
  const data = await response.json();
  return Array.isArray(data) ? data[0] : data;
};

export const updateUserProfile = async (userId: string, updates: Partial<UserProfile>) => {
  const response = await supabaseFetch(`user_profiles?user_id=eq.${userId}`, {
    method: 'PATCH',
    headers: { 'Prefer': 'return=representation' },
    body: JSON.stringify(updates),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update profile');
  }
  
  const data = await response.json();
  return Array.isArray(data) ? data[0] : data;
};

export const completeProfile = async (userId: string, profileData: {
  full_name: string;
  family_name?: string;
  bio?: string;
  phone_number?: string;
  phone_country_code?: string;
  date_of_birth?: string;
  gender?: string;
  country?: string;
  province?: string;
  country_of_birth?: string;
  category_of_member?: string;
  tithing?: string;
  tithing_type?: string;
  marital_status?: string;
  single_category?: string;
  blessed_child_generation?: string;
  parents_blessing_group?: string;
  children_names?: string[];
  spouse_name?: string;
  date_of_marriage?: string;
  blessing_group?: string;
  date_of_blessing?: string;
  ascension_date?: string;
  seonghwa_date?: string;
  education_status?: string;
  education_degree_status?: string;
  education_degree?: string;
  education_institution?: string;
  avatar_url?: string;
  family_photo_url?: string;
  extra_fields?: Array<{ title: string; value: string }>;
}): Promise<UserProfile> => {
  const response = await supabaseFetch(`user_profiles?user_id=eq.${userId}`, {
    method: 'PATCH',
    headers: { 'Prefer': 'return=representation' },
    body: JSON.stringify({
      ...profileData,
      profile_completed: true,
      updated_at: new Date().toISOString(),
    }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to complete profile');
  }
  
  const data = await response.json();
  return Array.isArray(data) ? data[0] : data;
};
