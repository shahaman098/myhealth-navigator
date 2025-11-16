import { Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatBubbleProps {
  role: "user" | "assistant";
  content: string;
  isTyping?: boolean;
}

const ChatBubble = ({ role, content, isTyping = false }: ChatBubbleProps) => {
  const isUser = role === "user";

  return (
    <div
      className={cn(
        "flex gap-3 animate-fade-in",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {!isUser && (
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-hero flex items-center justify-center shadow-md">
          <Bot className="h-5 w-5 text-white" />
        </div>
      )}

      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-3 shadow-sm",
          isUser
            ? "bg-primary text-primary-foreground rounded-br-md"
            : "bg-card border border-border rounded-bl-md"
        )}
      >
        {isTyping ? (
          <div className="flex gap-1.5 items-center py-1">
            <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.3s]" />
            <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.15s]" />
            <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" />
          </div>
        ) : (
          <p className={cn(
            "text-sm leading-relaxed whitespace-pre-line",
            isUser ? "text-primary-foreground" : "text-foreground"
          )}>
            {content}
          </p>
        )}
      </div>

      {isUser && (
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-accent flex items-center justify-center shadow-md">
          <User className="h-5 w-5 text-accent-foreground" />
        </div>
      )}
    </div>
  );
};

export default ChatBubble;
