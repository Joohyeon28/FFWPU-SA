import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AdminProvider } from "@/contexts/AdminContext";
import { useMessageNotifications } from "@/hooks/useMessageNotifications.tsx";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import ProfileSetup from "./pages/ProfileSetup.tsx";
import ProfileEdit from "./pages/ProfileEdit";
import Settings from "./pages/Settings";
import MessagesLayout from "./pages/MessagesLayout";
import NotFound from "./pages/NotFound";
import EventPlanner from "./pages/EventPlanner";
import Profile from "./pages/Profile";
import About from "./pages/About";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import AdminEditUser from "./pages/AdminEditUser";
import AdminConversations from "./pages/AdminConversations";
import AdminEvents from "./pages/AdminEvents";
import AdminAddEvent from "./pages/AdminAddEvent";
import AdminEditEvent from "./pages/AdminEditEvent";
import AdminSettings from "./pages/AdminSettings";
import { SocketProvider } from "./contexts/SocketContext";
import { useEffect, useState } from "react";

const queryClient = new QueryClient();

// Component that initializes the notification system
const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  useMessageNotifications();
  return <>{children}</>;
};

const App = () => {
  const [jwt, setJwt] = useState<string>("");

  useEffect(() => {
    // Get JWT from localStorage
    const authTokenRaw = localStorage.getItem("sb-opendizwrcmluvxabajt-auth-token");
    if (authTokenRaw) {
      try {
        const authToken = JSON.parse(authTokenRaw);
        setJwt(authToken?.access_token || "");
      } catch (error) {
        console.error("Error parsing auth token:", error);
      }
    }
  }, []);


  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SocketProvider jwt={jwt}>
          <AuthProvider>
            <AdminProvider>
              <NotificationProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/profile/setup" element={<ProfileSetup />} />
                    <Route path="/profile/edit" element={<ProfileEdit />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/messages" element={<MessagesLayout />} />
                    <Route path="/events" element={<EventPlanner />} />
                    <Route path="/profile/:userId" element={<Profile />} />
                    <Route path="/admin/dashboard" element={<AdminDashboard />} />
                    <Route path="/admin/users" element={<AdminUsers />} />
                    <Route path="/admin/users/edit/:userId" element={<AdminEditUser />} />
                    <Route path="/admin/conversations" element={<AdminConversations />} />
                    <Route path="/admin/events" element={<AdminEvents />} />
                    <Route path="/admin/events/add" element={<AdminAddEvent />} />
                    <Route path="/admin/events/edit/:eventId" element={<AdminEditEvent />} />
                    <Route path="/admin/settings" element={<AdminSettings />} />
                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </BrowserRouter>
              </NotificationProvider>
            </AdminProvider>
          </AuthProvider>
        </SocketProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
