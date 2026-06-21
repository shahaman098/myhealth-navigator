// ─────────────────────────────────────────────────────────────
// FlowClear Live — conversation state store.
// Vanilla pub/sub + useSyncExternalStore.
// ─────────────────────────────────────────────────────────────

import { useSyncExternalStore } from "react";
import {
  CONVERSATION_SUMMARY,
  KEY_CONCERNS,
  NEXT_STEPS,
  SAMPLE_TURNS,
  Speaker,
  Turn,
  bcp47,
} from "@/data/conversationData";
import { invokeFunction, isSupabaseConfigured } from "@/integrations/supabase/client";

export type AIPhase = "idle" | "listening" | "transcribing" | "translating" | "speaking";

export type ApprovalStatus = "pending" | "approved" | "rejected";

export interface SavedTurn extends Turn {
  savedAt: string;        // ISO
  approval: ApprovalStatus;
}

export interface AuditEvent {
  id: string;
  at: string;
  message: string;
  tone: "neutral" | "green" | "amber" | "red";
}

export interface ReviewItem {
  id: string;
  text: string;
  status: ApprovalStatus;
  edited?: boolean;
}

export interface ConversationState {
  // live transient state
  phase: AIPhase;
  currentSpeaker: Speaker | null;
  currentOriginal: string;
  currentTranslation: string;
  currentTurn: Turn | null;
  currentConfidence: number;

  // queue of pre-loaded sample turns
  remainingDoctorTurns: Turn[];
  remainingPatientTurns: Turn[];

  // persisted
  transcript: SavedTurn[];
  summary: string | null;
  concerns: ReviewItem[];
  nextSteps: ReviewItem[];
  summaryApproval: ApprovalStatus;
  transcriptApproval: ApprovalStatus;

  audit: AuditEvent[];
}

const doctorTurns = SAMPLE_TURNS.filter((t) => t.speaker === "doctor");
const patientTurns = SAMPLE_TURNS.filter((t) => t.speaker === "patient");

const initialState: ConversationState = {
  phase: "idle",
  currentSpeaker: null,
  currentOriginal: "",
  currentTranslation: "",
  currentTurn: null,
  currentConfidence: 0,
  remainingDoctorTurns: [...doctorTurns],
  remainingPatientTurns: [...patientTurns],
  transcript: [],
  summary: null,
  concerns: [],
  nextSteps: [],
  summaryApproval: "pending",
  transcriptApproval: "pending",
  audit: [
    {
      id: crypto.randomUUID(),
      at: new Date().toISOString(),
      message: "Conversation room opened · synthetic demo data",
      tone: "neutral",
    },
  ],
};

let state: ConversationState = initialState;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function update(
  partial:
    | Partial<ConversationState>
    | ((s: ConversationState) => Partial<ConversationState>),
) {
  const next = typeof partial === "function" ? partial(state) : partial;
  state = { ...state, ...next };
  emit();
}

function uid() {
  return crypto.randomUUID();
}
function nowIso() {
  return new Date().toISOString();
}

// ── hook ──────────────────────────────────────────────────────────

export function useConversation<T>(selector: (s: ConversationState) => T): T {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => selector(state),
    () => selector(initialState),
  );
}

export function getConversationState() {
  return state;
}

// ── audit ────────────────────────────────────────────────────────

export function logAudit(message: string, tone: AuditEvent["tone"] = "neutral") {
  update((s) => ({
    audit: [{ id: uid(), at: nowIso(), message, tone }, ...s.audit],
  }));
}

// ── live conversation flow ────────────────────────────────────────

function delay(ms: number) {
  return new Promise<void>((res) => setTimeout(res, ms));
}

