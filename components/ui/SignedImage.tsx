"use client";

import { useSignedUrl } from "@/lib/hooks/useSignedUrl";

interface SignedImageProps {
  storagePath: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
}

export function SignedImage({ storagePath, alt, width, height, className }: SignedImageProps) {
  const src = useSignedUrl(storagePath);
  if (!src) return null;
  // Using <img> directly to avoid Next.js Image restrictions on signed URLs
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} width={width} height={height} className={className} />;
}
