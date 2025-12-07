const io = require('socket.io')(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

io.on('connection', (socket) => {
  console.log('[Backend] New client connected:', socket.id);

  socket.on('getConversations', () => {
    console.log('[Backend] Received getConversations event from client:', socket.id);

    // Simulate fetching conversations (replace with actual database query)
    const conversations = [
      { id: 1, name: 'Conversation 1' },
      { id: 2, name: 'Conversation 2' }
    ];

    console.log('[Backend] Emitting conversations event with data:', conversations);
    socket.emit('conversations', conversations);
  });

  socket.on('disconnect', (reason) => {
    console.log('[Backend] Client disconnected:', socket.id, 'Reason:', reason);
  });
});