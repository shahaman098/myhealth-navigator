import { Conversation, type Mode, type Status, type VoiceConversation } from "@elevenlabs/client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FileText,
  Languages,
  Mic,
  MicOff,
  RotateCcw,
  ShieldCheck,
  Stethoscope,
  User,
  Users,
  HeartPulse,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConversationBubble } from "@/components/ConversationBubble";
import { getElevenLabsSignedUrl } from "@/lib/elevenLabsAgent";
import {
  resetConversation,
  saveLiveTurn,
  setLiveDraft,
  useConversation,
} from "@/store/conversationStore";
import { DOCTOR, PATIENT, Speaker, Turn } from "@/data/conversationData";
import {
  DEFAULT_PATIENT_LANGUAGE,
  FLOWCLEAR_LANGUAGES,
  getLanguageByCode,
  type FlowClearLanguage,
} from "@/data/languages";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

const speakerCopy = {
  doctor: {
    label: "Doctor",
    name: "Doctor",
    icon: Stethoscope,
    color: "266 76% 64%",
    sourceCode: DOCTOR.langCode,
    sourceLanguage: "English",
    targetCode: "selected-patient-language",
    targetLanguage: "the patient's language",
    direction: "Auto-detect -> Patient",
  },
  patient: {
    label: "Patient",
    name: "Patient",
    icon: User,
    color: "288 62% 62%",
    sourceCode: PATIENT.langCode,
    sourceLanguage: "any language the patient speaks",
    targetCode: DOCTOR.langCode,
    targetLanguage: "the clinician's language",
    direction: "Auto-detect -> Clinician",
  },
} as const;

const statusText: Record<string, string> = {
  disconnected: "Ready to start",
  connecting: "Connecting to ElevenLabs",
  connected: "Listening live",
  disconnecting: "Disconnecting",
};

const AGENT_OUTPUT_VOLUME = 0.72;

function nextSpeakerAfter(speaker: Speaker): Speaker {
  return speaker === "doctor" ? "patient" : "doctor";
}

function languageDirection(speaker: Speaker, patientLanguage: FlowClearLanguage) {
  return speaker === "doctor"
    ? `English -> ${patientLanguage.label}`
    : `${patientLanguage.label} -> Doctor`;
}

function patientVoiceInstruction(language: FlowClearLanguage) {
  return language.code === "fr"
    ? "When speaking to the patient in French, use native Metropolitan French (France, fr-FR) pronunciation and accent. Speak fully in French words and never use English phonetics or an English accent for French output."
    : `When speaking to the patient, use native ${language.label} pronunciation and accent for that language.`;
}

const DOCTOR_ENGLISH_VOICE_INSTRUCTION =
  "When speaking English to the doctor, use clear British English pronunciation and a British accent.";

const INTERPRETER_SYSTEM_PROMPT = `You are a clinical language interpreter relay between a doctor and a patient. You are NOT an assistant, companion, or independent agent.

STRICT RULES:
- Only translate speech that was just spoken by the active speaker. Never initiate conversation.
- Never greet, introduce yourself, small-talk, give opinions, medical advice, or add words the speaker did not say.
- Never mention being an AI, assistant, or interpreter unless required by the prefix format below.
- Wait silently until someone speaks. Do not speak on connect or when settings change.
- Preserve clinical facts, names, numbers, and meaning exactly. Do not summarize or expand.
- Never use personal names for the doctor or patient (for example Rita or Nicholas). Refer only to "the doctor" and "the patient".
- When translating doctor -> patient: speak only in the patient language, begin with the natural equivalent of "The doctor is saying:", then the translation.
- When translating patient -> doctor: speak only in English, begin with "The patient has said:", then the translation. ${DOCTOR_ENGLISH_VOICE_INSTRUCTION}`;

