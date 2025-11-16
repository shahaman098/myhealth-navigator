import { Calendar, Pill, Activity, FileText, StickyNote, UserRound } from "lucide-react";
import TimelineItem, { TimelineEvent, TimelineEventType } from "./TimelineItem";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface TimelineListProps {
  events: TimelineEvent[];
  emptyMessage?: string;
}

const TimelineList = ({ 
  events, 
  emptyMessage = "No timeline events to display" 
}: TimelineListProps) => {
  const getIcon = (type: TimelineEventType) => {
    switch (type) {
      case "appointment":
        return Calendar;
      case "medication":
        return Pill;
      case "treatment":
        return Activity;
      case "encounter":
        return FileText;
      case "note":
        return StickyNote;
      case "provider":
        return UserRound;
      default:
        return Activity;
    }
  };

  // Group events by month
  const groupedEvents = events.reduce((acc, event) => {
    const date = new Date(event.date);
    const monthKey = date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long' 
    });
    
    if (!acc[monthKey]) {
      acc[monthKey] = [];
    }
    acc[monthKey].push(event);
    return acc;
  }, {} as Record<string, TimelineEvent[]>);

  if (events.length === 0) {
    return (
      <Card className="p-12 text-center">
        <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
        <p className="text-lg text-muted-foreground">{emptyMessage}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {Object.entries(groupedEvents).map(([month, monthEvents]) => (
        <div key={month} className="space-y-4">
          {/* Month Header */}
          <div className="flex items-center gap-4">
            <Badge 
              variant="outline" 
              className="text-sm font-semibold bg-primary/5 text-primary border-primary/20 px-4 py-1"
            >
              {month}
            </Badge>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Events for this month */}
          <div className="space-y-4 relative">
            {/* Vertical Timeline Line */}
            <div className="absolute left-[27px] top-0 bottom-0 w-0.5 bg-gradient-to-b from-border via-border to-transparent" />
            
            {monthEvents
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map((event) => (
                <TimelineItem 
                  key={event.id} 
                  event={event} 
                  icon={getIcon(event.type)} 
                />
              ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default TimelineList;
