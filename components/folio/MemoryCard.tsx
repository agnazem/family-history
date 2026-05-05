"use client";

import { Mic, Image as ImageIcon, FileText, PenLine, Download, Users } from "lucide-react";
import { formatDate, personDisplayName } from "@/lib/utils";
import { AudioPlayer } from "@/components/folio/AudioPlayer";
import type { Memory, Person } from "@/types";
import Image from "next/image";
import Link from "next/link";

const TYPE_ICONS = {
  audio:    Mic,
  photo:    ImageIcon,
  document: FileText,
  note:     PenLine,
};

const TYPE_LABELS = {
  audio:    "Audio",
  photo:    "Photo",
  document: "Document",
  note:     "Note",
};

interface MemoryCardProps {
  memory: Memory;
  taggedPeople?: Person[];
  onClick?: () => void;
}

export function MemoryCard({ memory, taggedPeople, onClick }: MemoryCardProps) {
  const Icon = TYPE_ICONS[memory.type];

  return (
    <div
      onClick={onClick}
      className={`bg-[--surface] border border-[--rule] rounded-xl p-5 transition-colors ${
        onClick ? "cursor-pointer hover:border-[--gold]" : ""
      }`}
    >
      <div className="flex items-start gap-3">
        <Icon className="w-4 h-4 mt-1 flex-shrink-0 text-[--ink-mute]" />
        <div className="flex-1 min-w-0">
          <span className="eyebrow">{TYPE_LABELS[memory.type]}</span>
          <Link
            href={`/memory/${memory.id}`}
            onClick={(e) => e.stopPropagation()}
            className="block font-display text-[22px] leading-[1.2] font-normal text-[--ink] mt-0.5 hover:text-[--accent] transition-colors"
          >
            {memory.title}
          </Link>
          <p className="body-sm mt-1">{formatDate(memory.date_of_memory ?? memory.created_at)}</p>

          {memory.type === "audio" && memory.storage_url && (
            <AudioPlayer src={memory.storage_url} className="mt-3" />
          )}

          {memory.type === "photo" && memory.storage_url && (
            <div className="mt-3 rounded-lg overflow-hidden">
              <Image
                src={memory.storage_url}
                alt={memory.title}
                width={400}
                height={300}
                className="w-full h-48 object-cover rounded-lg"
              />
            </div>
          )}

          {memory.type === "document" && memory.storage_url && (
            <a
              href={memory.storage_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 mt-3 text-sm text-[--ink-soft] hover:text-[--ink] transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Download file
            </a>
          )}

          {memory.transcript && (
            <p className="text-[14px] leading-[1.5] text-[--ink-soft] mt-2 line-clamp-3">
              {memory.transcript}
            </p>
          )}

          {!memory.transcript && memory.description && (
            <p className="text-[14px] leading-[1.5] text-[--ink-soft] mt-2">
              {memory.description}
            </p>
          )}

          {taggedPeople && taggedPeople.length > 0 && (
            <p className="flex items-center gap-1.5 mt-2 text-[13px] text-[--ink-mute]">
              <Users className="w-3 h-3 flex-shrink-0" />
              {taggedPeople.map((p) => personDisplayName(p)).join(", ")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
