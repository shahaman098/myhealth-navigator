export const LIVE_VOICE_SETTINGS = {
  stability: 0.5,
  similarity_boost: 0.8,
  style: 0.12,
  use_speaker_boost: true,
  speed: 1.05,
};

export function normalizeLiveLanguageCode(language) {
  const raw = typeof language === "string" ? language.trim().toLowerCase() : "en";
  return raw.split("-")[0] || "en";
}

export function pickLiveTtsModel() {
  return "eleven_flash_v2_5";
}

export function buildLiveTtsPayload(text, language) {
  const languageCode = normalizeLiveLanguageCode(language);
  const payload = {
    text,
    model_id: pickLiveTtsModel(),
    voice_settings: LIVE_VOICE_SETTINGS,
  };

  if (languageCode !== "en") {
    payload.language_code = languageCode;
  }

  return payload;
}
