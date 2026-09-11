import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Message, getMessageText, getMessageImages } from "@/lib/chat";

export interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export function useConversations() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Fetch conversation list
  const fetchConversations = useCallback(async () => {
    if (!user) { setConversations([]); return; }
    const { data } = await supabase
      .from("conversations")
      .select("id, title, created_at, updated_at")
      .order("updated_at", { ascending: false })
      .limit(50);
    setConversations(data || []);
  }, [user]);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  // Load messages for a conversation
  const loadConversation = useCallback(async (conversationId: string) => {
    if (!user) return;
    setLoadingHistory(true);
    setActiveId(conversationId);
    const { data } = await supabase
      .from("chat_messages")
      .select("role, content, image_urls")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (data) {
      const loaded: Message[] = data.map((m) => {
        if (m.image_urls && m.image_urls.length > 0) {
          return {
            role: m.role as "user" | "assistant",
            content: [
              { type: "text" as const, text: m.content },
              ...m.image_urls.map((url: string) => ({ type: "image_url" as const, image_url: { url } })),
            ],
          };
        }
        return { role: m.role as "user" | "assistant", content: m.content };
      });
      setMessages(loaded);
    }
    setLoadingHistory(false);
  }, [user]);

  // Start a new conversation
  const newConversation = useCallback(() => {
    setActiveId(null);
    setMessages([]);
  }, []);

  // Save a message (creates conversation if needed, returns conversationId)
  const saveMessage = useCallback(async (
    role: "user" | "assistant",
    content: Message["content"],
    conversationId: string | null,
  ): Promise<string | null> => {
    if (!user) return null;

    let convId = conversationId;

    // Create conversation on first user message
    if (!convId && role === "user") {
      const text = getMessageText(content);
      const title = text.slice(0, 60) || "New Chat";
      const { data } = await supabase
        .from("conversations")
        .insert({ user_id: user.id, title })
        .select("id")
        .single();
      if (!data) return null;
      convId = data.id;
      setActiveId(convId);
    }

    if (!convId) return null;

    const text = typeof content === "string" ? content : getMessageText(content);
    const images = typeof content === "string" ? [] : getMessageImages(content);

    await supabase.from("chat_messages").insert({
      conversation_id: convId,
      user_id: user.id,
      role,
      content: text,
      image_urls: images.length > 0 ? images : null,
    });

    // Update conversation timestamp
    await supabase.from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", convId);

    return convId;
  }, [user]);

  // Delete a conversation
  const deleteConversation = useCallback(async (id: string) => {
    await supabase.from("conversations").delete().eq("id", id);
    if (activeId === id) newConversation();
    fetchConversations();
  }, [activeId, newConversation, fetchConversations]);

  return {
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
  };
}
