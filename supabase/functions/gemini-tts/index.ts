// supabase/functions/gemini-tts/index.ts
//
// FlowClear Live — Gemini TTS bridge.
// POST { text: string, voice?: string, language?: string }
// → audio/wav (16-bit PCM 24 kHz, mono)
//
// Uses Google Gemini 2.5 Flash Preview TTS, server-side only.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const DEFAULT_VOICE = "Kore"; // warm, neutral; works for EN & PA

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    const body = await req.json().catch(() => ({}));
    const text: string = (body?.text ?? "").toString().trim();
    const voice: string = (body?.voice ?? DEFAULT_VOICE).toString();
    const language: string = (body?.language ?? "").toString().trim();
    if (!text) throw new Error("text is required");

    // Gemini TTS follows natural-language style instructions; steer non-English
    // output toward native pronunciation instead of relying on auto-detection.
    const languageName = languageDisplayName(language);
    const prompt = languageName
      ? `Say the following in ${languageName} with native ${languageName} pronunciation: ${text}`
      : text;

    // Gemini 2.5 Flash Preview TTS
    const url =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=" +
      encodeURIComponent(GEMINI_API_KEY);

    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice },
          },
        },
      },
    };

    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error("Gemini TTS error:", resp.status, errText);
      return new Response(
        JSON.stringify({
          error: `Gemini TTS error (${resp.status})`,
          detail: errText.slice(0, 500),
        }),
        {
          status: resp.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const data = await resp.json();
    const part = data?.candidates?.[0]?.content?.parts?.find(
      (p: { inlineData?: unknown }) => p.inlineData,
    );
    const inline = part?.inlineData;
    const b64: string | undefined = inline?.data;
    const mime: string = inline?.mimeType ?? "audio/L16;rate=24000";

    if (!b64) {
      console.error("Gemini TTS response missing audio:", JSON.stringify(data).slice(0, 500));
      return new Response(
        JSON.stringify({ error: "No audio returned from Gemini" }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Decode base64 → raw PCM bytes
    const pcmBytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const sampleRate = parseSampleRate(mime);
    const wav = pcmToWav(pcmBytes, sampleRate, 1, 16);

    return new Response(wav, {
      headers: {
        ...corsHeaders,
        "Content-Type": "audio/wav",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("gemini-tts error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});

function languageDisplayName(code: string): string {
  const base = code.split("-")[0].toLowerCase();
  if (!base || base === "en") return "";
  try {
    const name = new Intl.DisplayNames(["en"], { type: "language" }).of(base);
    return name && name.toLowerCase() !== base ? name : "";
  } catch {
    return "";
  }
}

function parseSampleRate(mime: string): number {
  // Examples: "audio/L16;codec=pcm;rate=24000"
  const m = /rate=(\d+)/i.exec(mime);
  return m ? parseInt(m[1], 10) : 24000;
}

// Wrap raw 16-bit signed little-endian PCM in a minimal WAV (RIFF) container.
function pcmToWav(
  pcm: Uint8Array,
  sampleRate: number,
  channels: number,
  bitsPerSample: number,
): Uint8Array {
  const blockAlign = (channels * bitsPerSample) / 8;
  const byteRate = sampleRate * blockAlign;
  const dataSize = pcm.byteLength;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  // RIFF header
  writeStr(view, 0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeStr(view, 8, "WAVE");
  // fmt sub-chunk
  writeStr(view, 12, "fmt ");
  view.setUint32(16, 16, true);          // subchunk1 size
  view.setUint16(20, 1, true);           // PCM format
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  // data sub-chunk
  writeStr(view, 36, "data");
  view.setUint32(40, dataSize, true);
  new Uint8Array(buffer, 44).set(pcm);

  return new Uint8Array(buffer);
}

function writeStr(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}
