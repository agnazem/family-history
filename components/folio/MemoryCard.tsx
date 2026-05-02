"use client";

import { Mic, Image as ImageIcon, FileText, PenLine, Download, Users } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { AudioPlayer } from "@/components/folio/AudioPlayer";
import type { Memory, Person } from "@/types";
import Image from "next/image";

const TYPE_ICONS = {
  audio: Mic,
  photo: ImageIcon,
  document: FileText,
  note: PenLine,
};

const TYPE_COLORS = {
  audio:    "bg-purple-50 border-purple-200 text-purple-700",
  photo:    "bg-teal-50 border-teal-200 text-teal-700",
  document: "bg-green-50 border-green-200 text-green-700",
  note:     "bg-stone-50 border-stone-200 text-stone-600",
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
      className={`border rounded-xl p-4 ${TYPE_COLORS[memory.type]} ${onClick ? "cursor-pointer hover:shadow-md transition-shadow" : ""}`}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5">
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">{memory.title}</p>
          <p className="text-xs opacity-70 mt-0.5">
            {formatDate(memory.created_at)}
          </p>

          {memory.type === "audio" && memory.storage_url && (
            <AudioPlayer src={memory.storage_url} className="mt-2" />
          )}

          {memory.type === "photo" && memory.storage_url && (
            <div className="mt-2 rounded-lg overflow-hidden">
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
              className="flex items-center gap-1.5 mt-2 text-xs font-medium opacity-80 hover:opacity-100"
            >
              <Download className="w-3.5 h-3.5" />
              Download file
            </a>
          )}

          {memory.description && (
            <p className="text-sm mt-2 opacity-80 leading-relaxed">
              {memory.description}
            </p>
          )}

          {taggedPeople && taggedPeople.length > 0 && (
            <p className="flex items-center gap-1 text-xs mt-2 opacity-60">
              <Users className="w-3 h-3 flex-shrink-0" />
              {taggedPeople.map((p) => `${p.first_name} ${p.last_name}`).join(", ")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
