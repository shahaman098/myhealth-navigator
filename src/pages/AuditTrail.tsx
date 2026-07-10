import { Card } from "@/components/ui/card";
import { Activity, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { resetConversation, useConversation } from "@/store/conversationStore";
import { toast } from "@/hooks/use-toast";

const TONE_META: Record<string, { label: string; colour: string }> = {
  green: { label: "Approved", colour: "hsl(var(--success))" },
  amber: { label: "Attention", colour: "hsl(var(--warning))" },
  red: { label: "Rejected", colour: "hsl(var(--destructive))" },
  neutral: { label: "Info", colour: "hsl(var(--muted-foreground))" },
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
          <ul className="divide-y divide-border/70">
            {audit.map((e) => {
              const meta = TONE_META[e.tone] ?? TONE_META.neutral;
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
                      className="text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded inline-flex items-center gap-1 border"
                      style={{
                        background: `color-mix(in srgb, ${meta.colour} 12%, transparent)`,
                        color: meta.colour,
                        borderColor: `color-mix(in srgb, ${meta.colour} 30%, transparent)`,
                      }}
                    >
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: meta.colour }} />
                      {meta.label}
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
