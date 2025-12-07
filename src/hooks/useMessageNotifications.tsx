import { useEffect, useRef } from "react";
import { supabaseClient } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { MessageCircle, Users } from "lucide-react";

interface NotificationMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_name: string;
  content: string;
  created_at: string;
}

export const useMessageNotifications = () => {
  const { user } = useAuth();
  const subscriptionRef = useRef<any>(null);

  useEffect(() => {
    if (!user) return;

    console.log("🔔 Setting up message notifications for user:", user.id);

    // Subscribe to new messages in the messages table
    const channel = supabaseClient
      .channel("message-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        async (payload: any) => {
          const message = payload.new as NotificationMessage;
          
          console.log("🔔 New message received:", message);

          // Don't notify for user's own messages
          if (message.sender_id === user.id) {
            console.log("🔕 Skipping notification - own message");
            return;
          }

          // Fetch conversation info to determine if it's a group chat
          const { data: conversation, error } = await supabaseClient
            .from("conversations")
            .select("id, name, is_group")
            .eq("id", message.conversation_id)
            .single();

          if (error) {
            console.error("❌ Error fetching conversation:", error);
            return;
          }

          if (!conversation) {
            console.log("❌ Conversation not found");
            return;
          }

          // Check if user is a member of this conversation
          const { data: membership } = await supabaseClient
            .from("conversation_members")
            .select("id")
            .eq("conversation_id", message.conversation_id)
            .eq("user_id", user.id)
            .single();

          if (!membership) {
            console.log("🔕 Skipping notification - not a member of this conversation");
            return;
          }

          console.log("✅ Showing notification for conversation:", conversation);

          const isDirectMessage = !conversation.is_group;
          const truncatedContent = message.content.length > 100 
            ? message.content.substring(0, 100) + "..." 
            : message.content;

          // Show toast notification with different styling for DMs vs groups
          toast({
            title: (
              <div className="flex items-center gap-2">
                {isDirectMessage ? (
                  <MessageCircle className="h-5 w-5 text-blue-500" />
                ) : (
                  <Users className="h-4 w-4 text-gray-500" />
                )}
                <span className={isDirectMessage ? "font-bold" : "font-medium"}>
                  {isDirectMessage ? message.sender_name : conversation.name}
                </span>
              </div>
            ),
            description: (
              <div className="space-y-1">
                {!isDirectMessage && (
                  <p className="text-xs text-muted-foreground">{message.sender_name}</p>
                )}
                <p className={isDirectMessage ? "text-sm" : "text-sm text-muted-foreground"}>
                  {truncatedContent}
                </p>
              </div>
            ),
            duration: isDirectMessage ? 8000 : 5000, // DMs stay longer
            className: isDirectMessage 
              ? "border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-950" 
              : "",
            action: {
              label: "View",
              onClick: () => {
                window.location.href = "/messages";
              },
            },
          });
        }
      )
      .subscribe();

    subscriptionRef.current = channel;

    return () => {
      console.log("🔕 Cleaning up message notifications");
      if (subscriptionRef.current) {
        supabaseClient.removeChannel(subscriptionRef.current);
      }
    };
  }, [user]);
};
