import { useEffect, useState, useCallback, useRef } from "react";
import { supabaseClient } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSocket } from "./useSocket";

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_name: string;
  sender_avatar?: string;
  content: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  name: string;
  is_group: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  last_message?: string;
  last_message_time?: string;
  participants: { id: string; name: string; email: string; avatar?: string }[];
  messages: Message[];
  unread_count: number;
}

interface UseMessagesReturn {
  conversations: Conversation[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (conversationId: string, content: string) => Promise<void>;
  createConversation: (
    name: string,
    isGroup: boolean,
    participantEmails: string[]
  ) => Promise<string | null>;
  markAsRead: (conversationId: string) => Promise<void>;
  allUsers: { id: string; name: string; email: string; avatar?: string }[];
  refreshMessages: (conversationId: string) => Promise<void>;
  setActiveConversationId: (conversationId: string | null) => void;
  leaveConversation: (conversationId: string) => Promise<void>;
  addMembersToConversation: (conversationId: string, participantEmails: string[]) => Promise<void>;
  deleteConversation: (conversationId: string) => Promise<void>;
}

export const useMessages = (): UseMessagesReturn => {
  const { user, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [allUsers, setAllUsers] = useState<{ id: string; name: string; email: string; avatar?: string }[]>([]);
  const activeConversationIdRef = useRef<string | null>(null);
  const setActiveConversationId = (conversationId: string | null) => {
    activeConversationIdRef.current = conversationId;
  };

  const { sendMessage: socketSendMessage, deleteConversation: socketDeleteConversation, deleteMessage: socketDeleteMessage, updateMessage: socketUpdateMessage, updateConversation: socketUpdateConversation, connected } = useSocket({
    conversationId: activeConversationIdRef.current || "",
    onMessage: (msg) => {
      // Optionally handle incoming messages here
    },
  });

  const fetchAllUsers = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error: usersError } = await supabaseClient
        .from('user_profiles')
        .select('user_id,full_name,email,avatar_url');
      if (usersError) throw usersError;
      const filtered = (data || []).filter((u: any) => u.user_id !== user.id);
      setAllUsers(filtered.map((u: any) => ({ id: u.user_id, name: u.full_name || u.email, email: u.email, avatar: u.avatar_url })));
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  }, [user]);

  // Fetch conversations with React Query for initial load
  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ['conversations', user?.id, allUsers.length],
    queryFn: async () => {
      if (!user || !allUsers.length) return [];

      const { data: convData, error: convErr } = await supabaseClient
        .from('conversation_summaries')
        .select('*')
        .order('updated_at', { ascending: false });
      if (convErr) throw convErr;

      const prevCache: Conversation[] = queryClient.getQueryData(['conversations', user.id]) || [];

      const transformed: Conversation[] = (convData || [])
        .filter((conv: any) => !!conv.id)
        .map((conv: any) => {
          const prev = prevCache.find((c) => c.id === conv.id);
          // For direct chats, try to show the other participant's name
          let displayName = conv.name;
          if (!conv.is_group && conv.participants && conv.participants.length > 0) {
            // Find the participant who is not the current user
            const other = conv.participants.find((p: any) => p.user_id !== user.id);
            displayName = other?.full_name || other?.email || conv.name;
          }
          return {
            id: conv.id,
            name: displayName,
            is_group: conv.is_group,
            created_by: conv.created_by,
            created_at: conv.created_at,
            updated_at: conv.updated_at,
            last_message: conv.last_message || undefined,
            last_message_time: conv.last_message_time || undefined,
            participants: [],
            messages: prev?.messages || [],
            unread_count: conv.unread_count ?? 0,
          };
        });

      // Skip fetching members if no conversations are found
      if (transformed.length === 0) {
        return transformed;
      }

      const convIds = transformed.map((c) => c.id);
      console.log('Conversation IDs for members query:', convIds);
      if (!Array.isArray(convIds) || !convIds.length || convIds.includes(undefined)) {
        console.warn('Skipping conversation_members query due to invalid convIds:', convIds);
        return transformed;
      }

      const { data: membersData, error: membersErr } = await supabaseClient
        .from('conversation_members')
        .select('conversation_id,user_id')
        .in('conversation_id', convIds);
      if (membersErr) throw membersErr;

      // Map participants to conversations
      const participantsByConv = new Map<string, { id: string; name: string; email: string; avatar?: string }[]>();
      (membersData || []).forEach((m: any) => {
        const userInfo = allUsers.find((u) => u.id === m.user_id);
        if (!userInfo) return;
        const arr = participantsByConv.get(m.conversation_id) || [];
        arr.push(userInfo);
        participantsByConv.set(m.conversation_id, arr);
      });

      return transformed.map((c) => ({
        ...c,
        participants: participantsByConv.get(c.id) || [],
      }));
    },
    enabled: !!user && !authLoading,
    staleTime: 10000, // Cache for 10 seconds
    refetchInterval: 30000, // Background refetch every 30s
  });

  // Supabase real-time subscriptions and polling for messages are disabled. Use Socket.io for real-time messaging.

  const fetchMessages = useCallback(async (conversationId: string) => {
    try {
      const { data: messagesData, error: messagesErr } = await supabaseClient
        .from('messages')
        .select('id,conversation_id,sender_id,content,created_at')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (messagesErr) throw messagesErr;

      const senderIds = [...new Set((messagesData || []).map((m: any) => m.sender_id))];

      // Fetch user profiles WITH avatar_url
      const { data: usersData } = await supabaseClient
        .from('user_profiles')
        .select('user_id,full_name,avatar_url')
        .in('user_id', senderIds);

      const usersMap = new Map(
        (usersData || []).map((u: any) => [u.user_id, u])
      );

      const msgs: Message[] = (messagesData || []).map((m: any) => {
        const sender = usersMap.get(m.sender_id);
        return {
          id: m.id,
          conversation_id: m.conversation_id,
          sender_id: m.sender_id,
          sender_name: sender?.full_name || 'Unknown',
          sender_avatar: sender?.avatar_url, // Make sure this is included
          content: m.content,
          created_at: m.created_at,
        };
      });

      // Update cache
      queryClient.setQueryData(['conversations', user?.id], (old: Conversation[] = []) =>
        old.map((conv) => (conv.id === conversationId ? { ...conv, messages: msgs } : conv))
      );
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  }, [queryClient, user]);

  // Replace Supabase sendMessage with Socket.io
  const sendMessage = async (conversationId: string, content: string) => {
    if (!user) return;
    socketSendMessage(content);
  };

  // Replace Supabase deleteConversation with Socket.io
  const deleteConversation = async (conversationId: string) => {
    socketDeleteConversation(conversationId);
  };

  // Replace Supabase deleteMessage with Socket.io
  const deleteMessage = async (messageId: string, conversationId: string) => {
    socketDeleteMessage(messageId);
  };

  // Replace Supabase updateMessage with Socket.io
  const updateMessage = async (messageId: string, conversationId: string, newContent: string) => {
    socketUpdateMessage(messageId, newContent);
  };

  // Replace Supabase updateConversation with Socket.io
  const updateConversation = async (conversationId: string, updates: any) => {
    socketUpdateConversation(updates);
  };

  const createConversation = useCallback(async (name: string, isGroup: boolean, participantEmails: string[]): Promise<string | null> => {
    if (!user) return null;
    try {
      const { data: participants, error: partErr } = await supabaseClient
        .from('user_profiles')
        .select('user_id, email, full_name')
        .in('email', participantEmails);
      if (partErr) throw partErr;

      const participantIds = (participants || []).map((u: any) => u.user_id);
      participantIds.push(user.id);

      let conversationName = name;
      if (!isGroup && participants && participants.length > 0) {
        // For 1-on-1, get current user's name too
        const { data: currentUserProfile } = await supabaseClient
          .from('user_profiles')
          .select('full_name')
          .eq('user_id', user.id)
          .single();
        
        const otherUserName = participants[0].full_name || participants[0].email;
        const currentUserName = currentUserProfile?.full_name || 'You';
        conversationName = `${currentUserName} & ${otherUserName}`;
      }

      const now = new Date().toISOString();
      const convData = {
        name: conversationName,
        is_group: isGroup,
        created_by: user.id,
        created_at: now,
        updated_at: now
      };

      const { data: convDataResult, error: convCreateErr } = await supabaseClient
        .from('conversations')
        .insert([convData])
        .select()
        .single();
      if (convCreateErr) throw convCreateErr;

      const conv = convDataResult;

      const membersPayload = participantIds.map((id: string) => ({ conversation_id: conv.id, user_id: id }));
      const { error: membersErr } = await supabaseClient
        .from('conversation_members')
        .insert(membersPayload);
      if (membersErr) throw membersErr;

      // Invalidate and refetch conversations
      await queryClient.invalidateQueries({ queryKey: ['conversations', user.id] });
      return conv.id as string;
    } catch (err) {
      console.error("❌ FATAL: Error creating conversation:", err);
      setError(err instanceof Error ? err.message : "Failed to create conversation");
      return null;
    }
  }, [user, queryClient]);

  const markAsRead = useCallback(async (conversationId: string) => {
    if (!user) return;
    try {
      const { error: markErr } = await supabaseClient
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', user.id);
      if (markErr) throw markErr;
      queryClient.setQueryData(['conversations', user.id], (old: Conversation[] = []) =>
        old.map((conv) => (conv.id === conversationId ? { ...conv, unread_count: 0 } : conv))
      );
    } catch (err) {
      console.error("Error marking messages as read:", err);
      setError(err instanceof Error ? err.message : "Failed to mark messages as read");
    }
  }, [user, queryClient]);

  const leaveConversation = useCallback(async (conversationId: string) => {
    if (!user) return;
    try {
      const { error: leaveErr } = await supabaseClient
        .from('conversation_members')
        .delete()
        .eq('conversation_id', conversationId)
        .eq('user_id', user.id);
      if (leaveErr) throw leaveErr;
      // Update React Query cache
      queryClient.setQueryData(['conversations', user.id], (old: Conversation[] = []) =>
        old.filter((c) => c.id !== conversationId)
      );
      await queryClient.invalidateQueries({ queryKey: ['conversations', user.id] });
    } catch (err) {
      console.error("Error leaving conversation:", err);
      setError(err instanceof Error ? err.message : "Failed to leave conversation");
      throw err;
    }
  }, [user, queryClient]);

  const addMembersToConversation = useCallback(async (conversationId: string, participantEmails: string[]) => {
    if (!user) return;
    try {
      const { data: participants, error: partErr } = await supabaseClient
        .from('user_profiles')
        .select('user_id, email')
        .in('email', participantEmails);
      if (partErr) throw partErr;

      const participantIds = (participants || []).map((u: any) => u.user_id);
      if (participantIds.length === 0) {
        throw new Error('No valid users found with the provided emails');
      }

      const membersPayload = participantIds.map((id: string) => ({ conversation_id: conversationId, user_id: id }));
      const { error: membersErr } = await supabaseClient
        .from('conversation_members')
        .insert(membersPayload);
      if (membersErr) throw membersErr;

      // Invalidate to get updated participant list
      await queryClient.invalidateQueries({ queryKey: ['conversations', user.id] });
    } catch (err) {
      console.error("Error adding members:", err);
      setError(err instanceof Error ? err.message : "Failed to add members");
      throw err;
    }
  }, [user, queryClient]);

  // Initial load of all users
  useEffect(() => {
    if (!user || authLoading) return;
    fetchAllUsers();
  }, [user, authLoading, fetchAllUsers]);

  // Clear state when user logs out
  useEffect(() => {
    if (!user) {
      setAllUsers([]);
      setError(null);
    }
  }, [user]);

  const refreshMessages = useCallback(async (conversationId: string) => {
    await fetchMessages(conversationId);
  }, [fetchMessages, user]);

  return {
    conversations,
    isLoading,
    error,
    sendMessage,
    createConversation,
    markAsRead,
    allUsers,
    refreshMessages,
    setActiveConversationId,
    leaveConversation,
    addMembersToConversation,
    deleteConversation,
    // Optionally add deleteMessage, updateMessage, updateConversation if needed
  };
};
