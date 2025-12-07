import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchEvents, rsvpEvent, cancelRsvp } from "@/lib/events";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { supabaseClient } from "@/lib/supabase";
import { Users } from "lucide-react";

interface EventWithRsvp {
  id: string;
  title: string;
  description?: string | null;
  location?: string | null;
  starts_at: string;
  ends_at?: string | null;
  capacity?: number | null;
  is_public: boolean;
  created_by: string;
  created_at: string;
  userRsvp?: { status: string } | null;
  rsvpCount: number;
}

const EventList: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: events = [], isLoading } = useQuery({ 
    queryKey: ["events", user?.id], 
    queryFn: async () => {
      console.log("🔍 Fetching events with RSVPs...");
      const now = new Date().toISOString();
      
      const { data: eventData, error } = await supabaseClient
        .from("events")
        .select("*")
        .or(`ends_at.gte.${now},and(ends_at.is.null,starts_at.gte.${now})`)
        .order("starts_at", { ascending: true });
        
      if (error) {
        console.error("❌ Error fetching events:", error);
        return [];
      }

      // Fetch RSVPs for each event
      const eventsWithRsvps = await Promise.all(
        (eventData || []).map(async (event) => {
          // Get total RSVP count
          const { count } = await supabaseClient
            .from("rsvps")
            .select("*", { count: "exact", head: true })
            .eq("event_id", event.id)
            .eq("status", "going");

          // Get user's RSVP if logged in
          let userRsvp = null;
          if (user) {
            const { data: rsvpData } = await supabaseClient
              .from("rsvps")
              .select("status")
              .eq("event_id", event.id)
              .eq("user_id", user.id)
              .maybeSingle();
            userRsvp = rsvpData;
          }

          return {
            ...event,
            userRsvp,
            rsvpCount: count || 0,
          };
        })
      );

      console.log("✅ Events with RSVPs fetched:", eventsWithRsvps);
      return eventsWithRsvps as EventWithRsvp[];
    },
    retry: false,
  });

  const rsvpMutation = useMutation({
    mutationFn: ({ eventId, status }: { eventId: string; status: string }) => {
      console.log("🔄 RSVPing to event:", eventId, status);
      return rsvpEvent(eventId, user!.id, status);
    },
    onSuccess: () => {
      console.log("✅ RSVP successful");
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
    onError: (error) => {
      console.error("❌ RSVP failed:", error);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: ({ eventId }: { eventId: string }) => {
      console.log("🔄 Canceling RSVP for event:", eventId);
      return cancelRsvp(eventId, user!.id);
    },
    onSuccess: () => {
      console.log("✅ RSVP canceled");
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
    onError: (error) => {
      console.error("❌ Cancel RSVP failed:", error);
    },
  });

  if (isLoading) return <div>Loading events...</div>;

  return (
    <div className="space-y-6">
      {events.length === 0 && <div className="text-center py-8 text-muted-foreground">No upcoming events.</div>}
      {events.map((ev) => {
        const hasRsvped = ev.userRsvp?.status === "going";
        
        return (
          <div key={ev.id} className="p-4 border rounded-md">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold">{ev.title}</h3>
                {ev.location && <p className="text-sm text-muted-foreground">Location: {ev.location}</p>}
                {(() => {
                  const dateObj = new Date(ev.starts_at);
                  const day = String(dateObj.getDate()).padStart(2, '0');
                  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                  const year = dateObj.getFullYear();
                  let hours = dateObj.getHours();
                  const minutes = String(dateObj.getMinutes()).padStart(2, '0');
                  const ampm = hours >= 12 ? 'PM' : 'AM';
                  hours = hours % 12;
                  hours = hours ? hours : 12;
                  return (
                    <>
                      <p className="text-sm">Date: {day}/{month}/{year}</p>
                      <p className="text-sm">Time: {hours}:{minutes} {ampm}</p>
                    </>
                  );
                })()}
                <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{ev.rsvpCount} {ev.rsvpCount === 1 ? 'person' : 'people'} going</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                {user ? (
                  hasRsvped ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => cancelMutation.mutate({ eventId: ev.id })}
                      disabled={cancelMutation.isPending}
                    >
                      {cancelMutation.isPending ? "Canceling..." : "Cancel RSVP"}
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => rsvpMutation.mutate({ eventId: ev.id, status: "going" })}
                      disabled={rsvpMutation.isPending}
                    >
                      {rsvpMutation.isPending ? "RSVPing..." : "RSVP Going"}
                    </Button>
                  )
                ) : (
                  <div className="text-sm">Log in to RSVP</div>
                )}
              </div>
            </div>
            {ev.description && <p className="mt-2 text-sm">{ev.description}</p>}
          </div>
        );
      })}
    </div>
  );
};

export default EventList;
