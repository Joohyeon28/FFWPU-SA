import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { supabaseClient } from "@/lib/supabase";

interface AdminContextType {
  isAdmin: boolean;
  isSuperAdmin: boolean;
  adminRole: string | null;
  isLoading: boolean;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [adminRole, setAdminRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const checkAdminStatus = async () => {
      console.log("🔍 Checking admin status for user:", user?.id);
      
      if (!user) {
        console.log("❌ No user, setting isAdmin=false");
        if (mounted) {
          setIsAdmin(false);
          setIsLoading(false);
        }
        return;
      }

      try {
        const { data, error } = await supabaseClient
          .from("admins")
          .select("id, role")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) {
          console.error("❌ Error checking admin status:", error);
        }

        console.log("✅ Admin query result:", { data, error });

        if (mounted) {
          const adminStatus = !!data;
          const superAdminStatus = data?.role === 'super_admin';
          console.log("👤 User admin status:", { isAdmin: adminStatus, isSuperAdmin: superAdminStatus, role: data?.role });
          setIsAdmin(adminStatus);
          setIsSuperAdmin(superAdminStatus);
          setAdminRole(data?.role || null);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("❌ Error checking admin status:", error);
        if (mounted) {
          setIsAdmin(false);
          setIsSuperAdmin(false);
          setAdminRole(null);
          setIsLoading(false);
        }
      }
    };

    checkAdminStatus();

    return () => {
      mounted = false;
    };
  }, [user]);

  return (
    <AdminContext.Provider value={{ isAdmin, isSuperAdmin, adminRole, isLoading }}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error("useAdmin must be used within AdminProvider");
  }
  return context;
};
