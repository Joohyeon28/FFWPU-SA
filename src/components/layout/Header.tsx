import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Shield, Bell, Home, MessageSquare, Calendar, Info } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useAdmin } from "@/contexts/AdminContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchUserProfile } from "@/lib/profile";
import UserAvatar from "@/components/UserAvatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useSocketContext } from "@/contexts/SocketContext";

const Header = () => {
  const { user } = useAuth();
  const { isAdmin } = useAdmin();
  const location = useLocation();
  const { socket } = useSocketContext();
  const queryClient = useQueryClient();

  // Unread messages state managed via socket notifications
  const [unreadMessages, setUnreadMessages] = useState<any[]>([]);
  const hasUnread = unreadMessages.length > 0;
  const latestUnread = hasUnread ? unreadMessages[0] : null;

  const isActive = (path: string) => {
    return location.pathname === path ? "text-white border-b-2 border-white" : "text-white/70 border-b-2 border-transparent";
  };

  // Listen for real-time message updates
  useEffect(() => {
    if (!socket || !user) {
      console.log("[Header] Socket or user not available.");
      return;
    }

    console.log("[Header] Socket connected:", socket.connected);

    // Debugging: Join a test room for notifications
    const testRoom = `user-${user.id}`;
    socket.emit("join", testRoom, (response: any) => {
      console.log(`[Header] Joined room: ${testRoom}`, response);
    });

    const handleNewMessage = (message: any) => {
      console.log("[Header] New message received (socket):", message);
      if (message.conversation_id) {
        console.log("[Header] Message belongs to conversation:", message.conversation_id);
      } else {
        console.warn("[Header] Message does not have a conversation_id:", message);
      }

      // Add to local unread messages (avoid duplicates)
      setUnreadMessages((prev) => {
        if (!message || !message.id) return prev;
        if (prev.some((m) => m.id === message.id)) return prev;
        return [message, ...prev];
      });
    };

    const handleConversationRead = (payload: any) => {
      console.log('[Header] conversationRead received:', payload);
      const conversationId = payload?.conversationId;
      if (!conversationId) return;
      setUnreadMessages((prev) => prev.filter((m) => m.conversation_id !== conversationId));
    };

    const handleConversationUnreadCount = (payload: any) => {
      console.log('[Header] conversationUnreadCount received:', payload);
      const conversationId = payload?.conversationId;
      const unread = payload?.unread_count;
      if (!conversationId) return;
      if (typeof unread === 'number' && unread === 0) {
        // remove any stored unread messages for this conversation
        setUnreadMessages((prev) => prev.filter((m) => m.conversation_id !== conversationId));
      }
      // if unread > 0 we keep existing unreadMessages (they will be added by incoming message events)
    };

    console.log("[Header] Registering message & conversationRead event listeners.");
    socket.on("message", handleNewMessage);
    socket.on("conversationRead", handleConversationRead);
    socket.on("conversationUnreadCount", handleConversationUnreadCount);

    return () => {
      console.log("[Header] Removing message and conversationRead event listeners.");
      socket.off("message", handleNewMessage);
      socket.off("conversationRead", handleConversationRead);
      socket.off("conversationUnreadCount", handleConversationUnreadCount);
    };
  }, [socket, user, queryClient]);

  return (
    <>
    <header className="sticky top-0 z-50 w-full border-b bg-gradient-to-r from-primary/95 to-primary/90 backdrop-blur-md shadow-card text-white">
      <div className="container flex h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2 font-semibold text-white min-w-0 hover:opacity-80 transition-opacity">
          <img src="/FFWPU Logo.png" alt="FFWPU-SA Logo" className="h-10 w-10" />
          <span className="text-lg truncate font-bold">FFWPU-SA</span>
        </Link>

        <nav className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 items-center gap-8">
          <Link to="/" className={`text-sm font-medium transition-all hover:text-white/80 ${isActive("/")}`}> 
            Home
          </Link>
          <Link to="/messages" className={`text-sm font-medium transition-all hover:text-white/80 ${isActive("/messages")}`}> 
            Messages
          </Link>
          <Link to="/events" className={`text-sm font-medium transition-all hover:text-white/80 ${isActive("/events")}`}> 
            Events
          </Link>
          <Link to="/about" className={`text-sm font-medium transition-all hover:text-white/80 ${isActive("/about")}`}> 
            About
          </Link>
          {isAdmin && (
            <Link to="/admin/dashboard" className={`text-sm font-medium transition-all hover:text-white/80 flex items-center gap-1 ${isActive("/admin/dashboard")}`}> 
              <Shield className="h-4 w-4" />
              Admin
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-end">
          {user && <BellMenu hasUnread={hasUnread} latestUnread={latestUnread} />}
          {user ? <UserMenu userId={user.id} /> : (
            <>
              <Button variant="ghost" size="sm" asChild className="text-white hover:bg-white/20">
                <Link to="/login">Log in</Link>
              </Button>
              <Button size="sm" asChild className="bg-white text-primary hover:bg-white/90">
                <Link to="/register">Get Started</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
    {/* Mobile bottom navigation: visible on small screens only */}
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-gradient-to-r from-primary/95 to-primary/90 text-white shadow-inner">
      <div className="container mx-auto flex items-center justify-between px-4 py-2">
        <Link to="/" className={`flex flex-col items-center justify-center text-xs w-1/4 py-1 ${isActive('/')}`}>
          <Home className="h-5 w-5" />
          <span className="mt-1">Home</span>
        </Link>
        <Link to="/messages" className={`flex flex-col items-center justify-center text-xs w-1/4 py-1 ${isActive('/messages')}`}>
          <div className="relative">
            <MessageSquare className="h-5 w-5" />
            {hasUnread && <span className="absolute -top-1 -right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse" />}
          </div>
          <span className="mt-1">Messages</span>
        </Link>
        <Link to="/events" className={`flex flex-col items-center justify-center text-xs w-1/4 py-1 ${isActive('/events')}`}>
          <Calendar className="h-5 w-5" />
          <span className="mt-1">Events</span>
        </Link>
        <Link to="/about" className={`flex flex-col items-center justify-center text-xs w-1/4 py-1 ${isActive('/about')}`}>
          <Info className="h-5 w-5" />
          <span className="mt-1">About</span>
        </Link>
      </div>
    </nav>
    </>
  );
};

// BellMenu component for notifications
const BellMenu = ({ hasUnread, latestUnread }: { hasUnread: boolean, latestUnread: any }) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button className="relative flex items-center justify-center h-10 w-10 rounded-full hover:bg-white/20 transition-colors focus:outline-none" aria-label="Notifications">
          <Bell className="h-6 w-6 text-white" />
          {hasUnread && <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-white min-w-[260px]">
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        {hasUnread && latestUnread ? (
          <DropdownMenuItem
            onSelect={() => {
              setOpen(false);
              navigate("/messages");
            }}
            className="whitespace-normal"
          >
            <div>
              <div className="font-semibold text-primary">New Message</div>
              <div className="text-sm text-muted-foreground line-clamp-2">{latestUnread.content || "You have a new message."}</div>
              <div className="text-xs text-muted-foreground mt-1">From: {latestUnread.sender_name || "Unknown"}</div>
            </div>
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem disabled>No new messages</DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
const UserMenu = ({ userId }: { userId: string }) => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { isAdmin } = useAdmin();
  const { data: profile } = useQuery({
    queryKey: ["userProfile", userId],
    queryFn: () => fetchUserProfile(userId),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const display = profile?.full_name || profile?.email || "Account";
  const avatarSrc = profile?.avatar_url || "";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-white/20 transition-colors">
          <UserAvatar userId={userId} className="h-8 w-8" />
          <span className="hidden md:inline text-sm text-white">{display}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent sideOffset={8} align="end" className="bg-white">
        <DropdownMenuLabel>Account</DropdownMenuLabel>
        <DropdownMenuItem onSelect={() => navigate('/dashboard')}>Profile</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => navigate('/profile/edit')}>Edit Profile</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => navigate('/settings')}>Settings</DropdownMenuItem>
        {isAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Admin</DropdownMenuLabel>
            <DropdownMenuItem onSelect={() => navigate('/admin/dashboard')}>
              <Shield className="mr-2 h-4 w-4" />
              Admin Dashboard
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={async () => { await signOut(); navigate('/'); }}>Sign out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default Header;
