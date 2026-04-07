import { useState, useEffect, useRef } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useDoctors, usePatients } from "@/hooks/use-users";
import { useWebSocket } from "@/hooks/use-websocket";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AvatarUpload } from "@/components/avatar-upload";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Loader2, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import type { Message } from "@shared/schema";

export function MessagesPage() {
  const { user } = useAuth();
  const { sendMessage } = useWebSocket();
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const isStudent = user?.role === "student";
  const { data: doctors } = useDoctors();
  const { data: patients } = usePatients();

  const contacts = isStudent ? doctors : patients;

  const { data: messages = [], isLoading } = useQuery<Message[]>({
    queryKey: [`/api/messages/${selectedUserId}`],
    enabled: !!selectedUserId,
  });

  const markReadMutation = useMutation({
    mutationFn: async (senderId: number) => {
      await apiRequest("PUT", `/api/messages/${senderId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/messages/${selectedUserId}`] });
    },
  });

  const createMsgMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await apiRequest("POST", "/api/messages", {
        senderId: user!.id,
        receiverId: selectedUserId!,
        content,
      });
      return await res.json();
    },
    onSuccess: (newMsg) => {
      queryClient.setQueryData<Message[]>([`/api/messages/${selectedUserId}`], (old) => {
        return [...(old || []), newMsg];
      });
    },
  });

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    // Mark messages as read when a conversation is opened
    if (selectedUserId && messages.length > 0) {
      const hasUnread = messages.some(m => m.senderId === selectedUserId && !m.read);
      if (hasUnread) {
        markReadMutation.mutate(selectedUserId);
      }
    }
  }, [selectedUserId, messages]);

  if (!user) return null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedUserId) return;
    
    createMsgMutation.mutate(messageInput.trim());
    setMessageInput("");
  };

  const getContactStatus = (contactId: number) => {
    // We could add online presence later. For now, just return a default dot.
    return "bg-emerald-500"; 
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col h-[calc(100vh-8rem)]">
        <div className="mb-6">
          <h1 className="text-3xl font-display font-bold">Messages</h1>
          <p className="text-muted-foreground mt-1">
            {isStudent ? "Chat with your doctors" : "Chat with your patients"}
          </p>
        </div>

        <Card className="flex-1 flex overflow-hidden border-none shadow-md bg-card rounded-2xl">
          {/* Contacts Sidebar */}
          <div className="w-80 border-r flex flex-col bg-muted/10">
            <div className="p-4 border-b bg-card">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                Conversations
              </h3>
            </div>
            <ScrollArea className="flex-1">
              <div className="divide-y">
                {contacts?.map((contact) => (
                  <button
                    key={contact.id}
                    onClick={() => setSelectedUserId(contact.id)}
                    className={`w-full p-4 flex items-center gap-3 hover:bg-muted/50 transition-colors text-left ${
                      selectedUserId === contact.id ? "bg-primary/5 border-l-4 border-primary" : "border-l-4 border-transparent"
                    }`}
                  >
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 bg-primary/10 flex items-center justify-center">
                        {contact.avatar ? (
                          <img src={contact.avatar} alt={contact.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="font-bold text-primary text-xs uppercase">{contact.name.substring(0, 2)}</span>
                        )}
                      </div>
                      <span className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-background rounded-full ${getContactStatus(contact.id)}`} />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <h4 className="font-medium truncate">{isStudent ? `Dr. ${contact.name}` : contact.name}</h4>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Chat Window */}
          <div className="flex-1 flex flex-col bg-card">
            {selectedUserId ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 bg-primary/10 flex items-center justify-center">
                    {contacts?.find(c => c.id === selectedUserId)?.avatar ? (
                      <img src={contacts?.find(c => c.id === selectedUserId)?.avatar!} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-bold text-primary text-xs uppercase">{contacts?.find(c => c.id === selectedUserId)?.name.substring(0, 2)}</span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold">
                      {isStudent 
                        ? `Dr. ${contacts?.find(c => c.id === selectedUserId)?.name}`
                        : contacts?.find(c => c.id === selectedUserId)?.name
                      }
                    </h3>
                  </div>
                </div>

                {/* Messages Area */}
                <div 
                  className="flex-1 overflow-y-auto p-4 space-y-4"
                  ref={scrollRef}
                >
                  {isLoading ? (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                      <MessageSquare className="w-12 h-12 mb-4 opacity-20" />
                      <p>No messages yet. Say hello!</p>
                    </div>
                  ) : (
                    messages.map((msg, index) => {
                      const isMe = msg.senderId === user.id;
                      const showAvatar = index === 0 || messages[index - 1].senderId !== msg.senderId;
                      
                      return (
                        <div key={msg.id} className={`flex gap-3 ${isMe ? "justify-end" : "justify-start"}`}>
                          {!isMe && showAvatar && (
                            <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 bg-primary/10 mt-auto">
                               {contacts?.find(c => c.id === msg.senderId)?.avatar && (
                                 <img src={contacts.find(c => c.id === msg.senderId)!.avatar!} alt="Avatar" className="w-full h-full object-cover" />
                               )}
                            </div>
                          )}
                          {!isMe && !showAvatar && <div className="w-8" />}
                          
                          <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                            isMe 
                              ? "bg-primary text-primary-foreground rounded-br-none" 
                              : "bg-muted rounded-bl-none"
                          }`}>
                            <p className="text-sm">{msg.content}</p>
                            <span className={`text-[10px] mt-1 block ${isMe ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                              {format(new Date(msg.timestamp), "h:mm a")}
                              {isMe && msg.read && " • Read"}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Message Input */}
                <div className="p-4 border-t bg-muted/10">
                  <form onSubmit={handleSend} className="flex items-center gap-2">
                    <Input 
                      placeholder="Type your message..." 
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      className="flex-1 bg-background rounded-full h-12 px-6"
                    />
                    <Button 
                      type="submit" 
                      size="icon" 
                      className="w-12 h-12 rounded-full shrink-0 shadow-lg shadow-primary/20"
                      disabled={!messageInput.trim() || createMsgMutation.isPending}
                    >
                      {createMsgMutation.isPending ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                    </Button>
                  </form>
                </div>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                <div className="w-20 h-20 rounded-full bg-primary/5 flex items-center justify-center mb-4">
                  <MessageSquare className="w-10 h-10 text-primary/40" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-1">Your Messages</h3>
                <p>Select a conversation to start chatting</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
