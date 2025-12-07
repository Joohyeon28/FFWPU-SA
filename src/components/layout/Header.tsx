import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Shield, Bell } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useAdmin } from "@/contexts/AdminContext";
import { useQuery } from "@tanstack/react-query";
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

const Header = () => {

  const { user } = useAuth();
  const { isAdmin } = useAdmin();
  const location = useLocation();

  // Unread messages state (simulate with React Query or context, replace with real logic)
  // For demo, we'll use a query to fetch unread messages
  const { data: unreadMessages } = useQuery({
    queryKey: ["unreadMessages", user?.id],
    queryFn: async () => {
      if (!user) return [];
      // Replace with your real unread messages fetch logic
      const { data, error } = await fetch(`/api/messages/unread?userId=${user.id}`).then(r => r.json());
      if (error) return [];
      return data || [];
    },
    enabled: !!user,
    staleTime: 10000,
  });
  const hasUnread = unreadMessages && unreadMessages.length > 0;
  const latestUnread = hasUnread ? unreadMessages[0] : null;

  const isActive = (path: string) => {
    return location.pathname === path ? "text-white border-b-2 border-white" : "text-white/70 border-b-2 border-transparent";
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-gradient-to-r from-primary/95 to-primary/90 backdrop-blur-md shadow-card text-white">
      <div className="container flex h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2 font-semibold text-white min-w-0 hover:opacity-80 transition-opacity">
          <img src="/FFWPU Logo.png" alt="FFWPU-SA Logo" className="h-10 w-10" />
          <span className="text-lg truncate font-bold">FFWPU-SA</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
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
