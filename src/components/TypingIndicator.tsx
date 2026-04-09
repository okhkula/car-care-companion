import { Car } from "lucide-react";

const TypingIndicator = () => (
  <div className="flex gap-3 animate-fade-in-up">
    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
      <Car className="w-4 h-4 text-primary-foreground" />
    </div>
    <div className="bg-chat-bot rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1.5">
      <div className="w-2 h-2 rounded-full bg-muted-foreground typing-dot" />
      <div className="w-2 h-2 rounded-full bg-muted-foreground typing-dot" />
      <div className="w-2 h-2 rounded-full bg-muted-foreground typing-dot" />
    </div>
  </div>
);

export default TypingIndicator;
