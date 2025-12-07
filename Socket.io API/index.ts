import dotenv from 'dotenv';
dotenv.config();
console.log('Loaded SUPABASE_URL:', process.env.SUPABASE_URL);
// Socket.io API server entrypoint
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { authenticateSocket } from './auth';
import { createClient } from '@supabase/supabase-js';
// Create Supabase client for server-side DB operations
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:8080',
      'http://localhost:8080/',
      'http://127.0.0.1:8080',
      'http://127.0.0.1:8080/',
      'https://192.168.1.40:8080',
    ],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Socket.io connection handler with authentication
io.use(async (socket, next) => {
  console.log('[Socket.io] Connection attempt:', socket.id, 'from', socket.handshake.address);
  try {
    const authResult = await authenticateSocket(socket);
    if (!authResult) {
      console.warn('[Socket.io] Authentication failed for socket:', socket.id);
      return next(new Error('Authentication error'));
    }
    // Attach user info to socket
    (socket as any).user = authResult.user;
    (socket as any).userId = authResult.userId;
    console.log('[Socket.io] Authentication succeeded for user:', authResult.userId, 'socket:', socket.id);
    next();
  } catch (err) {
    console.error('[Socket.io] Error during authentication for socket:', socket.id, err);
    return next(new Error('Authentication error'));
  }
});

