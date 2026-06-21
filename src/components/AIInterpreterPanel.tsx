import {
  Headphones, Languages, Volume2, Save, ShieldAlert, ArrowLeftRight, Mic, Loader2, Stethoscope,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  speakCurrentTranslation,
  useConversation,
  isSpeechSynthesisSupported,
} from "@/store/conversationStore";
import { cn } from "@/lib/utils";

const PHASES = [
  { key: "listening",    label: "Listening",    icon: Headphones, color: "266 76% 64%" },
  { key: "transcribing", label: "Transcribing", icon: Mic,        color: "270 92% 66%" },
  { key: "translating",  label: "Translating",  icon: Languages,  color: "288 62% 62%" },
  { key: "speaking",     label: "Speaking",     icon: Volume2,    color: "278 82% 58%"  },
] as const;

export function AIInterpreterPanel() {
  const phase = useConversation((s) => s.phase);
  const speaker = useConversation((s) => s.currentSpeaker);
  const turn = useConversation((s) => s.currentTurn);
  const original = useConversation((s) => s.currentOriginal);
  const translation = useConversation((s) => s.currentTranslation);
  const confidence = useConversation((s) => s.currentConfidence);

  const direction = turn
    ? turn.originalLang === "en" ? "EN → PA" : "PA → EN"
    : "Awaiting input";

  const ttsAvailable = isSpeechSynthesisSupported();
  const ai = "266 76% 64%";

  return (
    <div
      className="surface flex flex-col overflow-hidden h-full animate-slide-up"
      style={{
        borderColor: `hsl(${ai} / 0.35)`,
      }}
    >
      {/* Header */}
      <div className="px-4 py-3 hairline border-b flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0"
          style={{
            background: `hsl(${ai} / 0.14)`,
            color: `hsl(${ai})`,
            border: `1px solid hsl(${ai} / 0.3)`,
          }}
        >
          <Stethoscope className="h-3.5 w-3.5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-foreground text-[13px] truncate leading-tight">
            AI Interpreter
          </div>
          <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
            <ArrowLeftRight className="h-2.5 w-2.5" />
            <span className="font-mono tabular">{direction}</span>
          </div>
        </div>
        {speaker && (
          <span
            className="tag tabular"
            style={{
              background:
                speaker === "doctor" ? "hsl(266 76% 64% / 0.10)" : "hsl(288 62% 62% / 0.10)",
              color:
                speaker === "doctor" ? "hsl(266 76% 64%)" : "hsl(288 62% 62%)",
              borderColor:
                speaker === "doctor" ? "hsl(266 76% 64% / 0.25)" : "hsl(288 62% 62% / 0.25)",
            }}
          >
            {speaker === "doctor" ? "Doctor" : "Patient"}
          </span>
        )}
      </div>

      {/* Phase rail */}
      <div className="px-4 pt-3 pb-2 grid grid-cols-4 gap-1.5">
        {PHASES.map((p) => {
          const Icon = p.icon;
          const active = phase === p.key;
          return (
            <div
              key={p.key}
              className={cn(
                "flex flex-col items-center gap-1 p-2 rounded-md text-[10px] font-medium uppercase tracking-wide transition-colors text-center",
              )}
              style={
                active
                  ? {
                      background: `hsl(${p.color} / 0.12)`,
                      color: `hsl(${p.color})`,
                      border: `1px solid hsl(${p.color} / 0.3)`,
                    }
                  : {
                      background: "hsl(var(--surface-3))",
                      color: "hsl(var(--muted-foreground))",
                      border: "1px solid hsl(var(--border))",
                    }
              }
            >
              <Icon className="h-3 w-3" />
              <span className="text-[10px] leading-none">{p.label}</span>
            </div>
          );
        })}
      </div>

      {/* Body */}
      <div className="flex-1 p-4 pt-2 space-y-3 min-h-0">
        <SectionBlock
          label="Transcription"
          accent={`hsl(${ai})`}
          active={phase === "transcribing"}
          pending={phase === "transcribing"}
          text={original}
          placeholder="Live transcription will appear here…"
        />
        <SectionBlock
          label="Translation"
          accent={`hsl(288 62% 62%)`}
          active={phase === "translating"}
          pending={phase === "translating"}
          text={translation}
          placeholder="Translated output will appear here…"
          footer={
            confidence > 0 ? (
              <div className="mt-2 flex items-center gap-2">
                <div className="h-1 flex-1 rounded-full overflow-hidden bg-[hsl(var(--surface-3))]">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${confidence * 100}%`,
                      background: "hsl(288 62% 62%)",
                    }}
                  />
                </div>
                <span className="font-mono tabular text-[10px] text-muted-foreground">
                  {(confidence * 100).toFixed(0)}%
                </span>
              </div>
            ) : undefined
          }
        />
      </div>

      {/* Warning */}
      <div
        className="mx-4 mb-3 flex items-center gap-2 text-[11px] px-2.5 py-1.5 rounded-md"
        style={{
          background: "hsl(38 92% 56% / 0.08)",
          color: "hsl(38 92% 72%)",
          border: "1px solid hsl(38 92% 56% / 0.25)",
        }}
      >
        <ShieldAlert className="h-3 w-3 flex-shrink-0" />
        Requires clinician confirmation
      </div>

      {/* Actions */}
      <div className="p-3 hairline border-t bg-[hsl(var(--surface-1))]/50 grid grid-cols-2 gap-2">
        <Button
          onClick={() => speakCurrentTranslation()}
          disabled={!translation || phase === "speaking"}
          variant="outline"
          size="sm"
          className="gap-2 h-9 font-medium"
          title={ttsAvailable ? "Speak translation aloud" : "Text-to-speech unavailable"}
        >
          {phase === "speaking" ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Speaking
            </>
          ) : (
            <>
              <Volume2 className="h-3.5 w-3.5" />
              Speak aloud
            </>
          )}
        </Button>
        <Button
          disabled
          variant="ghost"
          size="sm"
          className="gap-2 h-9 font-medium opacity-60 cursor-default"
          title="Each turn is auto-saved"
        >
          <Save className="h-3.5 w-3.5" />
          Auto-saved
        </Button>
      </div>
    </div>
  );
}

function SectionBlock({
  label, accent, active, pending, text, placeholder, footer,
}: {
  label: string;
  accent: string;
  active?: boolean;
  pending?: boolean;
  text: string;
  placeholder: string;
  footer?: React.ReactNode;
}) {
  return (
    <div>
      <div className="eyebrow text-[10px] mb-1.5 flex items-center gap-1.5">
        {active && <span className="dot animate-pulse-dot" style={{ color: accent }} />}
        {label}
      </div>
      <div
        className={cn(
          "surface-inset p-2.5 min-h-[60px] transition-colors",
        )}
        style={
          active
            ? {
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
                style={{ background: accent }}
              />
            )}
          </p>
        ) : (
          <p className="text-[12px] text-muted-foreground italic">{placeholder}</p>
        )}
        {footer}
      </div>
    </div>
  );
}