function buildSpeakerInstruction(speaker: Speaker, language: FlowClearLanguage) {
  const meta = speakerCopy[speaker];
  const roleInstruction =
    speaker === "doctor"
      ? `Active speaker: Doctor (English). Translate into ${language.label} for the patient only. ${patientVoiceInstruction(language)} ${patientVoiceLocaleInstruction(language)}`
      : `Active speaker: Patient (${language.label}). Translate into English for the doctor only. ${DOCTOR_ENGLISH_VOICE_INSTRUCTION}`;

  return `${roleInstruction} Source: ${meta.sourceLanguage}. Target: ${meta.targetLanguage}. Relay only what was said. No greetings. No advice. No extra commentary.`;
}

function patientVoiceLocaleInstruction(language: FlowClearLanguage) {
  return language.code === "fr"
    ? "Voice locale requirement: fr-FR."
    : `Voice locale requirement: ${language.code}.`;
}

function suppressUnpromptedAgentSpeech(conversation: VoiceConversation | null) {
  if (!conversation) return;
  conversation.sendUserActivity();
}

const LiveConversation = () => {
  const navigate = useNavigate();
  const [selectedSpeaker, setSelectedSpeaker] = useState<Speaker>("doctor");
  const [sessionStatus, setSessionStatus] = useState<Status>("disconnected");
  const [mode, setMode] = useState<Mode>("listening");
  const [micMuted, setMicMuted] = useState(false);
  const [patientLanguage, setPatientLanguage] = useState<FlowClearLanguage>(DEFAULT_PATIENT_LANGUAGE);
  const [error, setError] = useState("");
  const conversationRef = useRef<VoiceConversation | null>(null);
  const sessionRunRef = useRef(0);
  const manualMicMutedRef = useRef(false);
  const selectedRef = useRef<Speaker>("doctor");
  const patientLanguageRef = useRef<FlowClearLanguage>(DEFAULT_PATIENT_LANGUAGE);
  const modeRef = useRef<Mode>("listening");
  const pendingNextSpeakerRef = useRef<Speaker | null>(null);
  const playbackFinishedAwaitingFinalRef = useRef(false);
  const pendingTurnRef = useRef<Turn | null>(null);
  const partialAgentResponseRef = useRef("");

  const phase = useConversation((s) => s.phase);
  const currentOriginal = useConversation((s) => s.currentOriginal);
  const currentTranslation = useConversation((s) => s.currentTranslation);
  const currentTurn = useConversation((s) => s.currentTurn);
  const currentConfidence = useConversation((s) => s.currentConfidence);
  const transcript = useConversation((s) => s.transcript);

  selectedRef.current = selectedSpeaker;
  patientLanguageRef.current = patientLanguage;
  const selected = speakerCopy[selectedSpeaker];
  const selectedDirection = languageDirection(selectedSpeaker, patientLanguage);
  const active = sessionStatus === "connected" && !micMuted && mode === "listening";
  const echoGuardActive = sessionStatus === "connected" && !micMuted && mode === "speaking";
  const pendingReview = useMemo(
    () => transcript.filter((t) => t.approval === "pending").length,
    [transcript],
  );

  const applySpeakerMode = useCallback((speaker: Speaker) => {
    conversationRef.current?.sendContextualUpdate(buildSpeakerInstruction(speaker, patientLanguageRef.current));
  }, []);

  const activateSpeakerMode = useCallback((speaker: Speaker) => {
    setSelectedSpeaker(speaker);
    selectedRef.current = speaker;
    applySpeakerMode(speaker);
    setLiveDraft({ phase: "listening", speaker });
  }, [applySpeakerMode]);

  const advanceToNextSpeaker = useCallback(() => {
    const nextSpeaker = pendingNextSpeakerRef.current;
    if (!nextSpeaker) return false;

    pendingNextSpeakerRef.current = null;
    playbackFinishedAwaitingFinalRef.current = false;
    activateSpeakerMode(nextSpeaker);
    return true;
  }, [activateSpeakerMode]);

  const startElevenLabsSession = useCallback(async () => {
    const runId = sessionRunRef.current + 1;
    sessionRunRef.current = runId;
    const existingConversation = conversationRef.current;
    conversationRef.current = null;
    await existingConversation?.endSession().catch(() => undefined);
    pendingNextSpeakerRef.current = null;
    playbackFinishedAwaitingFinalRef.current = false;
    pendingTurnRef.current = null;
    partialAgentResponseRef.current = "";
    modeRef.current = "listening";

    setError("");
    setSessionStatus("connecting");
    setLiveDraft({ phase: "listening", speaker: selectedRef.current });

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("This browser does not support microphone capture.");
      }
      if (typeof window !== "undefined" && !window.isSecureContext) {
        throw new Error("Microphone access requires HTTPS or http://localhost.");
      }

      const permissionStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      permissionStream.getTracks().forEach((track) => track.stop());

      const signedUrl = await getElevenLabsSignedUrl(patientLanguageRef.current.code);

      const conversation = await Conversation.startSession({
        signedUrl,
        textOnly: false,
        inputChunkDurationMs: 40,
        dynamicVariables: {
          doctor_name: "Doctor",
          patient_name: "Patient",
          speaker_mode: speakerCopy[selectedRef.current].label,
          patient_language: patientLanguageRef.current.label,
          patient_language_native: patientLanguageRef.current.nativeLabel,
          patient_language_code: patientLanguageRef.current.code,
          patient_voice_instruction: patientVoiceInstruction(patientLanguageRef.current),
          patient_voice_locale_instruction: patientVoiceLocaleInstruction(patientLanguageRef.current),
          doctor_english_voice_instruction: DOCTOR_ENGLISH_VOICE_INSTRUCTION,
          translation_direction:
            selectedRef.current === "doctor"
              ? `The doctor speaks English. Translate English into ${patientLanguageRef.current.label} for the patient.`
              : `The patient speaks ${patientLanguageRef.current.label}. Translate into English for the doctor.`,
        },
        onConversationCreated: (createdConversation) => {
          if (runId !== sessionRunRef.current) {
            void createdConversation.endSession();
            return;
          }
          conversationRef.current = createdConversation;
          createdConversation.setVolume({ volume: AGENT_OUTPUT_VOLUME });
        },
        onConnect: () => {
          if (runId !== sessionRunRef.current) return;
          setSessionStatus("connected");
          manualMicMutedRef.current = false;
          setMicMuted(false);
          conversationRef.current?.sendContextualUpdate(INTERPRETER_SYSTEM_PROMPT);
          conversationRef.current?.sendContextualUpdate(
            `Interpreter mode only. Patient language: ${patientLanguageRef.current.label} (${patientLanguageRef.current.code}). Do not speak until the active speaker talks. Translate only. No greetings.`,
          );
          applySpeakerMode(selectedRef.current);
        },
        onDisconnect: (details) => {
          if (runId !== sessionRunRef.current) return;
          setSessionStatus("disconnected");
          setLiveDraft({ phase: "idle", speaker: selectedRef.current });
          if (details.reason === "error") {
            setError(details.message);
          }
        },
        onStatusChange: ({ status }) => {
          if (runId !== sessionRunRef.current) return;
          setSessionStatus(status);
        },
        onModeChange: ({ mode: nextMode }) => {
          if (runId !== sessionRunRef.current) return;
          const previousMode = modeRef.current;
          if (nextMode === "speaking") {
            if (pendingTurnRef.current || partialAgentResponseRef.current) {
              conversationRef.current?.setMicMuted(true);
            } else {
              suppressUnpromptedAgentSpeech(conversationRef.current);
            }
          } else if (!manualMicMutedRef.current) {
            conversationRef.current?.setMicMuted(false);
          }
          setMode(nextMode);
          modeRef.current = nextMode;

          if (nextMode === "listening" && previousMode === "speaking") {
            const advanced = advanceToNextSpeaker();
            if (!advanced && pendingTurnRef.current) {
              playbackFinishedAwaitingFinalRef.current = true;
            }
            return;
          }

          setLiveDraft({
            phase: nextMode === "speaking" ? "speaking" : "listening",
            speaker: selectedRef.current,
          });
        },
        onMessage: (message) => {
          if (runId !== sessionRunRef.current) return;
          const text = message.message.trim();
          if (!text) return;

          if (message.role === "user") {
            const speaker = selectedRef.current;
            const language = patientLanguageRef.current;
            const draftTurn: Turn = {
              id: crypto.randomUUID(),
              speaker,
              originalLang: speaker === "doctor" ? "en" : language.code,
              translatedLang: speaker === "doctor" ? language.code : "en",
              original: text,
              translated: "",
              confidence: 0,
            };
            pendingTurnRef.current = draftTurn;
            partialAgentResponseRef.current = "";
            setLiveDraft({
              phase: "listening",
              speaker,
              original: text,
              translation: "",
              confidence: 0,
              turn: draftTurn,
            });
            return;
          }

          const pending = pendingTurnRef.current;
          if (!pending) {
            suppressUnpromptedAgentSpeech(conversationRef.current);
            return;
          }

          saveLiveTurn({
            ...pending,
            translated: text || partialAgentResponseRef.current,
            confidence: 0.95,
          });
          pendingNextSpeakerRef.current = nextSpeakerAfter(pending.speaker);
          pendingTurnRef.current = null;
          partialAgentResponseRef.current = "";
          if (playbackFinishedAwaitingFinalRef.current || modeRef.current === "listening") {
            advanceToNextSpeaker();
          } else {
            setLiveDraft({ phase: "speaking", speaker: selectedRef.current });
          }
        },
        onAgentChatResponsePart: ({ text }) => {
          if (runId !== sessionRunRef.current) return;
          const pending = pendingTurnRef.current;
          if (!pending) {
            if (text) suppressUnpromptedAgentSpeech(conversationRef.current);
            return;
          }
          if (!text) return;
          const nextTranslation = `${partialAgentResponseRef.current}${text}`;
          partialAgentResponseRef.current = nextTranslation;
          setLiveDraft({
            phase: "speaking",
            speaker: pending.speaker,
            original: pending.original,
            translation: nextTranslation,
            confidence: 0,
            turn: { ...pending, translated: nextTranslation },
          });
        },
        onError: (message) => {
          if (runId !== sessionRunRef.current) return;
          setError(message);
          setSessionStatus("disconnected");
          toast({
            title: "ElevenLabs live session error",
            description: message,
            variant: "destructive",
          });
        },
      });

      if (runId !== sessionRunRef.current) {
        await conversation.endSession().catch(() => undefined);
        return;
      }
      conversationRef.current = conversation;
    } catch (err) {
      if (runId !== sessionRunRef.current) return;
      let message =
        err instanceof Error ? err.message : "Unable to start ElevenLabs live session.";
      if (err instanceof DOMException && err.name === "NotAllowedError") {
        message = "Microphone permission was denied. Allow microphone access and try again.";
      }
      setError(message);
      setSessionStatus("disconnected");
      setLiveDraft({ phase: "idle", speaker: selectedRef.current });
    }
  }, [advanceToNextSpeaker, applySpeakerMode]);

  useEffect(() => {
    return () => {
      sessionRunRef.current += 1;
      const conversation = conversationRef.current;
      conversationRef.current = null;
      void conversation?.endSession();
    };
  }, []);

  const switchSpeaker = useCallback((speaker: Speaker) => {
    pendingNextSpeakerRef.current = null;
    playbackFinishedAwaitingFinalRef.current = false;
    activateSpeakerMode(speaker);
  }, [activateSpeakerMode]);

  const selectPatientLanguage = useCallback(
    (code: string) => {
      const nextLanguage = getLanguageByCode(code);
      if (nextLanguage.code === patientLanguageRef.current.code) return;

      setPatientLanguage(nextLanguage);
      patientLanguageRef.current = nextLanguage;

      const live = sessionStatus === "connected" || sessionStatus === "connecting";
      if (live) {
        void startElevenLabsSession();
        toast({
          title: `Patient language: ${nextLanguage.label}`,
          description: "Reconnecting interpreter with the new language…",
        });
        return;
      }

      toast({
        title: `Patient language: ${nextLanguage.label}`,
        description: "Tap the mic when ready — interpreter will use this language.",
      });
    },
    [sessionStatus, startElevenLabsSession],
  );

  const toggleMic = useCallback(() => {
    const nextMuted = !micMuted;
    manualMicMutedRef.current = nextMuted;
    conversationRef.current?.setMicMuted(nextMuted);
    setMicMuted(nextMuted);
  }, [micMuted]);

  const liveTurn = currentTurn
    ? {
        ...currentTurn,
        original: currentOriginal,
        translated: currentTranslation,
        confidence: currentConfidence,
      }
    : null;

  return (
    <div className="min-h-[calc(100vh-6.5rem)] bg-transparent">
      <section className="mx-auto flex min-h-[calc(100vh-6.5rem)] w-full max-w-[1480px] flex-col px-5 py-8 md:px-10 lg:px-14">
        <header className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-5">
            <div className="mt-1 text-primary">
              <HeartPulse className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold leading-tight text-foreground">Interpreter</h1>
              <p className="mt-2 text-lg text-muted-foreground">Doctor ↔ patient relay only</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <PatientLanguageSelect
              value={patientLanguage}
              onChange={selectPatientLanguage}
            />
            <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:text-primary" onClick={resetConversation}>
              <RotateCcw className="h-5 w-5" />
            </Button>
          </div>
        </header>

        <div className="mt-6 flex flex-wrap items-center gap-2 pl-0 md:pl-[4.25rem]">
          <QuickLink to="/transcript" icon={<FileText className="h-4 w-4" />}>
            Transcript {transcript.length}
          </QuickLink>
          <QuickButton onClick={() => navigate("/review")} icon={<ShieldCheck className="h-4 w-4" />}>
            Review {pendingReview}
          </QuickButton>
          <span className="glass-pill inline-flex h-9 items-center gap-2 rounded-md px-4 text-sm font-medium text-muted-foreground">
            <Languages className="h-4 w-4 text-primary" />
            {selectedDirection}
          </span>
        </div>

        {error && (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 md:ml-[4.25rem]">
            {error}
            <button type="button" onClick={startElevenLabsSession} className="ml-3 font-semibold underline">
              Retry ElevenLabs
            </button>
          </div>
        )}

        <main className="flex-1 overflow-y-auto px-0 pb-36 pt-10 md:px-16 lg:px-28">
          {transcript.length === 0 && !liveTurn ? (
            <EmptyChat
              sessionStatus={sessionStatus}
              patientLanguage={patientLanguage}
              onLanguageChange={selectPatientLanguage}
            />
          ) : (
            <div className="mx-auto flex max-w-6xl flex-col gap-16">
              {transcript.map((t) => (
                <ConversationBubble
                  key={t.id + t.savedAt}
                  speaker={t.speaker}
                  speakerName={speakerCopy[t.speaker].label}
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
              {liveTurn && (
                <ConversationBubble
                  speaker={liveTurn.speaker}
                  speakerName={speakerCopy[liveTurn.speaker].label}
                  originalLang={liveTurn.originalLang}
                  original={liveTurn.original}
                  translatedLang={liveTurn.translatedLang}
                  translated={liveTurn.translated}
                  confidence={liveTurn.confidence}
                  approval="pending"
                  pending={phase !== "listening"}
                  timestamp="now"
                />
              )}
            </div>
          )}
        </main>

        <VoiceComposer
          active={active}
          mode={mode}
          status={sessionStatus}
          liveText={currentOriginal}
          selectedSpeaker={selectedSpeaker}
          patientLanguage={patientLanguage}
          onLanguageChange={selectPatientLanguage}
          switchSpeaker={switchSpeaker}
          micMuted={micMuted}
          echoGuardActive={echoGuardActive}
          toggleMic={toggleMic}
          restartSession={startElevenLabsSession}
        />
      </section>
    </div>
  );
};

function EmptyChat({
  sessionStatus,
  patientLanguage,
  onLanguageChange,
}: {
  sessionStatus: Status;
  patientLanguage: FlowClearLanguage;
  onLanguageChange: (code: string) => void;
}) {
  return (
    <div className="mx-auto flex min-h-[46vh] max-w-3xl flex-col justify-center">
      <div className="flex items-start gap-5">
        <div className="surface flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg text-primary">
          <HeartPulse className="h-7 w-7" />
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-[22px] leading-9 text-foreground">
              {sessionStatus === "connected"
                ? "Listening — speak when ready."
                : "Choose your patient language."}
            </p>
            <p className="text-lg leading-8 text-muted-foreground">
              {sessionStatus === "connected"
                ? `Interpreter relay only: English for the doctor, ${patientLanguage.label} for the patient.`
                : "Pick a language below, then tap the mic to connect."}
            </p>
          </div>
          <PatientLanguageSelect
            value={patientLanguage}
            onChange={onLanguageChange}
            prominent
          />
        </div>
      </div>
    </div>
  );
}

function PatientLanguageSelect({
  value,
  onChange,
  compact = false,
  prominent = false,
}: {
  value: FlowClearLanguage;
  onChange: (code: string) => void;
  compact?: boolean;
  prominent?: boolean;
}) {
  return (
    <div
      className={cn(
        "glass-pill flex items-center gap-2 rounded-lg px-4 py-2",
        compact ? "min-w-0 flex-shrink-0" : "min-w-[210px]",
        prominent && "max-w-md border border-primary/20 bg-white/80",
      )}
    >
      <Languages className="h-4 w-4 flex-shrink-0 text-primary" />
      <div className="min-w-0 flex-1">
        {!compact && (
          <p className="text-[11px] font-medium leading-4 text-muted-foreground">Patient language</p>
        )}
        <Select value={value.code} onValueChange={onChange}>
          <SelectTrigger
            className={cn(
              "border-0 bg-transparent p-0 font-semibold text-foreground shadow-none ring-0 focus:ring-0 focus:ring-offset-0",
              compact ? "h-8 text-sm" : "h-6 text-sm",
            )}
          >
            <SelectValue aria-label={value.label}>
              {compact ? value.label : value.label}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="max-h-80">
            {FLOWCLEAR_LANGUAGES.filter((language) => language.code !== "en").map((language) => (
              <SelectItem key={language.code} value={language.code}>
                <span className="flex min-w-0 items-center gap-2">
                  <span>{language.label}</span>
                  <span className="text-xs text-muted-foreground">{language.nativeLabel}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function VoiceComposer({
  active,
  mode,
  status,
  liveText,
  selectedSpeaker,
  patientLanguage,
  onLanguageChange,
  switchSpeaker,
  micMuted,
  echoGuardActive,
  toggleMic,
  restartSession,
}: {
  active: boolean;
  mode: Mode;
  status: Status;
  liveText: string;
  selectedSpeaker: Speaker;
  patientLanguage: FlowClearLanguage;
  onLanguageChange: (code: string) => void;
  switchSpeaker: (speaker: Speaker) => void;
  micMuted: boolean;
  echoGuardActive: boolean;
  toggleMic: () => void;
  restartSession: () => void;
}) {
  const selected = speakerCopy[selectedSpeaker];
  const SelectedIcon = selected.icon;
  const disconnected = status === "disconnected";
  const direction = languageDirection(selectedSpeaker, patientLanguage);
  const statusLabel = echoGuardActive ? "Speaking translation" : statusText[status] ?? "Listening live";
  const inputLabel = echoGuardActive
    ? "Playing translation..."
    : liveText || (
        status === "disconnected"
          ? `Tap mic to start ${selected.label}...`
          : `${active ? "Listening as" : "Connecting for"} ${selected.label}...`
      );

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-7 z-30 px-5">
      <div className="pointer-events-auto mx-auto max-w-5xl">
        <div className="glass-strong flex min-h-[86px] flex-col gap-3 rounded-2xl px-5 py-3 md:flex-row md:items-center md:gap-4 md:px-6">
          <div className="flex items-center justify-between gap-3 md:hidden">
            <PatientLanguageSelect
              value={patientLanguage}
              onChange={onLanguageChange}
              compact
            />
            <button
              type="button"
              onClick={() => switchSpeaker(selectedSpeaker === "doctor" ? "patient" : "doctor")}
              className="inline-flex h-9 items-center gap-2 rounded-full bg-primary/10 px-3 text-xs font-semibold text-primary"
            >
              <Users className="h-3.5 w-3.5" />
              {selected.label}
            </button>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-col gap-2 md:flex-row md:items-center">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <SelectedIcon className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                <span className="truncate text-base text-muted-foreground">
                  {inputLabel}
                </span>
              </div>
              <Waveform active={active && mode === "listening"} />
            </div>
          </div>

          <button
            type="button"
            onClick={() => switchSpeaker(selectedSpeaker === "doctor" ? "patient" : "doctor")}
            className="hidden h-11 items-center gap-2 rounded-full bg-primary/10 px-4 text-sm font-semibold text-primary transition-colors hover:bg-primary/15 sm:inline-flex"
          >
            <Users className="h-4 w-4" />
            {selected.label}
          </button>

          <button
            type="button"
            onClick={disconnected ? restartSession : toggleMic}
            className={cn(
              "flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-card text-primary shadow-md ring-1 ring-primary/15",
              active && "bg-primary text-white",
              status === "connecting" && "animate-pulse",
              micMuted && "text-muted-foreground",
            )}
            aria-label={
              disconnected
                ? "Reconnect ElevenLabs"
                : micMuted
                  ? "Unmute microphone"
                  : echoGuardActive
                    ? "Microphone gated during playback"
                    : "Mute microphone"
            }
          >
            {micMuted || echoGuardActive ? <MicOff className="h-8 w-8" /> : <Mic className="h-8 w-8" />}
          </button>
        </div>

        <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <span>{statusLabel}</span>
          <span>—</span>
          <span>{direction}</span>
        </div>
      </div>
    </div>
  );
}

function Waveform({ active }: { active: boolean }) {
  return (
    <div className="mx-auto hidden min-w-[230px] items-center justify-center gap-1 md:flex">
      {Array.from({ length: 28 }).map((_, i) => (
        <span
          key={i}
          className={cn(
            "block w-1 rounded-full bg-primary",
            !active && "opacity-25",
          )}
          style={{
            height: `${6 + ((i * 9) % 28)}px`,
            animationName: active ? "wave" : "none",
            animationDuration: "0.9s",
            animationTimingFunction: "ease-in-out",
            animationIterationCount: "infinite",
            animationDelay: `${i * 38}ms`,
          }}
        />
      ))}
    </div>
  );
}

function QuickLink({
  to,
  icon,
  children,
}: {
  to: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      to={to}
      className="glass-pill inline-flex h-9 items-center gap-2 rounded-full px-4 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/35 hover:text-primary"
    >
      {icon}
      {children}
    </Link>
  );
}

function QuickButton({
  onClick,
  icon,
  children,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="glass-pill inline-flex h-9 items-center gap-2 rounded-full px-4 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/35 hover:text-primary"
    >
      {icon}
      {children}
    </button>
  );
}

export default LiveConversation;
