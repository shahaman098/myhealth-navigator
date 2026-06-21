import { Card } from "@/components/ui/card";
import { Activity, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { resetConversation, useConversation } from "@/store/conversationStore";
import { toast } from "@/hooks/use-toast";

const toneColour = (tone: string) => {
  switch (tone) {
    case "speech":      return "hsl(266 76% 64%)";
    case "transcribe":  return "hsl(270 92% 72%)";
    case "translate":   return "hsl(288 62% 62%)";
    case "tts":         return "hsl(278 82% 68%)";
    case "review":      return "hsl(262 56% 58%)";
    case "warning":     return "hsl(4 86% 58%)";
    default:            return "hsl(263 13% 48%)";
  }
};

const AuditTrail = () => {
  const audit = useConversation((s) => s.audit);

  return (
    <div className="container mx-auto px-6 py-6 max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight flex items-center gap-3">
            <Activity className="h-7 w-7 text-primary" />
            Audit trail
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Every speech, transcription, translation, and clinician decision is logged.
          </p>
        </div>
        <Button
          variant="ghost"
          className="gap-2 text-destructive hover:text-destructive"
          onClick={() => {
            resetConversation();
            toast({ title: "Conversation reset", description: "Audit trail cleared." });
          }}
        >
          <Trash2 className="h-4 w-4" /> Reset demo
        </Button>
      </div>

      <Card
        className="surface p-0 overflow-hidden"
      >
        <div className="grid grid-cols-12 gap-2 px-4 py-3 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground border-b border-border">
          <div className="col-span-2">Time</div>
          <div className="col-span-2">Phase</div>
          <div className="col-span-8">Event</div>
        </div>
        {audit.length === 0 ? (
          <p className="px-4 py-10 text-sm text-center text-muted-foreground">
            No events yet. Open the Live Conversation Room and run the demo.
          </p>
        ) : (
          <ul className="divide-y divide-white/[0.04]">
            {audit.map((e) => {
              const colour = toneColour(e.tone);
              return (
                <li key={e.id} className="grid grid-cols-12 gap-2 px-4 py-3 text-sm items-start">
                  <div className="col-span-2 text-xs font-mono text-muted-foreground">
                    {new Date(e.at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </div>
                  <div className="col-span-2">
                    <span
                      className="text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded inline-flex items-center gap-1"
                      style={{ background: `${colour}1f`, color: colour, border: `1px solid ${colour}44` }}
                    >
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: colour }} />
                      {e.tone}
                    </span>
                  </div>
                  <div className="col-span-8 text-foreground leading-relaxed">{e.message}</div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
};

export default AuditTrail;