export async function startTurn(speaker: Speaker) {
  // pull next turn from the right queue
  const queueKey =
    speaker === "doctor" ? "remainingDoctorTurns" : "remainingPatientTurns";
  const queue = state[queueKey];
  if (queue.length === 0) {
    logAudit(
      `No more sample ${speaker === "doctor" ? "doctor" : "patient"} turns. Reset to replay.`,
      "amber",
    );
    return;
  }
  const [turn, ...rest] = queue;

  // 1. listening
  update({
    phase: "listening",
    currentSpeaker: speaker,
    currentOriginal: "",
    currentTranslation: "",
    currentTurn: turn,
    currentConfidence: 0,
  });
  logAudit(
    speaker === "doctor"
      ? "Doctor speaks · AI listening"
      : "Patient speaks · AI listening",
    "neutral",
  );
  await delay(700);

  // 2. transcribing — stream original text
  update({ phase: "transcribing" });
  await streamText(turn.original, (text) => update({ currentOriginal: text }));
  logAudit(
    speaker === "doctor"
      ? "Doctor speech transcribed (detected language)"
      : "Patient speech transcribed (detected language)",
    "neutral",
  );

  // 3. translating — stream translation
  await delay(300);
  update({ phase: "translating" });
  await streamText(turn.translated, (text) =>
    update({ currentTranslation: text }),
  );
  update({ currentConfidence: turn.confidence });
  logAudit(
    speaker === "doctor"
      ? "Clinician speech translated for patient"
      : "Patient speech translated for clinician",
    "neutral",
  );

  // 4. save turn into transcript
  update((s) => ({
    [queueKey]: rest,
    transcript: [
      ...s.transcript,
      { ...turn, savedAt: nowIso(), approval: "pending" },
    ],
    phase: "idle",
  } as Partial<ConversationState>));
  logAudit("Bilingual turn saved to transcript", "green");
}

// Speaks the current translation aloud via the browser, if available.
export async function speakCurrentTranslation() {
  const turn = state.currentTurn;
  if (!turn) return;
  const lang = bcp47(turn.translatedLang);
  update({ phase: "speaking" });
  logAudit(
    turn.translatedLang === "en"
      ? "English translation spoken aloud"
      : "Detected-language translation spoken aloud",
    "neutral",
  );
  try {
    await speakText(turn.translated, lang);
  } catch {
    /* graceful no-op */
  } finally {
    update({ phase: "idle" });
  }
}

export function resetConversation() {
  state = {
    ...initialState,
    audit: [
      {
        id: uid(),
        at: nowIso(),
        message: "Conversation reset",
        tone: "neutral",
      },
      ...state.audit,
    ],
    remainingDoctorTurns: [...doctorTurns],
    remainingPatientTurns: [...patientTurns],
  };
  emit();
}

export function saveLiveTurn(turn: Turn) {
  update((s) => ({
    transcript: [
      ...s.transcript,
      { ...turn, savedAt: nowIso(), approval: "pending" },
    ],
    currentSpeaker: turn.speaker,
    currentOriginal: turn.original,
    currentTranslation: turn.translated,
    currentTurn: turn,
    currentConfidence: turn.confidence,
    phase: "idle",
  }));
  logAudit(
    turn.speaker === "doctor"
      ? "Real doctor audio transcribed and translated"
      : "Real patient audio transcribed and translated",
    "green",
  );
}

export function setLiveDraft(partial: {
  phase?: AIPhase;
  speaker?: Speaker | null;
  original?: string;
  translation?: string;
  confidence?: number;
  turn?: Turn | null;
}) {
  update({
    phase: partial.phase ?? state.phase,
    currentSpeaker:
      partial.speaker === undefined ? state.currentSpeaker : partial.speaker,
    currentOriginal:
      partial.original === undefined ? state.currentOriginal : partial.original,
    currentTranslation:
      partial.translation === undefined
        ? state.currentTranslation
        : partial.translation,
    currentConfidence:
      partial.confidence === undefined
        ? state.currentConfidence
        : partial.confidence,
    currentTurn: partial.turn === undefined ? state.currentTurn : partial.turn,
  });
}

// ── summary / concerns / next steps ───────────────────────────────

export function generateSummary() {
  update({
    summary: CONVERSATION_SUMMARY,
    concerns: KEY_CONCERNS.map((text) => ({
      id: uid(),
      text,
      status: "pending" as ApprovalStatus,
    })),
    nextSteps: NEXT_STEPS.map((text) => ({
      id: uid(),
      text,
      status: "pending" as ApprovalStatus,
    })),
  });
  logAudit("Conversation summary generated · requires clinician review", "amber");
}

export function setReviewStatus(
  bucket: "concerns" | "nextSteps",
  id: string,
  status: ApprovalStatus,
) {
  update((s) => ({
    [bucket]: s[bucket].map((item) =>
      item.id === id ? { ...item, status } : item,
    ),
  } as Partial<ConversationState>));
  const list = bucket === "concerns" ? "key concern" : "next step";
  logAudit(
    `Clinician ${status} ${list}`,
    status === "approved" ? "green" : status === "rejected" ? "red" : "amber",
  );
}

