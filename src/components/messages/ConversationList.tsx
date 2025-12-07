import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Search, Users } from "lucide-react";
import { useState, useEffect } from "react";
import { useSocket } from "@/hooks/useSocket";
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
}

const ConversationList = ({ conversations, selectedId, onSelect }: ConversationListProps) => {
  console.log('[ConversationList.tsx] Rendering ConversationList. conversations:', conversations, 'selectedId:', selectedId);
  const [search, setSearch] = useState("");
  const [convList, setConvList] = useState<Conversation[]>(conversations);

  // Use selectedId from parent, which only changes when user selects a conversation
  const { deleteConversation } = useSocket({
    conversationId: selectedId || "",
    onMessage: (msg) => {
      setConvList((prev) => {
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
      });
    },
  });

  // Listen for new messages to update conversation list
  useEffect(() => {
    setConvList(conversations);
  }, [conversations]);

  // The useSocket hook does not expose the raw socket instance; handle server-driven
  // conversation removals via the conversations prop updates (already covered by the
  // effect that syncs convList with conversations).

  // Use socket for deleting conversation
  const handleDeleteConversation = async (conversationId: string) => {
    if (!conversationId) {
      console.error('Invalid conversation ID passed to handleDeleteConversation');
      return;
    }
    deleteConversation(conversationId);
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
              onClick={() => onSelect(conversation)}
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
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(conversation.last_message_time), { addSuffix: false })}
                    </span>
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
