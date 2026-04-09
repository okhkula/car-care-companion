import { useState, useRef, useEffect, useCallback } from "react";
import { toast } from "sonner";
import ChatMessage from "@/components/ChatMessage";
import ChatInput from "@/components/ChatInput";
import TypingIndicator from "@/components/TypingIndicator";
import WelcomeScreen from "@/components/WelcomeScreen";
import { Message, streamChat } from "@/lib/chat";

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const send = useCallback(
    async (input: string) => {
      if (isLoading) return;
      const userMsg: Message = { role: "user", content: input };
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
        <div>
          <h2 className="text-sm font-semibold text-foreground leading-tight">CarsGPT</h2>
          <p className="text-xs text-muted-foreground">Your beginner car guide</p>
        </div>
      </header>

      {/* Messages area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin">
        {hasMessages ? (
          <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
            {messages.map((m, i) => (
              <ChatMessage key={i} role={m.role} content={m.content} />
            ))}
            {isLoading && messages[messages.length - 1]?.role === "user" && <TypingIndicator />}
          </div>
        ) : (
          <WelcomeScreen onSuggestionClick={send} />
        )}
      </div>

      {/* Input */}
      <ChatInput onSend={send} disabled={isLoading} />
    </div>
  );
};

export default Index;
