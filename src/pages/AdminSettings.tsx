import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAdmin } from "@/contexts/AdminContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabaseClient } from "@/lib/supabase";
import { ArrowLeft, Plus, Trash2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Admin {
  id: string;
  user_id: string;
  role: string;
  user?: {
    email?: string;
  };
}

const AdminSettings = () => {
    // Scroll to top on mount
    useEffect(() => {
      window.scrollTo({ top: 0, behavior: "auto" });
    }, []);
  const { user, isLoading: authLoading } = useAuth();
  const { isAdmin, isSuperAdmin, isLoading: adminLoading } = useAdmin();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [addingAdmin, setAddingAdmin] = useState(false);

  useEffect(() => {
    if (authLoading || adminLoading) return;
    if (!user || !isAdmin) {
      navigate("/");
      return;
    }
    fetchAdmins();
  }, [user, isAdmin, authLoading, adminLoading, navigate]);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      
      // First get admins
      const { data: adminData, error: adminError } = await supabaseClient
        .from("admins")
        .select("id, user_id, role, created_at")
        .order("created_at", { ascending: false });

      if (adminError) throw adminError;

      if (!adminData || adminData.length === 0) {
        setAdmins([]);
        return;
      }

      // Then get user profiles
      const userIds = adminData.map((admin) => admin.user_id);
      const { data: profiles, error: profileError } = await supabaseClient
        .from("user_profiles")
        .select("user_id, email")
        .in("user_id", userIds);

      if (profileError) throw profileError;

      // Combine the data
      const adminsWithProfiles = adminData.map((admin) => ({
        ...admin,
        user: profiles?.find((p) => p.user_id === admin.user_id) || { email: "Unknown" },
      }));

      setAdmins(adminsWithProfiles);
    } catch (error) {
      console.error("Error fetching admins:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load admin list",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail.trim()) return;

    try {
      setAddingAdmin(true);

      // Find user by email
      const { data: userData, error: userError } = await supabaseClient
        .from("user_profiles")
        .select("user_id")
        .eq("email", newAdminEmail.trim())
        .maybeSingle();

      if (userError || !userData) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "User not found with that email",
        });
        return;
      }

      // Check if already admin
      const { data: existingAdmin } = await supabaseClient
        .from("admins")
        .select("id")
        .eq("user_id", userData.user_id)
        .maybeSingle();

      if (existingAdmin) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "User is already an admin",
        });
        return;
      }

      // Add as admin (regular admin role by default)
      const { error: addError } = await supabaseClient
        .from("admins")
        .insert({ user_id: userData.user_id, role: 'admin' });

      if (addError) throw addError;

      toast({
        title: "Success",
        description: `${newAdminEmail} has been added as an admin`,
      });

      setNewAdminEmail("");
      fetchAdmins();
    } catch (error) {
      console.error("Error adding admin:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add admin",
      });
    } finally {
      setAddingAdmin(false);
    }
  };

  const handleRemoveAdmin = async (adminId: string, adminEmail: string) => {
    try {
      const { error } = await supabaseClient
        .from("admins")
        .delete()
        .eq("id", adminId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `${adminEmail} is no longer an admin`,
      });

      fetchAdmins();
    } catch (error) {
      console.error("Error removing admin:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to remove admin",
      });
    }
  };

  if (authLoading || adminLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!isAdmin) {
    navigate("/");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="border-b bg-background">
        <div className="container py-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin/dashboard")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Admin Settings</h1>
              <p className="text-muted-foreground">Manage admin users and permissions</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-12 max-w-2xl">
        {/* Only super admins can add new admins */}
        {!isSuperAdmin && (
          <Card className="shadow-card mb-8 bg-muted/50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Limited Access</p>
                  <p className="text-sm text-muted-foreground">
                    Only Super Admins can add or remove admin users. Contact a Super Admin if you need to make changes.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Add Admin */}
        {isSuperAdmin && (
          <Card className="shadow-card mb-8">
            <CardHeader>
              <CardTitle>Add Admin User</CardTitle>
              <CardDescription>Grant administrator privileges to a member</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddAdmin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">User Email</Label>
                  <div className="flex gap-2">
                    <Input
                      id="email"
                      type="email"
                      placeholder="user@example.com"
                      value={newAdminEmail}
                      onChange={(e) => setNewAdminEmail(e.target.value)}
                    />
                    <Button type="submit" disabled={addingAdmin || !newAdminEmail.trim()}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Admin
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Current Admins */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Current Admins</CardTitle>
            <CardDescription>List of all users with admin privileges</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-8 text-center text-muted-foreground">Loading admins...</div>
            ) : admins.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">No admins found</div>
            ) : (
              <div className="space-y-2">
                {admins.map((admin) => {
                  const adminEmail = (admin.user as any)?.email || admin.user_id;
                  const isCurrentUser = user?.id === admin.user_id;
                  const canRemove = isSuperAdmin && !isCurrentUser;

                  return (
                    <div
                      key={admin.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-secondary/30 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{adminEmail}</p>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            admin.role === 'super_admin'
                              ? "bg-purple-500/10 text-purple-700"
                              : "bg-blue-500/10 text-blue-700"
                          }`}>
                            {admin.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                          </span>
                        </div>
                        {isCurrentUser && (
                          <p className="text-xs text-muted-foreground mt-1">You</p>
                        )}
                      </div>
                      {canRemove && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remove Admin</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will remove admin privileges from {adminEmail}.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleRemoveAdmin(admin.id, adminEmail)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Remove
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Warning */}
        <Card className="shadow-card border-yellow-500/20 bg-yellow-500/5 mt-8">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <CardTitle className="text-yellow-800">Important</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-yellow-700">
              Admin users have full access to manage users, conversations, and events. Only grant admin
              privileges to trusted members. Be careful when managing admin accounts.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AdminSettings;
