import { fetchWithElevenLabsKeys, getElevenLabsApiKeysFromEnv } from "./elevenLabsKeys.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const apiKeys = getElevenLabsApiKeysFromEnv();
  const defaultAgentId = process.env.ELEVENLABS_AGENT_ID;
  const frenchAgentId = process.env.ELEVENLABS_AGENT_ID_FR;
  const patientLanguageCode =
    typeof req.body?.patientLanguageCode === "string"
      ? req.body.patientLanguageCode.toLowerCase()
      : "";
  const agentId =
    patientLanguageCode === "fr" && frenchAgentId
      ? frenchAgentId
      : defaultAgentId;

  if (!apiKeys.length) {
    return res.status(500).json({ error: "ELEVENLABS_API_KEY is not configured" });
  }
  if (!defaultAgentId) {
    return res.status(500).json({ error: "ELEVENLABS_AGENT_ID is not configured" });
  }
  if (patientLanguageCode === "fr" && !frenchAgentId) {
    return res.status(500).json({
      error:
        "French accent agent is not configured. Set ELEVENLABS_AGENT_ID_FR to a French voice agent ID.",
    });
  }

  try {
    const url = new URL("https://api.elevenlabs.io/v1/convai/conversation/get-signed-url");
    url.searchParams.set("agent_id", agentId);

    const { response: upstream } = await fetchWithElevenLabsKeys(apiKeys, url, {
      method: "GET",
    });

    if (!upstream.ok) {
      const detail = await upstream.text().catch(() => "");
      return res.status(upstream.status).json({
        error: `ElevenLabs signed URL error (${upstream.status})`,
        detail: detail.slice(0, 500),
      });
    }

    const data = await upstream.json();
    return res.status(200).json({ signedUrl: data.signed_url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown ElevenLabs error";
    return res.status(500).json({ error: message });
  }
}
