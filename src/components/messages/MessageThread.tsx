import React, { useState, useRef, useEffect, useCallback } from "react";
import { useQueryClient } from '@tanstack/react-query';
import { useSocketContext } from "@/contexts/SocketContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Send, Users, MoreVertical, Info, UserPlus, LogOut } from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Message, Conversation } from "@/hooks/useMessages";
// Remove unused SocketProvider import. Wrap your parent component (e.g., Messages.tsx) with <SocketProvider jwt={jwt}> ... </SocketProvider>

interface MessageThreadProps {
  conversation: Conversation;
  currentUserId: string;
  onSendMessage: (content: string) => void;
  onBack: () => void;
  onLeaveGroup?: (conversationId: string) => Promise<void>;
  onAddMembers?: (conversationId: string, emails: string[]) => Promise<void>;
  onDeleteConversation?: (conversationId: string) => Promise<void>;
  allUsers?: { id: string; name: string; email: string; avatar?: string }[];
}
const MessageThread = ({ conversation, currentUserId, onSendMessage, onBack, onLeaveGroup, onAddMembers, onDeleteConversation, allUsers }: MessageThreadProps) => {
    useEffect(() => {
      console.log('[MessageThread] localStorage contents:');
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        const value = window.localStorage.getItem(key!);
        console.log(`  ${key}:`, value);
      }
    }, []);
  const [newMessage, setNewMessage] = useState("");
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [addMemberSuggestions, setAddMemberSuggestions] = useState<{ id: string; name: string; email: string }[]>([]);
  // Replace direct use of conversation.messages with local state
  const [messages, setMessages] = useState<Message[]>(conversation.messages || []);
  // Detect if a user was recently added (by comparing participants)
  const [lastParticipantCount, setLastParticipantCount] = useState(conversation.participants.length);
  const [userAddedNotification, setUserAddedNotification] = useState<string | null>(null);

  useEffect(() => {
    if (conversation.is_group) {
      if (conversation.participants.length > lastParticipantCount) {
        // Find the new participant(s)
        const prevCount = lastParticipantCount;
        const prevIds = new Set(conversation.participants.slice(0, prevCount).map(p => p.id));
        const newUsers = conversation.participants.filter(p => !prevIds.has(p.id));
        if (newUsers.length > 0) {
          setUserAddedNotification(`${newUsers.map(u => u.name).join(", ")} joined the group`);
        }
      }
      setLastParticipantCount(conversation.participants.length);
    }
  }, [conversation.participants]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const renderCount = useRef(0);

  // Remove JWT logic here. The socket context should be provided by a parent <SocketProvider jwt={jwt}>.

  // Use socket from context for all real-time actions
  const { socket, connected } = useSocketContext();

  // Join/leave conversation room for real-time messaging
  useEffect(() => {
    if (connected && socket && conversation.id) {
      socket.emit('join', conversation.id);
      return () => {
        socket.emit('leave', conversation.id);
      };
    }
  }, [connected, socket, conversation.id]);

  // Emit read receipts for all messages not sent by current user
  useEffect(() => {
    if (!socket) return;
    messages.forEach((message) => {
      if (message.sender_id !== currentUserId) {
        socket.emit('readReceipt', { messageId: message.id });
      }
    });
    // Only run when messages or currentUserId changes
  }, [messages, currentUserId, socket]);

  useEffect(() => {
    console.log('[MessageThread] Socket connected:', connected);
  }, [connected]);

  // Scroll to bottom when messages update
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Extend the Message type locally to include isTemporary
  type LocalMessage = Message & {
    isTemporary?: boolean; // Optional property for temporary messages
  };

  // Update local state to use LocalMessage
  const [localMessages, setLocalMessages] = useState<LocalMessage[]>(conversation.messages || []);
  const queryClient = useQueryClient();

  // Sync local messages when the conversation prop changes (e.g., when opening a conversation)
  useEffect(() => {
    setLocalMessages(conversation.messages || []);
  }, [conversation.id, conversation.messages]);

  // Update handleSend to use LocalMessage
  const handleSend = () => {
    if (!newMessage.trim() || !socket || !conversation.id) return;
    console.log('[MessageThread] Sending message:', {
      conversationId: conversation.id,
      content: newMessage.trim(),
    });
    const tempMessage: LocalMessage = {
      id: `temp-${Date.now()}`, // Temporary ID
      conversation_id: conversation.id,
      sender_id: currentUserId,
      sender_name: "You", // Placeholder for sender name
      content: newMessage.trim(),
      created_at: new Date().toISOString(),
      isTemporary: true, // Mark as temporary
    };
    setLocalMessages((prevMessages) => [...prevMessages, tempMessage]);
    // Optimistically update conversations list in react-query cache
    try {
      const now = new Date().toISOString();
      queryClient.setQueryData(['conversations', currentUserId], (old: any[] = []) => {
        const updated = [...old];
        const idx = updated.findIndex((c) => c.id === conversation.id);
        if (idx !== -1) {
          // update messages array for this conversation
          const conv = { ...updated[idx] };
          conv.last_message = tempMessage.content;
          conv.last_message_time = tempMessage.created_at;
          conv.updated_at = now;
          conv.messages = [...(conv.messages || []), tempMessage];
          updated[idx] = conv;
          // move to top
          const item = updated.splice(idx, 1)[0];
          updated.unshift(item);
        } else {
          // insert stub at top
          updated.unshift({
            id: conversation.id,
            name: conversation.name,
            is_group: conversation.is_group,
            participants: conversation.participants,
            last_message: tempMessage.content,
            last_message_time: tempMessage.created_at,
            unread_count: 0,
            messages: [tempMessage],
          });
        }
        return updated;
      });
    } catch (err) {
      console.warn('[MessageThread] optimistic update failed:', err);
    }
    socket.emit('sendMessage', {
      conversationId: conversation.id,
      content: newMessage.trim(),
    });
    setNewMessage("");
  };
  // Listen for incoming messages and add them to the UI if for this conversation
  useEffect(() => {
    if (!socket) return;
    const handleMessage = (msg: Message) => {
      console.log('[MessageThread] Received socket message:', msg);
      if (msg.conversation_id === conversation.id) {
        setLocalMessages((prevMessages) => {
          // Replace temporary message if it exists
          const tempIndex = prevMessages.findIndex((m) => m.isTemporary && m.content === msg.content);
          if (tempIndex !== -1) {
            const updatedMessages = [...prevMessages];
            updatedMessages[tempIndex] = msg; // Replace temporary message
            return updatedMessages;
          }
          // Avoid duplicates
          if (!prevMessages.some((m) => m.id === msg.id)) {
            return [...prevMessages, msg];
          }
          return prevMessages;
        });
      }
    };
    socket.on('message', handleMessage);
    return () => {
      socket.off('message', handleMessage);
    };
  }, [socket, conversation.id]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getInitials = (name: string | undefined | null) => {
    if (!name || typeof name !== 'string') return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatMessageDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) {
      return format(date, "h:mm a");
    } else if (isYesterday(date)) {
      return `Yesterday ${format(date, "h:mm a")}`;
    }
    return format(date, "MMM d, h:mm a");
  };

  const groupMessagesByDate = (messages: Message[]) => {
    const groups: { date: string; messages: Message[] }[] = [];
    let currentDate = "";

    messages.forEach((message) => {
      const messageDate = format(new Date(message.created_at), "yyyy-MM-dd");
      if (messageDate !== currentDate) {
        currentDate = messageDate;
        groups.push({
          date: isToday(new Date(message.created_at))
            ? "Today"
            : isYesterday(new Date(message.created_at))
            ? "Yesterday"
            : format(new Date(message.created_at), "MMMM d, yyyy"),
          messages: [message],
        });
      } else {
        groups[groups.length - 1].messages.push(message);
      }
    });

    return groups;
  };

  const messageGroups = groupMessagesByDate(localMessages);

  // Use socket for deleting conversation
  const handleDeleteConversation = async () => {
    if (!socket) return;
    if (confirm("Are you sure you want to delete this conversation?")) {
      socket.emit('deleteConversation', { id: conversation.id });
      onBack();
    }
  };

  // Use socket for deleting a message
  const handleDeleteMessage = async (messageId: string) => {
    if (!socket) return;
    socket.emit('deleteMessage', { id: messageId });
  };

  // Use socket for updating a message
  const handleUpdateMessage = async (messageId: string, newContent: string) => {
    if (!socket) return;
    socket.emit('updateMessage', { id: messageId, updates: { content: newContent } });
  };

  const handleLeaveGroup = async () => {
    if (!onLeaveGroup) return;
    if (confirm("Are you sure you want to leave this group?")) {
      try {
        await onLeaveGroup(conversation.id);
        onBack();
      } catch (err) {
        alert("Failed to leave group. Please try again.");
      }
    }
  };

  const handleAddMembers = async () => {
    if (!onAddMembers || !newMemberEmail.trim()) return;
    try {
      await onAddMembers(conversation.id, [newMemberEmail.trim()]);
      setNewMemberEmail("");
      setShowAddMembers(false);
      setAddMemberSuggestions([]);
    } catch (err) {
      alert("Failed to add member. Please try again.");
    }
  };

  const filterMemberSuggestions = (input: string) => {
    if (!input.trim() || !allUsers) {
      setAddMemberSuggestions([]);
      return;
    }
    const existingIds = new Set(conversation.participants.map((p) => p.id));
    const filtered = allUsers
      .filter((u) => !existingIds.has(u.id) && (u.name.toLowerCase().includes(input.toLowerCase()) || u.email.toLowerCase().includes(input.toLowerCase())))
      .slice(0, 5);
    setAddMemberSuggestions(filtered);
  };

  useEffect(() => {
    console.log("Conversation data:", conversation);
    console.log("Messages:", conversation.messages);
  }, [conversation]);
  // Adjust conversation name for one-on-one chats
  const conversationName = conversation.is_group
    ? conversation.name || `Group (${conversation.participants?.length || 0})`
    : (
        conversation.participants?.find((p) => p.id !== currentUserId)?.name ||
        conversation.name ||
        'Unknown User'
      );

  useEffect(() => {
    renderCount.current += 1;
    console.log(`[MessageThread] Render #${renderCount.current} for conversation:`, conversation.id);

    return () => {
      console.log(`[MessageThread] Unmounting for conversation:`, conversation.id);
    };
  }, [conversation.id]);

  return (
    <div className="flex h-full flex-col">
      {!connected && (
        <div className="bg-red-100 text-red-700 p-2 text-center text-sm">
          Real-time messaging is not connected. Please check your network or authentication.
        </div>
      )}
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="md:hidden" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Avatar className="h-10 w-10">
            {conversation.is_group ? (
              <AvatarFallback className="bg-primary/10 text-primary">
                <Users className="h-5 w-5" />
              </AvatarFallback>
            ) : (
              (() => {
                const otherUser = conversation.participants?.find(p => p.id !== currentUserId);
                return otherUser?.avatar ? (
                  <AvatarImage 
                    src={otherUser.avatar} 
                    alt={otherUser.name}
                  />
                ) : (
                  <AvatarFallback className="bg-secondary">
                    {getInitials(otherUser?.name || conversation.name)}
                  </AvatarFallback>
                );
              })()
            )}
          </Avatar>
          <div>
            <h3 className="font-medium">{conversationName}</h3>
            {conversation.is_group && (
              <p className="text-xs text-muted-foreground">
                {conversation.participants.map((p) => p.name).join(", ")}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {conversation.is_group && (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Info className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Group Info</SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-6">
                  <div>
                    <h4 className="mb-2 text-sm font-medium text-muted-foreground">
                      {conversation.participants.length} Members
                    </h4>
                    <div className="space-y-2">
                      {conversation.participants.map((participant) => (
                        <div key={participant.id} className="flex items-center gap-3 rounded-lg p-2 hover:bg-secondary/50">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">
                              {getInitials(participant.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <span className="text-sm font-medium">{participant.name}</span>
                            <p className="text-xs text-muted-foreground">{participant.email}</p>
                          </div>
                          {participant.id === currentUserId && (
                            <span className="ml-auto text-xs text-muted-foreground">You</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Add Members Section */}
                  {onAddMembers && (
                    <div className="border-t pt-4">
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => setShowAddMembers(!showAddMembers)}
                      >
                        <UserPlus className="mr-2 h-4 w-4" />
                        Add Members
                      </Button>
                      {showAddMembers && (
                        <div className="mt-3 space-y-2">
                          <Input
                            placeholder="Enter name or email..."
                            value={newMemberEmail}
                            onChange={(e) => {
                              setNewMemberEmail(e.target.value);
                              filterMemberSuggestions(e.target.value);
                            }}
                          />
                          {addMemberSuggestions.length > 0 && (
                            <div className="rounded-md border">
                              {addMemberSuggestions.map((suggestion) => (
                                <button
                                  key={suggestion.id}
                                  onClick={() => {
                                    setNewMemberEmail(suggestion.email);
                                    setAddMemberSuggestions([]);
                                  }}
                                  className="flex w-full items-center gap-2 p-2 hover:bg-secondary"
                                >
                                  <Avatar className="h-6 w-6">
                                    <AvatarFallback className="text-xs">
                                      {getInitials(suggestion.name)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="text-left">
                                    <p className="text-sm font-medium">{suggestion.name}</p>
                                    <p className="text-xs text-muted-foreground">{suggestion.email}</p>
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}
                          <Button
                            onClick={handleAddMembers}
                            disabled={!newMemberEmail.trim()}
                            size="sm"
                            className="w-full"
                          >
                            Add
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Leave Group Section */}
                  {onLeaveGroup && (
                    <div className="border-t pt-4">
                      <Button
                        variant="outline"
                        className="w-full justify-start text-destructive hover:bg-destructive/10"
                        onClick={handleLeaveGroup}
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Leave Group
                      </Button>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleDeleteConversation} className="text-destructive">
                Delete conversation
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Messages */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4">
        {/* Show notification if a user was added */}
        {userAddedNotification && (
          <div className="flex justify-center mb-4">
            <span className="rounded-full bg-secondary px-3 py-1 text-xs text-muted-foreground">
              {userAddedNotification}
            </span>
          </div>
        )}
        {/* If no messages, but group has members, show nothing */}
        {messageGroups.length === 0 && conversation.is_group && conversation.participants.length > 1 ? null :
          messageGroups.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-muted-foreground">No messages yet. Start the conversation!</p>
            </div>
          ) : null
        }
        {messageGroups.map((group, groupIndex) => (
          <div key={groupIndex}>
            <div className="mb-4 flex justify-center">
              <span className="rounded-full bg-secondary px-3 py-1 text-xs text-muted-foreground">
                {group.date}
              </span>
            </div>
            {group.messages.map((message) => {
              const isMe = message.sender_id === currentUserId; // Ensure current user ID is used
              return (
                <div
                  key={message.id}
                  className={`mb-4 flex ${isMe ? "justify-end" : "justify-start"}`}
                >
                  <div className={`flex max-w-[75%] ${isMe ? "flex-row-reverse" : ""} ${!conversation.is_group && isMe ? "gap-0" : "gap-2"}`}>
                    {/* Only show avatar for group messages not sent by current user */}
                    {conversation.is_group && !isMe && (
                      <Avatar className="h-8 w-8 shrink-0">
                        {message.sender_avatar ? (
                          <AvatarImage 
                            src={message.sender_avatar} 
                            alt={message.sender_name}
                          />
                        ) : (
                          <AvatarFallback className="text-xs">
                            {getInitials(message.sender_name || "")}
                          </AvatarFallback>
                        )}
                      </Avatar>
                    )}
                    <div>
                      {!isMe && conversation.is_group && (
                        <p className="mb-1 text-xs font-medium text-muted-foreground">
                          {message.sender_name}
                        </p>
                      )}
                      <div
                        className={`rounded-2xl px-4 py-2 ${
                          isMe
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary"
                        }`} 
                        style={{ display: 'inline-block', maxWidth: '100%', wordBreak: 'break-word' }}
                      >
                        <p className="text-sm" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{message.content}</p>
                        {/* Read receipt indicator */}
                        {message.read && (
                          <span
                            title={`Read${message.read_at ? ` at ${formatMessageDate(message.read_at)}` : ''}`}
                            className="ml-2 align-middle text-xs text-green-500"
                            style={{ verticalAlign: 'middle' }}
                          >
                            ✓
                          </span>
                        )}
                      </div>
                      <p className={`mt-1 text-xs text-muted-foreground ${isMe ? "text-right" : ""}`}>
                        {formatMessageDate(message.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t p-4">
        <div className="flex gap-2">
          <Input
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1"
          />
          <Button onClick={handleSend} disabled={!newMessage.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default React.memo(MessageThread);
