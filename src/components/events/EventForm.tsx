import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createEvent, isAdmin, EventRow } from "@/lib/events";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

// EventRow type is now imported from "@/lib/events"

const EventForm: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [location, setLocation] = useState("");

  const [allowed, setAllowed] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    let mounted = true;
    const check = async () => {
      if (!user) return setAllowed(false);
      const a = await isAdmin(user.id);
      if (mounted) setAllowed(a);
    };
    check();
    return () => {
      mounted = false;
    };
  }, [user]);

  type EventPayload = {
    title: string;
    description: string;
    starts_at: string;
    location: string;
    is_public: boolean;
    created_by: string;
  };

  const mutation = useMutation<EventRow, Error, EventPayload>({
    mutationFn: (payload: EventPayload) => createEvent(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      setTitle("");
      setDescription("");
      setStartsAt("");
      setLocation("");
    },
  });

  if (allowed === null) return <div>Checking permissions...</div>;
  if (!allowed) return <div>You do not have permission to create events.</div>;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!user) return;
        mutation.mutate({
          title,
          description,
          starts_at: new Date(startsAt).toISOString(),
          location,
          is_public: true,
          created_by: user.id,
        });
      }}
      className="space-y-4 p-4 border rounded-md"
    >
      <h3 className="text-lg font-semibold">Create Event</h3>
      <div>
        <label className="block text-sm">Title</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full input" />
      </div>
      <div>
        <label className="block text-sm">Description</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full textarea" />
      </div>
      <div>
        <label className="block text-sm">Starts At</label>
        <input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} className="input" />
      </div>
      <div>
        <label className="block text-sm">Location</label>
        <input value={location} onChange={(e) => setLocation(e.target.value)} className="w-full input" />
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={mutation.status === "pending"}>
          Create Event
        </Button>
      </div>
    </form>
  );
};

export default EventForm;
