import { useEffect, useRef } from 'react';
import { useSocketContext } from '../contexts/SocketContext';

interface UseSocketOptions {
  conversationId: string;
  onMessage: (msg: any) => void;
}

const joinTracker = new Map<string, boolean>(); // Track joins globally

export function useSocket({ conversationId, onMessage }: UseSocketOptions) {
  const { socket, connected } = useSocketContext();
  const hasJoinedRef = useRef(false);
  const joinTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!socket || !connected || !conversationId) return;

    // Clear any pending join
    if (joinTimeoutRef.current) {
      clearTimeout(joinTimeoutRef.current);
    }

    // Only join once per conversationId change
    if (!hasJoinedRef.current) {
      hasJoinedRef.current = true;
      socket.emit('join', conversationId);
      // Only log actual join
      // console.log('[useSocket] Joined room:', conversationId);
    }

    const handleMessage = (msg: any) => {
      onMessage(msg);
    };
    socket.on('message', handleMessage);

    // Cleanup
    return () => {
      socket.off('message', handleMessage);
      hasJoinedRef.current = false;
      socket.emit('leave_room', conversationId);
      // Only log actual leave
      // console.log('[useSocket] Left room:', conversationId);
    };

    return () => {
      if (joinTimeoutRef.current) {
        clearTimeout(joinTimeoutRef.current);
      }
      hasJoinedRef.current = false;
    };
  }, [socket, connected, conversationId, onMessage]);

  // Send a message
  const sendMessage = (content: string) => {
    if (socket && connected && content) {
      console.log('[Socket.io] Sending message:', { conversationId, content });
      socket.emit('message', {
        conversationId,
        message: { content }
      });
    } else {
      console.warn('[Socket.io] Cannot send message: socket not connected or content empty');
    }
  };

  // Delete a conversation
  const deleteConversation = (convId: string) => {
    if (socket && connected && convId) {
      socket.emit('deleteConversation', convId);
    }
  };

  // Delete a message
  const deleteMessage = (messageId: string) => {
    if (socket && connected && messageId && conversationId) {
      socket.emit('deleteMessage', { messageId, conversationId });
    }
  };

  // Update a message
  const updateMessage = (messageId: string, newContent: string) => {
    if (socket && connected && messageId && conversationId && newContent) {
      socket.emit('updateMessage', { messageId, conversationId, newContent });
    }
  };

  // Update a conversation
  const updateConversation = (updates: any) => {
    if (socket && connected && conversationId && updates) {
      socket.emit('updateConversation', { conversationId, updates });
    }
  };

  useEffect(() => {
    if (!socket || !connected || !conversationId) return;
    // Listen for delete/update events
    const handleConversationDeleted = (data: any) => {
      console.log('[Socket.io] Conversation deleted:', data);
      // Optionally trigger UI update here
    };
    const handleMessageDeleted = (data: any) => {
      console.log('[Socket.io] Message deleted:', data);
      // Optionally trigger UI update here
    };
    const handleMessageUpdated = (data: any) => {
      console.log('[Socket.io] Message updated:', data);
      // Optionally trigger UI update here
    };
    const handleConversationUpdated = (data: any) => {
      console.log('[Socket.io] Conversation updated:', data);
      // Optionally trigger UI update here
    };
    socket.on('conversationDeleted', handleConversationDeleted);
    socket.on('messageDeleted', handleMessageDeleted);
    socket.on('messageUpdated', handleMessageUpdated);
    socket.on('conversationUpdated', handleConversationUpdated);
    return () => {
      socket.off('conversationDeleted', handleConversationDeleted);
      socket.off('messageDeleted', handleMessageDeleted);
      socket.off('messageUpdated', handleMessageUpdated);
      socket.off('conversationUpdated', handleConversationUpdated);
    };
  }, [socket, connected, conversationId]);

  return { sendMessage, deleteConversation, deleteMessage, updateMessage, updateConversation, connected };
}

// New hook for fetching all conversations via Socket.io
type UseSocketConversationsOptions = {
  onConversations: (convs: any[]) => void;
};

export function useSocketConversations({ onConversations }: UseSocketConversationsOptions) {
  console.log('🔌 [useSocketConversations] Hook mounted');
  const { socket, connected, loading } = useSocketContext();

  // Log dependencies when they change
  useEffect(() => {
    console.log('📊 [useSocketConversations] Dependencies changed:', {
      hasSocket: !!socket,
      connected,
      loading,
      socketId: socket?.id,
      onConversations: !!onConversations
    });
  }, [socket, connected, loading, onConversations]);

  useEffect(() => {
    console.log('🔄 [useSocketConversations] useEffect MAIN running', {
      hasSocket: !!socket,
      connected,
      loading,
      socketId: socket?.id
    });

    // SIMPLIFIED CHECK - just check if we have a connected socket
    if (!socket || !connected) {
      console.log('⏳ [useSocketConversations] Waiting for socket connection');
      return;
    }

    // WE ARE CONNECTED!
    console.log('✅ [useSocketConversations] CONNECTED! Requesting conversations...');

    const handleConversations = (convs: any[]) => {
      console.log('📥 [useSocketConversations] GOT conversations:', convs?.length || 0);
      onConversations(convs || []);
    };

    // Setup listener
    socket.on('conversations', handleConversations);

    // Request conversations
    console.log('📤 [useSocketConversations] EMITTING getConversations');
    socket.emit('getConversations');

    return () => {
      console.log('🧹 [useSocketConversations] Cleanup');
      socket.off('conversations', handleConversations);
    };
  }, [socket, connected, onConversations]); // REMOVE 'loading' from dependencies

  return null;
}
