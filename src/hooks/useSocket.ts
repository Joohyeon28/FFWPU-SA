
import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface UseSocketOptions {
  userId: string;
  onMessage?: (message: any) => void;
  onConversation?: (conversation: any) => void;
}

interface UseSocketResult {
  sendMessage: (data: any) => void;
  deleteConversation: (id: string) => void;
  deleteMessage: (id: string) => void;
  updateMessage: (id: string, updates: any) => void;
  updateConversation: (id: string, updates: any) => void;
  sendReadReceipt: (messageId: string) => void;
  connected: boolean;
}

export function useSocket(options: UseSocketOptions): UseSocketResult {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socket = io('/', { query: { userId: options.userId } });
    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    if (options.onMessage) {
      socket.on('message', options.onMessage);
    }
    if (options.onConversation) {
      socket.on('conversation', options.onConversation);
    }

    return () => {
      socket.disconnect();
    };
  }, [options.userId]);

  const sendMessage = (data: any) => {
    socketRef.current?.emit('sendMessage', data);
  };
  const deleteConversation = (id: string) => {
    socketRef.current?.emit('deleteConversation', { id });
  };
  const deleteMessage = (id: string) => {
    socketRef.current?.emit('deleteMessage', { id });
  };
  const updateMessage = (id: string, updates: any) => {
    socketRef.current?.emit('updateMessage', { id, updates });
  };
  const updateConversation = (id: string, updates: any) => {
    socketRef.current?.emit('updateConversation', { id, updates });
  };
  const sendReadReceipt = (messageId: string) => {
    socketRef.current?.emit('readReceipt', { messageId });
  };

  return {
    sendMessage,
    deleteConversation,
    deleteMessage,
    updateMessage,
    updateConversation,
    sendReadReceipt,
    connected,
  };
}
