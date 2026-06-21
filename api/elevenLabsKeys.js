export function getElevenLabsApiKeys(primary, fallback) {
  return [primary, fallback].filter(Boolean).filter((key, index, keys) => keys.indexOf(key) === index);
}

export function getElevenLabsApiKeysFromEnv(env = process.env) {
  return getElevenLabsApiKeys(env.ELEVENLABS_API_KEY, env.ELEVENLABS_API_KEY_FALLBACK);
}

export function primaryElevenLabsApiKey(keys) {
  return keys[0] ?? "";
}

/** Retry ElevenLabs requests with the next key on auth failures (401/403). */
export async function fetchWithElevenLabsKeys(keys, url, init = {}) {
  if (!keys.length) {
    throw new Error("ELEVENLABS_API_KEY is not configured");
  }

  let lastResponse = null;
  let lastError = null;

  for (const apiKey of keys) {
    try {
      const headers = new Headers(init.headers ?? {});
      headers.set("xi-api-key", apiKey);
      const response = await fetch(url, { ...init, headers });
      if (response.ok || (response.status !== 401 && response.status !== 403)) {
        return { response, apiKey };
      }
      lastResponse = response;
    } catch (err) {
      lastError = err;
    }
  }

  if (lastResponse) {
    return { response: lastResponse, apiKey: keys[keys.length - 1] };
  }

  throw lastError instanceof Error ? lastError : new Error("ElevenLabs request failed");
}
