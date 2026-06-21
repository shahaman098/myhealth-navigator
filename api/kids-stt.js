import { fetchWithElevenLabsKeys, getElevenLabsApiKeysFromEnv } from "./elevenLabsKeys.js";

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
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    const audio = Buffer.concat(chunks);
    if (!audio.length) {
      return res.status(400).json({ error: "audio body is required" });
    }

    const contentType = req.headers["content-type"] || "audio/webm";
    const languageCode = req.headers["x-language-code"];
    const form = new FormData();
    form.append("model_id", "scribe_v2");
    if (typeof languageCode === "string" && languageCode.trim()) {
      form.append("language_code", languageCode.trim());
    }
    form.append("file", new Blob([audio], { type: contentType }), "kids-audio.webm");

    const { response: upstream } = await fetchWithElevenLabsKeys(
      apiKeys,
      "https://api.elevenlabs.io/v1/speech-to-text",
      {
        method: "POST",
        body: form,
      },
    );

    const data = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      return res.status(upstream.status).json({
        error: `ElevenLabs kids STT error (${upstream.status})`,
        detail: JSON.stringify(data).slice(0, 500),
      });
    }

    return res.status(200).json({
      text: typeof data.text === "string" ? data.text : "",
      language_code: data.language_code,
      language_probability: data.language_probability,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown ElevenLabs kids STT error";
    return res.status(500).json({ error: message });
  }
}
