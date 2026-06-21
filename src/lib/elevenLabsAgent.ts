interface SignedUrlResponse {
  signedUrl?: string;
  error?: string;
}

export async function getElevenLabsSignedUrl(patientLanguageCode?: string): Promise<string> {
  const data = await postJson<SignedUrlResponse>("/api/elevenlabs-signed-url", {
    patientLanguageCode,
  });

  if (!data.signedUrl) {
    throw new Error(data.error || "No ElevenLabs signed URL returned");
  }

  return data.signedUrl;
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      typeof data?.error === "string"
        ? data.error
        : `Request failed with status ${response.status}`;
    throw new Error(message);
  }
  return data as T;
}
