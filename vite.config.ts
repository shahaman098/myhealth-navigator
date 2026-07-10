import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { buildKidsTtsPayload, SPONGEBOB_VOICE_SETTINGS } from "./api/kidsVoiceSettings.js";
import { buildLiveTtsPayload } from "./api/liveVoiceSettings.js";
import { fetchWithElevenLabsKeys, getElevenLabsApiKeys } from "./api/elevenLabsKeys.js";

// Dev-only plugin: keeps provider API keys on the dev server.
function localAiDevPlugin(keys: {
  gemini?: string;
  elevenLabsKeys?: string[];
  elevenLabsAgentId?: string;
  elevenLabsAgentIdFr?: string;
  elevenLabsKidsVoiceId?: string;
}): Plugin {
  return {
    name: "local-ai-dev",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use("/api/elevenlabs-signed-url", async (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.end("Method Not Allowed");
          return;
        }
        const body = await readJson(req).catch(() => ({}));
        const patientLanguageCode =
          typeof (body as { patientLanguageCode?: unknown }).patientLanguageCode === "string"
            ? (body as { patientLanguageCode: string }).patientLanguageCode.toLowerCase()
            : "";
        if (!keys.elevenLabsKeys?.length) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "ELEVENLABS_API_KEY is not set in .env" }));
          return;
        }
        if (!keys.elevenLabsAgentId) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "ELEVENLABS_AGENT_ID is not set in .env" }));
          return;
        }
        if (patientLanguageCode === "fr" && !keys.elevenLabsAgentIdFr) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(
            JSON.stringify({
              error: "French accent agent is not set in .env (ELEVENLABS_AGENT_ID_FR).",
            }),
          );
          return;
        }
        const agentId =
          patientLanguageCode === "fr" && keys.elevenLabsAgentIdFr
            ? keys.elevenLabsAgentIdFr
            : keys.elevenLabsAgentId;

        try {
          const url = new URL("https://api.elevenlabs.io/v1/convai/conversation/get-signed-url");
          url.searchParams.set("agent_id", agentId);
          const { response: upstream } = await fetchWithElevenLabsKeys(keys.elevenLabsKeys, url, {
            method: "GET",
          });

          if (!upstream.ok) {
            const errText = await upstream.text();
            console.error("[elevenlabs-signed-url] upstream", upstream.status, errText.slice(0, 400));
            res.statusCode = upstream.status;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({
              error: `ElevenLabs signed URL error (${upstream.status})`,
              detail: errText.slice(0, 500),
            }));
            return;
          }

          const data = await upstream.json();
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ signedUrl: data.signed_url }));
        } catch (err) {
          console.error("[elevenlabs-signed-url] error", err);
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({
            error: err instanceof Error ? err.message : "Unknown error",
          }));
        }
      });

      server.middlewares.use("/api/gemini-tts", async (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.end("Method Not Allowed");
          return;
        }
        if (!keys.gemini) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "GEMINI_API_KEY is not set in .env" }));
          return;
        }

        try {
          const body = await readJson(req);
          const rawBody = body as { text?: unknown; voice?: unknown; language?: unknown };
          const text = String(rawBody?.text ?? "").trim();
          const voice = String(rawBody?.voice ?? "Kore");
          const language = String(rawBody?.language ?? "").trim();
          if (!text) {
            res.statusCode = 400;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "text is required" }));
            return;
          }

          // Mirror api/gemini-tts.js: steer non-English output toward native pronunciation.
          const languageName = languageDisplayName(language);
          const prompt = languageName
            ? `Say the following in ${languageName} with native ${languageName} pronunciation: ${text}`
            : text;

          const url =
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=" +
            encodeURIComponent(keys.gemini);

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
            const errText = await upstream.text();
            console.error("[gemini-tts] upstream", upstream.status, errText.slice(0, 400));
            res.statusCode = upstream.status;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({
              error: `Gemini TTS error (${upstream.status})`,
              detail: errText.slice(0, 500),
            }));
            return;
          }

          const data = await upstream.json();
          const part = data?.candidates?.[0]?.content?.parts?.find(
            (p: { inlineData?: unknown }) => p.inlineData,
          );
          const b64: string | undefined = part?.inlineData?.data;
          const mime: string = part?.inlineData?.mimeType ?? "audio/L16;rate=24000";

          if (!b64) {
            res.statusCode = 502;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "No audio in Gemini response" }));
            return;
          }

          const pcm = Buffer.from(b64, "base64");
          const sampleRate = parseSampleRate(mime);
          const wav = pcmToWav(pcm, sampleRate, 1, 16);
          res.statusCode = 200;
          res.setHeader("Content-Type", "audio/wav");
          res.setHeader("Cache-Control", "no-store");
          res.end(wav);
        } catch (err) {
          console.error("[gemini-tts] error", err);
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({
            error: err instanceof Error ? err.message : "Unknown error",
          }));
        }
      });

      server.middlewares.use("/api/kids-voice", async (req, res) => {
        if (req.method !== "GET") {
          res.statusCode = 405;
          res.end("Method Not Allowed");
          return;
        }
        if (!keys.elevenLabsKeys?.length) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "ELEVENLABS_API_KEY is not set in .env" }));
          return;
        }
        if (!keys.elevenLabsKidsVoiceId) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "ELEVENLABS_KIDS_VOICE_ID is not set in .env" }));
          return;
        }

        try {
          const { response: upstream } = await fetchWithElevenLabsKeys(
            keys.elevenLabsKeys,
            `https://api.elevenlabs.io/v1/voices/${encodeURIComponent(keys.elevenLabsKidsVoiceId)}`,
          );
          const data = await upstream.json().catch(() => ({}));
          if (!upstream.ok) {
            res.statusCode = upstream.status;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({
              error: `ElevenLabs voice lookup failed (${upstream.status})`,
              detail: JSON.stringify(data).slice(0, 500),
            }));
            return;
          }

          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({
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
          }));
        } catch (err) {
          console.error("[kids-voice] error", err);
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({
            error: err instanceof Error ? err.message : "Unknown error",
          }));
        }
      });

      server.middlewares.use("/api/kids-tts", async (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.end("Method Not Allowed");
          return;
        }
        if (!keys.elevenLabsKeys?.length) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "ELEVENLABS_API_KEY is not set in .env" }));
          return;
        }
        if (!keys.elevenLabsKidsVoiceId) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "ELEVENLABS_KIDS_VOICE_ID is not set in .env" }));
          return;
        }

        try {
          const body = await readJson(req);
          const text = String(body?.text ?? "").trim();
          const language = String(body?.language ?? "en").trim() || "en";
          if (!text) {
            res.statusCode = 400;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "text is required" }));
            return;
          }

          const { response: upstream } = await fetchWithElevenLabsKeys(
            keys.elevenLabsKeys,
            `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(keys.elevenLabsKidsVoiceId)}?output_format=mp3_44100_128`,
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
            const errText = await upstream.text();
            res.statusCode = upstream.status;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({
              error: `ElevenLabs kids TTS error (${upstream.status})`,
              detail: errText.slice(0, 500),
            }));
            return;
          }

          const audio = Buffer.from(await upstream.arrayBuffer());
          res.statusCode = 200;
          res.setHeader("Content-Type", "audio/mpeg");
          res.setHeader("Cache-Control", "no-store");
          res.end(audio);
        } catch (err) {
          console.error("[kids-tts] error", err);
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({
            error: err instanceof Error ? err.message : "Unknown error",
          }));
        }
      });

      server.middlewares.use("/api/live-tts", async (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.end("Method Not Allowed");
          return;
        }
        if (!keys.elevenLabsKeys?.length) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "ELEVENLABS_API_KEY is not set in .env" }));
          return;
        }
        if (!keys.elevenLabsAgentId) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "ELEVENLABS_AGENT_ID is not set in .env" }));
          return;
        }

        try {
          const body = await readJson(req);
          const text = String(body?.text ?? "").trim();
          const language = String(body?.language ?? "en").trim() || "en";
          const patientLanguageCode = String(
            body?.patientLanguageCode ?? language,
          )
            .trim()
            .toLowerCase();
          if (!text) {
            res.statusCode = 400;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "text is required" }));
            return;
          }

          const agentId =
            patientLanguageCode === "fr" && keys.elevenLabsAgentIdFr
              ? keys.elevenLabsAgentIdFr
              : keys.elevenLabsAgentId;
          const { response: agentResponse } = await fetchWithElevenLabsKeys(
            keys.elevenLabsKeys,
            `https://api.elevenlabs.io/v1/convai/agents/${encodeURIComponent(agentId)}`,
          );
          if (!agentResponse.ok) {
            const errText = await agentResponse.text().catch(() => "");
            res.statusCode = agentResponse.status;
            res.setHeader("Content-Type", "application/json");
            res.end(
              JSON.stringify({
                error: `Could not load agent voice (${agentResponse.status})`,
                detail: errText.slice(0, 500),
              }),
            );
            return;
          }
          const agentData = await agentResponse.json();
          const voiceId = agentData?.conversation_config?.tts?.voice_id;
          if (!voiceId) {
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "Interpreter voice_id not found on agent" }));
            return;
          }

          const { response: upstream } = await fetchWithElevenLabsKeys(
            keys.elevenLabsKeys,
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
            const errText = await upstream.text().catch(() => "");
            res.statusCode = upstream.status;
            res.setHeader("Content-Type", "application/json");
            res.end(
              JSON.stringify({
                error: `ElevenLabs live TTS error (${upstream.status})`,
                detail: errText.slice(0, 500),
              }),
            );
            return;
          }

          const audio = Buffer.from(await upstream.arrayBuffer());
          res.statusCode = 200;
          res.setHeader("Content-Type", "audio/mpeg");
          res.setHeader("Cache-Control", "no-store");
          res.end(audio);
        } catch (err) {
          console.error("[live-tts] error", err);
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({
            error: err instanceof Error ? err.message : "Unknown error",
          }));
        }
      });

      server.middlewares.use("/api/kids-stt", async (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.end("Method Not Allowed");
          return;
        }
        if (!keys.elevenLabsKeys?.length) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "ELEVENLABS_API_KEY is not set in .env" }));
          return;
        }

        try {
          const audio = await readRawBody(req);
          if (!audio.length) {
            res.statusCode = 400;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "audio body is required" }));
            return;
          }

          const form = new FormData();
          form.append("model_id", "scribe_v2");
          const languageCode = req.headers["x-language-code"];
          if (typeof languageCode === "string" && languageCode.trim()) {
            form.append("language_code", languageCode.trim());
          }
          form.append(
            "file",
            new Blob([audio], { type: req.headers["content-type"] || "audio/webm" }),
            "kids-audio.webm",
          );

          const { response: upstream } = await fetchWithElevenLabsKeys(
            keys.elevenLabsKeys,
            "https://api.elevenlabs.io/v1/speech-to-text",
            {
              method: "POST",
              body: form,
            },
          );

          const data = await upstream.json().catch(() => ({}));
          if (!upstream.ok) {
            res.statusCode = upstream.status;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({
              error: `ElevenLabs kids STT error (${upstream.status})`,
              detail: JSON.stringify(data).slice(0, 500),
            }));
            return;
          }

          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({
            text: typeof data.text === "string" ? data.text : "",
            language_code: data.language_code,
            language_probability: data.language_probability,
          }));
        } catch (err) {
          console.error("[kids-stt] error", err);
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({
            error: err instanceof Error ? err.message : "Unknown error",
          }));
        }
      });

    },
  };
}

