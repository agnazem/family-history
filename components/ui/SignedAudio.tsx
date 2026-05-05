"use client";

import { useSignedUrl } from "@/lib/hooks/useSignedUrl";
import { AudioPlayer } from "@/components/folio/AudioPlayer";

interface SignedAudioProps {
  storagePath: string;
  className?: string;
}

export function SignedAudio({ storagePath, className }: SignedAudioProps) {
  const src = useSignedUrl(storagePath);
  if (!src) return null;
  return <AudioPlayer src={src} className={className} />;
}
