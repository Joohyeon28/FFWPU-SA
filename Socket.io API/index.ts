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

  // Handle sending a message
  socket.on('message', async (data) => {
    console.log('[Socket.io] message event received:', data);
    try {
      const { conversationId, message } = data;

      // Validate input data
      if (!conversationId || !message?.content) {
        console.error('Invalid message data:', data);
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
          content: message.content,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving message to database:', error);
        socket.emit('error', { message: 'Failed to save message.' });
        return;
      }

      // After inserting message, fetch sender info
      const { data: senderData } = await supabase
        .from('user_profiles')
        .select('full_name, avatar_url')
        .eq('user_id', senderId)
        .single();

      // Broadcast the saved message to the room
      io.to(conversationId).emit('message', {
        ...inserted,
        sender_id: senderId,
        sender_name: senderData?.full_name || 'Unknown',
        sender_avatar: senderData?.avatar_url, // Add this
        content: message.content,
      });

      // Add logging for debugging
      console.log(`📤 [SERVER] Broadcasting message to room ${conversationId}`);
      console.log(`📤 [SERVER] Room members:`, io.sockets.adapter.rooms.get(conversationId));
    } catch (err) {
      console.error('Unexpected error in message handler:', err);
      socket.emit('error', { message: 'Server error.' });
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

          return {
            ...conv,
            participants,
            messages: messagesWithSenders,
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
