import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAdmin } from "@/contexts/AdminContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { supabaseClient } from "@/lib/supabase";
import { ArrowLeft, Calendar, MapPin, Users, Clock, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface RsvpWithUser {
  id: string;
  status: string;
  created_at: string;
  user_profiles: {
    user_id: string;
    full_name: string;
    email: string;
    avatar_url?: string;
  };
}

const AdminEditEvent = () => {
    // Scroll to top on mount
    useEffect(() => {
      window.scrollTo({ top: 0, behavior: "auto" });
    }, []);
  const { eventId } = useParams<{ eventId: string }>();
  const { user, isLoading: authLoading } = useAuth();
  const { isAdmin, isLoading: adminLoading } = useAdmin();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [rsvps, setRsvps] = useState<RsvpWithUser[]>([]);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    starts_at: "",
    ends_at: "",
    capacity: "",
    is_public: true,
  });

  useEffect(() => {
    if (authLoading || adminLoading) return;
    if (!user || !isAdmin) {
      navigate("/");
      return;
    }
    fetchEvent();
    fetchRsvps();
  }, [user, isAdmin, authLoading, adminLoading, eventId, navigate]);

  const fetchEvent = async () => {
    try {
      setFetchLoading(true);
      const { data, error } = await supabaseClient
        .from("events")
        .select("*")
        .eq("id", eventId)
        .single();

      if (error) throw error;

      // Format datetime for input fields
      const startsAt = data.starts_at ? new Date(data.starts_at).toISOString().slice(0, 16) : "";
      const endsAt = data.ends_at ? new Date(data.ends_at).toISOString().slice(0, 16) : "";

      setFormData({
        title: data.title || "",
        description: data.description || "",
        location: data.location || "",
        starts_at: startsAt,
        ends_at: endsAt,
        capacity: data.capacity?.toString() || "",
        is_public: data.is_public ?? true,
      });
    } catch (error) {
      console.error("Error fetching event:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load event",
      });
    } finally {
      setFetchLoading(false);
    }
  };

  const fetchRsvps = async () => {
    try {
      // First get the RSVPs
      const { data: rsvpData, error: rsvpError } = await supabaseClient
        .from("rsvps")
        .select("id, status, created_at, user_id")
        .eq("event_id", eventId)
        .eq("status", "going")
        .order("created_at", { ascending: false });

      if (rsvpError) throw rsvpError;

      if (!rsvpData || rsvpData.length === 0) {
        setRsvps([]);
        return;
      }

      // Then get the user profiles
      const userIds = rsvpData.map((rsvp) => rsvp.user_id);
      const { data: profiles, error: profileError } = await supabaseClient
        .from("user_profiles")
        .select("user_id, full_name, email, avatar_url")
        .in("user_id", userIds);

      if (profileError) throw profileError;

      // Combine the data
      const rsvpsWithProfiles = rsvpData.map((rsvp) => ({
        ...rsvp,
        user_profiles: profiles?.find((p) => p.user_id === rsvp.user_id) || {
          user_id: rsvp.user_id,
          full_name: "Unknown User",
          email: "N/A",
          avatar_url: null,
        },
      }));

      setRsvps(rsvpsWithProfiles);
    } catch (error) {
      console.error("Error fetching RSVPs:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !isAdmin) return;

    try {
      setLoading(true);

      // Validate required fields
      if (!formData.title || !formData.starts_at) {
        toast({
          variant: "destructive",
          title: "Validation Error",
          description: "Title and start date/time are required",
        });
        return;
      }

      // Prepare event data
      const eventData: any = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        location: formData.location.trim() || null,
        starts_at: new Date(formData.starts_at).toISOString(),
        ends_at: formData.ends_at ? new Date(formData.ends_at).toISOString() : null,
        capacity: formData.capacity ? parseInt(formData.capacity) : null,
        is_public: formData.is_public,
      };

      const { data, error } = await supabaseClient
        .from("events")
        .update(eventData)
        .eq("id", eventId)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: `Event "${formData.title}" has been updated`,
      });

      navigate("/admin/events");
    } catch (error) {
      console.error("Error updating event:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update event",
      });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || adminLoading || fetchLoading) {
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
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin/events")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Edit Event</h1>
              <p className="text-muted-foreground">Update event details and view RSVPs</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container max-w-6xl py-12">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Event Form */}
          <div className="lg:col-span-2">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Event Details</CardTitle>
                <CardDescription>Update the event information</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Title */}
                  <div className="space-y-2">
                    <Label htmlFor="title">
                      Event Title <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="title"
                      placeholder="e.g., Annual Gala, Monthly Meetup"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe the event..."
                      rows={4}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>

                  {/* Location */}
                  <div className="space-y-2">
                    <Label htmlFor="location">
                      <MapPin className="inline h-4 w-4 mr-1" />
                      Location
                    </Label>
                    <Input
                      id="location"
                      placeholder="e.g., Community Center, 123 Main St"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    />
                  </div>

                  {/* Start Date/Time */}
                  <div className="space-y-2">
                    <Label htmlFor="starts_at">
                      <Calendar className="inline h-4 w-4 mr-1" />
                      Start Date & Time <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="starts_at"
                      type="datetime-local"
                      value={formData.starts_at}
                      onChange={(e) => setFormData({ ...formData, starts_at: e.target.value })}
                      required
                    />
                  </div>

                  {/* End Date/Time */}
                  <div className="space-y-2">
                    <Label htmlFor="ends_at">
                      <Clock className="inline h-4 w-4 mr-1" />
                      End Date & Time
                    </Label>
                    <Input
                      id="ends_at"
                      type="datetime-local"
                      value={formData.ends_at}
                      onChange={(e) => setFormData({ ...formData, ends_at: e.target.value })}
                    />
                  </div>

                  {/* Capacity */}
                  <div className="space-y-2">
                    <Label htmlFor="capacity">
                      <Users className="inline h-4 w-4 mr-1" />
                      Capacity
                    </Label>
                    <Input
                      id="capacity"
                      type="number"
                      min="1"
                      placeholder="Maximum number of attendees"
                      value={formData.capacity}
                      onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    />
                    <p className="text-sm text-muted-foreground">Leave empty for unlimited capacity</p>
                  </div>

                  {/* Is Public */}
                  <div className="flex items-center justify-between space-x-2">
                    <div className="space-y-0.5">
                      <Label htmlFor="is_public">Public Event</Label>
                      <p className="text-sm text-muted-foreground">
                        Public events are visible to all members
                      </p>
                    </div>
                    <Switch
                      id="is_public"
                      checked={formData.is_public}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_public: checked })}
                    />
                  </div>

                  {/* Submit Buttons */}
                  <div className="flex gap-4 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate("/admin/events")}
                      disabled={loading}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={loading} className="flex-1">
                      {loading ? "Updating..." : "Update Event"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* RSVPs List */}
          <div className="lg:col-span-1">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>RSVPs ({rsvps.length})</CardTitle>
                <CardDescription>People attending this event</CardDescription>
              </CardHeader>
              <CardContent>
                {rsvps.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No RSVPs yet
                  </div>
                ) : (
                  <div className="space-y-4">
                    {rsvps.map((rsvp) => (
                      <div
                        key={rsvp.id}
                        className="flex items-center gap-3 p-3 border rounded-lg hover:bg-secondary/30 transition-colors"
                      >
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={rsvp.user_profiles?.avatar_url || ""} />
                          <AvatarFallback>
                            {rsvp.user_profiles?.full_name?.charAt(0) || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {rsvp.user_profiles?.full_name || "Unknown"}
                          </p>
                          <p className="text-sm text-muted-foreground truncate flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {rsvp.user_profiles?.email || "N/A"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminEditEvent;
