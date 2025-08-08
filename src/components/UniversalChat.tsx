import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Send, MessageCircle, X, Minimize2, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  avatar?: string;
  message: string;
  timestamp: Date;
  channelId?: string;
  roomId?: string;
}

interface UniversalChatProps {
  currentUserId: string;
  currentUsername: string;
  currentUserAvatar?: string;
  channelId?: string;
  roomId?: string;
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
  className?: string;
}

export const UniversalChat = ({
  currentUserId,
  currentUsername,
  currentUserAvatar,
  channelId,
  roomId,
  isMinimized = false,
  onToggleMinimize,
  className
}: UniversalChatProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      userId: "system",
      username: "System",
      message: "Welcome to the chat! You can now communicate with other users.",
      timestamp: new Date(Date.now() - 300000),
      channelId,
      roomId
    },
    {
      id: "2",
      userId: "alice",
      username: "Alice",
      message: "Hey everyone! Great to see the chat working!",
      timestamp: new Date(Date.now() - 120000),
      channelId,
      roomId
    },
    {
      id: "3",
      userId: "bob",
      username: "Bob",
      message: "This is awesome! The proximity chat feature is really cool.",
      timestamp: new Date(Date.now() - 60000),
      channelId,
      roomId
    }
  ]);
  
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  // Filter messages for current context
  const filteredMessages = messages.filter(msg => {
    if (channelId && msg.channelId === channelId) return true;
    if (roomId && msg.roomId === roomId) return true;
    if (!channelId && !roomId && !msg.channelId && !msg.roomId) return true;
    return false;
  });

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      userId: currentUserId,
      username: currentUsername,
      avatar: currentUserAvatar,
      message: inputMessage.trim(),
      timestamp: new Date(),
      channelId,
      roomId
    };

    setMessages(prev => [...prev, newMessage]);
    setInputMessage("");
    
    // Focus back to input
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp: Date) => {
    const today = new Date();
    const messageDate = new Date(timestamp);
    
    if (messageDate.toDateString() === today.toDateString()) {
      return "Today";
    }
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (messageDate.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    }
    
    return messageDate.toLocaleDateString();
  };

  // Group messages by date
  const groupedMessages = filteredMessages.reduce((groups, message) => {
    const dateKey = message.timestamp.toDateString();
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(message);
    return groups;
  }, {} as Record<string, ChatMessage[]>);

  if (isMinimized) {
    return (
      <div className={cn("fixed bottom-4 right-4 z-50", className)}>
        <Button
          onClick={onToggleMinimize}
          className="rounded-full w-12 h-12 shadow-lg"
          size="icon"
        >
          <MessageCircle className="w-5 h-5" />
        </Button>
        {/* Unread indicator could go here */}
      </div>
    );
  }

  return (
    <Card className={cn("flex flex-col border-border/50", className)}>
      {/* Chat Header */}
      <div className="flex items-center justify-between p-2 border-b border-border/50">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-accent" />
          <h3 className="font-semibold text-foreground">
            {channelId ? `# ${channelId}` : roomId ? `Room ${roomId}` : "Global Chat"}
          </h3>
        </div>
        <div className="flex items-center gap-1">
          {onToggleMinimize && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleMinimize}
              className="w-8 h-8"
            >
              <Minimize2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea ref={scrollAreaRef} className="flex-1 p-2 max-h-32">
        <div className="space-y-4">
          {Object.entries(groupedMessages).map(([dateKey, dayMessages]) => (
            <div key={dateKey}>
              {/* Date Separator */}
              <div className="flex items-center gap-2 my-4">
                <div className="flex-1 h-px bg-border/50" />
                <span className="text-xs text-muted-foreground px-2 bg-background">
                  {formatDate(new Date(dateKey))}
                </span>
                <div className="flex-1 h-px bg-border/50" />
              </div>

              {/* Messages for this date */}
              <div className="space-y-3">
                {dayMessages.map((message, index) => {
                  const isCurrentUser = message.userId === currentUserId;
                  const isSystemMessage = message.userId === "system";
                  const prevMessage = index > 0 ? dayMessages[index - 1] : null;
                  const isGrouped = prevMessage && 
                    prevMessage.userId === message.userId && 
                    (message.timestamp.getTime() - prevMessage.timestamp.getTime()) < 60000; // 1 minute

                  if (isSystemMessage) {
                    return (
                      <div key={message.id} className="text-center py-2">
                        <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded">
                          {message.message}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={message.id}
                      className={cn(
                        "flex gap-3",
                        isCurrentUser && "flex-row-reverse",
                        isGrouped && "mt-1"
                      )}
                    >
                      {/* Avatar */}
                      {!isGrouped && (
                        <Avatar className="w-8 h-8 flex-shrink-0">
                          <AvatarImage src={message.avatar} alt={message.username} />
                          <AvatarFallback className="text-xs">
                            {message.username.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      
                      {isGrouped && <div className="w-8" />}

                      {/* Message Content */}
                      <div className={cn("flex-1 max-w-[80%]", isCurrentUser && "text-right")}>
                        {!isGrouped && (
                          <div className={cn(
                            "flex items-baseline gap-2 mb-1",
                            isCurrentUser && "flex-row-reverse"
                          )}>
                            <span className="font-medium text-sm text-foreground">
                              {message.username}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatTime(message.timestamp)}
                            </span>
                          </div>
                        )}
                        
                        <div
                          className={cn(
                            "inline-block px-3 py-2 rounded-lg max-w-full break-words",
                            isCurrentUser
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-foreground"
                          )}
                        >
                          {message.message}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Message Input */}
      <div className="p-2 border-t border-border/50">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            placeholder={`Message ${channelId ? `#${channelId}` : roomId ? `Room ${roomId}` : "chat"}...`}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1"
            maxLength={500}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim()}
            size="icon"
            className="flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Character count */}
        <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
          <div />
          <span>{inputMessage.length}/500</span>
        </div>
      </div>
    </Card>
  );
};