import { fetchWithElevenLabsKeys, getElevenLabsApiKeysFromEnv } from "./elevenLabsKeys.js";
import { SPONGEBOB_VOICE_SETTINGS } from "./kidsVoiceSettings.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const apiKeys = getElevenLabsApiKeysFromEnv();
  const voiceId = process.env.ELEVENLABS_KIDS_VOICE_ID;

  if (!apiKeys.length) {
    return res.status(500).json({ error: "ELEVENLABS_API_KEY is not configured" });
  }
  if (!voiceId) {
    return res.status(500).json({ error: "ELEVENLABS_KIDS_VOICE_ID is not configured" });
  }

  try {
    const { response: upstream } = await fetchWithElevenLabsKeys(
      apiKeys,
      `https://api.elevenlabs.io/v1/voices/${encodeURIComponent(voiceId)}`,
    );

    const data = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      return res.status(upstream.status).json({
        error: `ElevenLabs voice lookup failed (${upstream.status})`,
        detail: JSON.stringify(data).slice(0, 500),
      });
    }

    return res.status(200).json({
      voice_id: data.voice_id,
      name: data.name,
      category: data.category,
      preview_url: data.preview_url ?? null,
      labels: data.labels ?? {},
      settings: SPONGEBOB_VOICE_SETTINGS,
      samples: Array.isArray(data.samples)
        ? data.samples.map((sample) => ({
            sample_id: sample.sample_id,
            file_name: sample.file_name,
            duration_secs: sample.duration_secs,
          }))
        : [],
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown ElevenLabs voice lookup error";
    return res.status(500).json({ error: message });
  }
}
