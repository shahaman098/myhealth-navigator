import {
  Check,
  Clock,
  Languages,
  X,
} from "lucide-react";
import type { Lang, Speaker } from "@/data/conversationData";
import { FLOWCLEAR_LANGUAGES } from "@/data/languages";

interface Props {
  speaker: Speaker;
  speakerName: string;
  originalLang: Lang;
  original: string;
  translatedLang: Lang;
  translated: string;
  confidence?: number;
  pending?: boolean;
  approval?: "pending" | "approved" | "rejected";
  timestamp?: string;
}

const langLabel = (code: Lang) => {
  if (code === "en") return "English";
  if (code === "auto") return "Detected language";
  const language = FLOWCLEAR_LANGUAGES.find((item) => item.code === code);
  if (language) return language.label;
  return code.toUpperCase();
};

export function ConversationBubble({
  speaker,
  speakerName,
  originalLang,
  original,
  translatedLang,
  translated,
  confidence,
  pending,
  approval = "pending",
  timestamp,
}: Props) {
  const approvalMeta = {
    approved: { color: "152 58% 38%", label: "Confirmed", icon: Check },
    rejected: { color: "0 70% 48%", label: "Rejected", icon: X },
    pending: { color: "38 92% 44%", label: "Needs review", icon: Clock },
  }[approval];
  const ApprovalIcon = approvalMeta.icon;

  return (
    <article className="space-y-7">
      <div className="flex justify-end">
        <div className="max-w-[min(680px,82%)]">
          <div className="glass-strong rounded-[26px] border border-border px-7 py-5 text-[17px] leading-7 text-foreground shadow-sm">
            {original || <span className="text-muted-foreground">Listening live...</span>}
            {pending && (
              <span className="ml-1 inline-block h-5 w-1 translate-y-1 animate-pulse rounded-full bg-primary" />
            )}
          </div>
          <div className="mt-3 text-right text-sm text-muted-foreground tabular">
            {timestamp ?? "now"} · {speakerName} · {langLabel(originalLang)}
          </div>
        </div>
      </div>

      <div className="flex items-start gap-5">
        <div className="glass-pill mt-1 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full text-primary">
          <Languages className="h-6 w-6" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="max-w-3xl text-[18px] leading-8 text-foreground">
            {translated || <span className="text-muted-foreground">Translation will appear here...</span>}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>{langLabel(translatedLang)} translation</span>
            <span>·</span>
            <span className="font-mono">
              {originalLang.toUpperCase()} {"->"} {translatedLang.toUpperCase()}
            </span>
            {typeof confidence === "number" && confidence > 0 && (
              <>
                <span>·</span>
                <span className="font-mono">{(confidence * 100).toFixed(0)}% confidence</span>
              </>
            )}
            <span
              className="inline-flex h-6 items-center gap-1.5 rounded-full border px-2 text-xs font-semibold"
              style={{
                background: `hsl(${approvalMeta.color} / 0.09)`,
                borderColor: `hsl(${approvalMeta.color} / 0.22)`,
                color: `hsl(${approvalMeta.color})`,
              }}
            >
              <ApprovalIcon className="h-3 w-3" />
              {approvalMeta.label}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}
