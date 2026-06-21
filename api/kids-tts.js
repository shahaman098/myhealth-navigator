import { buildKidsTtsPayload } from "./kidsVoiceSettings.js";
import { fetchWithElevenLabsKeys, getElevenLabsApiKeysFromEnv } from "./elevenLabsKeys.js";
import { readJsonBody } from "./readJsonBody.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
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
    const body = await readJsonBody(req);
    const text = typeof body?.text === "string" ? body.text.trim() : "";
    const language = typeof body?.language === "string" ? body.language.trim() : "en";

    if (!text) {
      return res.status(400).json({ error: "text is required" });
    }

    const { response: upstream } = await fetchWithElevenLabsKeys(
      apiKeys,
      `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
        },
        body: JSON.stringify(buildKidsTtsPayload(text, language)),
      },
    );

    if (!upstream.ok) {
      const detail = await upstream.text().catch(() => "");
      return res.status(upstream.status).json({
        error: `ElevenLabs kids TTS error (${upstream.status})`,
        detail: detail.slice(0, 500),
      });
    }

    const audio = Buffer.from(await upstream.arrayBuffer());
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).send(audio);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown ElevenLabs kids TTS error";
    return res.status(500).json({ error: message });
  }
}
