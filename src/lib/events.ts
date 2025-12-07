import { supabaseClient } from "@/lib/supabase";

export interface EventRow {
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
}

export interface RsvpRow {
  id: string;
  event_id: string;
  user_id: string;
  status: string; // 'going' | 'interested' | 'declined'
  created_at: string;
}

export const fetchEvents = async (): Promise<EventRow[]> => {
  console.log("🔍 Fetching events...");
  const now = new Date().toISOString();
  
  const { data, error } = await supabaseClient
    .from("events")
    .select("*")
    .or(`ends_at.gte.${now},and(ends_at.is.null,starts_at.gte.${now})`)
    .order("starts_at", { ascending: true });
    
  if (error) {
    console.error("❌ Error fetching events:", error);
    return [];
  }
  console.log("✅ Events fetched:", data);
  return data || [];
};

export const createEvent = async (payload: Partial<EventRow>) => {
  const { data, error } = await supabaseClient.from("events").insert([payload]).select().single();
  if (error) throw error;
  return data as EventRow;
};

export const fetchRsvpsForEvent = async (eventId: string): Promise<RsvpRow[]> => {
  const { data, error } = await supabaseClient.from("rsvps").select("*").eq("event_id", eventId);
  if (error) throw error;
  return data || [];
};

export const rsvpEvent = async (eventId: string, userId: string, status = "going") => {
  // upsert RSVP
  const { data, error } = await supabaseClient
    .from("rsvps")
    .upsert({ event_id: eventId, user_id: userId, status }, { onConflict: "event_id,user_id" })
    .select()
    .single();
  if (error) throw error;
  return data as RsvpRow;
};

export const cancelRsvp = async (eventId: string, userId: string) => {
  const { error } = await supabaseClient.from("rsvps").delete().match({ event_id: eventId, user_id: userId });
  if (error) throw error;
  return true;
};

export const isAdmin = async (userId: string): Promise<boolean> => {
  const { data, error } = await supabaseClient.from("admins").select("id").eq("user_id", userId).limit(1).maybeSingle();
  if (error) {
    // If admins table does not exist, treat as non-admin (do not throw)
    return false;
  }
  return !!data;
};
