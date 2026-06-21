import { buildLiveTtsPayload } from "./liveVoiceSettings.js";
import { fetchWithElevenLabsKeys, getElevenLabsApiKeysFromEnv } from "./elevenLabsKeys.js";
import { readJsonBody } from "./readJsonBody.js";

async function resolveAgentVoiceId(apiKeys, patientLanguageCode) {
  const agentId =
    patientLanguageCode === "fr" && process.env.ELEVENLABS_AGENT_ID_FR
      ? process.env.ELEVENLABS_AGENT_ID_FR
      : process.env.ELEVENLABS_AGENT_ID;

  if (!agentId) {
    throw new Error("ELEVENLABS_AGENT_ID is not configured");
  }

  const { response: upstream } = await fetchWithElevenLabsKeys(
    apiKeys,
    `https://api.elevenlabs.io/v1/convai/agents/${encodeURIComponent(agentId)}`,
  );

  if (!upstream.ok) {
    const detail = await upstream.text().catch(() => "");
    throw new Error(`Could not load agent voice (${upstream.status}): ${detail.slice(0, 200)}`);
  }

  const data = await upstream.json();
  const voiceId = data?.conversation_config?.tts?.voice_id;
  if (!voiceId) {
    throw new Error("Interpreter voice_id not found on ElevenLabs agent");
  }

  return voiceId;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const apiKeys = getElevenLabsApiKeysFromEnv();
  if (!apiKeys.length) {
    return res.status(500).json({ error: "ELEVENLABS_API_KEY is not configured" });
  }

  try {
    const body = await readJsonBody(req);
    const text = typeof body?.text === "string" ? body.text.trim() : "";
    const language = typeof body?.language === "string" ? body.language.trim() : "en";
    const patientLanguageCode =
      typeof body?.patientLanguageCode === "string"
        ? body.patientLanguageCode.trim().toLowerCase()
        : language;

    if (!text) {
      return res.status(400).json({ error: "text is required" });
    }

    const voiceId = await resolveAgentVoiceId(apiKeys, patientLanguageCode);

    const { response: upstream } = await fetchWithElevenLabsKeys(
      apiKeys,
      `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
        },
        body: JSON.stringify(buildLiveTtsPayload(text, language)),
      },
    );

    if (!upstream.ok) {
      const detail = await upstream.text().catch(() => "");
      return res.status(upstream.status).json({
        error: `ElevenLabs live TTS error (${upstream.status})`,
        detail: detail.slice(0, 500),
      });
    }

    const audio = Buffer.from(await upstream.arrayBuffer());
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).send(audio);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown ElevenLabs live TTS error";
    return res.status(500).json({ error: message });
  }
}
