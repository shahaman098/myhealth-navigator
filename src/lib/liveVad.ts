export const VAD_SPEECH_THRESHOLD = 0.055;
export const VAD_SILENCE_MS = 1300;
export const VAD_MIN_SPEECH_MS = 500;
export const MIN_AUDIO_BYTES = 1200;

const NOISE_TAG_PATTERN = /\[(?:background chattering|music|noise|silence|inaudible|laughter|applause)[^\]]*\]/gi;

export function sanitizeSttText(text: string): string {
  return text
    .replace(NOISE_TAG_PATTERN, " ")
    .replace(/\[[^\]]+\]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function isUsefulSttText(text: string): boolean {
  const cleaned = sanitizeSttText(text);
  if (!cleaned) return false;
  const letters = cleaned.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ]/g, "");
  return letters.length >= 2;
}

export async function transcribeAudioBlob(
  audio: Blob,
  languageCode: string,
): Promise<string> {
  const response = await fetch("/api/kids-stt", {
    method: "POST",
    headers: {
      "Content-Type": audio.type || "audio/webm",
      "x-language-code": languageCode,
    },
    body: audio,
  });
  if (!response.ok) {
    const detail = await response.json().catch(() => ({}));
    throw new Error(
      typeof detail?.error === "string"
        ? detail.error
        : `Speech transcription failed (${response.status})`,
    );
  }
  const data = (await response.json()) as { text?: string };
  return data.text?.trim() ?? "";
}
