import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { fetchUserProfile, updateUserProfile } from "@/lib/profile";
import UserAvatar from "@/components/UserAvatar";
import { 
  Users, 
  Settings, 
  LogOut, 
  Plus, 
  Edit2, 
  Trash2, 
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Home,
  MessageSquare,
  CalendarDays
} from "lucide-react";

// Mock user data - will be replaced with Supabase data
const mockUser = {
  name: "John Doe",
  email: "john@example.com",
  avatar: "",
  description: "Community enthusiast and tech lover",
  fields: [
    { id: "1", label: "Location", value: "San Francisco, CA", icon: MapPin },
    { id: "2", label: "Role", value: "Software Developer", icon: Briefcase },
  ]
};

const Dashboard = () => {
    // Scroll to top on mount
    useEffect(() => {
      window.scrollTo({ top: 0, behavior: "auto" });
    }, []);
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editValue, setEditValue] = useState("");
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null);

  const { data: profile, isLoading: profileLoading, error: profileError, isFetched } = useQuery({
    queryKey: ["userProfile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      console.log("📊 Dashboard fetching profile for user:", user.id);
      const result = await fetchUserProfile(user.id);
      console.log("📊 Dashboard profile result:", result);
      console.log("📊 Dashboard profile loaded successfully, profile_completed:", result?.profile_completed);
      return result;
    },
    enabled: !!user,
    retry: 1,
    staleTime: 1000 * 60, // 1 minute
  });

  console.log("📊 Dashboard query state:", { profileLoading, isFetched, hasProfile: !!profile, authLoading });

  // Redirect to profile setup if profile not completed or doesn't exist
  useEffect(() => {
    console.log("📊 Dashboard useEffect:", { authLoading, profileLoading, hasUser: !!user, profile, profileError });
    
    if (!authLoading && user) {
      // If profile is still loading, wait
      if (profileLoading) {
        console.log("⏳ Dashboard waiting for profile to load...");
        return;
      }
      
      // If no profile or profile not completed, redirect to setup
      if (!profile || !profile.profile_completed) {
        console.log("🔄 Dashboard redirecting to profile setup");
        navigate("/profile/setup");
      } else {
        console.log("✅ Dashboard profile is complete, showing dashboard");
      }
    }
  }, [authLoading, profileLoading, user, profile, navigate]);

  const startInlineEdit = (index: number) => {
    if (!profile) return;
    const field = profile.extra_fields?.[index];
    if (!field) return;
    setEditingIndex(index);
    setEditTitle(field.title || "");
    setEditValue(field.value || "");
  };

  const cancelInlineEdit = () => {
    setEditingIndex(null);
    setEditTitle("");
    setEditValue("");
  };

  const saveInlineEdit = async () => {
    if (editingIndex === null || !profile || !user) return;
    const newFields = (profile.extra_fields || []).map((f, i) =>
      i === editingIndex ? { ...f, title: editTitle, value: editValue } : f
    );
    try {
      await updateUserProfile(user.id, { extra_fields: newFields });
      await queryClient.invalidateQueries({ queryKey: ["userProfile", user.id] });
      cancelInlineEdit();
    } catch (err) {
      console.error("Failed to save field", err);
    }
  };

  const confirmDeleteField = async () => {
    if (deletingIndex === null || !user || !profile) return;
    const newFields = (profile.extra_fields || []).filter((_, i) => i !== deletingIndex);
    try {
      await updateUserProfile(user.id, { extra_fields: newFields });
      await queryClient.invalidateQueries({ queryKey: ["userProfile", user.id] });
    } catch (err) {
      console.error("Failed to delete field", err);
    } finally {
      setDeletingIndex(null);
    }
  };

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
            <Button variant="subtle" className="w-full justify-start" asChild>
              <Link to="/dashboard">
                <User className="mr-2 h-4 w-4" />
                My Profile
              </Link>
            </Button>
            <Button variant="ghost" className="w-full justify-start" asChild>
              <Link to="/settings">
                <Settings className="mr-2 h-4 w-4" />
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
            <Button variant="ghost" className="w-full justify-start text-muted-foreground">
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
                <Link to="/settings">
                  <Settings className="h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </header>

        <div className="container max-w-4xl py-12">
          {/* Profile header */}
          <Card className="mb-8 shadow-card border-primary/10 bg-gradient-to-br from-white via-primary/5 to-white">
            <CardContent className="p-6 border-b border-primary/10">
              <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
                <div className="relative">
                  <UserAvatar src={profile?.avatar_url || null} className="h-24 w-24 flex-shrink-0 ring-4 ring-primary/20" />
                </div>
                <div className="flex-1 text-center sm:text-left min-w-0">
                  <h1 className="text-3xl font-bold text-primary">{profile?.full_name || "Complete Profile"}</h1>
                  <p className="flex items-center justify-center gap-2 text-muted-foreground mt-2 sm:justify-start">
                    <Mail className="h-4 w-4 text-primary" />
                    {profile?.email || user?.email}
                  </p>
                  <p className="mt-3 text-muted-foreground whitespace-pre-wrap break-words">{profile?.bio || "No bio yet"}</p>
                </div>
                <Button className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-card flex-shrink-0" asChild>
                  <Link to="/profile/edit">
                    <Edit2 className="mr-2 h-4 w-4" />
                    Edit Profile
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Profile fields */}
          <div className="space-y-6">
            {/* Contact Information */}
            <div>
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-primary">My Contact Information</h2>
                <p className="text-sm text-muted-foreground">
                  Your contact details
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Card className="shadow-card border-primary/10 hover:shadow-elevated transition-all hover:border-primary/30 bg-gradient-to-br from-white via-primary/5 to-white">
                  <CardContent className="flex items-start gap-4 p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
                      <Mail className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-primary">Email</p>
                      <p className="font-medium break-all text-foreground">{profile?.email || user?.email}</p>
                    </div>
                  </CardContent>
                </Card>

                {profile?.phone_number && (
                  <Card className="shadow-card border-primary/10 hover:shadow-elevated transition-all hover:border-primary/30 bg-gradient-to-br from-white via-primary/5 to-white">
                    <CardContent className="flex items-start gap-4 p-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
                        <Phone className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-primary">Phone</p>
                        <p className="font-medium text-foreground">
                          {profile.phone_country_code && `${profile.phone_country_code} `}
                          {profile.phone_number}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            {/* Extended Profile Information */}
            {(profile?.gender || profile?.country || profile?.province || profile?.country_of_birth || profile?.category_of_member || profile?.tithing || profile?.marital_status || profile?.education_status) && (
              <div>
                <div className="mb-4">
                  <h2 className="text-xl font-semibold text-primary">My Profile Information</h2>
                  <p className="text-sm text-muted-foreground">
                    Your detailed profile information
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {profile?.gender && (
                    <Card className="shadow-card border-primary/10 hover:shadow-elevated transition-all hover:border-primary/30 bg-gradient-to-br from-white via-primary/5 to-white">
                      <CardContent className="flex items-start gap-4 p-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-primary">Gender</p>
                          <p className="font-medium text-foreground">{profile.gender}</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {profile?.country && (
                    <Card className="shadow-card border-primary/10 hover:shadow-elevated transition-all hover:border-primary/30 bg-gradient-to-br from-white via-primary/5 to-white">
                      <CardContent className="flex items-start gap-4 p-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
                          <MapPin className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-primary">Country</p>
                          <p className="font-medium text-foreground">{profile.country}</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {profile?.province && (
                    <Card className="shadow-card border-primary/10 hover:shadow-elevated transition-all hover:border-primary/30 bg-gradient-to-br from-white via-primary/5 to-white">
                      <CardContent className="flex items-start gap-4 p-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
                          <MapPin className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-primary">Province</p>
                          <p className="font-medium text-foreground">{profile.province}</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {profile?.country_of_birth && (
                    <Card className="shadow-card border-primary/10 hover:shadow-elevated transition-all hover:border-primary/30 bg-gradient-to-br from-white via-primary/5 to-white">
                      <CardContent className="flex items-start gap-4 p-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
                          <MapPin className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-primary">Country of Birth</p>
                          <p className="font-medium text-foreground">{profile.country_of_birth}</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {profile?.category_of_member && (
                    <Card className="shadow-card border-primary/10 hover:shadow-elevated transition-all hover:border-primary/30 bg-gradient-to-br from-white via-primary/5 to-white">
                      <CardContent className="flex items-start gap-4 p-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-primary">Category</p>
                          <p className="font-medium text-foreground">{profile.category_of_member}</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {profile?.marital_status && (
                    <Card className="shadow-card border-primary/10 hover:shadow-elevated transition-all hover:border-primary/30 bg-gradient-to-br from-white via-primary/5 to-white">
                      <CardContent className="flex items-start gap-4 p-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-primary">Marital Status</p>
                          <p className="font-medium text-foreground">{profile.marital_status}</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {profile?.education_status && (
                    <Card className="shadow-card border-primary/10 hover:shadow-elevated transition-all hover:border-primary/30 bg-gradient-to-br from-white via-primary/5 to-white">
                      <CardContent className="flex items-start gap-4 p-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
                          <Briefcase className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-primary">Education</p>
                          <p className="font-medium text-foreground">{profile.education_status}</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {profile?.tithing && (
                    <Card className="shadow-card border-primary/10 hover:shadow-elevated transition-all hover:border-primary/30 bg-gradient-to-br from-white via-primary/5 to-white">
                      <CardContent className="flex items-start gap-4 p-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
                          <Briefcase className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-primary">Tithing</p>
                          <p className="font-medium text-foreground">{profile.tithing}</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            )}

            {(profile?.marital_status || profile?.single_category || profile?.blessed_child_generation || profile?.parents_blessing_group || profile?.spouse_name || profile?.date_of_marriage || profile?.blessing_group || profile?.date_of_blessing || profile?.ascension_date || profile?.seonghwa_date || (profile?.children_names && profile.children_names.length > 0)) && (
              <div>
                <div className="mb-4">
                  <h2 className="text-xl font-semibold text-primary">Family & Marital Information</h2>
                  <p className="text-sm text-muted-foreground">Details related to your marital status and family.</p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {profile?.marital_status && (
                    <Card className="shadow-card border-primary/10 hover:shadow-elevated transition-all hover:border-primary/30 bg-gradient-to-br from-white via-primary/5 to-white">
                      <CardContent className="flex items-start gap-4 p-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-primary">Marital Status</p>
                          <p className="font-medium text-foreground break-words">{profile.marital_status}</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {profile?.single_category && (
                    <Card className="shadow-card border-primary/10 hover:shadow-elevated transition-all hover:border-primary/30 bg-gradient-to-br from-white via-primary/5 to-white">
                      <CardContent className="flex items-start gap-4 p-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-primary">Single Category</p>
                          <p className="font-medium text-foreground break-words">{profile.single_category}</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {profile?.blessed_child_generation && (
                    <Card className="shadow-card border-primary/10 hover:shadow-elevated transition-all hover:border-primary/30 bg-gradient-to-br from-white via-primary/5 to-white">
                      <CardContent className="flex items-start gap-4 p-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-primary">Generation</p>
                          <p className="font-medium text-foreground break-words">{profile.blessed_child_generation}</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {profile?.parents_blessing_group && (
                    <Card className="shadow-card border-primary/10 hover:shadow-elevated transition-all hover:border-primary/30 bg-gradient-to-br from-white via-primary/5 to-white">
                      <CardContent className="flex items-start gap-4 p-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-primary">Parents' Blessing Group</p>
                          <p className="font-medium text-foreground break-words">{profile.parents_blessing_group}</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {profile?.spouse_name && (
                    <Card className="shadow-card border-primary/10 hover:shadow-elevated transition-all hover:border-primary/30 bg-gradient-to-br from-white via-primary/5 to-white">
                      <CardContent className="flex items-start gap-4 p-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-primary">Spouse Name</p>
                          <p className="font-medium text-foreground break-words">{profile.spouse_name}</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {profile?.date_of_marriage && (
                    <Card className="shadow-card border-primary/10 hover:shadow-elevated transition-all hover:border-primary/30 bg-gradient-to-br from-white via-primary/5 to-white">
                      <CardContent className="flex items-start gap-4 p-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
                          <CalendarDays className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-primary">Date of Marriage</p>
                          <p className="font-medium text-foreground break-words">
                            {new Date(profile.date_of_marriage).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {profile?.blessing_group && (
                    <Card className="shadow-card border-primary/10 hover:shadow-elevated transition-all hover:border-primary/30 bg-gradient-to-br from-white via-primary/5 to-white">
                      <CardContent className="flex items-start gap-4 p-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-primary">Blessing Group</p>
                          <p className="font-medium text-foreground break-words">{profile.blessing_group}</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {profile?.date_of_blessing && (
                    <Card className="shadow-card border-primary/10 hover:shadow-elevated transition-all hover:border-primary/30 bg-gradient-to-br from-white via-primary/5 to-white">
                      <CardContent className="flex items-start gap-4 p-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
                          <CalendarDays className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-primary">Date of Blessing</p>
                          <p className="font-medium text-foreground break-words">
                            {new Date(profile.date_of_blessing).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {profile?.ascension_date && (
                    <Card className="shadow-card border-primary/10 hover:shadow-elevated transition-all hover:border-primary/30 bg-gradient-to-br from-white via-primary/5 to-white">
                      <CardContent className="flex items-start gap-4 p-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
                          <CalendarDays className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-primary">Ascension Date</p>
                          <p className="font-medium text-foreground break-words">
                            {new Date(profile.ascension_date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {profile?.seonghwa_date && (
                    <Card className="shadow-card border-primary/10 hover:shadow-elevated transition-all hover:border-primary/30 bg-gradient-to-br from-white via-primary/5 to-white">
                      <CardContent className="flex items-start gap-4 p-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
                          <CalendarDays className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-primary">Seonghwa Date</p>
                          <p className="font-medium text-foreground break-words">
                            {new Date(profile.seonghwa_date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {profile?.children_names && profile.children_names.length > 0 && (
                    <Card className="shadow-card border-primary/10 hover:shadow-elevated transition-all hover:border-primary/30 bg-gradient-to-br from-white via-primary/5 to-white">
                      <CardContent className="flex items-start gap-4 p-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-primary">Children's Names</p>
                          <p className="font-medium text-foreground break-words">{profile.children_names.join(", ")}</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            )}

            {profile?.family_photo_url && (
              <div>
                <div className="mb-4">
                  <h2 className="text-xl font-semibold text-primary">Family Photo</h2>
                  <p className="text-sm text-muted-foreground">Your uploaded family photo.</p>
                </div>
                <Card className="shadow-card border-primary/10 bg-gradient-to-br from-white via-primary/5 to-white">
                  <CardContent className="p-4">
                    <div className="overflow-hidden rounded-lg border border-primary/10 bg-white/70 flex justify-center">
                      <img
                        src={profile.family_photo_url}
                        alt="Family"
                        className="max-h-[32rem] w-full h-auto object-contain"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Custom Profile Fields */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-primary">Custom Information</h2>
                  <p className="text-sm text-muted-foreground">
                    Manage your custom profile information
                  </p>
                </div>
              </div>

            <div className="grid gap-4">
              {!profile?.extra_fields || profile.extra_fields.length === 0 ? (
                <Card className="border-dashed shadow-card border-primary/20 bg-gradient-to-br from-primary/5 via-white to-primary/5">
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <Button type="button" variant="ghost" className="mb-4 rounded-full bg-primary/10 p-3 hover:bg-primary/20" onClick={() => navigate("/profile/edit?section=additional-information")}> 
                      <Plus className="h-6 w-6 text-primary" />
                    </Button>
                    <h3 className="mb-1 font-semibold text-foreground">No fields yet</h3>
                    <p className="mb-4 text-sm text-muted-foreground">
                      Add custom fields to personalize your profile
                    </p>
                    <Button type="button" className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary" onClick={() => navigate("/profile/edit?section=additional-information")}>Add a field</Button>
                    
                  </CardContent>
                </Card>
              ) : (
                profile.extra_fields.map((field, idx) => (
                  <Card key={idx} className="group hover:shadow-elevated transition-all duration-200 shadow-card border-primary/10 hover:border-primary/30 bg-gradient-to-br from-white via-primary/5 to-white">
                    <CardContent className="flex items-start gap-4 p-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
                        <Briefcase className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        {editingIndex === idx ? (
                          <div className="space-y-2">
                            <input
                              className="w-full px-3 py-2 border border-primary/20 rounded-md bg-background focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                            />
                            <textarea
                              className="w-full px-3 py-2 border border-primary/20 rounded-md bg-background h-24 resize-y min-h-[6rem] max-h-[60vh] focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                            />
                            <div className="flex gap-2 pt-1">
                              <Button type="button" className="bg-primary hover:bg-primary/90" onClick={saveInlineEdit}>
                                Save
                              </Button>
                              <Button type="button" variant="outline" onClick={cancelInlineEdit}>
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p className="text-sm font-semibold text-primary">{field.title}</p>
                            <p className="font-medium text-foreground whitespace-pre-wrap break-words">{field.value}</p>
                          </>
                        )}
                      </div>
                      <div className="flex gap-2 opacity-0 transition-opacity group-hover:opacity-100 flex-shrink-0">
                        {editingIndex === idx ? (
                          <Button type="button" variant="ghost" size="icon" onClick={cancelInlineEdit}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button type="button" variant="ghost" size="icon" onClick={() => startInlineEdit(idx)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        )}
                        <AlertDialog open={deletingIndex === idx} onOpenChange={(open) => setDeletingIndex(open ? idx : null)}>
                          <AlertDialogTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => setDeletingIndex(idx)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete this field?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action will remove the field from your profile. You can add it again later.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel onClick={() => setDeletingIndex(null)}>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={confirmDeleteField} className="bg-destructive hover:bg-destructive">
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
