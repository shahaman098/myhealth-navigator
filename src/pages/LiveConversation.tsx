import { Conversation, type Mode, type Status, type VoiceConversation } from "@elevenlabs/client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FileText,
  Languages,
  Mic,
  RotateCcw,
  ShieldCheck,
  Square,
  Stethoscope,
  User,
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
  DOCTOR_LANGUAGE,
  PATIENT_LANGUAGES,
  getLanguageByCode,
  type FlowClearLanguage,
} from "@/data/languages";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import {
  isUsefulSttText,
  MIN_AUDIO_BYTES,
  sanitizeSttText,
  transcribeAudioBlob,
  VAD_MIN_SPEECH_MS,
  VAD_SILENCE_MS,
  VAD_SPEECH_THRESHOLD,
} from "@/lib/liveVad";

const speakerCopy = {
  doctor: {
    label: "Doctor",
    name: "Doctor",
    icon: Stethoscope,
    color: "266 76% 64%",
    sourceCode: DOCTOR.langCode,
    sourceLanguage: DOCTOR_LANGUAGE.label,
    targetCode: "selected-patient-language",
    targetLanguage: "the patient's language",
    direction: `${DOCTOR_LANGUAGE.label} -> Patient`,
  },
  patient: {
    label: "Patient",
    name: "Patient",
    icon: User,
    color: "288 62% 62%",
    sourceCode: PATIENT.langCode,
    sourceLanguage: "any language the patient speaks",
    targetCode: DOCTOR_LANGUAGE.code,
    targetLanguage: DOCTOR_LANGUAGE.label,
    direction: `Patient -> ${DOCTOR_LANGUAGE.label}`,
  },
} as const;

const statusText: Record<string, string> = {
  disconnected: "Ready to start",
  connecting: "Connecting to ElevenLabs",
  connected: "Listening live",
  disconnecting: "Disconnecting",
};

const AGENT_OUTPUT_VOLUME = 0.72;

type SpeechRecognitionAlternativeLike = {
  transcript?: string;
};

type SpeechRecognitionResultLike = {
  isFinal: boolean;
  0?: SpeechRecognitionAlternativeLike;
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: SpeechRecognitionResultLike;
  };
};

type BrowserSpeechRecognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onend: (() => void) | null;
  onerror: ((event: { error?: string; message?: string }) => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  abort: () => void;
  start: () => void;
  stop: () => void;
};

type BrowserSpeechRecognitionConstructor = new () => BrowserSpeechRecognition;

function nextSpeakerAfter(speaker: Speaker): Speaker {
  return speaker === "doctor" ? "patient" : "doctor";
}

