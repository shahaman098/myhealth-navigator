import { parseSampleRate, pcmToWav } from "./geminiAudio.js";
import { readJsonBody } from "./readJsonBody.js";

function languageDisplayName(code) {
  const base = code.split("-")[0].toLowerCase();
  if (!base || base === "en") return "";
  try {
    const name = new Intl.DisplayNames(["en"], { type: "language" }).of(base);
    return name && name.toLowerCase() !== base ? name : "";
  } catch {
    return "";
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "GEMINI_API_KEY is not configured" });
  }

  try {
    const body = await readJsonBody(req);
    const text = typeof body?.text === "string" ? body.text.trim() : "";
    const voice = typeof body?.voice === "string" && body.voice.trim() ? body.voice.trim() : "Kore";
    const language = typeof body?.language === "string" ? body.language.trim() : "";

    if (!text) {
      return res.status(400).json({ error: "text is required" });
    }

    // Gemini TTS follows natural-language style instructions; steer non-English
    // output toward native pronunciation instead of relying on auto-detection.
    const languageName = language ? languageDisplayName(language) : "";
    const prompt = languageName
      ? `Say the following in ${languageName} with native ${languageName} pronunciation: ${text}`
      : text;

    const url =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=" +
      encodeURIComponent(apiKey);

    const upstream = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voice },
            },
          },
        },
      }),
    });

    if (!upstream.ok) {
      const detail = await upstream.text().catch(() => "");
      return res.status(upstream.status).json({
        error: `Gemini TTS error (${upstream.status})`,
        detail: detail.slice(0, 500),
      });
    }

    const data = await upstream.json();
    const part = data?.candidates?.[0]?.content?.parts?.find(
      (p) => p?.inlineData,
    );
    const b64 = part?.inlineData?.data;
    const mime = part?.inlineData?.mimeType ?? "audio/L16;rate=24000";

    if (!b64) {
      return res.status(502).json({ error: "No audio in Gemini response" });
    }

    const pcm = Buffer.from(b64, "base64");
    const wav = pcmToWav(pcm, parseSampleRate(mime), 1, 16);
    res.setHeader("Content-Type", "audio/wav");
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).send(wav);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown Gemini TTS error";
    return res.status(500).json({ error: message });
  }
}
