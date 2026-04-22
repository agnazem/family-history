"use client";

import { useState, useRef, useEffect } from "react";
import { Trash2, Play, Pause, Download, Pencil, Check, X } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils";
import Image from "next/image";
import type { Memory } from "@/types";

interface MemoryModalProps {
  memory: Memory | null;
  onClose: () => void;
  onChanged: () => void;
}

const TYPE_LABELS: Record<string, string> = {
  audio: "Voice Memory",
  photo: "Photo",
  document: "Document",
  note: "Written Note",
};

export function MemoryModal({ memory, onClose, onChanged }: MemoryModalProps) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const supabase = createClient();

  useEffect(() => {
    if (memory) {
      setTitle(memory.title);
      setDescription(memory.description ?? "");
      setEditing(false);
      setPlaying(false);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    }
  }, [memory?.id]);

  if (!memory) return null;

  function toggleAudio() {
    if (!memory?.storage_url) return;
    if (!audioRef.current) {
      const audio = document.createElement("audio");
      const source = document.createElement("source");
      source.src = memory.storage_url;
      const ext = memory.storage_url.split("?")[0].split(".").pop()?.toLowerCase();
      source.type = ext === "mp4" ? "audio/mp4" : ext === "ogg" ? "audio/ogg" : "audio/webm";
      audio.appendChild(source);
      audio.onended = () => setPlaying(false);
      audioRef.current = audio;
    }
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play().catch(() => setPlaying(false));
      setPlaying(true);
    }
  }

  async function handleSave() {
    setSaving(true);
    await supabase
      .from("memories")
      .update({ title, description: description || null })
      .eq("id", memory.id);
    setSaving(false);
    setEditing(false);
    onChanged();
  }

  async function handleDelete() {
    if (!window.confirm("Delete this memory? This cannot be undone.")) return;
    await supabase.from("memories").delete().eq("id", memory.id);
    onChanged();
    onClose();
  }

  function handleCancelEdit() {
    setTitle(memory.title);
    setDescription(memory.description ?? "");
    setEditing(false);
  }

  return (
    <Modal open={!!memory} onClose={onClose} title={TYPE_LABELS[memory.type] ?? "Memory"} size="md">
      <div className="space-y-4">

        {/* Title */}
        <div>
          {editing ? (
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-base font-semibold border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          ) : (
            <p className="text-base font-semibold text-gray-900">{memory.title}</p>
          )}
          <p className="text-xs text-gray-400 mt-0.5">{formatDate(memory.created_at)}</p>
        </div>

        {/* Media */}
        {memory.type === "audio" && memory.storage_url && (
          <button
            onClick={toggleAudio}
            className="flex items-center gap-2 w-full bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm font-medium text-blue-700 hover:bg-blue-100 transition-colors"
          >
            {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {playing ? "Pause recording" : "Play recording"}
          </button>
        )}

        {memory.type === "photo" && memory.storage_url && (
          <div className="rounded-xl overflow-hidden">
            <Image
              src={memory.storage_url}
              alt={memory.title}
              width={600}
              height={400}
              className="w-full object-cover max-h-72"
            />
          </div>
        )}

        {memory.type === "document" && memory.storage_url && (
          <a
            href={memory.storage_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 w-full bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm font-medium text-blue-700 hover:bg-blue-100 transition-colors"
          >
            <Download className="w-4 h-4" />
            Download file
          </a>
        )}

        {/* Description */}
        <div>
          {editing ? (
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Add a caption or description..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          ) : memory.description ? (
            <p className="text-sm text-gray-600 leading-relaxed">{memory.description}</p>
          ) : (
            <p className="text-sm text-gray-400 italic">No description.</p>
          )}
        </div>

        {/* Actions */}
        {editing ? (
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleCancelEdit}
              className="flex items-center gap-1.5 flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50 justify-center"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !title.trim()}
              className="flex items-center gap-1.5 flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 justify-center"
            >
              <Check className="w-4 h-4" />
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        ) : (
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleDelete}
              className="flex items-center gap-1.5 border border-red-300 text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg text-sm transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
            <button
              onClick={onClose}
              className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50"
            >
              Close
            </button>
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm hover:bg-blue-700 justify-center"
            >
              <Pencil className="w-4 h-4" />
              Edit
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}
