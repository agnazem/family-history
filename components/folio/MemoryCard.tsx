"use client";

import { useState, useRef } from "react";
import { Mic, Image as ImageIcon, FileText, PenLine, Play, Pause, Download } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { Memory } from "@/types";
import Image from "next/image";

const TYPE_ICONS = {
  audio: Mic,
  photo: ImageIcon,
  document: FileText,
  note: PenLine,
};

const TYPE_COLORS = {
  audio: "bg-purple-50 border-purple-200 text-purple-700",
  photo: "bg-blue-50 border-blue-200 text-blue-700",
  document: "bg-green-50 border-green-200 text-green-700",
  note: "bg-amber-50 border-amber-200 text-amber-700",
};

interface MemoryCardProps {
  memory: Memory;
}

export function MemoryCard({ memory }: MemoryCardProps) {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const Icon = TYPE_ICONS[memory.type];

  function toggleAudio() {
    if (!memory.storage_url) return;
    if (!audioRef.current) {
      audioRef.current = new Audio(memory.storage_url);
      audioRef.current.onended = () => setPlaying(false);
    }
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play();
      setPlaying(true);
    }
  }

  return (
    <div className={`border rounded-xl p-4 ${TYPE_COLORS[memory.type]}`}>
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
            <button
              onClick={toggleAudio}
              className="flex items-center gap-2 mt-2 text-xs font-medium opacity-80 hover:opacity-100"
            >
              {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              {playing ? "Pause" : "Play recording"}
            </button>
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
        </div>
      </div>
    </div>
  );
}