export function editReviewItem(
  bucket: "concerns" | "nextSteps",
  id: string,
  text: string,
) {
  update((s) => ({
    [bucket]: s[bucket].map((item) =>
      item.id === id ? { ...item, text, edited: true, status: "pending" } : item,
    ),
  } as Partial<ConversationState>));
  logAudit(`Clinician edited a ${bucket === "concerns" ? "concern" : "next step"}`, "amber");
}

export function setSummaryApproval(status: ApprovalStatus) {
  update({ summaryApproval: status });
  logAudit(
    `Clinician ${status} conversation summary`,
    status === "approved" ? "green" : status === "rejected" ? "red" : "amber",
  );
}

export function setTranscriptApproval(status: ApprovalStatus) {
  update((s) => ({
    transcriptApproval: status,
    transcript: s.transcript.map((t) => ({ ...t, approval: status })),
  }));
  logAudit(
    `Clinician ${status} the bilingual transcript`,
    status === "approved" ? "green" : status === "rejected" ? "red" : "amber",
  );
}

export function setTurnApproval(turnId: string, approval: ApprovalStatus) {
  update((s) => ({
    transcript: s.transcript.map((t) =>
      t.id === turnId ? { ...t, approval } : t,
    ),
  }));
  logAudit(
    `Clinician ${approval} a bilingual turn`,
    approval === "approved" ? "green" : approval === "rejected" ? "red" : "amber",
  );
}

// ── helpers ───────────────────────────────────────────────────────

async function streamText(full: string, onChunk: (current: string) => void) {
  // Stream by characters in chunks to feel “live”.
  const total = full.length;
  const chunkSize = Math.max(2, Math.round(total / 60));
  const intervalMs = 18;
  let i = 0;
  while (i < total) {
    i = Math.min(total, i + chunkSize);
    onChunk(full.slice(0, i));
    await delay(intervalMs);
  }
}

function speakText(text: string, lang: string): Promise<void> {
  void lang;
  return speakWithGemini(text);
}

let currentAudio: HTMLAudioElement | null = null;
let currentObjectUrl: string | null = null;

async function speakWithGemini(text: string): Promise<void> {
  if (typeof window === "undefined") {
    throw new Error("No window");
  }

  let blob: Blob;
  if (import.meta.env.DEV) {
    // Dev: use Vite middleware → API key never reaches the browser bundle.
    const resp = await fetch("/api/gemini-tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!resp.ok) {
      const t = await resp.text().catch(() => "");
      throw new Error(`gemini-tts ${resp.status} ${t.slice(0, 200)}`);
    }
    blob = await resp.blob();
  } else {
    if (!isSupabaseConfigured()) throw new Error("Supabase not configured");
    blob = (await invokeFunction(
      "gemini-tts",
      { text },
      { responseType: "blob" },
    )) as Blob;
  }

  // Clean up any prior audio first.
  stopCurrentAudio();

  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  audio.preload = "auto";
  currentAudio = audio;
  currentObjectUrl = url;

  return new Promise<void>((resolve) => {
    const done = () => {
      stopCurrentAudio();
      resolve();
    };
    audio.onended = done;
    audio.onerror = () => done();
    audio.play().catch((err) => {
      console.warn("[FlowClear] audio.play() failed:", err);
      done();
    });
  });
}

function stopCurrentAudio() {
  if (currentAudio) {
    try { currentAudio.pause(); } catch { /* ignore */ }
    currentAudio.src = "";
    currentAudio = null;
  }
  if (currentObjectUrl) {
    try { URL.revokeObjectURL(currentObjectUrl); } catch { /* ignore */ }
    currentObjectUrl = null;
  }
}

export function isSpeechSynthesisSupported() {
  return import.meta.env.DEV || isSupabaseConfigured();
}

export function isSpeechRecognitionSupported() {
  if (typeof window === "undefined") return false;
  const w = window as Window & {
    SpeechRecognition?: unknown;
    webkitSpeechRecognition?: unknown;
  };
  return !!(w.SpeechRecognition || w.webkitSpeechRecognition);
}