function readJson(req: import("http").IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.setEncoding("utf8");
    req.on("data", (c) => (raw += c));
    req.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on("error", reject);
  });
}

function readRawBody(req: import("http").IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

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
  const pieces = mime.split(";");
  for (const piece of pieces) {
    const [rawKey, rawValue] = piece.split("=");
    if (rawKey?.trim().toLowerCase() === "rate") {
      const parsed = Number.parseInt(rawValue?.trim() ?? "", 10);
      return Number.isFinite(parsed) ? parsed : 24000;
    }
  }
  return 24000;
}

function pcmToWav(pcm: Buffer, sampleRate: number, channels: number, bps: number): Buffer {
  const blockAlign = (channels * bps) / 8;
  const byteRate = sampleRate * blockAlign;
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bps, 34);
  header.write("data", 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    server: {
      host: "::",
      port: 8090,
    },
    plugins: [
      react(),
      localAiDevPlugin({
        gemini: env.GEMINI_API_KEY,
        elevenLabsKeys: getElevenLabsApiKeys(
          env.ELEVENLABS_API_KEY,
          env.ELEVENLABS_API_KEY_FALLBACK,
        ),
        elevenLabsAgentId: env.ELEVENLABS_AGENT_ID,
        elevenLabsAgentIdFr: env.ELEVENLABS_AGENT_ID_FR,
        elevenLabsKidsVoiceId: env.ELEVENLABS_KIDS_VOICE_ID,
      }),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        // Ensure ElevenLabs registers the browser voice session strategy (mic/WebSocket setup).
        "@elevenlabs/client": path.resolve(
          __dirname,
          "node_modules/@elevenlabs/client/dist/platform/web/index.js",
        ),
      },
    },
  };
});
