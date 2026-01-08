import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Menu } from "lucide-react";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ConversationList from "@/components/messages/ConversationList";
import MessageThread from "@/components/messages/MessageThread";
import NewConversationDialog from "@/components/messages/NewConversationDialog";
import { Button } from "@/components/ui/button";
import { useMessages, type Conversation } from "@/hooks/useMessages";
import { useAuth } from "@/contexts/AuthContext";
import { toast as sonnerToast } from "@/components/ui/sonner";
import { SocketProvider, useSocketContext } from '../contexts/SocketContext';

function useToast() {
  return {
    toast: ({ title = "", description = "", duration = 4000 }: any) => {
      const msg = title ? (description ? `${title}: ${description}` : title) : description || "";
      if (typeof sonnerToast === 'function') sonnerToast(msg, { duration });
      else console.info('[toast]', msg);
    }
  };
}

const MessagesInner: React.FC = () => {
  const { socket, connected } = useSocketContext();
  const { user, isLoading: authLoading } = useAuth();
  const { createConversation, allUsers, refreshMessages, markAsRead, setActiveConversationId, deleteConversation } = useMessages();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [socketConversations, setSocketConversations] = useState<Conversation[]>([]);
  const [deletingIds, setDeletingIds] = useState<string[]>([]);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);

  const mountRef = useRef(0);
  useEffect(() => { mountRef.current += 1; }, []);

  useEffect(() => {
    if (!socket || !connected) return;
    const handleConversations = (convs: Conversation[]) => setSocketConversations(convs || []);
    socket.on('conversations', handleConversations);
    socket.emit('getConversations');
    return () => { socket.off('conversations', handleConversations); };
  }, [socket, connected]);

  useEffect(() => {
    if (!socket) return;
    const handleMessage = (msg: any) => {
      setSocketConversations(prev => prev.map(c => c.id === msg.conversation_id ? { ...c, messages: [...(c.messages||[]), msg], last_message: msg.content, last_message_time: msg.created_at } : c));
      if (user && msg.sender_id !== user.id) toast({ title: msg.sender_name || 'New message', description: msg.content });
    };
    const handleDeleted = (data: any) => {
      const id = data.conversationId || data.id;
      setSocketConversations(prev => prev.filter(c => c.id !== id));
      setDeletingIds(prev => prev.filter(x => x !== id));
      if (selectedConversation?.id === id) setSelectedConversation(null);
    };
    socket.on('message', handleMessage);
    socket.on('conversationDeleted', handleDeleted);
    return () => { socket.off('message', handleMessage); socket.off('conversationDeleted', handleDeleted); };
  }, [socket, user, selectedConversation]);

  useEffect(() => {
    if (!selectedConversation?.id) return;
    (async () => {
      try { await refreshMessages(selectedConversation.id); markAsRead(selectedConversation.id); setActiveConversationId(selectedConversation.id); }
      catch (e) { console.error(e); }
    })();
  }, [selectedConversation?.id]);

  useEffect(() => { if (!user) setSelectedConversation(null); }, [user]);

  const adjustedConversations = socketConversations.map((conv) => {
    if (conv.is_group) return { ...conv, name: conv.name || `Group (${conv.participants?.length || 0} members)` };
    if (conv.participants?.length) {
      const other = conv.participants.find(p => p.id !== user?.id);
      return { ...conv, name: other?.name || other?.email || conv.name || 'Unknown' };
    }
    return conv;
  });

  if (authLoading) return (<div className="flex min-h-screen flex-col"><Header /><main className="flex-1 flex items-center justify-center"><p className="text-muted-foreground">Loading...</p></main><Footer/></div>);
  if (!user) return (<div className="flex min-h-screen flex-col"><Header /><main className="flex-1 flex items-center justify-center"><div className="text-center"><p className="text-lg font-medium mb-4">Please log in to access messages</p><Button onClick={() => navigate('/login')}>Go to Login</Button></div></main><Footer/></div>);

  const handleSendMessage = (content: string) => {
    if (!selectedConversation || !socket) return;
    socket.emit('sendMessage', { conversationId: selectedConversation.id, content });
  };

  const handleCreateConversation = async (name: string, isGroup: boolean, participantEmails: string[]) => {
    const tempId = `temp-${Date.now()}`;
    const participants = isGroup ? participantEmails.map(e => ({ id: '', name: e, email: e })) : [{ id: user!.id, name: (user as any).name || user!.email, email: user!.email }];
    const optimistic: Conversation = { id: tempId, name: name || 'Conversation', is_group: isGroup, created_by: user!.id, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), participants, messages: [], unread_count: 0 };
    setSocketConversations(prev => [optimistic, ...prev]);
    setSelectedConversation(optimistic);
    try {
      const id = await createConversation(name, isGroup, participantEmails);
      if (id) {
        setSocketConversations(prev => prev.map(c => c.id === tempId ? { ...c, id } : c));
        setShowNewDialog(false);
        toast({ title: 'Success', description: 'Conversation created' });
      }
    } catch (e) { console.error(e); }
  };

  const handleDeleteConversation = async (conversationId: string): Promise<void> => {
    if (!socket) return;
    setDeletingIds((prev) => Array.from(new Set([...(prev || []), conversationId])));
    await deleteConversation(conversationId);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-gradient-subtle animate-fade-in">
        <div className="container max-w-5xl py-12">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Messages</h1>
              <p className="text-muted-foreground">Chat with members and groups</p>
            </div>
            <Button onClick={() => setShowNewDialog(true)}><Plus className="mr-2 h-4 w-4"/>New Message</Button>
          </div>

          <div className="flex h-[calc(100vh-280px)] min-h-[500px] overflow-hidden rounded-xl border bg-background shadow-card">
            <Button variant="ghost" size="icon" className="absolute left-4 top-4 z-10 md:hidden" onClick={() => setShowSidebar(!showSidebar)}><Menu className="h-5 w-5"/></Button>
            <div className={`w-full border-r md:w-80 lg:w-96 overflow-y-auto ${showSidebar ? 'block' : 'hidden md:block'} ${selectedConversation && 'hidden md:block'}`}>
              <ConversationList
                conversations={adjustedConversations}
                selectedId={selectedConversation?.id}
                onSelect={(conv) => {
                  setSelectedConversation(conv as Conversation);
                  setShowSidebar(false);
                }}
                userId={user!.id}
                deletingIds={deletingIds}
              />
            </div>
            <div className={`flex-1 ${!selectedConversation && 'hidden md:flex'} flex flex-col`}>
              {selectedConversation ? (
                <MessageThread conversation={selectedConversation} currentUserId={user!.id} onSendMessage={handleSendMessage} onBack={() => { setSelectedConversation(null); setShowSidebar(true); }} onDeleteConversation={handleDeleteConversation} allUsers={allUsers} />
              ) : (
                <div className="flex h-full items-center justify-center"><p className="text-muted-foreground">Select a conversation to start chatting</p></div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
      <NewConversationDialog open={showNewDialog} onOpenChange={setShowNewDialog} onCreate={handleCreateConversation} knownRecipients={allUsers} />
    </div>
  );
};

const Messages: React.FC = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  if (isLoading) return (<div className="flex min-h-screen flex-col"><Header /><main className="flex-1 flex items-center justify-center"><p className="text-muted-foreground">Loading...</p></main><Footer/></div>);
  if (!user) return (<div className="flex min-h-screen flex-col"><Header /><main className="flex-1 flex items-center justify-center"><div className="text-center"><p className="text-lg font-medium mb-4">Please log in to access messages</p><Button onClick={() => navigate('/login')}>Go to Login</Button></div></main><Footer/></div>);

  const jwt = (() => {
    try { const raw = window.localStorage.getItem('sb-opendizwrcmluvxabajt-auth-token'); if (!raw) return ''; const parsed = JSON.parse(raw); return parsed?.access_token || ''; }
    catch (e) { return ''; }
  })();

  if (!jwt) return (<div className="flex min-h-screen flex-col"><Header /><main className="flex-1 flex items-center justify-center"><p className="text-muted-foreground">Loading messages...</p></main><Footer/></div>);
  return (<SocketProvider jwt={jwt}><MessagesInner /></SocketProvider>);
};

export default Messages;

