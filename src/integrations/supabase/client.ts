// Minimal Supabase REST client used only to call edge functions.
// We do not need supabase-js here — keeps the bundle tiny.

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as
  | string
  | undefined;

export function isSupabaseConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

export function functionUrl(name: string): string {
  if (!SUPABASE_URL) throw new Error("VITE_SUPABASE_URL is not configured");
  return `${SUPABASE_URL}/functions/v1/${name}`;
}

export async function invokeFunction(
  name: string,
  body: unknown,
  init: { responseType?: "json" | "blob" | "arrayBuffer" } = {},
): Promise<unknown> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error("Supabase is not configured");
  }
  const resp = await fetch(functionUrl(name), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify(body ?? {}),
  });
  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(`Function ${name} failed: ${resp.status} ${text.slice(0, 200)}`);
  }
  switch (init.responseType) {
    case "blob":
      return resp.blob();
    case "arrayBuffer":
      return resp.arrayBuffer();
    default:
      return resp.json();
  }
}
