import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAdmin } from "@/contexts/AdminContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, MessageSquare, CalendarDays, Settings, ArrowRight, Lock } from "lucide-react";
import { supabaseClient } from "@/lib/supabase";

interface DashboardStats {
  totalUsers: number;
  totalConversations: number;
  totalEvents: number;
  recentUsers: number;
}

const AdminDashboard = () => {
    // Scroll to top on mount
    useEffect(() => {
      window.scrollTo({ top: 0, behavior: "auto" });
    }, []);
  const { user, isLoading: authLoading } = useAuth();
  const { isAdmin, isLoading: adminLoading } = useAdmin();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalConversations: 0,
    totalEvents: 0,
    recentUsers: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Wait for both auth and admin loading to complete
    if (authLoading || adminLoading) return;

    // Now check if user exists and is admin
    if (!user) {
      console.log("❌ No user found, redirecting to home");
      navigate("/");
      return;
    }

    if (!isAdmin) {
      console.log("❌ User is not admin, redirecting to home");
      navigate("/");
      return;
    }

    console.log("✅ User is admin, loading stats");
    fetchStats();
  }, [user, isAdmin, authLoading, adminLoading, navigate]);

  const fetchStats = async () => {
    try {
      setLoading(true);

      // Get total users
      const { count: usersCount } = await supabaseClient
        .from("user_profiles")
        .select("*", { count: "exact", head: true });

      // Get total conversations
      const { count: conversationsCount, error: convError } = await supabaseClient
        .from("conversations")
        .select("*", { count: "exact", head: true });

      if (convError) {
        console.error("Error fetching conversations count:", convError);
      }

      // Get total events
      const { count: eventsCount } = await supabaseClient
        .from("events")
        .select("*", { count: "exact", head: true });

      // Get recent users (last 7 days)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { count: recentCount } = await supabaseClient
        .from("user_profiles")
        .select("*", { count: "exact", head: true })
        .gte("created_at", sevenDaysAgo);

      console.log("Admin stats fetched:", { usersCount, conversationsCount, eventsCount, recentCount });

      setStats({
        totalUsers: usersCount || 0,
        totalConversations: conversationsCount || 0,
        totalEvents: eventsCount || 0,
        recentUsers: recentCount || 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || adminLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading admin access...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Card className="w-full max-w-md shadow-card">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-destructive" />
              <CardTitle>Not Authenticated</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Please log in to access the admin dashboard.
            </p>
            <Button onClick={() => navigate("/login")} className="w-full">
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Card className="w-full max-w-md shadow-card">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-destructive" />
              <CardTitle>Access Denied</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              You don't have admin privileges to access this page.
            </p>
            <Button onClick={() => navigate("/")} variant="outline" className="w-full">
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Users",
      value: stats.totalUsers,
      description: "Registered members",
      icon: Users,
      color: "bg-blue-500/10 text-blue-600",
      href: "/admin/users",
    },
    {
      title: "Conversations",
      value: stats.totalConversations,
      description: "Active group chats",
      icon: MessageSquare,
      color: "bg-purple-500/10 text-purple-600",
      href: "/admin/conversations",
    },
    {
      title: "Events",
      value: stats.totalEvents,
      description: "Scheduled events",
      icon: CalendarDays,
      color: "bg-green-500/10 text-green-600",
      href: "/admin/events",
    },
    {
      title: "New Users",
      value: stats.recentUsers,
      description: "Last 7 days",
      icon: Users,
      color: "bg-orange-500/10 text-orange-600",
      href: "/admin/users",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="border-b bg-background">
        <div className="container py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
              <p className="text-muted-foreground">Manage your platform</p>
            </div>
            <Button variant="outline" onClick={() => navigate("/")} asChild>
              <Link to="/">Back to Site</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-12">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4 mb-12">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <Card key={card.title} className="shadow-card hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate(card.href)}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{card.title}</CardTitle>
                      <CardDescription>{card.description}</CardDescription>
                    </div>
                    <div className={`p-3 rounded-lg ${card.color}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end justify-between">
                    <p className="text-3xl font-bold">{loading ? "-" : card.value}</p>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4" />
                Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={() => navigate("/admin/users")}>
                Manage Users
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Conversations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={() => navigate("/admin/conversations")}>
                Manage Conversations
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={() => navigate("/admin/events")}>
                Manage Events
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline" onClick={() => navigate("/admin/settings")}>
                Admin Settings
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
