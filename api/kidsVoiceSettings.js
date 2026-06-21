/** Fast, natural SpongeBob clone — low drama, quick delivery. */
export const SPONGEBOB_VOICE_SETTINGS = {
  stability: 0.52,
  similarity_boost: 0.92,
  style: 0.18,
  use_speaker_boost: true,
  speed: 1.2,
};

export function normalizeKidsLanguageCode(language) {
  const raw = typeof language === "string" ? language.trim().toLowerCase() : "en";
  return raw.split("-")[0] || "en";
}

/** Flash v2.5 is ~4× faster than v3 and less theatrical. */
export function pickKidsTtsModel(_language) {
  return "eleven_flash_v2_5";
}

export function buildKidsTtsPayload(text, language) {
  const languageCode = normalizeKidsLanguageCode(language);
  const payload = {
    text,
    model_id: pickKidsTtsModel(languageCode),
    voice_settings: SPONGEBOB_VOICE_SETTINGS,
  };

  if (languageCode !== "en") {
    payload.language_code = languageCode;
  }

  return payload;
}

export async function getKidsVoiceSettings() {
  return SPONGEBOB_VOICE_SETTINGS;
}
