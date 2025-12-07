import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import EventList from "@/components/events/EventList";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

const EventPlanner: React.FC = () => {
  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Loading...</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-lg font-medium mb-4">Please log in to access events</p>
            <Button onClick={() => navigate("/login")}>Go to Login</Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-gradient-subtle animate-fade-in">
        <div className="container py-12">
          <h1 className="text-2xl font-bold mb-6">Upcoming Events</h1>
          <div className="rounded-xl border bg-background p-4 shadow-card">
            <EventList />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default EventPlanner;