io.on('connection', (socket) => {
  const user = (socket as any).user;
  const userId = (socket as any).userId;
  console.log(`[Socket.io] User connected: ${userId} (socket: ${socket.id})`);

  socket.on('error', (err) => {
    console.error('[Socket.io] Socket error:', err);
  });

  socket.on('connect_error', (err) => {
    console.error('[Socket.io] Socket connect error:', err);
  });

  // Join a conversation room
  socket.on('join', (conversationId, callback) => {
    // Only log on first join, not re-joins
    const rooms = Array.from(socket.rooms);
    if (!rooms.includes(conversationId)) {
      console.log(`[SERVER] User ${userId} joining room ${conversationId}`);
    }
    socket.join(conversationId);
    if (callback) {
      callback({ success: true });
    }
  });

  // Leave a conversation room
  socket.on('leave', (conversationId) => {
    if (!conversationId) {
      console.error('Invalid conversation ID');
      return;
    }

    const rooms = Array.from(socket.rooms);
    if (!rooms.includes(conversationId)) {
      console.log(`User ${userId} is not in room ${conversationId}`);
      return;
    }

    socket.leave(conversationId);
    console.log(`User ${userId} left room ${conversationId}`);
  });

  // Handle sending a message (with detailed logging)
  socket.on('sendMessage', async (data) => {
    console.log('[Socket.io] sendMessage event received:', {
      socketId: socket.id,
      userId,
      data
    });
    try {
      const { conversationId, content } = data;

      // Validate input data
      if (!conversationId || !content) {
        console.error('[Socket.io] Invalid sendMessage data:', data);
        socket.emit('error', { message: 'Invalid message data.' });
        return;
      }

      const senderId = userId;

      // Insert message into the database
      const { error, data: inserted } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: senderId,
          content,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('[Socket.io] Error saving message to database:', error);
        socket.emit('error', { message: 'Failed to save message.' });
        return;
      }

      // After inserting message, fetch sender info
      const { data: senderData } = await supabase
        .from('user_profiles')
        .select('full_name, avatar_url')
        .eq('user_id', senderId)
        .single();

      const broadcastPayload = {
        ...inserted,
        sender_id: senderId,
        sender_name: senderData?.full_name || 'Unknown',
        sender_avatar: senderData?.avatar_url,
        content,
      };

      // Broadcast the saved message to the room
      console.log(`[SERVER] Broadcasting message to room ${conversationId}`);
      console.log(`[SERVER] Broadcast payload:`, broadcastPayload);
      console.log(`[SERVER] Room members:`, io.sockets.adapter.rooms.get(conversationId));
      // Broadcast the saved message to the conversation room
      io.to(conversationId).emit('message', broadcastPayload);

      // Also emit a per-user notification to each conversation member's personal room
      try {
        const { data: members, error: membersError } = await supabase
          .from('conversation_members')
          .select('user_id')
          .eq('conversation_id', conversationId);

        if (membersError) {
          console.error('[Socket.io] Error fetching conversation members:', membersError);
        } else if (Array.isArray(members)) {
          const userIds = members.map((m: any) => m.user_id).filter(Boolean);
          console.log(`[SERVER] Emitting user notifications to:`, userIds);
          userIds.forEach((uid: string) => {
            const userRoom = `user-${uid}`;
            io.to(userRoom).emit('message', broadcastPayload);
          });
          // Update persisted unread_count for each member (except sender)
          try {
            for (const m of members) {
              const memberId = m.user_id;
              if (!memberId) continue;
              if (memberId === senderId) {
                // Ensure sender's unread_count remains unchanged (or zero)
                continue;
              }
              // Count unread messages for this member (messages not sent by them and not marked read)
              const { count, error: countErr } = await supabase
                .from('messages')
                .select('id', { count: 'exact' })
                .eq('conversation_id', conversationId)
                .neq('sender_id', memberId)
                .is('is_read', false);
              let unreadCount = 0;
              if (countErr) {
                console.error('[Socket.io] Error counting unread messages for', memberId, countErr);
              } else {
                unreadCount = (count as number) || 0;
              }
              // Persist the unread_count to conversation_members
              const { error: updateErr } = await supabase
                .from('conversation_members')
                .update({ unread_count: unreadCount })
                .eq('conversation_id', conversationId)
                .eq('user_id', memberId);
              if (updateErr) {
                console.error('[Socket.io] Error updating unread_count for', memberId, updateErr);
              }
              // Emit the updated unread count to the member's personal room
              const memberRoom = `user-${memberId}`;
              io.to(memberRoom).emit('conversationUnreadCount', { conversationId, unread_count: unreadCount });
            }
          } catch (err) {
            console.error('[Socket.io] Error updating/emitting unread counts after sendMessage:', err);
          }
        }
      } catch (err) {
        console.error('[Socket.io] Error emitting per-user notifications:', err);
      }
    } catch (err) {
      console.error('[Socket.io] Unexpected error in sendMessage handler:', err);
      socket.emit('error', { message: 'Server error.' });
    }
  });

  // Handle marking a conversation as read by this user
  socket.on('markConversationRead', async (data) => {
    const conversationId = data?.conversationId;
    console.log('[Socket.io] markConversationRead received from', userId, 'for', conversationId);
    if (!conversationId) return;
    try {
      const { error: markErr } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', userId);
      if (markErr) {
        console.error('[Socket.io] Error marking messages read:', markErr);
      }

      // Notify this user's UI to clear conversation-level notifications
      const userRoom = `user-${userId}`;
      io.to(userRoom).emit('conversationRead', { conversationId });

      // Optionally notify other participants in the conversation that messages were read (emit to conversation room)
      io.to(conversationId).emit('conversationReadBy', { conversationId, userId });
      // Persistently reset this member's unread_count to 0
      try {
        const { error: resetErr } = await supabase
          .from('conversation_members')
          .update({ unread_count: 0 })
          .eq('conversation_id', conversationId)
          .eq('user_id', userId);
        if (resetErr) {
          console.error('[Socket.io] Error resetting unread_count for', userId, resetErr);
        }
      } catch (err) {
        console.error('[Socket.io] Error while resetting unread_count persistently:', err);
      }
      // Compute unread counts per participant and emit to their personal rooms
      try {
        const { data: members, error: membersErr } = await supabase
          .from('conversation_members')
          .select('user_id')
          .eq('conversation_id', conversationId);
        if (membersErr) {
          console.error('[Socket.io] Error fetching conversation members for unread counts:', membersErr);
        } else if (Array.isArray(members)) {
          for (const m of members) {
            const memberId = m.user_id;
            // count unread messages for this member (messages not sent by them and not marked read)
            const { count, error: countErr } = await supabase
              .from('messages')
              .select('id', { count: 'exact' })
              .eq('conversation_id', conversationId)
              .neq('sender_id', memberId)
              .is('is_read', false);
            let unreadCount = 0;
            if (countErr) {
              console.error('[Socket.io] Error counting unread messages for', memberId, countErr);
            } else {
              unreadCount = (count as number) || 0;
            }
            // Persist the computed unread_count
            try {
              const { error: updateErr } = await supabase
                .from('conversation_members')
                .update({ unread_count: unreadCount })
                .eq('conversation_id', conversationId)
                .eq('user_id', memberId);
              if (updateErr) {
                console.error('[Socket.io] Error updating unread_count for', memberId, updateErr);
              }
            } catch (err) {
              console.error('[Socket.io] Error persisting unread_count for', memberId, err);
            }
            const memberRoom = `user-${memberId}`;
            io.to(memberRoom).emit('conversationUnreadCount', { conversationId, unread_count: unreadCount });
          }
        }
      } catch (err) {
        console.error('[Socket.io] Error computing/emitting unread counts:', err);
      }
    } catch (err) {
      console.error('[Socket.io] Error handling markConversationRead:', err);
    }
  });

    // Handle deleting a conversation
    socket.on('deleteConversation', async (conversationId) => {
      console.log('[Socket.io] deleteConversation event received:', conversationId);
      try {
        if (!conversationId) {
          socket.emit('error', { message: 'Invalid conversation ID.' });
          return;
        }

        // Delete related conversation members
        const { error: membersError } = await supabase
          .from('conversation_members')
          .delete()
          .eq('conversation_id', conversationId);

        if (membersError) {
          console.error('Error deleting conversation members:', membersError);
          socket.emit('error', { message: 'Failed to delete conversation members.' });
          return;
        }

        // Delete related messages
        const { error: messagesError } = await supabase
          .from('messages')
          .delete()
          .eq('conversation_id', conversationId);

        if (messagesError) {
          console.error('Error deleting messages:', messagesError);
          socket.emit('error', { message: 'Failed to delete messages.' });
          return;
        }

        // Delete the conversation
        const { error: conversationError } = await supabase
          .from('conversations')
          .delete()
          .eq('id', conversationId);

        if (conversationError) {
          console.error('Error deleting conversation:', conversationError);
          socket.emit('error', { message: 'Failed to delete conversation.' });
          return;
        }

        // Notify all clients in the room
        io.to(conversationId).emit('conversationDeleted', { conversationId });
        socket.leave(conversationId);
      } catch (err) {
        console.error('Unexpected error in deleteConversation handler:', err);
        socket.emit('error', { message: 'Server error.' });
      }
    });

    // Handle deleting a message
    socket.on('deleteMessage', async ({ messageId, conversationId }) => {
      console.log('[Socket.io] deleteMessage event received:', { messageId, conversationId });
      try {
        if (!messageId || !conversationId) {
          socket.emit('error', { message: 'Invalid message or conversation ID.' });
          return;
        }
        const { error } = await supabase
          .from('messages')
          .delete()
          .eq('id', messageId);
        if (error) {
          console.error('Error deleting message:', error);
          socket.emit('error', { message: 'Failed to delete message.' });
          return;
        }
        io.to(conversationId).emit('messageDeleted', { messageId });
      } catch (err) {
        console.error('Unexpected error in deleteMessage handler:', err);
        socket.emit('error', { message: 'Server error.' });
      }
    });

    // Handle updating a message
    socket.on('updateMessage', async ({ messageId, conversationId, newContent }) => {
      console.log('[Socket.io] updateMessage event received:', { messageId, conversationId, newContent });
      try {
        if (!messageId || !conversationId || !newContent) {
          socket.emit('error', { message: 'Invalid update data.' });
          return;
        }
        const { error, data: updated } = await supabase
          .from('messages')
          .update({ content: newContent })
          .eq('id', messageId)
          .select()
          .single();
        if (error) {
          console.error('Error updating message:', error);
          socket.emit('error', { message: 'Failed to update message.' });
          return;
        }
        io.to(conversationId).emit('messageUpdated', { ...updated });
      } catch (err) {
        console.error('Unexpected error in updateMessage handler:', err);
        socket.emit('error', { message: 'Server error.' });
      }
    });

    // Handle updating a conversation
    socket.on('updateConversation', async ({ conversationId, updates }) => {
      console.log('[Socket.io] updateConversation event received:', { conversationId, updates });
      try {
        if (!conversationId || !updates) {
          socket.emit('error', { message: 'Invalid update data.' });
          return;
        }
        const { error, data: updated } = await supabase
          .from('conversations')
          .update(updates)
          .eq('id', conversationId)
          .select()
          .single();
        if (error) {
          console.error('Error updating conversation:', error);
          socket.emit('error', { message: 'Failed to update conversation.' });
          return;
        }
        io.to(conversationId).emit('conversationUpdated', { ...updated });
      } catch (err) {
        console.error('Unexpected error in updateConversation handler:', err);
        socket.emit('error', { message: 'Server error.' });
      }
    });

  // Handle message read receipts
  socket.on('messageRead', async ({ messageId, conversationId }) => {
    try {
      if (!messageId || !conversationId) {
        socket.emit('error', { message: 'Invalid message or conversation ID for read receipt.' });
        return;
      }
      // Update the message's read status in the database
      const { error, data: updated } = await supabase
        .from('messages')
        .update({ read: true, read_at: new Date().toISOString() })
        .eq('id', messageId)
        .select()
        .single();
      if (error) {
        console.error('Error updating message read status:', error);
        socket.emit('error', { message: 'Failed to update message read status.' });
        return;
      }
      // Broadcast the read receipt to all clients in the conversation room
      io.to(conversationId).emit('messageRead', {
        messageId,
        conversationId,
        read: true,
        read_at: updated?.read_at || new Date().toISOString(),
        readerId: userId
      });
      console.log(`[SERVER] Broadcasted read receipt for message ${messageId} in conversation ${conversationId}`);
    } catch (err) {
      console.error('Unexpected error in messageRead handler:', err);
      socket.emit('error', { message: 'Server error.' });
    }
  });

  // Fetch all conversations for the connected user
  socket.on('getConversations', async () => {
    try {
      console.log('[SERVER] getConversations for user:', userId);
      // Find all conversation IDs where the user is a member
      const { data: memberRows, error: memberErr } = await supabase
        .from('conversation_members')
        .select('conversation_id')
        .eq('user_id', userId);

      if (memberErr) {
        console.error('❌ Error fetching conversation memberships:', memberErr);
        socket.emit('error', { message: 'Failed to fetch conversations.' });
        return;
      }

      const conversationIds = (memberRows || []).map((row: any) => row.conversation_id);

      if (!conversationIds.length) {
        socket.emit('conversations', []);
        return;
      }

      // SIMPLIFIED: Just fetch basic conversation data first
      const { data: conversations, error: convErr } = await supabase
        .from('conversations')  // Use 'conversations' table, not 'conversation_summaries'
        .select('*')
        .in('id', conversationIds)
        .order('updated_at', { ascending: false });

      if (convErr) {
        console.error('❌ Error fetching conversations:', convErr);
        socket.emit('error', { message: 'Failed to fetch conversations.' });
        return;
      }

      console.log('🎯 [SERVER] Found conversations:', conversations?.length || 0);

      // For each conversation, fetch participants
      const conversationsWithParticipants = await Promise.all(
        (conversations || []).map(async (conv: any) => {
          // Fetch participants for this conversation
          const { data: members } = await supabase
            .from('conversation_members')
            .select('user_id')
            .eq('conversation_id', conv.id);

          const participantIds = (members || []).map((m: any) => m.user_id);

          // Fetch user details for participants
          let participants: {
            id: string;
            name: string;
            email: string;
            avatar?: string;
          }[] = [];
          if (participantIds.length > 0) {
            const { data: users } = await supabase
              .from('user_profiles')
              .select('user_id, full_name, email, avatar_url')
              .in('user_id', participantIds);

            participants = (users || []).map((u: any) => ({
              id: u.user_id,
              name: u.full_name || u.email,
              email: u.email,
              avatar: u.avatar_url,
            }));
          }

          // Fetch messages for this conversation
          const { data: messagesData } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: true });

          // Get sender info for each message
          const messagesWithSenders = await Promise.all(
            (messagesData || []).map(async (msg: any) => {
              const { data: sender } = await supabase
                .from('user_profiles')
                .select('full_name, avatar_url')
                .eq('user_id', msg.sender_id)
                .single();
              return {
                ...msg,
                sender_name: sender?.full_name || 'Unknown',
                sender_avatar: sender?.avatar_url
              };
            })
          );

          // Fetch unread_count for this conversation for the connected user
          let unread_count = 0;
          try {
            const { data: cm } = await supabase
              .from('conversation_members')
              .select('unread_count')
              .eq('conversation_id', conv.id)
              .eq('user_id', userId)
              .single();
            unread_count = cm?.unread_count || 0;
          } catch (err) {
            console.error('[SERVER] Error fetching unread_count for conversation', conv.id, err);
          }

          return {
            ...conv,
            participants,
            messages: messagesWithSenders,
            unread_count,
            last_message: messagesWithSenders[messagesWithSenders.length - 1]?.content,
            last_message_time: messagesWithSenders[messagesWithSenders.length - 1]?.created_at
          };
        })
      );

      console.log('🎯 [SERVER] Emitting conversations with participants');
      socket.emit('conversations', conversationsWithParticipants);

    } catch (err) {
      console.error('🎯 [SERVER] Unexpected error:', err);
      socket.emit('error', { message: 'Server error.' });
    }
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${userId} (${socket.id})`);
  });
});

const PORT: number = parseInt(process.env.PORT ?? '4000', 10);
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Socket.io API server running on http://0.0.0.0:${PORT}`);
  console.log('Socket.io server started');
});
