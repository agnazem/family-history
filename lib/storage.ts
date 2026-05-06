import type { SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_STORAGE_RE = /\/storage\/v1\/object\/(?:public|sign|authenticated)\/([^/?]+)\/(.+)/;

/**
 * Parse a storage_url field into bucket + path.
 *
 * Accepts two formats:
 *   - New: "audio/family-id/file.webm"  (bucket is the first path segment)
 *   - Legacy: full Supabase public URL   (extracted via regex)
 */
export function parseStoragePath(storageUrl: string): { bucket: string; path: string } | null {
  if (!storageUrl) return null;
  if (storageUrl.startsWith("http")) {
    const match = storageUrl.match(SUPABASE_STORAGE_RE);
    if (!match) return null;
    return { bucket: match[1], path: match[2].split("?")[0] };
  }
  const slash = storageUrl.indexOf("/");
  if (slash < 1) return null;
  return { bucket: storageUrl.slice(0, slash), path: storageUrl.slice(slash + 1) };
}

/** Build the new storage_url format: "bucket/path" */
export function buildStoragePath(bucket: string, path: string): string {
  return `${bucket}/${path}`;
}

/** Generate a signed URL for a storage_url field value. Returns null on failure. */
export async function getSignedUrl(
  supabase: SupabaseClient,
  storageUrl: string,
  expiresIn = 7200
): Promise<string | null> {
  const parsed = parseStoragePath(storageUrl);
  if (!parsed) return null;
  const { data } = await supabase.storage
    .from(parsed.bucket)
    .createSignedUrl(parsed.path, expiresIn);
  return data?.signedUrl ?? null;
}
