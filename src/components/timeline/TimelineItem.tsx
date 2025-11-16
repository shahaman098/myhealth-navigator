import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, ChevronDown, ChevronUp, User } from "lucide-react";
import { cn } from "@/lib/utils";

export type TimelineEventType = 
  | "appointment" 
  | "treatment" 
  | "medication" 
  | "encounter" 
  | "note" 
  | "provider";

export interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  title: string;
  date: string;
  time?: string;
  description: string;
  provider?: string;
  details?: string;
  status?: "completed" | "ongoing" | "scheduled" | "cancelled";
}

interface TimelineItemProps {
  event: TimelineEvent;
  icon: React.ElementType;
}

const TimelineItem = ({ event, icon: Icon }: TimelineItemProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getTypeColor = (type: TimelineEventType) => {
    switch (type) {
      case "appointment":
        return "bg-primary/10 text-primary border-primary/20";
      case "treatment":
        return "bg-secondary/10 text-secondary border-secondary/20";
      case "medication":
        return "bg-accent/10 text-accent border-accent/20";
      case "encounter":
        return "bg-primary/10 text-primary border-primary/20";
      case "note":
        return "bg-muted text-muted-foreground border-border";
      case "provider":
        return "bg-secondary/10 text-secondary border-secondary/20";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  const getStatusVariant = (status?: string) => {
    switch (status) {
      case "completed":
        return "secondary";
      case "ongoing":
        return "default";
      case "scheduled":
        return "outline";
      case "cancelled":
        return "destructive";
      default:
        return "secondary";
    }
  };

  return (
    <Card 
      className={cn(
        "relative p-6 hover:shadow-md transition-smooth animate-fade-in",
        "border-l-4",
        event.type === "appointment" && "border-l-primary",
        event.type === "treatment" && "border-l-secondary",
        event.type === "medication" && "border-l-accent",
        event.type === "encounter" && "border-l-primary",
        event.type === "note" && "border-l-muted-foreground",
        event.type === "provider" && "border-l-secondary"
      )}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={cn("p-3 rounded-lg", getTypeColor(event.type))}>
          <Icon className="h-5 w-5" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-2">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-foreground mb-1">
                {event.title}
              </h3>
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {new Date(event.date).toLocaleDateString('en-US', {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
                {event.time && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {event.time}
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex flex-col items-end gap-2">
              <Badge 
                variant="outline" 
                className={cn("capitalize", getTypeColor(event.type))}
              >
                {event.type}
              </Badge>
              {event.status && (
                <Badge variant={getStatusVariant(event.status)}>
                  {event.status}
                </Badge>
              )}
            </div>
          </div>

          {/* Provider */}
          {event.provider && (
            <p className="text-sm font-medium text-foreground flex items-center gap-2 mb-2">
              <User className="h-4 w-4 text-muted-foreground" />
              {event.provider}
            </p>
          )}

          {/* Description */}
          <p className="text-muted-foreground leading-relaxed mb-3">
            {event.description}
          </p>

          {/* Expandable Details */}
          {event.details && (
            <>
              {isExpanded && (
                <div className="mt-4 p-4 rounded-lg bg-muted/50 animate-fade-in">
                  <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
                    {event.details}
                  </p>
                </div>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="mt-2 text-primary hover:text-primary-foreground"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-2" />
                    Show Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-2" />
                    View Details
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </div>
    </Card>
  );
};

export default TimelineItem;
