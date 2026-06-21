import { Stethoscope, User, Mic, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DOCTOR, PATIENT, Speaker } from "@/data/conversationData";
import { useConversation, startTurn } from "@/store/conversationStore";
import { cn } from "@/lib/utils";

interface Props {
  speaker: Speaker;
}

const META = {
  doctor: {
    name: DOCTOR.name,
    role: DOCTOR.role,
    language: DOCTOR.language,
    color: "266 76% 64%",
    icon: Stethoscope,
    cta: "Doctor speaks",
  },
  patient: {
    name: PATIENT.name,
    role: `Patient · ${PATIENT.age}y · ${PATIENT.ward}`,
    language: PATIENT.language,
    color: "288 62% 62%",
    icon: User,
    cta: "Patient replies",
  },
} as const;

export function SpeakerPanel({ speaker }: Props) {
  const meta = META[speaker];
  const Icon = meta.icon;
  const c = `hsl(${meta.color})`;

  const phase = useConversation((s) => s.phase);
  const currentSpeaker = useConversation((s) => s.currentSpeaker);
  const liveText = useConversation((s) => s.currentOriginal);
  const remaining = useConversation((s) =>
    speaker === "doctor" ? s.remainingDoctorTurns.length : s.remainingPatientTurns.length,
  );
  const myLast = useConversation((s) =>
    [...s.transcript].reverse().find((t) => t.speaker === speaker),
  );
  const otherLast = useConversation((s) =>
    [...s.transcript].reverse().find((t) => t.speaker !== speaker),
  );

  const busy = phase !== "idle";
  const isMe = currentSpeaker === speaker;
  const speaking = isMe && (phase === "listening" || phase === "transcribing");

  return (
    <div className="surface flex flex-col overflow-hidden h-full animate-slide-up">
      {/* Header */}
      <div className="px-4 py-3 hairline border-b flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0"
          style={{
            background: `hsl(${meta.color} / 0.12)`,
            color: c,
            border: `1px solid hsl(${meta.color} / 0.25)`,
          }}
        >
          <Icon className="h-3.5 w-3.5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-foreground text-[13px] truncate leading-tight">
            {meta.name}
          </div>
          <div className="text-[11px] text-muted-foreground truncate mt-0.5">
            {meta.role}
          </div>
        </div>
        <span
          className="tag tabular"
          style={{
            background: `hsl(${meta.color} / 0.10)`,
            color: c,
            borderColor: `hsl(${meta.color} / 0.25)`,
          }}
        >
          {speaking && (
            <span className="equalizer h-2.5" style={{ color: c }}>
              <span /><span /><span /><span />
            </span>
          )}
          {meta.language}
        </span>
      </div>

      {/* Sections */}
      <div className="flex-1 p-4 space-y-3 min-h-0">
        <PanelSection
          label="Speaking now"
          accent={c}
          active={speaking}
          text={isMe ? liveText : ""}
          pending={speaking}
          emptyText={busy && isMe ? "Listening…" : "Not currently speaking"}
        />
        <PanelSection
          label={speaker === "doctor" ? "Last clinician message" : "Last patient reply"}
          text={myLast?.original ?? ""}
          emptyText="—"
        />
        <PanelSection
          label={speaker === "doctor" ? "Translation from patient" : "Translation from doctor"}
          text={otherLast?.translated ?? ""}
          emptyText="—"
        />
      </div>

      {/* CTA */}
      <div className="p-3 hairline border-t bg-[hsl(var(--surface-1))]/50">
        <Button
          size="default"
          onClick={() => startTurn(speaker)}
          disabled={busy || remaining === 0}
          className={cn("w-full gap-2 h-9 font-medium")}
          style={{
            background: c,
            color: "white",
          }}
        >
          {busy && isMe ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Listening…
            </>
          ) : (
            <>
              <Mic className="h-3.5 w-3.5" />
              {meta.cta}
              {remaining > 0 && (
                <span className="ml-1 text-[10px] font-mono opacity-70">{remaining} left</span>
              )}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

function PanelSection({
  label, accent, text, active, pending, emptyText,
}: {
  label: string;
  accent?: string;
  text: string;
  active?: boolean;
  pending?: boolean;
  emptyText?: string;
}) {
  return (
    <div>
      <div className="eyebrow text-[10px] mb-1.5 flex items-center gap-1.5">
        {active && accent && (
          <span className="dot animate-pulse-dot" style={{ color: accent }} />
        )}
        {label}
      </div>
      <div
        className={cn(
          "surface-inset p-2.5 min-h-[44px] transition-colors",
          active && "ring-1",
        )}
        style={
          active
            ? {
                background: `hsl(${(accent ?? "266 76% 64%").replace(/hsl\(|\)/g, "")} / 0.06)`,
                borderColor: accent,
              }
            : undefined
        }
      >
        {text ? (
          <p className="text-[13px] text-foreground leading-relaxed">
            {text}
            {pending && (
              <span
                className="inline-block w-1 h-3.5 ml-1 align-middle animate-pulse"
                style={{ background: accent ?? "hsl(var(--primary))" }}
              />
            )}
          </p>
        ) : (
          <p className="text-[12px] text-muted-foreground italic">{emptyText ?? "—"}</p>
        )}
      </div>
    </div>
  );
}
