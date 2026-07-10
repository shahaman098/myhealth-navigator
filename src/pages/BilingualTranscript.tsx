import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, CheckCircle2, XCircle, FileSignature, ListChecks, ClipboardCheck,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { DOCTOR, PATIENT } from "@/data/conversationData";
import {
  generateSummary, useConversation, setTurnApproval,
} from "@/store/conversationStore";
import { ConversationBubble } from "@/components/ConversationBubble";
import { ApprovalBadge } from "@/components/ApprovalBadge";
import { toast } from "@/hooks/use-toast";

const BilingualTranscript = () => {
  const navigate = useNavigate();
  const transcript = useConversation((s) => s.transcript);
  const summary = useConversation((s) => s.summary);

  return (
    <div className="container mx-auto px-6 py-6 max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Button variant="ghost" size="sm" onClick={() => navigate("/live")} className="gap-2 mb-2">
            <ArrowLeft className="h-4 w-4" /> Back to live conversation
          </Button>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">Bilingual transcript</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {PATIENT.name} ↔ {DOCTOR.name} · every turn shown in both languages with confidence and clinician status.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            onClick={() => {
              if (transcript.length === 0) {
                toast({
                  title: "No transcript yet",
                  description: "Run the live conversation first.",
                  variant: "destructive",
                });
                return;
              }
              generateSummary();
              toast({
                title: "Summary generated",
                description: "Conversation summary, key concerns and next steps prepared for review.",
              });
              navigate("/review");
            }}
            className="gap-2"
          >
            <ListChecks className="h-4 w-4" />
            Generate Conversation Summary
          </Button>
          <Button variant="outline" onClick={() => navigate("/review")} className="gap-2">
            <ClipboardCheck className="h-4 w-4" /> Clinician review
          </Button>
        </div>
      </div>

      {/* Table view */}
      <Card
        className="surface overflow-hidden p-0"
      >
        <div className="grid grid-cols-12 gap-2 px-4 py-3 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground border-b border-border">
          <div className="col-span-1">Time</div>
          <div className="col-span-1">Speaker</div>
          <div className="col-span-1">Lang</div>
          <div className="col-span-4">Original</div>
          <div className="col-span-3">Translation</div>
          <div className="col-span-1">Conf.</div>
          <div className="col-span-1">Status</div>
        </div>
        {transcript.length === 0 ? (
          <p className="px-4 py-8 text-sm text-center text-muted-foreground">
            No turns yet. Run the live conversation first.
          </p>
        ) : (
          <ul>
            {transcript.map((t) => {
              return (
                <li
                  key={t.id + t.savedAt}
                  className="grid grid-cols-12 gap-2 px-4 py-3 text-sm border-b border-border/70 items-start"
                >
                  <div className="col-span-1 text-xs text-muted-foreground">
                    {new Date(t.savedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                  <div className="col-span-1 font-semibold text-foreground capitalize">
                    {t.speaker}
                  </div>
                  <div className="col-span-1 text-xs text-muted-foreground">
                    {t.originalLang.toUpperCase()} → {t.translatedLang.toUpperCase()}
                  </div>
                  <div className="col-span-4 text-foreground leading-relaxed">{t.original}</div>
                  <div className="col-span-3 text-muted-foreground leading-relaxed">{t.translated}</div>
                  <div className="col-span-1 font-mono text-xs">{(t.confidence * 100).toFixed(0)}%</div>
                  <div className="col-span-1 flex flex-col gap-1">
                    <ApprovalBadge status={t.approval} className="justify-center" />
                    <div className="flex gap-1">
                      <button
                        onClick={() => setTurnApproval(t.id, "approved")}
                        className="text-[10px] text-primary hover:text-primary/80"
                        title="Approve"
                      >
                        <CheckCircle2 className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => setTurnApproval(t.id, "rejected")}
                        className="text-[10px] text-destructive hover:text-destructive/80"
                        title="Reject"
                      >
                        <XCircle className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {/* Bubble view */}
      {transcript.length > 0 && (
        <Card
          className="surface p-5"
         
        >
          <h2 className="font-bold mb-3 flex items-center gap-2">
            <FileSignature className="h-4 w-4 text-primary" /> Conversation view
          </h2>
          <div className="space-y-3">
            {transcript.map((t) => (
              <ConversationBubble
                key={t.id + "-b-" + t.savedAt}
                speaker={t.speaker}
                speakerName={t.speaker === "doctor" ? DOCTOR.name : PATIENT.name}
                originalLang={t.originalLang}
                original={t.original}
                translatedLang={t.translatedLang}
                translated={t.translated}
                confidence={t.confidence}
                approval={t.approval}
                timestamp={new Date(t.savedAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              />
            ))}
          </div>
        </Card>
      )}

      {summary && (
        <Card
          className="surface p-5"
         
        >
          <h2 className="font-bold mb-2 flex items-center gap-2">
            <ListChecks className="h-4 w-4 text-primary" /> Generated summary (preview)
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{summary}</p>
          <Button onClick={() => navigate("/review")} variant="outline" className="mt-3 gap-2">
            Open clinician review →
          </Button>
        </Card>
      )}
    </div>
  );
};

export default BilingualTranscript;
