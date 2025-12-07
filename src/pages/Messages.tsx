import { useState, useEffect, useRef } from "react";
// Room join/leave should be handled inside the Messages component where
// `socket` and `activeConversation` are in scope; the stray top-level effect
// was removed to avoid referencing undefined identifiers.
import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ConversationList from "@/components/messages/ConversationList";
import MessageThread from "@/components/messages/MessageThread";
import { Button } from "@/components/ui/button";
import { Plus, Menu } from "lucide-react";
import NewConversationDialog from "@/components/messages/NewConversationDialog";
import { useMessages, type Conversation } from "@/hooks/useMessages";
import { useAuth } from "@/contexts/AuthContext";
import { toast as sonnerToast } from "@/components/ui/sonner";
import { SocketProvider } from '../contexts/SocketContext';
import { useSocketContext } from '../contexts/SocketContext';
import { useSocket } from "@/hooks/useSocket";
import { supabaseClient } from "@/lib/supabase";

export const ConversationSocket = ({ conversationId, onMessage }: { 
  conversationId: string | null, 
  onMessage: (msg: any) => void 
}) => {
  if (!conversationId) return null;
  useSocket({
    conversationId,
    onMessage,
  } as any);
  return null;
};


const Messages = () => {
      // Scroll to top on mount
      useEffect(() => {
        window.scrollTo({ top: 0, behavior: "auto" });
      }, []);
    // Provide socket and connected for all logic and effects
    const { socket, connected } = useSocketContext();
  // Must be declared before any useEffect or logic that uses them
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  // All hooks must be at the top level

  // Direct state update on conversationDeleted event (no re-fetch)
  useEffect(() => {
    if (!socket || !connected) return;
    const handleConversationDeleted = (data) => {
      console.log('[Messages] Conversation deleted event:', data);
      setSocketConversations(prev => prev.filter(conv => conv.id !== data.conversationId));
      if (selectedConversation?.id === data.conversationId) {
        setSelectedConversation(null);
      }
    };
    socket.on('conversationDeleted', handleConversationDeleted);
    return () => {
      socket.off('conversationDeleted', handleConversationDeleted);
    };
  }, [selectedConversation, socket, connected]);
  console.log('🚀 [Messages] COMPONENT MOUNTING');
  const mountRef = useRef(0);

  useEffect(() => {
    mountRef.current += 1;
    console.log(`🚀 [Messages] Component rendered ${mountRef.current} times`);

    return () => {
      console.log('🚀 [Messages] Component UNMOUNTING');
    };
  }, []);

  const { user, isLoading: authLoading } = useAuth();
  const { createConversation, allUsers, refreshMessages, markAsRead, setActiveConversationId, leaveConversation, addMembersToConversation, deleteConversation } = useMessages();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [jwt, setJwt] = useState<string>(""); // Store JWT in state

  // Get JWT token from localStorage ONCE when component mounts
  useEffect(() => {
    const authTokenRaw = window.localStorage.getItem('sb-opendizwrcmluvxabajt-auth-token');
    if (authTokenRaw) {
      try {
        const authToken = JSON.parse(authTokenRaw);
        const token = authToken?.access_token || "";
        setJwt(token);
      } catch (error) {
        console.error('[Messages.tsx] Error parsing auth token:', error);
        setJwt("");
      }
    } else {
      console.warn('[Messages.tsx] No auth token found in localStorage');
      setJwt("");
    }
  }, []); // Empty dependency array = run once on mount

  // Manage conversations and messages at the parent level
  const [socketConversations, setSocketConversations] = useState<Conversation[]>([]);
  useEffect(() => {
    if (!socket || !connected) {
      console.log('⏳ [Direct] Socket not ready');
      return;
    }
    console.log('✅ [Direct] Socket ready, fetching conversations');
    const handleConversations = (convs) => {
      setSocketConversations(convs || []);
    };
    socket.on('conversations', handleConversations);
    socket.emit('getConversations');

    // Listen for real-time deletion
    const handleConversationDeleted = (deletedId) => {
      setSocketConversations(prev => prev.filter(c => c.id !== deletedId));
      setSelectedConversation(prev => (prev && prev.id === deletedId ? null : prev));
    };
    socket.on('conversationDeleted', handleConversationDeleted);

    return () => {
      socket.off('conversations', handleConversations);
      socket.off('conversationDeleted', handleConversationDeleted);
    };
  }, [socket, connected]);



  // Derive the active conversation from latest list to keep it in sync (reference stable)
  const activeConversationId = selectedConversation?.id || null;
  const activeConversation = activeConversationId
    ? socketConversations.find((c) => c.id === activeConversationId) ?? selectedConversation
    : null;

  // Listen for new messages and update parent state
  useSocket({
    conversationId: activeConversationId || '',
    onMessage: (msg) => {
      console.log('[Messages] Received socket message:', msg);
      setSocketConversations(prev => prev.map(conv => {
        if (conv.id === msg.conversation_id) {
          // Check if message already exists to avoid duplicates
          const messageExists = conv.messages?.some(m => m.id === msg.id);
          if (messageExists) {
            console.log('[Messages] Message already exists, skipping:', msg.id);
            return conv;
          }
          // Show Sonner toast notification if message is not from current user
          if (user && msg.sender_id !== user.id) {
            sonnerToast(
              `${msg.sender_name || 'New message'}: ${msg.content.length > 100 ? msg.content.substring(0, 100) + '...' : msg.content}`,
              {
                duration: 7000,
                action: {
                  label: "View",
                  onClick: () => {
                    setSelectedConversation(prev => prev && prev.id === msg.conversation_id ? prev : prev);
                    navigate('/messages');
                  },
                },
              }
            );
          }
          console.log('[Messages] Adding message to conversation:', conv.id);
          return {
            ...conv,
            messages: [...(conv.messages || []), msg],
            last_message: msg.content,
            last_message_time: msg.created_at,
            updated_at: msg.created_at
          };
        }
        return conv;
      }));
    },
  } as any);

  // Only join/leave room when socket or activeConversationId changes
  useEffect(() => {
    if (!socket || !activeConversationId) return;
    socket.emit("join_room", activeConversationId);
    return () => {
      socket.emit("leave_room", activeConversationId);
    };
  }, [socket, activeConversationId]);
  // Fetch existing messages and group participants from the database when a conversation is opened
  useEffect(() => {
    const fetchGroupParticipants = async (conversation: Conversation) => {
      if (!conversation.is_group) return;
      try {
        // Fetch participant user_ids from conversation_members
        const { data: memberRows, error: memberErr } = await supabaseClient
          .from('conversation_members')
          .select('user_id')
          .eq('conversation_id', conversation.id);
        if (memberErr) throw memberErr;
        const participantIds = (memberRows || []).map((m: any) => m.user_id);
        // Fetch user details for participants
        let participants: { id: string; name: string; email: string; avatar?: string }[] = [];
        if (participantIds.length > 0) {
          const { data: users, error: usersErr } = await supabaseClient
            .from('user_profiles')
            .select('user_id, full_name, email, avatar_url')
            .in('user_id', participantIds);
          if (usersErr) throw usersErr;
          participants = (users || []).map((u: any) => ({
            id: u.user_id,
            name: u.full_name || u.email,
            email: u.email,
            avatar: u.avatar_url,
          }));
        }
        // Update selectedConversation with fresh participants
        setSelectedConversation((prev) => prev && prev.id === conversation.id ? { ...prev, participants } : prev);
      } catch (err) {
        console.error('[Messages] Error fetching group participants:', err);
      }
    };
    if (activeConversation?.id) {
      console.log('[Messages] Active conversation changed, fetching messages:', activeConversation.id);
      fetchConversationMessages(activeConversation.id);
      if (activeConversation.is_group) {
        fetchGroupParticipants(activeConversation);
      }
    }
  }, [activeConversation?.id]);

  // Load messages, mark as read, and inform hook of active conversation
  useEffect(() => {
    if (activeConversation?.id) {
      // Clear unread for the active conversation immediately
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      markAsRead(activeConversation.id);
      setActiveConversationId(activeConversation.id);
    } else {
      setActiveConversationId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConversation?.id]);

  // Fetch messages helper
  const fetchConversationMessages = async (conversationId: string) => {
    try {
      // Use your existing useMessages hook or direct Supabase call
      await refreshMessages(conversationId);
    } catch (err) {
      console.error('[Messages] Error fetching messages:', err);
    }
  };

  // When the user logs out, clear any selected conversation to avoid stale state
  useEffect(() => {
    if (!user) {
      setSelectedConversation(null);
    }
  }, [user]);

  // Add debugging logs to verify user and conversations data
  console.log("Logged-in user:", user);
  console.log("Conversations:", socketConversations);

  // Debugging effect to log conversation details
  useEffect(() => {
    if (socketConversations.length > 0) {
      console.log('🔍 [DEBUG] Conversation data:', socketConversations[0]);
      console.log('🔍 [DEBUG] Participants:', socketConversations[0]?.participants);
      console.log('🔍 [DEBUG] Is group:', socketConversations[0]?.is_group);
      console.log('🔍 [DEBUG] Name:', socketConversations[0]?.name);
    }
  }, [socketConversations]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Loading...</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-lg font-medium mb-4">Please log in to access messages</p>
            <Button onClick={() => navigate("/login")}>Go to Login</Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Use the socket context to send messages
  const handleSendMessage = async (content: string) => {
    if (!activeConversation || !socket) return;
    try {
      socket.emit('sendMessage', {
        conversationId: activeConversation.id,
        content,
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to send message",
      });
    }
  };

  const handleLeaveGroup = async (conversationId: string) => {
    try {
      await leaveConversation(conversationId);
      setSelectedConversation(null);
      toast({
        title: "Success",
        description: "You have left the group",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to leave group",
      });
      throw err;
    }
  };

  const handleAddMembers = async (conversationId: string, emails: string[]) => {
    try {
      await addMembersToConversation(conversationId, emails);
      // Force refresh of conversation list and participants
      if (activeConversation?.id === conversationId) {
        // Fetch latest group participants and update selectedConversation
        const { data: memberRows, error: memberErr } = await supabaseClient
          .from('conversation_members')
          .select('user_id')
          .eq('conversation_id', conversationId);
        if (!memberErr) {
          const participantIds = (memberRows || []).map((m: any) => m.user_id);
          let participants: { id: string; name: string; email: string; avatar?: string }[] = [];
          if (participantIds.length > 0) {
            const { data: users, error: usersErr } = await supabaseClient
              .from('user_profiles')
              .select('user_id, full_name, email, avatar_url')
              .in('user_id', participantIds);
            if (!usersErr) {
              participants = (users || []).map((u: any) => ({
                id: u.user_id,
                name: u.full_name || u.email,
                email: u.email,
                avatar: u.avatar_url,
              }));
              setSelectedConversation((prev) => prev && prev.id === conversationId ? { ...prev, participants } : prev);
            }
          }
        }
      }
      // Optionally, force refresh of conversation list (socketConversations)
      if (socket && connected) {
        socket.emit('getConversations');
      }
      toast({
        title: "Success",
        description: "Members added successfully",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add members",
      });
      throw err;
    }
  };

  const handleDeleteConversation = async (conversationId: string) => {
    if (confirm("Are you sure you want to delete this conversation?")) {
      // Optimistically remove from UI immediately
      setSocketConversations(prev => prev.filter(conv => conv.id !== conversationId));
      if (selectedConversation?.id === conversationId) {
        setSelectedConversation(null);
      }
      // Then send delete request
      try {
        await deleteConversation(conversationId);
        toast({
          title: "Deleted",
          description: "Conversation removed",
        });
      } catch (err) {
        // If error, revert optimistic update
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to delete conversation",
        });
        // Optionally re-fetch conversations here
      }
    }
  };

  const handleCreateConversation = async (name: string, isGroup: boolean, participantEmails: string[]) => {
    try {
      // Optimistically add conversation to UI
      const tempId = `temp-${Date.now()}`;
      let participants: { id: string; name: string; email: string; avatar?: string }[] = [];
      if (isGroup) {
        // For group, you can optionally fill participants if you want
        participants = participantEmails
          .map(email => allUsers.find(u => u.email === email))
          .filter(Boolean) as { id: string; name: string; email: string; avatar?: string }[];
        // Optionally add current user
        participants = [{ id: user.id, name: (user as any).name || user.email, email: user.email, avatar: (user as any).avatar }, ...participants];
      } else {
        // For direct, add current user and the other participant
        const other = allUsers.find(u => u.email === participantEmails[0]);
        if (other) {
          participants = [
            { id: user.id, name: (user as any).name || user.email, email: user.email, avatar: (user as any).avatar },
            other
          ];
        } else {
          participants = [
            { id: user.id, name: (user as any).name || user.email, email: user.email, avatar: (user as any).avatar },
            { id: '', name: participantEmails[0], email: participantEmails[0] }
          ];
        }
      }
      const optimisticConv: Conversation = {
        id: tempId,
        name: isGroup ? name : (participants.find(p => p.id !== user.id)?.name || participantEmails[0] || "Conversation"),
        is_group: isGroup,
        created_by: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        participants,
        messages: [],
        unread_count: 0,
      };
      setSocketConversations(prev => [optimisticConv, ...prev]);
      setSelectedConversation(optimisticConv);

      // Send create request to server
      const conversationId = await createConversation(name, isGroup, participantEmails);
      if (conversationId) {
        // Replace temp conversation with real one
        setSocketConversations(prev => [
          ...prev.filter(c => c.id !== tempId),
          {
            ...optimisticConv,
            id: conversationId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
        ]);
        setSelectedConversation(prev => prev && prev.id === tempId
          ? { ...optimisticConv, id: conversationId }
          : prev);
        setShowNewDialog(false);
        toast({
          title: "Success",
          description: "Conversation created",
        });
      } else {
        // Remove temp conversation if server failed
        setSocketConversations(prev => prev.filter(c => c.id !== tempId));
        setSelectedConversation(null);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to create conversation",
        });
      }
    } catch (err) {
      // Remove temp conversation if error
      setSocketConversations(prev => prev.filter(c => !c.id.startsWith('temp-')));
      setSelectedConversation(null);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create conversation",
      });
    }
  };

  // Refine the logic for setting conversation names in one-on-one chats
  const adjustedConversations = socketConversations.map((conv) => {
    // For group chats, use the stored name
    if (conv.is_group) {
      return {
        ...conv,
        name: conv.name || `Group (${conv.participants?.length || 0} members)`,
        avatar: undefined,
      };
    }

    // For one-on-one chats
    if (conv.participants && conv.participants.length > 0) {
      // Find the participant who is NOT the current user
      const otherParticipant = conv.participants.find((p) => p.id !== user.id);

      if (otherParticipant) {
        return {
          ...conv,
          name: otherParticipant.name || otherParticipant.email || 'Unknown User',
          avatar: otherParticipant.avatar,
        };
      }
    }

    // Fallback: check if name exists in conversation data
    if (conv.name && conv.name !== 'Unnamed Participant') {
      return conv;
    }

    // Last resort fallback
    return {
      ...conv,
      name: 'Unknown User',
      avatar: undefined,
    };
  });

  // At the end of the component, conditionally render SocketProvider
  if (!jwt) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Loading messages...</p>
        </main>
        <Footer />
      </div>
    );
  }

  const mainContent = (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-gradient-subtle animate-fade-in">
        <div className="container max-w-5xl py-12">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Messages</h1>
              <p className="text-muted-foreground">Chat with members and groups</p>
            </div>
            <Button onClick={() => setShowNewDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Message
            </Button>
          </div>

          <div className="flex h-[calc(100vh-280px)] min-h-[500px] overflow-hidden rounded-xl border bg-background shadow-card">
            {/* Mobile sidebar toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-4 top-4 z-10 md:hidden"
              onClick={() => setShowSidebar(!showSidebar)}
            >
              <Menu className="h-5 w-5" />
            </Button>

            {/* Conversation list sidebar */}
            <div
              className={`w-full border-r md:w-80 lg:w-96 overflow-y-auto ${
                showSidebar ? "block" : "hidden md:block"
              } ${selectedConversation && "hidden md:block"}`}
            >
              <ConversationList
                conversations={adjustedConversations}
                selectedId={activeConversation?.id}
                onSelect={(conv) => {
                  setSelectedConversation(conv as Conversation);
                  setShowSidebar(false);
                }}
                userId={user.id}
              />
              </div>
            <div
              className={`flex-1 ${
                !selectedConversation && "hidden md:flex"
              } flex flex-col`}
            >
            {activeConversation ? (
              <MessageThread
                conversation={activeConversation}
                currentUserId={user.id}
                onSendMessage={handleSendMessage}
                onBack={() => {
                  setSelectedConversation(null);
                  setShowSidebar(true);
                }}
                onLeaveGroup={activeConversation.is_group ? handleLeaveGroup : undefined}
                onAddMembers={activeConversation.is_group ? handleAddMembers : undefined}
                onDeleteConversation={handleDeleteConversation}
                allUsers={allUsers}
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <p className="text-muted-foreground">Select a conversation to start chatting</p>
              </div>
            )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
      <NewConversationDialog
        open={showNewDialog}
        onOpenChange={setShowNewDialog}
        onCreate={handleCreateConversation}
        knownRecipients={allUsers}
      />
    </div>
  );

  return (
    <SocketProvider jwt={jwt}>
      {mainContent}
    </SocketProvider>
  );
};

export default Messages;
function useToast(): {
	toast: (opts: {
		variant?: string;
		title?: string;
		description?: string;
		action?: { label: string; onClick: () => void } | null;
		duration?: number;
	}) => void;
} {
	return {
		toast: ({ title = "", description = "", action, duration }: {
			variant?: string;
			title?: string;
			description?: string;
			action?: { label: string; onClick: () => void } | null;
			duration?: number;
		}) => {
			try {
				// Compose a brief message from title + description
				const message = title ? (description ? `${title}: ${description}` : title) : description || "";

				// If sonnerToast is available (imported as `sonnerToast`), delegate to it.
				// It expects a message string and an options object.
				if (typeof sonnerToast === "function") {
					sonnerToast(message, {
						duration: duration ?? 4000,
						action: action ?? undefined,
					});
					return;
				}

				// Fallback: log to console
				// eslint-disable-next-line no-console
				console.info("[toast]", message);
			} catch (err) {
				// eslint-disable-next-line no-console
				console.error("[useToast] failed to show toast", err);
			}
		},
	};
}

