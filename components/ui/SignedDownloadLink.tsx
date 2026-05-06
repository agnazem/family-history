"use client";

import { useSignedUrl } from "@/lib/hooks/useSignedUrl";
import { Download } from "lucide-react";

interface SignedDownloadLinkProps {
  storagePath: string;
  className?: string;
}

export function SignedDownloadLink({ storagePath, className }: SignedDownloadLinkProps) {
  const src = useSignedUrl(storagePath);
  if (!src) return null;
  return (
    <a
      href={src}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      <Download className="w-3.5 h-3.5" />
      Download file
    </a>
  );
}
