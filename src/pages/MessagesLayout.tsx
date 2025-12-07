import { useState, useEffect } from 'react';
import { SocketProvider } from '../contexts/SocketContext';
import Messages from './Messages';

const MessagesLayout = () => {
    // Scroll to top on mount
    useEffect(() => {
      window.scrollTo({ top: 0, behavior: "auto" });
    }, []);
  const [jwt, setJwt] = useState('');

  useEffect(() => {
    const authTokenRaw = localStorage.getItem('sb-opendizwrcmluvxabajt-auth-token');
    if (authTokenRaw) {
      try {
        const authToken = JSON.parse(authTokenRaw);
        setJwt(authToken?.access_token || '');
      } catch {}
    }
  }, []);

  if (!jwt) {
    return <div>Loading messages...</div>;
  }

  return (
    <SocketProvider jwt={jwt}>
      <Messages />
    </SocketProvider>
  );
};

export default MessagesLayout;