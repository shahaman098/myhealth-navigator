import type { CSSProperties } from "react";
import { Mic, Sparkles, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type SpongeBobMode = "idle" | "ready" | "listening" | "speaking" | "translating";

type Props = {
  mode: SpongeBobMode;
  voiceLabel: string;
  audioLevel: number;
  statusLine: string;
  onStart?: () => void;
  disabled?: boolean;
};

export function SpongeBobStage({
  mode,
  voiceLabel,
  audioLevel,
  statusLine,
  onStart,
  disabled,
}: Props) {
  const canTap = mode === "idle" || mode === "ready";
  const mouthOpen = mode === "speaking" || (mode === "listening" && audioLevel > 0.08);

  return (
    <div className="kids-ocean-stage">
      <div className="kids-bubble kids-bubble-1" aria-hidden />
      <div className="kids-bubble kids-bubble-2" aria-hidden />
      <div className="kids-bubble kids-bubble-3" aria-hidden />
      <div className="kids-bubble kids-bubble-4" aria-hidden />

      <button
        type="button"
        onClick={canTap ? onStart : undefined}
        disabled={disabled || !canTap || mode === "speaking"}
        className={cn(
          "kids-sponge-hitarea",
          canTap && !disabled && "cursor-pointer",
          !canTap && "cursor-default",
        )}
        aria-label={
          canTap && !disabled
            ? `Start ${voiceLabel} translation`
            : `${voiceLabel} ${mode}`
        }
      >
        <div
          className={cn(
            "kids-sponge-actor",
            mode === "idle" && "kids-sponge-actor--idle",
            mode === "ready" && "kids-sponge-actor--ready",
            mode === "listening" && "kids-sponge-actor--listening",
            mode === "speaking" && "kids-sponge-actor--speaking",
            mode === "translating" && "kids-sponge-actor--translating",
          )}
          style={
            mode === "listening"
              ? ({ "--sponge-audio": audioLevel } as CSSProperties)
              : undefined
          }
        >
          <div className="kids-sponge-ring kids-sponge-ring-1" aria-hidden />
          <div className="kids-sponge-ring kids-sponge-ring-2" aria-hidden />

          <div className="kids-sponge-body">
            <span className="kids-sponge-hole hole-1" />
            <span className="kids-sponge-hole hole-2" />
            <span className="kids-sponge-hole hole-3" />
            <span className="kids-sponge-hole hole-4" />

            <span className={cn("kids-sponge-eye eye-left", mode === "listening" && "kids-sponge-eye--wide")} />
            <span className={cn("kids-sponge-eye eye-right", mode === "listening" && "kids-sponge-eye--wide")} />

            <span className="kids-sponge-cheek cheek-left" />
            <span className="kids-sponge-cheek cheek-right" />

            <span className={cn("kids-sponge-smile", mouthOpen && "kids-sponge-smile--open")} />

            <span className="kids-sponge-pocket">
              {mode === "speaking" ? (
                <Volume2 className="h-5 w-5" />
              ) : mode === "listening" ? (
                <Mic className="h-5 w-5" />
              ) : mode === "translating" ? (
                <Sparkles className="h-5 w-5 animate-pulse" />
              ) : (
                <Sparkles className="h-5 w-5" />
              )}
            </span>
          </div>

          <div className="kids-mascot-shadow" />
        </div>
      </button>

      <div className="kids-sponge-speech-bubble">
        <p className="kids-sponge-speech-title">{voiceLabel}</p>
        <p className="kids-sponge-speech-text">{statusLine}</p>
        {canTap && !disabled && (
          <p className="kids-sponge-speech-hint">Tap SpongeBob to begin</p>
        )}
      </div>

      {(mode === "listening" || mode === "speaking" || mode === "translating") && (
        <div className="kids-sponge-waveform" aria-hidden>
          {Array.from({ length: 12 }).map((_, i) => (
            <span
              key={i}
              className="kids-sponge-wave-bar"
              style={{
                animationDelay: `${i * 70}ms`,
                opacity: mode === "listening" ? 0.35 + audioLevel * 0.65 : 0.85,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
