import { MessageSquare, Plus, Trash2, X } from "lucide-react";
import { Conversation } from "@/hooks/useConversations";

interface Props {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

const ChatHistory = ({ conversations, activeId, onSelect, onNew, onDelete, onClose }: Props) => {
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    return d.toLocaleDateString();
  };

  return (
    <div className="flex flex-col h-full bg-card border-r border-border">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground">Chat History</h3>
        <div className="flex items-center gap-1">
          <button
            onClick={onNew}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            title="New chat"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors md:hidden"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <MessageSquare className="w-8 h-8 text-muted-foreground mb-2" />
            <p className="text-xs text-muted-foreground">No past chats yet</p>
            <p className="text-[10px] text-muted-foreground mt-1">Start a conversation and it'll appear here</p>
          </div>
        ) : (
          <div className="py-2 space-y-0.5">
            {conversations.map((c) => (
              <div
                key={c.id}
                className={`group flex items-center gap-2 mx-2 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                  activeId === c.id
                    ? "bg-primary/10 text-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
                onClick={() => onSelect(c.id)}
              >
                <MessageSquare className="w-3.5 h-3.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{c.title}</p>
                  <p className="text-[10px] opacity-60">{formatDate(c.updated_at)}</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(c.id); }}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded text-muted-foreground hover:text-destructive transition-all"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatHistory;
