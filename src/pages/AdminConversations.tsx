import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAdmin } from "@/contexts/AdminContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabaseClient } from "@/lib/supabase";
import { Search, ArrowLeft, Trash2, Users, Calendar } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";

interface Conversation {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
  is_group: boolean;
  member_count?: number;
  display_name?: string;
  member_names?: string[];
}

const AdminConversations = () => {
    // Scroll to top on mount
    useEffect(() => {
      window.scrollTo({ top: 0, behavior: "auto" });
    }, []);
  const { user, isLoading: authLoading } = useAuth();
  const { isAdmin, isLoading: adminLoading } = useAdmin();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const ITEMS_PER_PAGE = 25;
  const { toast } = useToast();

  useEffect(() => {
    if (authLoading || adminLoading) return;
    if (!user || !isAdmin) {
      navigate("/");
      return;
    }
    fetchConversations();
    // eslint-disable-next-line
  }, [user, isAdmin, authLoading, adminLoading, searchQuery, page, navigate]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const from = page * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      let query = supabaseClient
        .from("conversations")
        .select("*")
        .order("created_at", { ascending: false })
        .range(from, to);

      if (searchQuery.trim()) {
        query = query.ilike("name", `%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      const conversationsWithCounts = await Promise.all(
        (data || []).map(async (conv: any) => {
          try {
            const { data: members } = await supabaseClient
              .from("conversation_members")
              .select("user_id")
              .eq("conversation_id", conv.id);

            let member_count = members ? members.length : 0;
            let displayName = conv.name;
            let memberNames: string[] = [];

            if (members && members.length > 0) {
              const userIds = members.map((m: any) => m.user_id);
              const { data: profiles } = await supabaseClient
                .from("user_profiles")
                .select("full_name")
                .in("user_id", userIds);
              if (profiles) {
                memberNames = profiles.map((p: any) => p.full_name).filter(Boolean);
              }
            }

            if (!conv.is_group && memberNames.length === 2) {
              displayName = memberNames.join(" & ");
            }

            return {
              ...conv,
              member_count,
              display_name: displayName,
              member_names: conv.is_group ? memberNames : undefined,
            };
          } catch {
            return {
              ...conv,
              member_count: 0,
              display_name: conv.name,
              member_names: [],
            };
          }
        })
      );
      setConversations(conversationsWithCounts);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load conversations",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConversation = async (conversationId: string, conversationName: string) => {
    try {
      const { error } = await supabaseClient
        .from("conversations")
        .delete()
        .eq("id", conversationId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Conversation "${conversationName}" has been deleted`,
      });

      fetchConversations();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete conversation",
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
              <h1 className="text-3xl font-bold tracking-tight">Conversation Management</h1>
              <p className="text-muted-foreground">Manage all group conversations</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-12">
        {/* Search */}
        <Card className="shadow-card mb-8">
          <CardHeader>
            <CardTitle>Search Conversations</CardTitle>
            <CardDescription>Find conversations by name</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(0);
                }}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Conversations List */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>All Conversations</CardTitle>
            <CardDescription>{conversations.length} conversations loaded</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-8 text-center text-muted-foreground">Loading conversations...</div>
            ) : conversations.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">No conversations found</div>
            ) : (
              <div className="space-y-4">
                {conversations.map((conv) => (
                  <div
                    key={conv.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-secondary/30 transition-colors"
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold">{conv.display_name || conv.name}</h3>
                      {/* Show group members for group chats */}
                      {conv.is_group && Array.isArray(conv.member_names) && conv.member_names.length > 0 && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Members: {conv.member_names.join(", ")}
                        </div>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {conv.member_count} members
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(conv.created_at).toLocaleDateString()}
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          conv.is_group
                            ? "bg-blue-500/10 text-blue-700"
                            : "bg-gray-500/10 text-gray-700"
                        }`}>
                          {conv.is_group ? "Group" : "Direct"}
                        </span>
                      </div>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Conversation</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete the conversation "{conv.name}" and all its messages.
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteConversation(conv.id, conv.name)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {!loading && conversations.length > 0 && (
              <div className="mt-6 flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">Page {page + 1}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={conversations.length < ITEMS_PER_PAGE}
                >
                  Next
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AdminConversations;
