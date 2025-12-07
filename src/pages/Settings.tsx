import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { fetchUserProfile } from "@/lib/profile";
import { Users, User, Settings as SettingsIcon, Shield, LogOut, Trash2, Home, MessageSquare, CalendarDays } from "lucide-react";
import { supabaseAuth } from "@/lib/supabase";

const Settings = () => {
    // Scroll to top on mount
    useEffect(() => {
      window.scrollTo({ top: 0, behavior: "auto" });
    }, []);
  const { user, isLoading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["userProfile", user?.id],
    queryFn: () => (user ? fetchUserProfile(user.id) : null),
    enabled: !!user,
  });

  if (authLoading || profileLoading) {
    return (
      <div className="flex min-h-screen bg-background">
        <main className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Loading...</p>
        </main>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen bg-background">
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-lg font-medium mb-4">Please log in</p>
            <Button onClick={() => navigate("/login")}>Go to Login</Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-subtle">
      {/* Sidebar */}
      <aside className="hidden w-64 border-r bg-secondary/30 lg:block">
        <div className="flex h-full flex-col">
          <div className="p-6">
            <Link to="/" className="flex items-center gap-2 font-semibold text-foreground">
              <img src="/FFWPU Logo.png" alt="FFWPU-SA Logo" className="h-10 w-10" />
              <span>FFWPU-SA</span>
            </Link>
          </div>

          <nav className="flex-1 space-y-1 px-3">
            <Button variant="ghost" className="w-full justify-start" asChild>
              <Link to="/dashboard">
                <User className="mr-2 h-4 w-4" />
                My Profile
              </Link>
            </Button>
            <Button variant="subtle" className="w-full justify-start" asChild>
              <Link to="/settings">
                <SettingsIcon className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </Button>
          </nav>

          <div className="space-y-1 px-3 pb-3">
            <Button variant="ghost" className="w-full justify-start" asChild>
              <Link to="/">
                <Home className="mr-2 h-4 w-4" />
                Home
              </Link>
            </Button>
            <Button variant="ghost" className="w-full justify-start" asChild>
              <Link to="/messages">
                <MessageSquare className="mr-2 h-4 w-4" />
                Messages
              </Link>
            </Button>
            <Button variant="ghost" className="w-full justify-start" asChild>
              <Link to="/events">
                <CalendarDays className="mr-2 h-4 w-4" />
                Events
              </Link>
            </Button>
          </div>

          <div className="border-t p-3">
            <Button variant="ghost" className="w-full justify-start text-muted-foreground" onClick={signOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 animate-fade-in">
        {/* Mobile header */}
        <header className="border-b bg-background p-4 lg:hidden">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 font-semibold">
              <img src="/FFWPU Logo.png" alt="FFWPU-SA Logo" className="h-10 w-10" />
              <span>FFWPU-SA</span>
            </Link>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" asChild>
                <Link to="/">
                  <Home className="h-5 w-5" />
                </Link>
              </Button>
              <Button variant="ghost" size="icon" asChild>
                <Link to="/messages">
                  <MessageSquare className="h-5 w-5" />
                </Link>
              </Button>
              <Button variant="ghost" size="icon" asChild>
                <Link to="/events">
                  <CalendarDays className="h-5 w-5" />
                </Link>
              </Button>
              <Button variant="ghost" size="icon" asChild>
                <Link to="/dashboard">
                  <User className="h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </header>

        <div className="container max-w-4xl py-12">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>Manage your profile and preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-lg border p-4 bg-background">
                <p className="text-sm text-muted-foreground">Signed in as</p>
                <p className="text-lg font-medium">{user?.email}</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button className="shadow-soft" onClick={() => navigate("/profile/edit")}>Edit Profile</Button>
                <Button variant="secondary" className="shadow-soft" onClick={() => navigate("/profile/edit")}>Change Avatar</Button>
                <Button variant="destructive" className="shadow-soft" onClick={() => { signOut(); navigate("/"); }}>Sign out</Button>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="shadow-card border-destructive/50 mt-6">
            <CardHeader className="bg-destructive/5">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-destructive" />
                <CardTitle className="text-destructive">Danger Zone</CardTitle>
              </div>
              <CardDescription>
                Irreversible and destructive actions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="rounded-lg border border-destructive/50 p-4 bg-destructive/5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-destructive mb-1">Delete Account</h3>
                    <p className="text-sm text-muted-foreground">
                      Permanently delete your account and all associated data. This action cannot be undone.
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="shadow-soft flex-shrink-0"
                    onClick={async () => {
                      if (!user) return;
                      
                      const confirmText = window.prompt(
                        'This will permanently delete your account and all your data.\n\nType "DELETE" to confirm:'
                      );
                      
                      if (confirmText !== "DELETE") {
                        return;
                      }

                      try {
                        // Get the current session
                        const { data: { session } } = await supabaseAuth.getSession();
                        if (!session) {
                          throw new Error("No active session");
                        }

                        // Call the Edge Function to delete the account
                        const response = await fetch(
                          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-account`,
                          {
                            method: 'POST',
                            headers: {
                              'Authorization': `Bearer ${session.access_token}`,
                              'Content-Type': 'application/json',
                            },
                          }
                        );

                        if (!response.ok) {
                          const error = await response.json();
                          throw new Error(error.error || 'Failed to delete account');
                        }

                        // Clear local storage and session
                        localStorage.clear();
                        sessionStorage.clear();
                        
                        // Redirect to homepage with full reload
                        window.location.href = "/";
                      } catch (err) {
                        console.error("Error deleting account:", err);
                        alert(`Failed to delete account: ${err instanceof Error ? err.message : 'Unknown error'}`);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Account
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Settings;
