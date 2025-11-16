import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface QuickActionCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  href: string;
  color?: "primary" | "secondary" | "accent";
}

const QuickActionCard = ({ 
  icon: Icon, 
  title, 
  description, 
  href,
  color = "primary" 
}: QuickActionCardProps) => {
  const navigate = useNavigate();

  const colorClasses = {
    primary: "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white",
    secondary: "bg-secondary/10 text-secondary group-hover:bg-secondary group-hover:text-white",
    accent: "bg-accent/10 text-accent group-hover:bg-accent group-hover:text-white",
  };

  return (
    <Card
      onClick={() => navigate(href)}
      className={cn(
        "group p-6 cursor-pointer transition-all duration-300",
        "hover:shadow-lg hover:scale-[1.02] hover:-translate-y-1",
        "border border-border/50"
      )}
    >
      <div className="flex flex-col items-center text-center gap-4">
        <div className={cn(
          "p-4 rounded-xl transition-all duration-300",
          colorClasses[color]
        )}>
          <Icon className="h-8 w-8" />
        </div>
        <div>
          <h3 className="font-semibold text-lg text-foreground mb-1">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground">
            {description}
          </p>
        </div>
      </div>
    </Card>
  );
};

export default QuickActionCard;
