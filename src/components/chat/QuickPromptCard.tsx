import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickPromptCardProps {
  icon: LucideIcon;
  title: string;
  prompt: string;
  onClick: (prompt: string) => void;
  disabled?: boolean;
}

const QuickPromptCard = ({ 
  icon: Icon, 
  title, 
  prompt, 
  onClick,
  disabled = false 
}: QuickPromptCardProps) => {
  return (
    <Card
      onClick={() => !disabled && onClick(prompt)}
      className={cn(
        "p-4 cursor-pointer transition-all duration-200",
        "hover:shadow-md hover:scale-[1.02] hover:border-primary/30",
        "border border-border/50",
        disabled && "opacity-50 cursor-not-allowed hover:shadow-sm hover:scale-100"
      )}
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-foreground mb-1 text-sm">
            {title}
          </h4>
          <p className="text-xs text-muted-foreground line-clamp-2">
            {prompt}
          </p>
        </div>
      </div>
    </Card>
  );
};

export default QuickPromptCard;
