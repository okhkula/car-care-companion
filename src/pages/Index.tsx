import { useState, useRef, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { ImageIcon, LogOut, LogIn } from "lucide-react";
import ChatMessage from "@/components/ChatMessage";
import ChatInput from "@/components/ChatInput";
import TypingIndicator from "@/components/TypingIndicator";
import WelcomeScreen from "@/components/WelcomeScreen";
import { Message, MessageContent, streamChat, getMessageText } from "@/lib/chat";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { user, signOut } = useAuth();

  const scrollToBottom = () => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const send = useCallback(
    async (input: string, imageUrls?: string[]) => {
      if (isLoading) return;

      let content: MessageContent;
      if (imageUrls && imageUrls.length > 0) {
        content = [
          { type: "text" as const, text: input },
          ...imageUrls.map((url) => ({
            type: "image_url" as const,
            image_url: { url },
          })),
        ];
      } else {
        content = input;
      }

      const userMsg: Message = { role: "user", content };
      const updatedMessages = [...messages, userMsg];
      setMessages(updatedMessages);
      setIsLoading(true);

      let assistantContent = "";

      const upsert = (chunk: string) => {
        assistantContent += chunk;
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant") {
            return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantContent } : m));
          }
          return [...prev, { role: "assistant", content: assistantContent }];
        });
      };

      try {
        await streamChat({
          messages: updatedMessages,
          onDelta: upsert,
          onDone: () => setIsLoading(false),
          onError: (err) => {
            toast.error(err);
            setIsLoading(false);
          },
        });
      } catch {
        toast.error("Failed to connect. Please try again.");
        setIsLoading(false);
      }
    },
    [messages, isLoading]
  );

  const hasMessages = messages.length > 0;

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="flex items-center gap-2 px-4 py-3 border-b border-border bg-card">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <span className="text-primary-foreground text-sm font-bold">🚗</span>
        </div>
        <div className="flex-1">
          <h2 className="text-sm font-semibold text-foreground leading-tight">CarsGPT</h2>
          <p className="text-xs text-muted-foreground">Your beginner car guide</p>
        </div>
        <div className="flex items-center gap-2">
          {user && (
            <Link
              to="/gallery"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              Gallery
            </Link>
          )}
          {user ? (
            <button
              onClick={signOut}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign out
            </button>
          ) : (
            <Link
              to="/auth"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-primary hover:bg-secondary transition-colors"
            >
              <LogIn className="w-3.5 h-3.5" />
              Sign in
            </Link>
          )}
        </div>
      </header>

      {/* Messages area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin">
        {hasMessages ? (
          <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
            {messages.map((m, i) => (
              <ChatMessage key={i} role={m.role} content={m.content} />
            ))}
            {isLoading && getMessageText(messages[messages.length - 1]?.content) && messages[messages.length - 1]?.role === "user" && <TypingIndicator />}
          </div>
        ) : (
          <WelcomeScreen onSuggestionClick={(text) => send(text)} />
        )}
      </div>

      {/* Input */}
      <ChatInput onSend={send} disabled={isLoading} />
    </div>
  );
};

export default Index;
