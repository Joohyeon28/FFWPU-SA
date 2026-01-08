import { useState, useEffect } from 'react';
import { SocketProvider } from '../contexts/SocketContext';
import Messages from './Messages';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const MessagesLayout = () => {
    // Scroll to top on mount
    useEffect(() => {
      window.scrollTo({ top: 0, behavior: "auto" });
    }, []);
  const [jwt, setJwt] = useState('');
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const authTokenRaw = localStorage.getItem('sb-opendizwrcmluvxabajt-auth-token');
    if (authTokenRaw) {
      try {
        const authToken = JSON.parse(authTokenRaw);
        setJwt(authToken?.access_token || '');
      } catch {}
    }
  }, []);

  if (isLoading) {
    return (<div className="flex min-h-screen flex-col"><Header /><main className="flex-1 flex items-center justify-center"><p className="text-muted-foreground">Loading...</p></main><Footer/></div>);
  }

  if (!user) {
    return (<div className="flex min-h-screen flex-col"><Header /><main className="flex-1 flex items-center justify-center"><div className="text-center"><p className="text-lg font-medium mb-4">Please log in to access messages</p><Button onClick={() => navigate('/login')}>Go to Login</Button></div></main><Footer/></div>);
  }

  if (!jwt) {
    return (<div className="flex min-h-screen flex-col"><Header /><main className="flex-1 flex items-center justify-center"><p className="text-muted-foreground">Loading messages...</p></main><Footer/></div>);
  }

  return (
    <SocketProvider jwt={jwt}>
      <Messages />
    </SocketProvider>
  );
};

export default MessagesLayout;