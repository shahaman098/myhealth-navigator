import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, FileText, Pill, Activity, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const Timeline = () => {
  const timelineEvents = [
    {
      id: 1,
      date: "2024-03-15",
      type: "appointment",
      title: "Annual Physical Checkup",
      provider: "Dr. Sarah Johnson",
      details: "Routine examination, blood work ordered",
      status: "completed",
    },
    {
      id: 2,
      date: "2024-03-10",
      type: "medication",
      title: "Started New Medication",
      provider: "Dr. Michael Chen",
      details: "Lisinopril 10mg - for blood pressure management",
      status: "ongoing",
    },
    {
      id: 3,
      date: "2024-02-28",
      type: "diagnosis",
      title: "Diagnosis: Hypertension (Stage 1)",
      provider: "Dr. Michael Chen",
      details: "Blood pressure consistently elevated. Lifestyle modifications recommended.",
      status: "ongoing",
    },
    {
      id: 4,
      date: "2024-02-20",
      type: "lab",
      title: "Blood Work Results",
      provider: "LabCorp",
      details: "Complete metabolic panel - all values within normal range",
      status: "completed",
    },
  ];

  const getIcon = (type: string) => {
    switch (type) {
      case "appointment":
        return Calendar;
      case "medication":
        return Pill;
      case "diagnosis":
        return AlertCircle;
      case "lab":
        return FileText;
      default:
        return Activity;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "appointment":
        return "bg-primary/10 text-primary";
      case "medication":
        return "bg-secondary/10 text-secondary";
      case "diagnosis":
        return "bg-accent/10 text-accent";
      case "lab":
        return "bg-muted text-muted-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Your Health Timeline</h1>
          <p className="text-lg text-muted-foreground">
            Track your complete health journey in one unified view
          </p>
        </div>

        <div className="space-y-6">
          {timelineEvents.map((event, index) => {
            const Icon = getIcon(event.type);
            return (
              <Card key={event.id} className="p-6 hover:shadow-md transition-smooth">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${getTypeColor(event.type)}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2 gap-4">
                      <h3 className="text-lg font-semibold text-foreground">{event.title}</h3>
                      <Badge variant={event.status === "ongoing" ? "default" : "secondary"}>
                        {event.status}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {new Date(event.date).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </p>
                      
                      <p className="text-sm font-medium text-foreground">
                        Provider: {event.provider}
                      </p>
                      
                      <p className="text-muted-foreground">{event.details}</p>
                      
                      <Button variant="link" className="p-0 h-auto text-primary">
                        Ask AI to explain this
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        <Card className="mt-8 p-6 bg-primary/5 border-primary/20">
          <div className="text-center">
            <Activity className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Want to understand more?
            </h3>
            <p className="text-muted-foreground mb-4">
              Our AI assistant can explain any health event in simple terms
            </p>
            <Button>
              <AlertCircle className="h-4 w-4 mr-2" />
              Ask the AI Assistant
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Timeline;
