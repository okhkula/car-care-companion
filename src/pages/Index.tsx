import { useState, useRef, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { ImageIcon, LogOut, LogIn, Car, History, X } from "lucide-react";
import ChatMessage from "@/components/ChatMessage";
import ChatInput from "@/components/ChatInput";
import ChatHistory from "@/components/ChatHistory";
import TypingIndicator from "@/components/TypingIndicator";
import WelcomeScreen from "@/components/WelcomeScreen";
import { Message, MessageContent, ResponseMode, streamChat } from "@/lib/chat";
import { useAuth } from "@/hooks/useAuth";
import { useUserCars, buildCarContext } from "@/hooks/useUserCars";
import { useConversations } from "@/hooks/useConversations";

const Index = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [responseMode, setResponseMode] = useState<ResponseMode>(() => {
    return (localStorage.getItem("carsgpt-response-mode") as ResponseMode) || "brief";
  });
  const scrollRef = useRef<HTMLDivElement>(null);
  const { user, signOut } = useAuth();
  const userCars = useUserCars();

  const {
    conversations,
    activeId,
    messages,
    setMessages,
    loadingHistory,
    fetchConversations,
    loadConversation,
    newConversation,
    saveMessage,
    deleteConversation,
  } = useConversations();

  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Driver";

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

      // Save user message & get/create conversation
      let convId = activeId;
      if (user) {
        convId = await saveMessage("user", content, activeId);
      }

      // Inject car context for the first message
      const carContext = buildCarContext(userCars);
      const messagesForApi = carContext && updatedMessages.length === 1
        ? [{ role: "user" as const, content: `[Context: ${carContext}]\n\n${typeof content === "string" ? content : input}` } as Message]
        : updatedMessages;

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
          messages: messagesForApi,
          responseMode,
          onDelta: upsert,
          onDone: async () => {
            setIsLoading(false);
            // Save assistant message
            if (user && convId && assistantContent) {
              await saveMessage("assistant", assistantContent, convId);
              fetchConversations();
            }
          },
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
    [messages, isLoading, userCars, user, activeId, saveMessage, setMessages, fetchConversations, responseMode]
  );

  const handleSelectConversation = (id: string) => {
    loadConversation(id);
    setShowHistory(false);
  };

  const handleNewChat = () => {
    newConversation();
    setShowHistory(false);
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="flex h-screen bg-background">
      {/* History sidebar — desktop */}
      {user && showHistory && (
        <div className="hidden md:flex w-72 flex-shrink-0">
          <ChatHistory
            conversations={conversations}
            activeId={activeId}
            onSelect={handleSelectConversation}
            onNew={handleNewChat}
            onDelete={deleteConversation}
            onClose={() => setShowHistory(false)}
          />
        </div>
      )}

      {/* History sidebar — mobile overlay */}
      {user && showHistory && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="w-72 h-full shadow-xl">
            <ChatHistory
              conversations={conversations}
              activeId={activeId}
              onSelect={handleSelectConversation}
              onNew={handleNewChat}
              onDelete={deleteConversation}
              onClose={() => setShowHistory(false)}
            />
          </div>
          <div className="flex-1 bg-foreground/20" onClick={() => setShowHistory(false)} />
        </div>
      )}

      {/* Main chat area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Header */}
        <header className="flex items-center gap-2 px-4 py-3 border-b border-border bg-card">
          {user && (
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              title="Chat history"
            >
              <History className="w-4 h-4" />
            </button>
          )}
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground text-sm font-bold">🚗</span>
          </div>
          <div className="flex-1">
            <h2 className="text-sm font-semibold text-foreground leading-tight">CarsGPT</h2>
            <p className="text-xs text-muted-foreground">
              {user ? `Hey ${displayName} 👋` : "Your beginner car guide"}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                const next = responseMode === "brief" ? "detailed" : "brief";
                setResponseMode(next);
                localStorage.setItem("carsgpt-response-mode", next);
                toast.success(`Switched to ${next} mode`);
              }}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                responseMode === "detailed"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
              title={responseMode === "brief" ? "Switch to detailed answers" : "Switch to brief answers"}
            >
              {responseMode === "brief" ? "⚡ Brief" : "📖 Detailed"}
            </button>
            {user && (
              <>
                <Link
                  to="/my-car"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                >
                  <Car className="w-3.5 h-3.5" />
                  My Car{userCars.length > 0 && <span className="ml-0.5 px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-medium">{userCars.length}</span>}
                </Link>
                <Link
                  to="/gallery"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  Gallery
                </Link>
              </>
            )}
            {user ? (
              <button
                onClick={signOut}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            ) : (
              <Link
                to="/auth"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
              >
                <LogIn className="w-3.5 h-3.5" />
                Sign in
              </Link>
            )}
          </div>
        </header>

        {/* Messages area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin">
          {loadingHistory ? (
            <div className="flex justify-center py-12">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : hasMessages ? (
            <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
              {messages.map((m, i) => (
                <ChatMessage key={i} role={m.role} content={m.content} />
              ))}
              {isLoading && messages[messages.length - 1]?.role === "user" && <TypingIndicator />}
            </div>
          ) : (
            <WelcomeScreen
              onSuggestionClick={(text) => send(text)}
              userName={user ? displayName : undefined}
              userCars={userCars}
            />
          )}
        </div>

        {/* Input */}
        <ChatInput onSend={send} disabled={isLoading} />
      </div>
    </div>
  );
};

export default Index;
