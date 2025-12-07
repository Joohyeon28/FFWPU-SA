import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { X, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Recipient {
  id: string;
  name: string;
  email: string;
}

interface NewConversationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (name: string, isGroup: boolean, participants: string[]) => void; // participants: emails
  knownRecipients?: Recipient[]; // optional list to power suggestions
}

const NewConversationDialog = ({ open, onOpenChange, onCreate, knownRecipients = [] }: NewConversationDialogProps) => {
  const [isGroup, setIsGroup] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [participantInput, setParticipantInput] = useState("");
  const [participants, setParticipants] = useState<Recipient[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filteredSuggestions = participantInput
    ? knownRecipients.filter((r) => {
        const nameMatch = (r.name?.toLowerCase() || "").includes(participantInput.toLowerCase());
        const emailMatch = (r.email?.toLowerCase() || "").includes(participantInput.toLowerCase());
        return nameMatch || emailMatch;
      })
    : [];

  const handleAddParticipant = (recipient?: Recipient) => {
    if (recipient) {
      if (!participants.some((p) => p.email === recipient.email)) {
        setParticipants([...participants, recipient]);
      }
      setParticipantInput("");
      setShowSuggestions(false);
      return;
    }
    // If user presses add without selecting suggestion, ignore (name required)
    if (participantInput.trim()) {
      setShowSuggestions(true);
    }
  };

  const handleRemoveParticipant = (email: string) => {
    setParticipants(participants.filter((p) => p.email !== email));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddParticipant();
    }
  };

  const handleCreate = () => {
    if (participants.length === 0) return;
    const participantEmails = participants.map((p) => p.email);
    onCreate(groupName, isGroup, participantEmails);
    // Reset form
    setIsGroup(false);
    setGroupName("");
    setParticipantInput("");
    setParticipants([]);
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset form
    setIsGroup(false);
    setGroupName("");
    setParticipantInput("");
    setParticipants([]);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="sm:max-w-md"
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault() as unknown as void}
      >
        {/* Explicit close button – only allowed way to dismiss without creating */}
        <button
          type="button"
          aria-label="Close"
          onClick={handleClose}
          className="absolute right-3 top-3 rounded-sm p-1 text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-none"
        >
          <X className="h-4 w-4" />
        </button>
        <DialogHeader>
          <DialogTitle>New Conversation</DialogTitle>
          <DialogDescription>
            Start a new direct message or create a group chat.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="group-toggle" className="text-sm font-medium">
              Create a group chat
            </Label>
            <Switch
              id="group-toggle"
              checked={isGroup}
              onCheckedChange={setIsGroup}
            />
          </div>

          {isGroup && (
            <div className="space-y-2">
              <Label htmlFor="group-name">Group Name</Label>
              <Input
                id="group-name"
                placeholder="Enter group name..."
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="participants">
              {isGroup ? "Add Participants (name)" : "Recipient Name"}
            </Label>
            <div className="flex gap-2 relative">
              <Input
                id="participants"
                placeholder="Type a name..."
                value={participantInput}
                onChange={(e) => {
                  setParticipantInput(e.target.value);
                  setShowSuggestions(true);
                }}
                onKeyPress={handleKeyPress}
              />
              <Button
                type="button"
                variant="secondary"
                size="icon"
                onClick={() => handleAddParticipant()}
                disabled={!participantInput.trim()}
              >
                <UserPlus className="h-4 w-4" />
              </Button>
              {showSuggestions && filteredSuggestions.length > 0 && (
                <div className="absolute left-0 top-full z-20 mt-2 w-full rounded-md border bg-background shadow-card">
                  {filteredSuggestions.slice(0, 6).map((r) => (
                    <button
                      key={r.email}
                      type="button"
                      className="flex w-full items-center justify-between px-3 py-2 hover:bg-secondary"
                      onClick={() => handleAddParticipant(r)}
                    >
                      <span className="text-sm font-medium">{r.name}</span>
                      <span className="text-xs text-muted-foreground">{r.email}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {participants.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {participants.map((participant) => (
                <Badge
                  key={participant.email}
                  variant="secondary"
                  className="flex items-center gap-1 py-1"
                >
                  {participant.name}
                  <button
                    onClick={() => handleRemoveParticipant(participant.email)}
                    className="ml-1 rounded-full hover:bg-muted-foreground/20"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            onClick={handleCreate}
            disabled={participants.length === 0 || (isGroup && !groupName.trim())}
          >
            {isGroup ? "Create Group" : "Start Conversation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NewConversationDialog;