function languageDirection(speaker: Speaker, patientLanguage: FlowClearLanguage) {
  return speaker === "doctor"
    ? `${DOCTOR_LANGUAGE.label} -> ${patientLanguage.label}`
    : `${patientLanguage.label} -> ${DOCTOR_LANGUAGE.label}`;
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
- The doctor ALWAYS speaks English only. Clinician language is fixed to English and never changes.
- Only translate speech that was just spoken by the active speaker. Never initiate conversation.
- Never greet, introduce yourself, small-talk, give opinions, medical advice, or add words the speaker did not say.
- Never mention being an AI, assistant, or interpreter unless required by the prefix format below.
- Wait silently until someone speaks. Do not speak on connect or when settings change.
- Preserve clinical facts, names, numbers, and meaning exactly. Do not summarize or expand.
- Never use personal names for the doctor or patient (for example Rita or Nicholas). Refer only to "the doctor" and "the patient".
- When translating doctor -> patient: the doctor spoke English; speak only in the patient language, begin with the natural equivalent of "The doctor is saying:", then the translation.
- When translating patient -> doctor: speak only in English, begin with "The patient has said:", then the translation. ${DOCTOR_ENGLISH_VOICE_INSTRUCTION}
- The conversation ALWAYS starts with the doctor speaking English. Do not listen for the patient until the doctor has spoken first and you have spoken the patient-language translation aloud.`;

function buildSpeakerInstruction(
  speaker: Speaker,
  language: FlowClearLanguage,
  options?: { doctorFirst?: boolean },
) {
  const meta = speakerCopy[speaker];
  const doctorFirst =
    options?.doctorFirst && speaker === "doctor"
      ? "FIRST TURN: The doctor speaks first. When the doctor stops speaking English, you MUST immediately speak the translation aloud to the patient. "
      : "";
  const roleInstruction =
    speaker === "doctor"
      ? `${doctorFirst}Active speaker: Doctor (${DOCTOR_LANGUAGE.label}). Translate into ${language.label} for the patient only. Output language must be ${language.label} only — never English when speaking to the patient. ${patientVoiceInstruction(language)} ${patientVoiceLocaleInstruction(language)}`
      : `Active speaker: Patient (${language.label}). Translate into ${DOCTOR_LANGUAGE.label} for the doctor only. ${DOCTOR_ENGLISH_VOICE_INSTRUCTION}`;

  return `${roleInstruction} Source: ${meta.sourceLanguage}. Target: ${meta.targetLanguage}. Relay only what was said. No greetings. No advice. No extra commentary.`;
}

function doctorRelayPrompt(language: FlowClearLanguage, doctorText: string) {
  return `The doctor has finished speaking in English: "${doctorText}". Speak NOW to the patient in ${language.label} (${language.code}) only. Start with the natural equivalent of "The doctor is saying:" then give the full translation. ${patientVoiceInstruction(language)} ${patientVoiceLocaleInstruction(language)} Do not use English in your spoken reply to the patient.`;
}

function patientVoiceLocaleInstruction(language: FlowClearLanguage) {
  return language.code === "fr"
    ? "Voice locale requirement: fr-FR."
    : `Voice locale requirement: ${language.code}.`;
}

function speechRecognitionLocale(speaker: Speaker, language: FlowClearLanguage) {
  if (speaker === "doctor") return "en-GB";
  const locales: Record<string, string> = {
    ar: "ar-SA",
    bn: "bn-BD",
    es: "es-ES",
    fr: "fr-FR",
    hi: "hi-IN",
    pl: "pl-PL",
    pt: "pt-PT",
    ro: "ro-RO",
    ru: "ru-RU",
    so: "so-SO",
    tr: "tr-TR",
    uk: "uk-UA",
    ur: "ur-PK",
    zh: "zh-CN",
  };
  return locales[language.code] ?? language.code;
}

function getSpeechRecognitionCtor(): BrowserSpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const speechWindow = window as Window & {
    SpeechRecognition?: BrowserSpeechRecognitionConstructor;
    webkitSpeechRecognition?: BrowserSpeechRecognitionConstructor;
  };
  return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition ?? null;
}

const LiveConversation = () => {
  const navigate = useNavigate();
  const [selectedSpeaker, setSelectedSpeaker] = useState<Speaker>("doctor");
  const [sessionStatus, setSessionStatus] = useState<Status>("disconnected");
  const [mode, setMode] = useState<Mode>("listening");
  const [patientLanguage, setPatientLanguage] = useState<FlowClearLanguage>(DEFAULT_PATIENT_LANGUAGE);
  const [doctorTurnCompleted, setDoctorTurnCompleted] = useState(false);
  const [error, setError] = useState("");
  const conversationRef = useRef<VoiceConversation | null>(null);
  const sessionRunRef = useRef(0);
  const liveSessionWantedRef = useRef(false);
  const reconnectTimerRef = useRef<number | null>(null);
  const selectedRef = useRef<Speaker>("doctor");
  const patientLanguageRef = useRef<FlowClearLanguage>(DEFAULT_PATIENT_LANGUAGE);
  const modeRef = useRef<Mode>("listening");
  const pendingNextSpeakerRef = useRef<Speaker | null>(null);
  const playbackFinishedAwaitingFinalRef = useRef(false);
  const pendingTurnRef = useRef<Turn | null>(null);
  const partialAgentResponseRef = useRef("");
  const agentReplyExpectedRef = useRef(false);
  const agentSessionReadyRef = useRef(false);
  const doctorTurnCompletedRef = useRef(false);
  const vadActiveRef = useRef(false);
  const processingUtteranceRef = useRef(false);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const segmentRecorderRef = useRef<MediaRecorder | null>(null);
  const segmentChunksRef = useRef<Blob[]>([]);
  const finishingSegmentRef = useRef(false);
  const finishSegmentRef = useRef<((options?: { allowTextFallback?: boolean }) => Promise<boolean>) | null>(null);
  const vadSpeakingRef = useRef(false);
  const vadLastSpeechRef = useRef(0);
  const vadSpeechStartRef = useRef<number | null>(null);
  const speakingTranslationRef = useRef(false);
  const playbackRef = useRef<HTMLAudioElement | null>(null);
  const playbackUrlRef = useRef<string | null>(null);
  const liveRecognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const liveRecognitionWantedRef = useRef(false);
  const liveRecognitionRestartRef = useRef<number | null>(null);
  const liveFinalCaptionRef = useRef("");
  const liveInterimTextRef = useRef("");
  const [liveInterimText, setLiveInterimText] = useState("");
  const [browserCaptioningSupported, setBrowserCaptioningSupported] = useState(true);
  const [vadListening, setVadListening] = useState(false);
  const [processingUtterance, setProcessingUtterance] = useState(false);
  doctorTurnCompletedRef.current = doctorTurnCompleted;

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
  const sessionLive = sessionStatus === "connected" || sessionStatus === "connecting";
  const agentSpeaking = sessionStatus === "connected" && mode === "speaking";
  const active = vadListening && !agentSpeaking && !processingUtterance;
  const pendingReview = useMemo(
    () => transcript.filter((t) => t.approval === "pending").length,
    [transcript],
  );

  const clearLiveCaption = useCallback(() => {
    liveFinalCaptionRef.current = "";
    liveInterimTextRef.current = "";
    setLiveInterimText("");
  }, []);

  const stopLiveTranscription = useCallback((options?: { clearCaption?: boolean }) => {
    liveRecognitionWantedRef.current = false;
    if (liveRecognitionRestartRef.current != null) {
      window.clearTimeout(liveRecognitionRestartRef.current);
      liveRecognitionRestartRef.current = null;
    }

    const recognition = liveRecognitionRef.current;
    liveRecognitionRef.current = null;
    if (recognition) {
      recognition.onend = null;
      recognition.onerror = null;
      recognition.onresult = null;
      try {
        recognition.abort();
      } catch {
        /* noop */
      }
    }

    if (options?.clearCaption ?? true) {
      clearLiveCaption();
    }
  }, [clearLiveCaption]);

  const startLiveTranscription = useCallback(() => {
    if (liveRecognitionRef.current || !vadActiveRef.current) return;

    const Recognition = getSpeechRecognitionCtor();
    if (!Recognition) {
      setBrowserCaptioningSupported(false);
      return;
    }

    setBrowserCaptioningSupported(true);
    liveRecognitionWantedRef.current = true;
    liveFinalCaptionRef.current = "";

    const recognition = new Recognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.lang = speechRecognitionLocale(selectedRef.current, patientLanguageRef.current);

    recognition.onresult = (event) => {
      if (
        !liveRecognitionWantedRef.current ||
        speakingTranslationRef.current ||
        agentReplyExpectedRef.current
      ) {
        return;
      }

      let finalCaption = liveFinalCaptionRef.current;
      let interimCaption = "";

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        const text = result?.[0]?.transcript?.trim() ?? "";
        if (!text) continue;
        if (result.isFinal) {
          finalCaption = `${finalCaption} ${text}`.trim();
        } else {
          interimCaption = `${interimCaption} ${text}`.trim();
        }
      }

      liveFinalCaptionRef.current = finalCaption;
      const combinedCaption = sanitizeSttText(`${finalCaption} ${interimCaption}`);
      if (!combinedCaption) return;

      liveInterimTextRef.current = combinedCaption;
      setLiveInterimText(combinedCaption);
      setLiveDraft({
        phase: processingUtteranceRef.current ? "transcribing" : "listening",
        speaker: selectedRef.current,
        original: combinedCaption,
        translation: "",
        confidence: 0,
        turn: null,
      });
    };

    recognition.onerror = (event) => {
      const recognitionError = event.error ?? event.message ?? "";
      if (recognitionError === "not-allowed" || recognitionError === "service-not-allowed") {
        setBrowserCaptioningSupported(false);
      }
    };

    recognition.onend = () => {
      liveRecognitionRef.current = null;
      if (!liveRecognitionWantedRef.current || !vadActiveRef.current) return;
      if (liveRecognitionRestartRef.current != null) {
        window.clearTimeout(liveRecognitionRestartRef.current);
      }
      liveRecognitionRestartRef.current = window.setTimeout(() => {
        liveRecognitionRestartRef.current = null;
        startLiveTranscription();
      }, 250);
    };

    try {
      recognition.start();
      liveRecognitionRef.current = recognition;
    } catch {
      liveRecognitionWantedRef.current = false;
    }
  }, []);

  const restartLiveTranscription = useCallback(() => {
    if (!vadActiveRef.current) return;
    stopLiveTranscription({ clearCaption: true });
    liveRecognitionWantedRef.current = true;
    startLiveTranscription();
  }, [startLiveTranscription, stopLiveTranscription]);

  const stopContinuousVad = useCallback(() => {
    vadActiveRef.current = false;
    setVadListening(false);
    stopLiveTranscription();
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    try {
      segmentRecorderRef.current?.stop();
    } catch {
      /* noop */
    }
    finishSegmentRef.current = null;
    finishingSegmentRef.current = false;
    segmentRecorderRef.current = null;
    segmentChunksRef.current = [];
    vadSpeakingRef.current = false;
    vadSpeechStartRef.current = null;
    audioCtxRef.current?.close().catch(() => undefined);
    audioCtxRef.current = null;
    analyserRef.current = null;
    audioStreamRef.current?.getTracks().forEach((track) => track.stop());
    audioStreamRef.current = null;
  }, [stopLiveTranscription]);

  const stopPlayback = useCallback(() => {
    if (playbackRef.current) {
      try {
        playbackRef.current.pause();
      } catch {
        /* noop */
      }
      playbackRef.current.src = "";
      playbackRef.current = null;
    }
    if (playbackUrlRef.current) {
      URL.revokeObjectURL(playbackUrlRef.current);
      playbackUrlRef.current = null;
    }
  }, []);

  const speakLiveTranslation = useCallback(
    async (text: string, languageCode: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      stopPlayback();
      stopLiveTranscription({ clearCaption: false });
      speakingTranslationRef.current = true;
      modeRef.current = "speaking";
      setMode("speaking");
      setLiveDraft({
        phase: "speaking",
        speaker: selectedRef.current,
        translation: trimmed,
      });

      try {
        const response = await fetch("/api/live-tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: trimmed,
            language: languageCode,
            patientLanguageCode: patientLanguageRef.current.code,
          }),
        });
        if (!response.ok) {
          const detail = await response.json().catch(() => ({}));
          throw new Error(
            typeof detail?.error === "string"
              ? detail.error
              : `Live voice failed (${response.status})`,
          );
        }

        const url = URL.createObjectURL(await response.blob());
        playbackUrlRef.current = url;
        const audio = new Audio(url);
        playbackRef.current = audio;
        audio.volume = AGENT_OUTPUT_VOLUME;

        await new Promise<void>((resolve, reject) => {
          audio.onended = () => resolve();
          audio.onerror = () => reject(new Error("Could not play interpreter audio."));
          void audio.play().catch(reject);
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Interpreter voice failed.";
        toast({
          title: "Interpreter voice failed",
          description: message,
          variant: "destructive",
        });
      } finally {
        stopPlayback();
        speakingTranslationRef.current = false;
        agentReplyExpectedRef.current = false;
        modeRef.current = "listening";
        setMode("listening");
        if (vadActiveRef.current && liveSessionWantedRef.current) {
          clearLiveCaption();
          startLiveTranscription();
        }
      }
    },
    [clearLiveCaption, startLiveTranscription, stopLiveTranscription, stopPlayback],
  );

  const relayUtteranceToAgent = useCallback(
    (speaker: Speaker, text: string) => {
      const language = patientLanguageRef.current;
      const draftTurn: Turn = {
        id: crypto.randomUUID(),
        speaker,
        originalLang: speaker === "doctor" ? DOCTOR_LANGUAGE.code : language.code,
        translatedLang: speaker === "doctor" ? language.code : DOCTOR_LANGUAGE.code,
        original: text,
        translated: "",
        confidence: 0,
      };
      pendingTurnRef.current = draftTurn;
      partialAgentResponseRef.current = "";
      agentReplyExpectedRef.current = true;

      if (speaker === "doctor") {
        conversationRef.current?.sendContextualUpdate(doctorRelayPrompt(language, text));
      } else {
        conversationRef.current?.sendContextualUpdate(
          `The patient has finished speaking in ${language.label}: "${text}". Speak NOW to the doctor in ${DOCTOR_LANGUAGE.label} only. Start with "The patient has said:" then translate. ${DOCTOR_ENGLISH_VOICE_INSTRUCTION}`,
        );
      }
      conversationRef.current?.sendUserMessage(text);

      setLiveDraft({
        phase: "listening",
        speaker,
        original: text,
        translation: "",
        confidence: 0,
        turn: draftTurn,
      });
    },
    [],
  );

  const processTranscriptText = useCallback(
    (speaker: Speaker, text: string) => {
      const transcript = sanitizeSttText(text);
      if (!isUsefulSttText(transcript)) return false;

      if (speaker === "patient" && !doctorTurnCompletedRef.current) {
        toast({
          title: "Doctor speaks first",
          description: "Translate the doctor's English turn before listening to the patient.",
        });
        return false;
      }

      liveInterimTextRef.current = transcript;
      setLiveInterimText(transcript);
      relayUtteranceToAgent(speaker, transcript);
      return true;
    },
    [relayUtteranceToAgent],
  );

  const processUtterance = useCallback(
    async (audio: Blob) => {
      if (!vadActiveRef.current || !agentSessionReadyRef.current || !conversationRef.current) {
        return;
      }

      const speaker = selectedRef.current;
      if (speaker === "patient" && !doctorTurnCompletedRef.current) {
        toast({
          title: "Doctor speaks first",
          description: "Speak as the doctor in English before the patient turn.",
        });
        return;
      }

      processingUtteranceRef.current = true;
      setProcessingUtterance(true);
      setLiveDraft({ phase: "transcribing", speaker });

      try {
        const sttLanguage =
          speaker === "doctor" ? DOCTOR_LANGUAGE.code : patientLanguageRef.current.code;
        const serverTranscript = sanitizeSttText(await transcribeAudioBlob(audio, sttLanguage));
        const browserTranscript = sanitizeSttText(liveInterimTextRef.current);
        const transcript = isUsefulSttText(serverTranscript) ? serverTranscript : browserTranscript;
        processTranscriptText(speaker, transcript);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Could not transcribe speech.";
        setError(message);
        toast({
          title: "Transcription failed",
          description: message,
          variant: "destructive",
        });
      } finally {
        processingUtteranceRef.current = false;
        setProcessingUtterance(false);
      }
    },
    [processTranscriptText],
  );

  const startContinuousVad = useCallback(async () => {
    if (vadActiveRef.current) return;
    if (typeof window === "undefined" || !("MediaRecorder" in window)) {
      throw new Error("This browser does not support continuous microphone capture.");
    }

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioStreamRef.current = stream;
    vadActiveRef.current = true;
    setVadListening(true);
    startLiveTranscription();

    const startSegmentRecorder = () => {
      if (!audioStreamRef.current || segmentRecorderRef.current || processingUtteranceRef.current) {
        return;
      }
      segmentChunksRef.current = [];
      const recorder = new MediaRecorder(audioStreamRef.current);
      segmentRecorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) segmentChunksRef.current.push(event.data);
      };
      recorder.start();
    };

    const finishSegment = async () => {
      if (finishingSegmentRef.current || processingUtteranceRef.current) return false;
      const recorder = segmentRecorderRef.current;
      if (!recorder || recorder.state === "inactive") return false;

      finishingSegmentRef.current = true;

      try {
        await new Promise<void>((resolve) => {
          recorder.onstop = () => resolve();
          recorder.stop();
        });

        segmentRecorderRef.current = null;
        const audio = new Blob(segmentChunksRef.current, {
          type: segmentChunksRef.current[0]?.type || "audio/webm",
        });
        segmentChunksRef.current = [];

        if (audio.size < MIN_AUDIO_BYTES) return false;
        await processUtterance(audio);
        return true;
      } finally {
        finishingSegmentRef.current = false;
      }
    };
    finishSegmentRef.current = finishSegment;

    const AudioCtor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtor) return;

    const ctx = new AudioCtor();
    audioCtxRef.current = ctx;
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    source.connect(analyser);
    analyserRef.current = analyser;

    const data = new Uint8Array(analyser.frequencyBinCount);
    const tick = () => {
      if (!vadActiveRef.current || !analyserRef.current) return;

      analyserRef.current.getByteTimeDomainData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i++) {
        const v = (data[i] - 128) / 128;
        sum += v * v;
      }
      const rms = Math.sqrt(sum / data.length);

      const paused =
        !agentSessionReadyRef.current ||
        !conversationRef.current ||
        modeRef.current === "speaking" ||
        processingUtteranceRef.current ||
        agentReplyExpectedRef.current ||
        speakingTranslationRef.current;
      const now = Date.now();
      const isSpeech = rms > VAD_SPEECH_THRESHOLD;

      if (!paused) {
        if (isSpeech) {
          vadLastSpeechRef.current = now;
          if (!vadSpeakingRef.current) {
            vadSpeakingRef.current = true;
            vadSpeechStartRef.current = now;
            startSegmentRecorder();
          }
        } else if (vadSpeakingRef.current) {
          const silenceDuration = now - vadLastSpeechRef.current;
          const speechDuration =
            vadSpeechStartRef.current != null ? now - vadSpeechStartRef.current : 0;
          if (silenceDuration >= VAD_SILENCE_MS && speechDuration >= VAD_MIN_SPEECH_MS) {
            vadSpeakingRef.current = false;
            vadSpeechStartRef.current = null;
            void finishSegment();
          }
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    };
    tick();
  }, [processUtterance, startLiveTranscription]);

  const applySpeakerMode = useCallback((speaker: Speaker) => {
    const doctorFirst = speaker === "doctor" && !doctorTurnCompletedRef.current;
    conversationRef.current?.sendContextualUpdate(
      buildSpeakerInstruction(speaker, patientLanguageRef.current, { doctorFirst }),
    );
  }, []);

  const activateSpeakerMode = useCallback((speaker: Speaker) => {
    if (speaker === "patient" && !doctorTurnCompletedRef.current) {
      return;
    }
    setSelectedSpeaker(speaker);
    selectedRef.current = speaker;
    clearLiveCaption();
    applySpeakerMode(speaker);
    setLiveDraft({
      phase: "listening",
      speaker,
      original: "",
      translation: "",
      confidence: 0,
      turn: null,
    });
    restartLiveTranscription();
  }, [applySpeakerMode, clearLiveCaption, restartLiveTranscription]);

  const ensureDoctorSpeaker = useCallback(() => {
    setSelectedSpeaker("doctor");
    selectedRef.current = "doctor";
  }, []);

  const advanceToNextSpeaker = useCallback(() => {
    const nextSpeaker = pendingNextSpeakerRef.current;
    if (!nextSpeaker) return false;

    pendingNextSpeakerRef.current = null;
    playbackFinishedAwaitingFinalRef.current = false;
    activateSpeakerMode(nextSpeaker);
    return true;
  }, [activateSpeakerMode]);

  const clearReconnectTimer = useCallback(() => {
    if (reconnectTimerRef.current != null) {
      window.clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  }, []);

  const stopLiveSession = useCallback(() => {
    liveSessionWantedRef.current = false;
    agentSessionReadyRef.current = false;
    clearReconnectTimer();
    stopContinuousVad();
    stopPlayback();
    sessionRunRef.current += 1;
    const conversation = conversationRef.current;
    conversationRef.current = null;
    void conversation?.endSession().catch(() => undefined);
    setSessionStatus("disconnected");
    setLiveDraft({
      phase: "idle",
      speaker: selectedRef.current,
      original: "",
      translation: "",
      confidence: 0,
      turn: null,
    });
  }, [clearReconnectTimer, stopContinuousVad, stopPlayback]);

  const startElevenLabsSession = useCallback(async (opts?: { preserveTurnState?: boolean }) => {
    const runId = sessionRunRef.current + 1;
    sessionRunRef.current = runId;
    const existingConversation = conversationRef.current;
    conversationRef.current = null;
    await existingConversation?.endSession().catch(() => undefined);
    agentSessionReadyRef.current = false;
    pendingNextSpeakerRef.current = null;
    playbackFinishedAwaitingFinalRef.current = false;
    pendingTurnRef.current = null;
    partialAgentResponseRef.current = "";
    agentReplyExpectedRef.current = false;
    modeRef.current = "listening";
    if (!opts?.preserveTurnState) {
      doctorTurnCompletedRef.current = false;
      setDoctorTurnCompleted(false);
    }
    ensureDoctorSpeaker();
    clearReconnectTimer();

    setError("");
    setSessionStatus("connecting");
    clearLiveCaption();
    setLiveDraft({
      phase: "listening",
      speaker: selectedRef.current,
      original: "",
      translation: "",
      confidence: 0,
      turn: null,
    });

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("This browser does not support microphone capture.");
      }
      if (typeof window !== "undefined" && !window.isSecureContext) {
        throw new Error("Microphone access requires HTTPS or http://localhost.");
      }

      const signedUrl = await getElevenLabsSignedUrl(patientLanguageRef.current.code);

      const conversation = await Conversation.startSession({
        signedUrl,
        // Keep the agent text-only: the app plays exactly one translated voice via /api/live-tts.
        textOnly: true,
        connectionType: "websocket",
        inputChunkDurationMs: 40,
        dynamicVariables: {
          doctor_name: "Doctor",
          patient_name: "Patient",
          doctor_language: DOCTOR_LANGUAGE.label,
          doctor_language_code: DOCTOR_LANGUAGE.code,
          speaker_mode: speakerCopy[selectedRef.current].label,
          patient_language: patientLanguageRef.current.label,
          patient_language_native: patientLanguageRef.current.nativeLabel,
          patient_language_code: patientLanguageRef.current.code,
          patient_voice_instruction: patientVoiceInstruction(patientLanguageRef.current),
          patient_voice_locale_instruction: patientVoiceLocaleInstruction(patientLanguageRef.current),
          doctor_english_voice_instruction: DOCTOR_ENGLISH_VOICE_INSTRUCTION,
          translation_direction:
            selectedRef.current === "doctor"
              ? `The doctor speaks ${DOCTOR_LANGUAGE.label}. Translate ${DOCTOR_LANGUAGE.label} into ${patientLanguageRef.current.label} for the patient.`
              : `The patient speaks ${patientLanguageRef.current.label}. Translate into ${DOCTOR_LANGUAGE.label} for the doctor.`,
        },
        onConversationCreated: (createdConversation) => {
          if (runId !== sessionRunRef.current) {
            void createdConversation.endSession();
            return;
          }
          conversationRef.current = createdConversation;
        },
        onConnect: () => {
          if (runId !== sessionRunRef.current) return;
          agentSessionReadyRef.current = true;
          setSessionStatus("connected");
          conversationRef.current?.sendContextualUpdate(INTERPRETER_SYSTEM_PROMPT);
          conversationRef.current?.sendContextualUpdate(
            `Interpreter mode only. Doctor language is always ${DOCTOR_LANGUAGE.label} (${DOCTOR_LANGUAGE.code}). Patient language: ${patientLanguageRef.current.label} (${patientLanguageRef.current.code}). The doctor speaks FIRST in English. After the doctor stops, speak the translation aloud to the patient in ${patientLanguageRef.current.label} only. Then wait for the patient. No greetings on connect.`,
          );
          applySpeakerMode("doctor");
          if (!vadActiveRef.current) {
            void startContinuousVad().catch((err) => {
              const message =
                err instanceof Error ? err.message : "Could not start continuous listening.";
              setError(message);
              toast({
                title: "Microphone error",
                description: message,
                variant: "destructive",
              });
            });
          }
        },
        onDisconnect: (details) => {
          if (runId !== sessionRunRef.current) return;
          agentSessionReadyRef.current = false;
          setSessionStatus("disconnected");
          setLiveDraft({
            phase: "idle",
            speaker: selectedRef.current,
            original: "",
            translation: "",
            confidence: 0,
            turn: null,
          });
          if (!liveSessionWantedRef.current) {
            stopContinuousVad();
          }
          if (details.reason === "error") {
            setError(details.message);
          }
          if (liveSessionWantedRef.current) {
            reconnectTimerRef.current = window.setTimeout(() => {
              reconnectTimerRef.current = null;
              if (liveSessionWantedRef.current) {
                void startElevenLabsSession({ preserveTurnState: true });
              }
            }, 1200);
          }
        },
        onStatusChange: ({ status }) => {
          if (runId !== sessionRunRef.current) return;
          setSessionStatus(status);
          if (status === "disconnected") {
            agentSessionReadyRef.current = false;
            if (!liveSessionWantedRef.current) {
              stopContinuousVad();
            }
          }
        },
        onModeChange: ({ mode: nextMode }) => {
          if (runId !== sessionRunRef.current) return;
          const previousMode = modeRef.current;
          setMode(nextMode);
          modeRef.current = nextMode;

          if (nextMode === "listening" && previousMode === "speaking") {
            agentReplyExpectedRef.current = false;
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
            return;
          }

          const pending = pendingTurnRef.current;
          if (!pending) {
            return;
          }

          agentReplyExpectedRef.current = false;
          const translatedText = text || partialAgentResponseRef.current;
          saveLiveTurn({
            ...pending,
            translated: translatedText,
            confidence: 0.95,
          });
          if (pending.speaker === "doctor") {
            doctorTurnCompletedRef.current = true;
            setDoctorTurnCompleted(true);
          }
          const nextSpeaker = nextSpeakerAfter(pending.speaker);
          pendingNextSpeakerRef.current = nextSpeaker;
          pendingTurnRef.current = null;
          partialAgentResponseRef.current = "";

          void speakLiveTranslation(translatedText, pending.translatedLang).finally(() => {
            if (runId !== sessionRunRef.current) return;
            advanceToNextSpeaker();
            setLiveDraft({
              phase: "listening",
              speaker: selectedRef.current,
              original: "",
              translation: "",
              confidence: 0,
              turn: null,
            });
          });
        },
        onAgentChatResponsePart: ({ text }) => {
          if (runId !== sessionRunRef.current) return;
          const pending = pendingTurnRef.current;
          if (!pending) {
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
          agentSessionReadyRef.current = false;
          setError(message);
          setSessionStatus("disconnected");
          toast({
            title: "ElevenLabs live session error",
            description: message,
            variant: "destructive",
          });
          if (liveSessionWantedRef.current) {
            reconnectTimerRef.current = window.setTimeout(() => {
              reconnectTimerRef.current = null;
              if (liveSessionWantedRef.current) {
                void startElevenLabsSession({ preserveTurnState: true });
              }
            }, 2000);
          }
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
      setLiveDraft({
        phase: "idle",
        speaker: selectedRef.current,
        original: "",
        translation: "",
        confidence: 0,
        turn: null,
      });
    }
  }, [
    advanceToNextSpeaker,
    applySpeakerMode,
    clearLiveCaption,
    clearReconnectTimer,
    ensureDoctorSpeaker,
    speakLiveTranslation,
    startContinuousVad,
    stopContinuousVad,
  ]);

  useEffect(() => {
    return () => {
      liveSessionWantedRef.current = false;
      clearReconnectTimer();
      stopContinuousVad();
      stopPlayback();
      sessionRunRef.current += 1;
      const conversation = conversationRef.current;
      conversationRef.current = null;
      void conversation?.endSession();
    };
  }, [clearReconnectTimer, stopContinuousVad, stopPlayback]);

  const beginLiveSession = useCallback(async () => {
    if (sessionStatus === "connecting") return;
    if (sessionStatus === "connected" && vadListening && agentSessionReadyRef.current) return;

    liveSessionWantedRef.current = true;
    setError("");

    try {
      if (!vadActiveRef.current) {
        await startContinuousVad();
      }
      if (!agentSessionReadyRef.current) {
        await startElevenLabsSession(
          doctorTurnCompletedRef.current ? { preserveTurnState: true } : undefined,
        );
      }
    } catch (err) {
      let message =
        err instanceof Error ? err.message : "Unable to start live interpreter session.";
      if (err instanceof DOMException && err.name === "NotAllowedError") {
        message = "Microphone permission was denied. Allow microphone access and try again.";
      }
      if (!agentSessionReadyRef.current) {
        liveSessionWantedRef.current = false;
        stopContinuousVad();
      }
      setError(message);
      setSessionStatus("disconnected");
      toast({
        title: "Live interpreter error",
        description: message,
        variant: "destructive",
      });
    }
  }, [sessionStatus, startContinuousVad, startElevenLabsSession, stopContinuousVad, vadListening]);

  const finishCurrentSpeakerTurn = useCallback(async () => {
    if (processingUtteranceRef.current || speakingTranslationRef.current || agentReplyExpectedRef.current) {
      return;
    }

    if (!agentSessionReadyRef.current || !conversationRef.current) {
      toast({
        title: "Interpreter is still connecting",
        description: "Wait until the live session is ready, then stop the speaker turn.",
      });
      return;
    }

    const speaker = selectedRef.current;
    if (speaker === "patient" && !doctorTurnCompletedRef.current) {
      toast({
        title: "Doctor speaks first",
        description: "Stop the doctor turn first so it can be translated for the patient.",
      });
      return;
    }

    vadSpeakingRef.current = false;
    vadSpeechStartRef.current = null;

    const submittedAudio = await finishSegmentRef.current?.();
    if (submittedAudio) return;

    if (processTranscriptText(speaker, liveInterimTextRef.current)) {
      return;
    }

    toast({
      title: `No ${speakerCopy[speaker].label.toLowerCase()} speech captured`,
      description: `Speak as the ${speakerCopy[speaker].label.toLowerCase()}, then press Stop ${speakerCopy[speaker].label.toLowerCase()}.`,
    });
  }, [processTranscriptText]);

  const handleReset = useCallback(() => {
    setDoctorTurnCompleted(false);
    doctorTurnCompletedRef.current = false;
    agentReplyExpectedRef.current = false;
    stopPlayback();
    stopContinuousVad();
    stopLiveSession();
    resetConversation();
  }, [stopContinuousVad, stopLiveSession, stopPlayback]);

  const switchSpeaker = useCallback((speaker: Speaker) => {
    if (speaker === "patient" && !doctorTurnCompletedRef.current) {
      toast({
        title: "Doctor speaks first",
        description: "The doctor must speak in English before the patient turn begins.",
      });
      return;
    }
    pendingNextSpeakerRef.current = null;
    playbackFinishedAwaitingFinalRef.current = false;
    activateSpeakerMode(speaker);
  }, [activateSpeakerMode]);

  const waitingForDoctor = sessionLive && !doctorTurnCompleted;

  const selectPatientLanguage = useCallback(
    (code: string) => {
      const nextLanguage = getLanguageByCode(code);
      if (nextLanguage.code === patientLanguageRef.current.code) return;

      setPatientLanguage(nextLanguage);
      patientLanguageRef.current = nextLanguage;
      ensureDoctorSpeaker();

      const live = sessionStatus === "connected" || sessionStatus === "connecting";
      if (live) {
        liveSessionWantedRef.current = true;
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
    [ensureDoctorSpeaker, sessionStatus, startElevenLabsSession],
  );

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

          <div className="flex flex-wrap items-center gap-3">
            <DoctorLanguageBadge />
            <PatientLanguageSelect
              value={patientLanguage}
              onChange={selectPatientLanguage}
            />
            <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:text-primary" onClick={handleReset}>
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
            <button type="button" onClick={beginLiveSession} className="ml-3 font-semibold underline">
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
              browserCaptioningSupported={browserCaptioningSupported}
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
          sessionLive={sessionLive}
          agentSpeaking={agentSpeaking}
          liveText={currentOriginal}
          selectedSpeaker={selectedSpeaker}
          patientLanguage={patientLanguage}
          onLanguageChange={selectPatientLanguage}
          switchSpeaker={switchSpeaker}
          onMicPress={beginLiveSession}
          onStopSpeakerTurn={finishCurrentSpeakerTurn}
          waitingForDoctor={waitingForDoctor}
          doctorTurnCompleted={doctorTurnCompleted}
          vadListening={vadListening}
          processingUtterance={processingUtterance}
          browserCaptioningSupported={browserCaptioningSupported}
          liveInterimText={liveInterimText}
        />
      </section>
    </div>
  );
};

function DoctorLanguageBadge({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={cn(
        "glass-pill flex items-center gap-2 rounded-lg px-4 py-2",
        compact ? "min-w-0 flex-shrink-0 px-3 py-1.5" : "min-w-[170px]",
      )}
    >
      <Stethoscope className="h-4 w-4 flex-shrink-0 text-primary" />
      <div className="min-w-0">
        {!compact && (
          <p className="text-[11px] font-medium leading-4 text-muted-foreground">Doctor language</p>
        )}
        <p className={cn("font-semibold text-foreground", compact ? "text-sm" : "text-sm")}>
          {DOCTOR_LANGUAGE.label}
        </p>
      </div>
    </div>
  );
}

function EmptyChat({
  sessionStatus,
  patientLanguage,
  onLanguageChange,
  browserCaptioningSupported,
}: {
  sessionStatus: Status;
  patientLanguage: FlowClearLanguage;
  onLanguageChange: (code: string) => void;
  browserCaptioningSupported: boolean;
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
                ? "Always listening — just speak."
                : "Choose your patient language."}
            </p>
            <p className="text-lg leading-8 text-muted-foreground">
              {sessionStatus === "connected"
                ? `Doctor speaks first in ${DOCTOR_LANGUAGE.label}. Press Stop doctor to translate and speak ${patientLanguage.label}, then press Stop patient to speak English back to the doctor.`
                : `Pick a language, tap the mic once, speak as the doctor, then press Stop doctor to speak ${patientLanguage.label}; after the patient replies, press Stop patient to speak English to the doctor.`}
            </p>
          </div>
          <DoctorLanguageBadge />
          <PatientLanguageSelect
            value={patientLanguage}
            onChange={onLanguageChange}
            prominent
          />
          {!browserCaptioningSupported && (
            <p className="max-w-xl text-sm leading-6 text-muted-foreground">
              Live captions are not available in this browser, but final transcription still runs after each pause.
            </p>
          )}
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
            <SelectValue placeholder="Select language" />
          </SelectTrigger>
          <SelectContent className="max-h-80">
            {PATIENT_LANGUAGES.map((language) => (
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
  sessionLive,
  agentSpeaking,
  liveText,
  selectedSpeaker,
  patientLanguage,
  onLanguageChange,
  switchSpeaker,
  onMicPress,
  onStopSpeakerTurn,
  waitingForDoctor,
  doctorTurnCompleted,
  vadListening,
  processingUtterance,
  browserCaptioningSupported,
  liveInterimText,
}: {
  active: boolean;
  mode: Mode;
  status: Status;
  sessionLive: boolean;
  agentSpeaking: boolean;
  liveText: string;
  selectedSpeaker: Speaker;
  patientLanguage: FlowClearLanguage;
  onLanguageChange: (code: string) => void;
  switchSpeaker: (speaker: Speaker) => void;
  onMicPress: () => void;
  onStopSpeakerTurn: () => void;
  waitingForDoctor: boolean;
  doctorTurnCompleted: boolean;
  vadListening: boolean;
  processingUtterance: boolean;
  browserCaptioningSupported: boolean;
  liveInterimText: string;
}) {
  const selected = speakerCopy[selectedSpeaker];
  const SelectedIcon = selected.icon;
  const disconnected = status === "disconnected";
  const micLive = sessionLive && vadListening;
  const stoppingDisabled = processingUtterance || agentSpeaking;
  const direction = languageDirection(selectedSpeaker, patientLanguage);
  const statusLabel = processingUtterance
    ? "Live · transcribing"
    : agentSpeaking
      ? waitingForDoctor
        ? "Live · translating to patient"
        : "Live · speaking translation"
      : micLive
        ? waitingForDoctor
          ? "Listening to doctor · stop to translate"
          : selectedSpeaker === "patient"
            ? "Listening to patient · stop to speak English"
            : "Listening to doctor · stop to translate"
        : sessionLive
          ? "Live · connecting mic…"
          : statusText[status] ?? "Ready to start";
  const captionText = liveInterimText || liveText;
  const inputLabel = processingUtterance
    ? "Transcribing what you said…"
    : agentSpeaking
      ? waitingForDoctor
        ? `Speaking to patient (${patientLanguage.label})…`
        : "Playing translation — mic stays live"
      : captionText || (
          disconnected
            ? `Tap mic once — speak, then press Stop ${selected.label.toLowerCase()}`
            : waitingForDoctor
              ? `Doctor speaks first (${DOCTOR_LANGUAGE.label}) — press Stop doctor to speak ${patientLanguage.label}`
              : micLive
                ? `Listening as ${selected.label} — press Stop ${selected.label.toLowerCase()} when they finish`
                : sessionLive
                  ? "Connecting continuous microphone…"
                  : `Connecting for ${selected.label}…`
        );
  const actionLabel = micLive
    ? `Stop ${selected.label.toLowerCase()}`
    : disconnected
      ? "Start live"
      : "Start live";
  const ActionIcon = micLive ? Square : Mic;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-7 z-30 px-5">
      <div className="pointer-events-auto mx-auto max-w-5xl">
        <div className="glass-strong flex min-h-[86px] flex-col gap-3 rounded-2xl px-5 py-3 md:flex-row md:items-center md:gap-4 md:px-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <DoctorLanguageBadge compact />
              <PatientLanguageSelect
                value={patientLanguage}
                onChange={onLanguageChange}
                compact
              />
            </div>
            <div className="inline-flex rounded-full bg-muted/60 p-1">
              {(["doctor", "patient"] as const).map((speaker) => {
                const copy = speakerCopy[speaker];
                const Icon = copy.icon;
                const activeSpeaker = selectedSpeaker === speaker;
                const locked = speaker === "patient" && !doctorTurnCompleted;
                return (
                  <button
                    key={speaker}
                    type="button"
                    onClick={() => switchSpeaker(speaker)}
                    disabled={locked}
                    className={cn(
                      "inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-semibold sm:text-sm",
                      activeSpeaker
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground",
                      locked && "cursor-not-allowed opacity-40",
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {copy.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-col gap-2 md:flex-row md:items-center">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <SelectedIcon className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                <span
                  className={cn(
                    "min-w-0 text-base text-muted-foreground",
                    captionText ? "line-clamp-2 whitespace-normal" : "truncate",
                  )}
                >
                  {inputLabel}
                </span>
              </div>
              <Waveform active={active && mode === "listening"} />
            </div>
          </div>

          <button
            type="button"
            onClick={micLive ? onStopSpeakerTurn : onMicPress}
            disabled={status === "connecting" || stoppingDisabled}
            className={cn(
              "flex h-16 flex-shrink-0 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold shadow-md ring-1 ring-primary/15",
              micLive
                ? "min-w-[10.5rem] bg-primary text-white ring-2 ring-primary/30"
                : "w-16 bg-card text-primary",
              (status === "connecting" || stoppingDisabled) && "cursor-not-allowed opacity-70",
              status === "connecting" && "animate-pulse",
            )}
            aria-label={micLive ? actionLabel : "Start live interpreter"}
          >
            <ActionIcon className={cn(micLive ? "h-4 w-4" : "h-8 w-8")} />
            {micLive && <span>{actionLabel}</span>}
          </button>
        </div>

        <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <span>{statusLabel}</span>
          <span>—</span>
          <span>{direction}</span>
          {micLive && (
            <>
              <span>—</span>
              <span className="font-medium text-primary">
                {browserCaptioningSupported ? "Live captions on" : "Final captions only"}
              </span>
            </>
          )}
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
