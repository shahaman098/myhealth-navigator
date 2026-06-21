import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function getElevenLabsApiKeys() {
  return [Deno.env.get("ELEVENLABS_API_KEY"), Deno.env.get("ELEVENLABS_API_KEY_FALLBACK")].filter(
    (key): key is string => Boolean(key),
  ).filter((key, index, keys) => keys.indexOf(key) === index);
}

async function fetchWithElevenLabsKeys(
  keys: string[],
  url: string | URL,
  init: RequestInit = {},
) {
  let lastResponse: Response | null = null;
  for (const apiKey of keys) {
    const headers = new Headers(init.headers ?? {});
    headers.set("xi-api-key", apiKey);
    const response = await fetch(url, { ...init, headers });
    if (response.ok || (response.status !== 401 && response.status !== 403)) {
      return response;
    }
    lastResponse = response;
  }
  if (lastResponse) return lastResponse;
  throw new Error("ElevenLabs request failed");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKeys = getElevenLabsApiKeys();
    const defaultAgentId = Deno.env.get("ELEVENLABS_AGENT_ID");
    const frenchAgentId = Deno.env.get("ELEVENLABS_AGENT_ID_FR");
    const body = await req.json().catch(() => ({}));
    const patientLanguageCode =
      typeof body?.patientLanguageCode === "string"
        ? body.patientLanguageCode.toLowerCase()
        : "";
    const agentId =
      patientLanguageCode === "fr" && frenchAgentId
        ? frenchAgentId
        : defaultAgentId;
    if (!apiKeys.length) throw new Error("ELEVENLABS_API_KEY is not configured");
    if (!defaultAgentId) throw new Error("ELEVENLABS_AGENT_ID is not configured");
    if (patientLanguageCode === "fr" && !frenchAgentId) {
      throw new Error(
        "French accent agent is not configured. Set ELEVENLABS_AGENT_ID_FR to a French voice agent ID.",
      );
    }

    const url = new URL(
      "https://api.elevenlabs.io/v1/convai/conversation/get-signed-url",
    );
    url.searchParams.set("agent_id", agentId);

    const response = await fetchWithElevenLabsKeys(apiKeys, url, {
      method: "GET",
    });

    if (!response.ok) {
      const detail = await response.text();
      return new Response(
        JSON.stringify({
          error: `ElevenLabs signed URL error (${response.status})`,
          detail,
        }),
        {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const data = await response.json();
    return new Response(JSON.stringify({ signedUrl: data.signed_url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("elevenlabs-signed-url error:", error);
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
