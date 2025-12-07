import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Search, Users } from "lucide-react";
import { useState, useEffect } from "react";
import { useSocket } from "@/hooks/useSocket";
import { useSocketContext } from "@/contexts/SocketContext";
import { formatDistanceToNow } from "date-fns";
// Import removed to avoid local 'Conversation' type conflict.
// Remove unused SocketProvider import. Wrap your parent component (e.g., Messages.tsx) with <SocketProvider jwt={jwt}> ... </SocketProvider>

// Ensure Conversation type includes avatar property for direct chats

interface Conversation {
  id: string;
  name: string;
  is_group: boolean;
  participants: Participant[];
  avatar?: string; // Add this optional property
  last_message?: string;
  last_message_time?: string;
  unread_count?: number;
}

interface Participant {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface ConversationListProps {
  conversations: Conversation[];
  selectedId?: string;
  onSelect: (conversation: Conversation) => void;
  userId: string;
}

const ConversationList = ({ conversations, selectedId, onSelect, userId }: ConversationListProps) => {
  console.log('[ConversationList.tsx] Rendering ConversationList. conversations:', conversations, 'selectedId:', selectedId);
  const [search, setSearch] = useState("");
  const [convList, setConvList] = useState<Conversation[]>(conversations);

  // Use the shared authenticated socket from context
  const { socket, connected } = useSocketContext();

  // deleteConversation still uses the socket emit; we'll call it directly below

  // Join the user's personal room so this component receives per-user notifications
  useEffect(() => {
    if (!socket) return;
    const userRoom = `user-${userId}`;
    socket.emit('join', userRoom, (res: any) => {
      console.log('[ConversationList] joined user room:', userRoom, res);
    });
    return () => {
      try {
        socket.emit('leave', userRoom);
      } catch (err) {
        // ignore
      }
    };
  }, [socket, userId]);

  // Merge incoming conversations prop with local convList so socket updates aren't overwritten
  useEffect(() => {
    setConvList((prev) => {
      const prevMap: Record<string, Conversation> = {};
      prev.forEach((p) => {
        prevMap[p.id] = p;
      });
      return conversations.map((c) => {
        const existing = prevMap[c.id];
        if (!existing) return c;
        // Preserve locally-updated fields (unread_count, last_message, last_message_time) if they exist
        return {
          ...c,
          unread_count: existing.unread_count ?? c.unread_count,
          last_message: existing.last_message ?? c.last_message,
          last_message_time: existing.last_message_time ?? c.last_message_time,
        };
      });
    });
  }, [conversations]);

  // Register message listener on the shared socket (authenticated)
  useEffect(() => {
    if (!socket) return;
    const handleMsg = (msg: any) => {
      console.log('[ConversationList] socket onMessage received (context):', msg);
      setConvList((prev) => {
        const found = prev.some((conv) => conv.id === msg.conversation_id);
        if (found) {
          return prev.map((conv) =>
            conv.id === msg.conversation_id
              ? {
                  ...conv,
                  last_message: msg.content,
                  last_message_time: msg.created_at,
                  unread_count: (conv.unread_count ?? 0) + 1,
                }
              : conv
          );
        }
        // If conversation not found locally, prepend a stub so the list updates
        const stub: Conversation = {
          id: msg.conversation_id,
          name: (msg.conversation_name as string) || "Conversation",
          is_group: false,
          participants: [],
          last_message: msg.content,
          last_message_time: msg.created_at,
          unread_count: 1,
        };
        return [stub, ...prev];
      });
    };

    socket.on('message', handleMsg);

    const handleUnreadCount = (payload: any) => {
      console.log('[ConversationList] conversationUnreadCount received:', payload);
      const convoId = payload?.conversationId;
      const unread = payload?.unread_count ?? 0;
      setConvList((prev) => {
        const found = prev.some((c) => c.id === convoId);
        if (found) {
          return prev.map((c) => (c.id === convoId ? { ...c, unread_count: unread } : c));
        }
        if (unread > 0) {
          const stub: Conversation = {
            id: convoId,
            name: 'Conversation',
            is_group: false,
            participants: [],
            last_message: undefined,
            last_message_time: undefined,
            unread_count: unread,
          };
          return [stub, ...prev];
        }
        return prev;
      });
    };

    socket.on('conversationUnreadCount', handleUnreadCount);

    return () => {
      socket.off('message', handleMsg);
      socket.off('conversationUnreadCount', handleUnreadCount);
    };
  }, [socket]);

  // The useSocket hook does not expose the raw socket instance; handle server-driven
  // conversation removals via the conversations prop updates (already covered by the
  // effect that syncs convList with conversations).

  // Use socket for deleting conversation
  const handleDeleteConversation = async (conversationId: string) => {
    if (!conversationId) {
      console.error('Invalid conversation ID passed to handleDeleteConversation');
      return;
    }
    try {
      socket?.emit('deleteConversation', conversationId);
    } catch (err) {
      console.warn('Failed to emit deleteConversation', err);
    }
  };

  const filteredConversations = convList.filter((conv) =>
    conv.name.toLowerCase().includes(search.toLowerCase())
  );

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Track image load errors for each conversation
  const [imageErrorMap, setImageErrorMap] = useState<{ [id: string]: boolean }>({});

  const handleImageError = (id: string) => {
    setImageErrorMap((prev) => ({ ...prev, [id]: true }));
  };

  const isLoading = conversations.length === 0;
  return (
    <div className="flex h-full flex-col">
      <div className="border-b p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="space-y-4 p-4">
            {[...Array(5)].map((_, idx) => (
              <div key={idx} className="flex items-center gap-3 animate-pulse">
                <div className="h-12 w-12 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/2 rounded bg-muted" />
                  <div className="h-3 w-1/3 rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-muted-foreground">
            No conversations found
          </div>
        ) : (
          filteredConversations.map((conversation, idx) => (
            <button
              key={conversation.id || idx}
              onClick={() => {
                // Clear unread count locally when selecting the conversation
                setConvList((prev) => prev.map((c) => c.id === conversation.id ? { ...c, unread_count: 0 } : c));
                // Emit a socket event to mark conversation read (backend may handle this)
                try {
                  socket?.emit('markConversationRead', { conversationId: conversation.id });
                } catch (err) {
                  console.warn('Failed to emit markConversationRead', err);
                }
                onSelect(conversation);
              }}
              className={`flex w-full items-start gap-3 border-b p-4 text-left transition-colors hover:bg-secondary/50 ${
                selectedId === conversation.id ? "bg-secondary" : ""
              }`}
            >
              <div className="relative">
                <Avatar className="h-12 w-12">
                  {conversation.is_group ? (
                    <AvatarFallback className="bg-primary/10 text-primary">
                      <Users className="h-5 w-5" />
                    </AvatarFallback>
                  ) : conversation.avatar && !imageErrorMap[conversation.id] ? (
                    <AvatarImage
                      src={conversation.avatar}
                      alt={conversation.name}
                      onError={() => handleImageError(conversation.id)}
                    />
                  ) : (
                    <AvatarFallback>
                      {getInitials(conversation.name)}
                    </AvatarFallback>
                  )}
                </Avatar>
                {conversation.unread_count > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                    {conversation.unread_count}
                  </span>
                )}
              </div>

              <div className="flex-1 overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{conversation.name}</span>
                  {conversation.last_message_time && (
                    <div className="text-right">
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(conversation.last_message_time), { addSuffix: false })}
                      </span>
                      {/* Unread count under the timestamp removed - badge near avatar remains */}
                    </div>
                  )}
                </div>
                {conversation.is_group && (
                  <p className="text-xs text-muted-foreground">
                    {conversation.participants.length} members
                  </p>
                )}
                {conversation.last_message && (
                  <p className="mt-1 truncate text-sm text-muted-foreground">
                    {conversation.last_message}
                  </p>
                )}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default ConversationList;
