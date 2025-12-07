import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface SocketContextValue {
  socket: Socket | null;
  connected: boolean;
  loading: boolean; // Include loading in context value
}

const SocketContext = createContext<SocketContextValue>({ socket: null, connected: false, loading: true });

export const useSocketContext = () => {
  return useContext(SocketContext);
};

interface SocketProviderProps {
  jwt: string;
  children: React.ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ jwt, children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true); // New loading state

  useEffect(() => {
    console.log('[SocketProvider] useEffect running. jwt:', jwt, 'socket:', socket);
    if (!jwt) return;

    const newSocket = io('http://192.168.1.40:4000', {
      auth: { token: jwt },
      transports: ['websocket']
    });
    setSocket(newSocket);

    newSocket.on('connect', () => {
      setConnected(true);
      setLoading(false); // Set loading to false when connected
      console.log('[SocketProvider] Connected:', newSocket.id);
    });

    newSocket.on('disconnect', (reason) => {
      setConnected(false);
      console.log('[SocketProvider] Disconnected:', reason);
    });

    newSocket.on('connect_error', (err) => {
      setConnected(false);
      setLoading(false); // Set loading to false even on error
      console.error('[SocketProvider] Connect error:', err);
    });

    return () => {
      newSocket.disconnect();
      setSocket(null);
    };
  }, [jwt]);

  const contextValue = React.useMemo(() => ({ socket, connected, loading }), [socket, connected, loading]);

  return <SocketContext.Provider value={contextValue}>{children}</SocketContext.Provider>;
};
