import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Languages, Stethoscope, User, Volume2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DEFAULT_PATIENT_LANGUAGE,
  DOCTOR_LANGUAGE,
  PATIENT_LANGUAGES,
  type FlowClearLanguage,
} from "@/data/languages";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { SpongeBobStage, type SpongeBobMode } from "@/components/SpongeBobStage";

async function translateText(
  text: string,
  sourceCode: string,
  targetCode: string,
): Promise<string> {
  if (sourceCode === targetCode) return text;
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
    text,
  )}&langpair=${encodeURIComponent(sourceCode)}|${encodeURIComponent(targetCode)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Translation failed (${res.status})`);
  const data = (await res.json()) as {
    responseData?: { translatedText?: string };
  };
  const out = data?.responseData?.translatedText?.trim();
  if (!out) throw new Error("Empty translation response");
  return out;
}

type KidsVoiceDirectory = {
  voice_id: string;
  name: string;
  category: string;
  preview_url: string | null;
  labels: Record<string, string>;
  samples: Array<{ sample_id: string; file_name: string; duration_secs?: number }>;
};

type KidsSpeaker = "doctor" | "patient";

type KidsTurn = {
  id: string;
  speaker: KidsSpeaker;
  original: string;
  translated: string;
  spokenTo: "doctor" | "patient";
};

const DOCTOR_GREETING =
  "Hi doctor! Pick the patient language — I'll translate both ways.";

const DOCTOR_PREFIX = "Patient says:";
const PATIENT_PREFIX = "Doctor says:";

const VAD_SPEECH_THRESHOLD = 0.045;
const VAD_SILENCE_MS = 1300;
const VAD_MIN_SPEECH_MS = 450;
const MIN_AUDIO_BYTES = 1200;

function stopPlayback(
  audioRef: { current: HTMLAudioElement | null },
  urlRef: { current: string | null },
) {
  if (audioRef.current) {
    try {
      audioRef.current.pause();
    } catch {
      /* noop */
    }
    audioRef.current.src = "";
    audioRef.current = null;
  }
  if (urlRef.current) {
    URL.revokeObjectURL(urlRef.current);
    urlRef.current = null;
  }
}

async function playKidsAudio(
  source: Blob | string,
  playbackRef: { current: HTMLAudioElement | null },
  urlRef: { current: string | null },
): Promise<void> {
  if (source instanceof Blob) {
    const contentType = source.type || "";
    if (contentType.includes("json") || (source.size < 256 && !contentType.startsWith("audio/"))) {
      const raw = await source.text();
      try {
        const detail = JSON.parse(raw) as { error?: string };
        throw new Error(detail.error || "Voice response was not audio");
      } catch (err) {
        if (err instanceof Error && err.message !== "Voice response was not audio") throw err;
        throw new Error("Voice response was not audio");
      }
    }
  }

  stopPlayback(playbackRef, urlRef);

  const url = typeof source === "string" ? source : URL.createObjectURL(source);
  const audio = new Audio(url);
  audio.volume = 1;
  audio.preload = "auto";
  playbackRef.current = audio;
  if (source instanceof Blob) {
    urlRef.current = url;
  }

  await new Promise<void>((resolve, reject) => {
    const fail = (message: string) => {
      stopPlayback(playbackRef, urlRef);
      reject(new Error(message));
    };
    audio.onended = () => resolve();
    audio.onerror = () => fail("Audio playback failed");
    audio.play().catch((err) => {
      fail(err instanceof Error ? err.message : "Audio playback was blocked");
    });
  });
}

function nextSpeaker(speaker: KidsSpeaker): KidsSpeaker {
  return speaker === "doctor" ? "patient" : "doctor";
}

const KidsMode = () => {
  const [languageCode, setLanguageCode] = useState(DEFAULT_PATIENT_LANGUAGE.code);
  const [activeSpeaker, setActiveSpeaker] = useState<KidsSpeaker>("doctor");
  const [lastTurnSpeaker, setLastTurnSpeaker] = useState<KidsSpeaker | null>(null);
  const [speaking, setSpeaking] = useState(false);
  const [speakingTo, setSpeakingTo] = useState<"doctor" | "patient" | null>(null);
  const [listening, setListening] = useState(false);
  const [busyTranslating, setBusyTranslating] = useState(false);
  const [heardText, setHeardText] = useState("");
  const [interimText, setInterimText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [turns, setTurns] = useState<KidsTurn[]>([]);
  const [audioLevel, setAudioLevel] = useState(0);
  const [voiceDirectory, setVoiceDirectory] = useState<KidsVoiceDirectory | null>(null);
  const [voiceDirectoryError, setVoiceDirectoryError] = useState("");
  const [voiceReady, setVoiceReady] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);

  const liveActiveRef = useRef(false);
  const processingRef = useRef(false);
  const speakingRef = useRef(false);
  const busyRef = useRef(false);
  const vadSpeakingRef = useRef(false);
  const vadSpeechStartRef = useRef<number | null>(null);
  const vadLastSpeechRef = useRef(0);
  const segmentRecorderRef = useRef<MediaRecorder | null>(null);
  const segmentChunksRef = useRef<Blob[]>([]);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const playbackRef = useRef<HTMLAudioElement | null>(null);
  const playbackUrlRef = useRef<string | null>(null);
  const rafRef = useRef<number | null>(null);
  const patientLanguageCodeRef = useRef(DEFAULT_PATIENT_LANGUAGE.code);
  const activeSpeakerRef = useRef<KidsSpeaker>("doctor");

  const patientLanguage = useMemo(
    () => PATIENT_LANGUAGES.find((language) => language.code === languageCode) ?? DEFAULT_PATIENT_LANGUAGE,
    [languageCode],
  );

  patientLanguageCodeRef.current = patientLanguage.code;
  activeSpeakerRef.current = activeSpeaker;
  speakingRef.current = speaking;
  busyRef.current = busyTranslating;

  const canRecord = typeof window !== "undefined" && "MediaRecorder" in window;

  useEffect(() => {
    document.title = "Kids Mode · MyHealth Navigator";
    void fetch("/api/kids-voice")
      .then(async (response) => {
        if (!response.ok) {
          const detail = await response.json().catch(() => ({}));
          throw new Error(detail?.error || `Voice lookup failed (${response.status})`);
        }
        return response.json() as Promise<KidsVoiceDirectory>;
      })
      .then((data) => {
        setVoiceDirectory(data);
        setVoiceDirectoryError("");
        setVoiceReady(true);
      })
      .catch((err) => {
        setVoiceDirectoryError(err instanceof Error ? err.message : "Could not load SpongeBob voice");
        setVoiceReady(false);
      });

    return () => {
      liveActiveRef.current = false;
      stopPlayback(playbackRef, playbackUrlRef);
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      try {
        segmentRecorderRef.current?.stop();
      } catch {
        /* noop */
      }
      audioCtxRef.current?.close().catch(() => undefined);
      audioStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const voiceLabel = useMemo(() => {
    const raw = voiceDirectory?.name?.trim();
    if (!raw) return "SpongeBob";
    if (raw.toLowerCase() === "spongebob") return "SpongeBob";
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  }, [voiceDirectory?.name]);

  const speak = useCallback(async (text: string, languageCodeForTts: string, audience: "doctor" | "patient") => {
    const trimmed = text.trim();
    if (!trimmed) return;

    stopPlayback(playbackRef, playbackUrlRef);
    setSpeaking(true);
    setSpeakingTo(audience);

    try {
      const response = await fetch("/api/kids-tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trimmed, language: languageCodeForTts }),
      });
      if (!response.ok) {
        const detail = await response.json().catch(() => ({}));
        throw new Error(detail?.error || `Kids voice failed (${response.status})`);
      }

      await playKidsAudio(await response.blob(), playbackRef, playbackUrlRef);
    } catch (err) {
      toast({
        title: "Voice playback failed",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      stopPlayback(playbackRef, playbackUrlRef);
      setSpeaking(false);
      setSpeakingTo(null);
    }
  }, []);

  const relayToPatient = useCallback(
    async (englishText: string) => {
      const patientCode = patientLanguageCodeRef.current;
      const [translated, prefix] = await Promise.all([
        patientCode === DOCTOR_LANGUAGE.code
          ? englishText
          : translateText(englishText, DOCTOR_LANGUAGE.code, patientCode),
        patientCode === DOCTOR_LANGUAGE.code
          ? PATIENT_PREFIX
          : translateText(PATIENT_PREFIX, DOCTOR_LANGUAGE.code, patientCode),
      ]);
      const spoken = `${prefix} ${translated}`;
      setTurns((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          speaker: "doctor",
          original: englishText,
          translated,
          spokenTo: "patient",
        },
      ]);
      await speak(spoken, patientCode, "patient");
    },
    [speak],
  );

  const relayToDoctor = useCallback(
    async (patientText: string, englishText: string) => {
      const spoken = `${DOCTOR_PREFIX} ${englishText}`;
      setTurns((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          speaker: "patient",
          original: patientText,
          translated: englishText,
          spokenTo: "doctor",
        },
      ]);
      await speak(spoken, DOCTOR_LANGUAGE.code, "doctor");
    },
    [speak],
  );

  const processAutoUtterance = useCallback(
    async (audio: Blob) => {
      const speaker = activeSpeakerRef.current;
      const patientCode = patientLanguageCodeRef.current;
      const sttLanguage = speaker === "doctor" ? DOCTOR_LANGUAGE.code : patientCode;

      setBusyTranslating(true);
      setInterimText("Processing…");
      try {
        const response = await fetch("/api/kids-stt", {
          method: "POST",
          headers: {
            "Content-Type": audio.type || "audio/webm",
            "x-language-code": sttLanguage,
          },
          body: audio,
        });
        if (!response.ok) {
          const detail = await response.json().catch(() => ({}));
          throw new Error(detail?.error || `Speech transcription failed (${response.status})`);
        }

        const data = (await response.json()) as { text?: string };
        const transcript = data.text?.trim() ?? "";
        if (!transcript) return;

        setHeardText(transcript);
        setInterimText("");
        setLastTurnSpeaker(speaker);

        if (speaker === "doctor") {
          const patientOut =
            patientCode === DOCTOR_LANGUAGE.code
              ? transcript
              : await translateText(transcript, DOCTOR_LANGUAGE.code, patientCode);
          setTranslatedText(patientOut);
          await relayToPatient(transcript);
        } else {
          const englishOut = await translateText(transcript, patientCode, DOCTOR_LANGUAGE.code);
          setTranslatedText(englishOut);
          await relayToDoctor(transcript, englishOut);
        }

        const upcoming = nextSpeaker(speaker);
        activeSpeakerRef.current = upcoming;
        setActiveSpeaker(upcoming);
      } catch (err) {
        setInterimText("");
        toast({
          title: "Translation failed",
          description: err instanceof Error ? err.message : "Please try again.",
          variant: "destructive",
        });
      } finally {
        setBusyTranslating(false);
      }
    },
    [relayToDoctor, relayToPatient],
  );

  const selectSpeaker = useCallback((speaker: KidsSpeaker) => {
    activeSpeakerRef.current = speaker;
    setActiveSpeaker(speaker);
  }, []);

  const stopContinuousListening = useCallback(() => {
    liveActiveRef.current = false;
    setListening(false);
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    try {
      segmentRecorderRef.current?.stop();
    } catch {
      /* noop */
    }
    segmentRecorderRef.current = null;
    segmentChunksRef.current = [];
    vadSpeakingRef.current = false;
    vadSpeechStartRef.current = null;
    audioCtxRef.current?.close().catch(() => undefined);
    audioCtxRef.current = null;
    analyserRef.current = null;
    audioStreamRef.current?.getTracks().forEach((t) => t.stop());
    audioStreamRef.current = null;
    setAudioLevel(0);
  }, []);

  const startContinuousListening = useCallback(async () => {
    if (!canRecord) {
      toast({
        title: "Microphone not supported",
        description: "Try Chrome or Edge for seamless translation.",
        variant: "destructive",
      });
      return;
    }

    if (typeof window !== "undefined" && !window.isSecureContext) {
      toast({
        title: "Insecure context",
        description: "Microphone needs HTTPS or http://localhost.",
        variant: "destructive",
      });
      return;
    }

    if (liveActiveRef.current) return;

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      toast({
        title: "Microphone blocked",
        description: err instanceof Error ? err.message : "Please allow microphone access.",
        variant: "destructive",
      });
      return;
    }

    audioStreamRef.current = stream;
    liveActiveRef.current = true;
    setListening(true);
    setHeardText("");
    setInterimText("");
    setTranslatedText("");

    const startSegmentRecorder = () => {
      if (!audioStreamRef.current || segmentRecorderRef.current || processingRef.current) return;
      segmentChunksRef.current = [];
      const recorder = new MediaRecorder(audioStreamRef.current);
      segmentRecorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) segmentChunksRef.current.push(event.data);
      };
      recorder.start();
    };

    const finishSegment = async () => {
      const recorder = segmentRecorderRef.current;
      if (!recorder || recorder.state === "inactive") return;

      await new Promise<void>((resolve) => {
        recorder.onstop = () => resolve();
        recorder.stop();
      });

      segmentRecorderRef.current = null;
      const audio = new Blob(segmentChunksRef.current, {
        type: segmentChunksRef.current[0]?.type || "audio/webm",
      });
      segmentChunksRef.current = [];

      if (audio.size < MIN_AUDIO_BYTES) return;

      processingRef.current = true;
      try {
        await processAutoUtterance(audio);
      } finally {
        processingRef.current = false;
      }
    };

    try {
      const AudioCtor =
        (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }).AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AudioCtor) {
        const ctx = new AudioCtor();
        audioCtxRef.current = ctx;
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 512;
        source.connect(analyser);
        analyserRef.current = analyser;

        const data = new Uint8Array(analyser.frequencyBinCount);
        const tick = () => {
          if (!liveActiveRef.current || !analyserRef.current) return;

          analyserRef.current.getByteTimeDomainData(data);
          let sum = 0;
          for (let i = 0; i < data.length; i++) {
            const v = (data[i] - 128) / 128;
            sum += v * v;
          }
          const rms = Math.sqrt(sum / data.length);
          setAudioLevel(Math.min(1, rms * 3));

          const paused = speakingRef.current || busyRef.current || processingRef.current;
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
      }
    } catch (err) {
      console.warn("[KidsMode] audio meter failed:", err);
    }
  }, [canRecord, processAutoUtterance]);

  const startSession = useCallback(async () => {
    if (!voiceReady || speaking || sessionStarted) return;
    setSessionStarted(true);
    setActiveSpeaker("doctor");
    activeSpeakerRef.current = "doctor";
    void startContinuousListening();
    await speak(DOCTOR_GREETING, DOCTOR_LANGUAGE.code, "doctor");
    activeSpeakerRef.current = "doctor";
    setActiveSpeaker("doctor");
  }, [sessionStarted, speak, startContinuousListening, speaking, voiceReady]);

  const handleVoiceButtonClick = useCallback(() => {
    if (!voiceReady || speaking || busyTranslating || sessionStarted) return;
    void startSession();
  }, [busyTranslating, sessionStarted, speaking, startSession, voiceReady]);

  const playVoiceSample = useCallback(async () => {
    if (!voiceDirectory?.preview_url || speaking || listening || busyTranslating) return;
    stopPlayback(playbackRef, playbackUrlRef);
    setSpeaking(true);
    setSpeakingTo("doctor");
    try {
      await playKidsAudio(voiceDirectory.preview_url, playbackRef, playbackUrlRef);
    } catch (err) {
      toast({
        title: "Voice sample failed",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      stopPlayback(playbackRef, playbackUrlRef);
      setSpeaking(false);
      setSpeakingTo(null);
    }
  }, [busyTranslating, listening, speaking, voiceDirectory?.preview_url]);

  const handleLanguageChange = useCallback((code: string) => {
    if (code === DOCTOR_LANGUAGE.code) return;
    setLanguageCode(code);
    setActiveSpeaker("doctor");
    activeSpeakerRef.current = "doctor";
  }, []);

  const endSession = useCallback(() => {
    stopContinuousListening();
    setSessionStarted(false);
    setActiveSpeaker("doctor");
    activeSpeakerRef.current = "doctor";
  }, [stopContinuousListening]);

  const statusLine = useMemo(() => {
    if (speaking) {
      return speakingTo === "doctor"
        ? `${voiceLabel} speaking to the doctor (${DOCTOR_LANGUAGE.label})…`
        : `${voiceLabel} speaking to the patient (${patientLanguage.label})…`;
    }
    if (busyTranslating) return "Translating…";
    if (listening) {
      return activeSpeaker === "doctor"
        ? audioLevel > 0.05
          ? `Doctor speaking (${DOCTOR_LANGUAGE.label}) — keep talking`
          : `Listening for the doctor (${DOCTOR_LANGUAGE.label})…`
        : audioLevel > 0.05
          ? `Patient speaking (${patientLanguage.label}) — keep talking`
          : `Listening for the patient (${patientLanguage.label})…`;
    }
    if (!sessionStarted) return `Tap ${voiceLabel} to start translation`;
    return "Ready";
  }, [activeSpeaker, audioLevel, busyTranslating, listening, patientLanguage.label, sessionStarted, speaking, speakingTo, voiceLabel]);

  const spongeBobMode = useMemo((): SpongeBobMode => {
    if (speaking) return "speaking";
    if (busyTranslating) return "translating";
    if (listening) return "listening";
    if (voiceReady && !sessionStarted) return "ready";
    return "idle";
  }, [busyTranslating, listening, sessionStarted, speaking, voiceReady]);

  return (
    <div className="kids-page">
      <section className="kids-layout">
        <div className="space-y-4">
          <Button asChild variant="glass" size="sm" className="rounded-full">
            <Link to="/live">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
          </Button>

          <SpongeBobStage
            mode={spongeBobMode}
            voiceLabel={voiceLabel}
            audioLevel={audioLevel}
            statusLine={statusLine}
            onStart={handleVoiceButtonClick}
            disabled={!voiceReady || speaking || busyTranslating || sessionStarted}
          />

          {!voiceReady && !voiceDirectoryError && (
            <p className="text-center text-xs text-muted-foreground lg:text-left">Loading SpongeBob voice…</p>
          )}
          {voiceDirectoryError && (
            <p className="text-center text-xs text-destructive lg:text-left">{voiceDirectoryError}</p>
          )}

          {voiceReady && voiceDirectory?.preview_url && !sessionStarted && (
            <div className="flex justify-center lg:justify-start">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-full"
                onClick={() => void playVoiceSample()}
                disabled={speaking || listening || busyTranslating}
              >
                <Volume2 className="h-4 w-4" />
                Hear {voiceLabel} clone sample
              </Button>
            </div>
          )}
        </div>

        <div className="kids-panel space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Translation room</h2>
              <p className="text-sm text-muted-foreground">
                Doctor ({DOCTOR_LANGUAGE.label}) ↔ patient ({patientLanguage.label})
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="glass-pill flex items-center gap-2 rounded-full px-4 py-2">
                <Stethoscope className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">{DOCTOR_LANGUAGE.label}</span>
              </div>
              <div className="glass-pill flex min-w-[210px] items-center gap-2 rounded-full px-4 py-2">
                <Languages className="h-4 w-4 text-primary" />
                <Select value={languageCode} onValueChange={handleLanguageChange}>
                  <SelectTrigger className="h-7 border-0 bg-transparent p-0 text-sm font-semibold text-foreground shadow-none focus:ring-0 focus:ring-offset-0">
                    <SelectValue aria-label={patientLanguage.label}>{patientLanguage.label}</SelectValue>
                  </SelectTrigger>
                  <SelectContent className="max-h-80">
                    {PATIENT_LANGUAGES.map((language: FlowClearLanguage) => (
                      <SelectItem key={language.code} value={language.code}>
                        {language.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {sessionStarted && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => selectSpeaker("doctor")}
                disabled={speaking || busyTranslating}
                className={cn(
                  "kids-speaker-pill",
                  activeSpeaker === "doctor" && "kids-speaker-pill--active",
                  (speaking || busyTranslating) && "cursor-not-allowed opacity-60",
                )}
              >
                <Stethoscope className="h-4 w-4" />
                Doctor
              </button>
              <button
                type="button"
                onClick={() => selectSpeaker("patient")}
                disabled={speaking || busyTranslating}
                className={cn(
                  "kids-speaker-pill",
                  activeSpeaker === "patient" && "kids-speaker-pill--active",
                  (speaking || busyTranslating) && "cursor-not-allowed opacity-60",
                )}
              >
                <User className="h-4 w-4" />
                Patient
              </button>
            </div>
          )}

          {(heardText || interimText || translatedText) && (
            <div className="kids-transcript-bubble space-y-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  Heard · {lastTurnSpeaker === "doctor" ? `Doctor (${DOCTOR_LANGUAGE.label})` : lastTurnSpeaker === "patient" ? `Patient (${patientLanguage.label})` : activeSpeaker === "doctor" ? `Doctor (${DOCTOR_LANGUAGE.label})` : "Patient"}
                </p>
                <p className="mt-1 text-sm text-foreground">
                  {heardText || <span className="italic text-muted-foreground">{interimText || "…"}</span>}
                </p>
              </div>
              {translatedText && (
                <div className="border-t border-primary/10 pt-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                    {lastTurnSpeaker === "doctor"
                      ? `SpongeBob → patient (${patientLanguage.label})`
                      : `SpongeBob → doctor (${DOCTOR_LANGUAGE.label})`}
                  </p>
                  <p className="mt-1 text-sm font-medium text-foreground">{translatedText}</p>
                </div>
              )}
            </div>
          )}

          {turns.length > 0 && (
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                Conversation
              </p>
              <div className="max-h-52 space-y-2 overflow-y-auto pr-1">
                {turns.map((turn) => (
                  <div key={turn.id} className="kids-transcript-bubble text-sm">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                      {turn.speaker === "doctor" ? "Doctor" : "Patient"} →{" "}
                      {turn.spokenTo === "doctor" ? "Doctor" : `Patient (${patientLanguage.label})`}
                    </p>
                    <p className="mt-1 text-foreground">{turn.original}</p>
                    {turn.translated !== turn.original && (
                      <p className="mt-1 text-muted-foreground">{turn.translated}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <p className="text-xs leading-5 text-muted-foreground">
              Turn-based relay · tap Doctor or Patient if the wrong person speaks next.
            </p>
            {sessionStarted && (
              <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={endSession}>
                End session
              </Button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default KidsMode;
