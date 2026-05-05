"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getSignedUrl } from "@/lib/storage";

/**
 * Resolves a stored storage path or legacy public URL to a short-lived signed URL.
 * Returns null while loading or if the path is empty.
 */
export function useSignedUrl(storageUrl: string | null | undefined, expiresIn = 7200): string | null {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    if (!storageUrl) { setSignedUrl(null); return; }
    let cancelled = false;
    getSignedUrl(supabase, storageUrl, expiresIn).then((url) => {
      if (!cancelled) setSignedUrl(url);
    });
    return () => { cancelled = true; };
  }, [storageUrl, expiresIn]);

  return signedUrl;
}
