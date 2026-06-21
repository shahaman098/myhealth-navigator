import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft, CheckCircle2, XCircle, Pencil, AlertTriangle,
  ListChecks, ClipboardCheck, ShieldCheck, FileSignature,
} from "lucide-react";
import {
  editReviewItem, generateSummary, setSummaryApproval, setTranscriptApproval,
  setReviewStatus, useConversation, ApprovalStatus, ReviewItem,
} from "@/store/conversationStore";
import { toast } from "@/hooks/use-toast";
import { DOCTOR, PATIENT } from "@/data/conversationData";
import { ConversationBubble } from "@/components/ConversationBubble";
import { cn } from "@/lib/utils";

const ClinicianReview = () => {
  const navigate = useNavigate();
  const transcript = useConversation((s) => s.transcript);
  const summary = useConversation((s) => s.summary);
  const concerns = useConversation((s) => s.concerns);
  const nextSteps = useConversation((s) => s.nextSteps);
  const summaryApproval = useConversation((s) => s.summaryApproval);
  const transcriptApproval = useConversation((s) => s.transcriptApproval);

  return (
    <div className="container mx-auto px-6 py-6 max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Button variant="ghost" size="sm" onClick={() => navigate("/live")} className="gap-2 mb-2">
            <ArrowLeft className="h-4 w-4" /> Back to live conversation
          </Button>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">Clinician review</h1>
          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            FlowClear Live does not make clinical decisions. Every item requires clinician approval.
          </p>
        </div>
        <Button
          variant="outline"
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
            toast({ title: "Summary regenerated" });
          }}
          className="gap-2"
        >
          <ListChecks className="h-4 w-4" />
          {summary ? "Regenerate summary" : "Generate summary"}
        </Button>
      </div>

      {/* Bilingual transcript */}
      <Card className="surface p-5"
       >
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h2 className="font-bold flex items-center gap-2">
            <FileSignature className="h-4 w-4 text-primary" /> Full bilingual transcript
          </h2>
          <ApprovalControls
            status={transcriptApproval}
            onApprove={() => {
              setTranscriptApproval("approved");
              toast({ title: "Transcript approved" });
            }}
            onReject={() => {
              setTranscriptApproval("rejected");
              toast({ title: "Transcript rejected", variant: "destructive" });
            }}
          />
        </div>
        {transcript.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">No turns yet.</p>
        ) : (
          <div className="space-y-3">
            {transcript.map((t) => (
              <ConversationBubble
                key={t.id + t.savedAt}
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
        )}
      </Card>

      {/* Summary */}
      <Card className="surface p-5"
       >
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h2 className="font-bold flex items-center gap-2">
            <ListChecks className="h-4 w-4 text-primary" /> Conversation summary
          </h2>
          <ApprovalControls
            status={summaryApproval}
            disabled={!summary}
            onApprove={() => {
              setSummaryApproval("approved");
              toast({ title: "Summary approved" });
            }}
            onReject={() => {
              setSummaryApproval("rejected");
              toast({ title: "Summary rejected", variant: "destructive" });
            }}
          />
        </div>
        {summary ? (
          <p className="text-sm text-foreground leading-relaxed">{summary}</p>
        ) : (
          <div className="text-sm text-muted-foreground p-4 rounded-lg border border-amber-400/30 bg-amber-400/5 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            No summary generated yet. Click <em>Generate summary</em> above.
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ReviewList
          icon={<AlertTriangle className="h-4 w-4 text-amber-400" />}
          title="Key concerns"
          empty="Generate the summary to extract patient concerns."
          items={concerns}
          bucket="concerns"
        />
        <ReviewList
          icon={<ClipboardCheck className="h-4 w-4 text-primary" />}
          title="Agreed next steps"
          empty="Generate the summary to populate next steps."
          items={nextSteps}
          bucket="nextSteps"
        />
      </div>
    </div>
  );
};

function ApprovalControls({
  status, onApprove, onReject, disabled,
}: {
  status: ApprovalStatus;
  onApprove: () => void;
  onReject: () => void;
  disabled?: boolean;
}) {
  const colour =
    status === "approved" ? "hsl(150 80% 50%)" :
    status === "rejected" ? "hsl(4 86% 58%)" :
    "hsl(41 100% 55%)";
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span
        className="text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded"
        style={{ background: `${colour}1f`, color: colour, border: `1px solid ${colour}44` }}
      >
        {status}
      </span>
      <Button size="sm" onClick={onApprove} disabled={disabled} className="h-7 gap-1">
        <CheckCircle2 className="h-3 w-3" /> Approve
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={onReject}
        disabled={disabled}
        className="h-7 gap-1 text-destructive hover:text-destructive"
      >
        <XCircle className="h-3 w-3" /> Reject
      </Button>
    </div>
  );
}

function ReviewList({
  icon, title, items, bucket, empty,
}: {
  icon: React.ReactNode;
  title: string;
  items: ReviewItem[];
  bucket: "concerns" | "nextSteps";
  empty: string;
}) {
  return (
    <Card className="surface p-5">
      <h2 className="font-bold mb-3 flex items-center gap-2">
        {icon} {title}
      </h2>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{empty}</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <ReviewRow key={item.id} item={item} bucket={bucket} />
          ))}
        </ul>
      )}
    </Card>
  );
}

function ReviewRow({
  item, bucket,
}: { item: ReviewItem; bucket: "concerns" | "nextSteps" }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item.text);

  const colour =
    item.status === "approved" ? "hsl(150 80% 50%)" :
    item.status === "rejected" ? "hsl(4 86% 58%)" :
    "hsl(41 100% 55%)";

  return (
    <li className="surface-inset p-3">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="text-sm text-foreground flex-1 min-w-0">
          {editing ? (
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="bg-background/40 min-h-[60px]"
            />
          ) : (
            <p className="leading-relaxed">
              {item.text}
              {item.edited && (
                <span className="ml-2 text-[10px] uppercase tracking-wider font-bold text-amber-300/80">
                  · edited
                </span>
              )}
            </p>
          )}
        </div>
        <span
          className={cn("text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded flex-shrink-0")}
          style={{ background: `${colour}1f`, color: colour, border: `1px solid ${colour}44` }}
        >
          {item.status}
        </span>
      </div>
      <div className="flex gap-2 flex-wrap">
        {editing ? (
          <>
            <Button
              size="sm"
              className="h-7 gap-1"
              onClick={() => {
                editReviewItem(bucket, item.id, draft);
                setEditing(false);
                toast({ title: "Edited · awaiting re-approval" });
              }}
            >
              <Pencil className="h-3 w-3" /> Save
            </Button>
            <Button size="sm" variant="ghost" className="h-7" onClick={() => { setEditing(false); setDraft(item.text); }}>
              Cancel
            </Button>
          </>
        ) : (
          <>
            <Button
              size="sm"
              className="h-7 gap-1"
              disabled={item.status === "approved"}
              onClick={() => setReviewStatus(bucket, item.id, "approved")}
            >
              <CheckCircle2 className="h-3 w-3" /> Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 gap-1"
              onClick={() => setEditing(true)}
            >
              <Pencil className="h-3 w-3" /> Edit
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 gap-1 text-destructive hover:text-destructive"
              disabled={item.status === "rejected"}
              onClick={() => setReviewStatus(bucket, item.id, "rejected")}
            >
              <XCircle className="h-3 w-3" /> Reject
            </Button>
          </>
        )}
      </div>
    </li>
  );
}

export default ClinicianReview;
