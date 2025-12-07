import { createContext, useContext, useEffect, useState } from "react";
import { supabaseAuth, supabaseFetch, supabaseClient } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";

interface User {
  id: string;
  email?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  profileCompleted: boolean | null;
  signOut: () => Promise<void>;
  refreshProfileStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [profileCompleted, setProfileCompleted] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;

    // Helper to create user profile if missing
    const ensureUserProfile = async (user: User) => {
      if (!mounted) return;
      
      try {
        console.log("🔍 Checking if profile exists for user:", user.id);
        // Check if profile exists
        const { data: existingProfile, error: checkError } = await supabaseClient
          .from('user_profiles')
          .select('id,profile_completed,user_id')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (!mounted) return;

        if (checkError) {
          console.error("Error checking profile:", checkError);
          setProfileCompleted(null);
          return;
        }

        if (existingProfile) {
          console.log("✅ Profile exists:", existingProfile);
          setProfileCompleted(existingProfile.profile_completed || false);
        } else {
          // Profile doesn't exist, create it
          console.log("🆕 Creating new profile for user:", user.id);
          setProfileCompleted(false);
          
          // Create profile
          const { error: createError } = await supabaseClient
            .from('user_profiles')
            .insert({
              user_id: user.id,
              email: user.email,
              profile_completed: false,
            });

          if (createError) {
            console.error("❌ Error creating profile:", createError);
          } else {
            console.log("✅ Profile created successfully");
          }
        }
      } catch (error) {
        if (!mounted) return;
        console.error("Error ensuring user profile:", error);
        setProfileCompleted(null);
      }
    };

    // Check current session
    const checkSession = async () => {
      try {
        const { data } = await supabaseClient.auth.getSession();
        const currentUser = data?.session?.user || null;
        
        if (!mounted) return;
        setUser(currentUser);

        // Create profile if user is authenticated and profile doesn't exist
        if (currentUser) {
          await ensureUserProfile(currentUser);
        }
      } catch (error) {
        console.error("Error checking session:", error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    checkSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user || null;
      
      if (!mounted) return;
      setUser(currentUser);

      // Create profile on sign-in if it doesn't exist (non-blocking)
      if (currentUser) {
        ensureUserProfile(currentUser).catch(err => 
          console.error("Error in ensureUserProfile:", err)
        );
      } else {
        setProfileCompleted(null);
      }
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const refreshProfileStatus = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabaseClient
        .from('user_profiles')
        .select('profile_completed')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error("Error refreshing profile status:", error);
        return;
      }

      if (data) {
        setProfileCompleted(data.profile_completed || false);
      }
    } catch (error) {
      console.error("Error refreshing profile status:", error);
    }
  };

  const signOut = async () => {
    // Sign out via Supabase client (removes persisted session)
    await supabaseClient.auth.signOut();

    // Proactively remove any Supabase auth tokens persisted in localStorage
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("sb-")) {
          localStorage.removeItem(key);
        }
      }
    } catch (e) {
      console.warn("Failed to clear localStorage auth keys", e);
    }

    // Clear auth-related state
    setUser(null);
    setProfileCompleted(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, profileCompleted, signOut, refreshProfileStatus }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
