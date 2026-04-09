import { Car } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { getMessageText, getMessageImages, type MessageContent } from "@/lib/chat";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: MessageContent;
}

const ChatMessage = ({ role, content }: ChatMessageProps) => {
  const isUser = role === "user";
  const text = getMessageText(content);
  const images = getMessageImages(content);

  return (
    <div className={`flex gap-3 animate-fade-in-up ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
          <Car className="w-4 h-4 text-primary-foreground" />
        </div>
      )}
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? "bg-chat-user text-chat-user-foreground rounded-br-md"
            : "bg-chat-bot text-chat-bot-foreground rounded-bl-md"
        }`}
      >
        {images.length > 0 && (
          <div className={`flex flex-wrap gap-2 ${text ? "mb-2" : ""}`}>
            {images.map((url, i) => (
              <img
                key={i}
                src={url}
                alt="Attached"
                className="rounded-lg max-w-[200px] max-h-[200px] object-cover"
              />
            ))}
          </div>
        )}
        {isUser ? (
          text && <p>{text}</p>
        ) : (
          <div className="prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0.5 prose-headings:my-2">
            <ReactMarkdown>{text}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
