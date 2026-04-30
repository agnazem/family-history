"use client";

import { useState, useRef, useEffect } from "react";
import { Trash2, Play, Pause, Download, Pencil, Check, X, Users } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils";
import Image from "next/image";
import type { Memory, Person } from "@/types";

interface MemoryModalProps {
  memory: Memory | null;
  familyPeople: Person[];
  onClose: () => void;
  onChanged: () => void;
}

const TYPE_LABELS: Record<string, string> = {
  audio: "Voice Memory",
  photo: "Photo",
  document: "Document",
  note: "Written Note",
};

export function MemoryModal({ memory, familyPeople, onClose, onChanged }: MemoryModalProps) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [playing, setPlaying] = useState(false);

  // People tagging state
  const [taggedIds, setTaggedIds] = useState<Set<string>>(new Set());
  const [originalTaggedIds, setOriginalTaggedIds] = useState<Set<string>>(new Set());

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const supabase = createClient();

  // Reset all state when the memory changes, and fetch current tags
  useEffect(() => {
    if (!memory) return;
    setTitle(memory.title);
    setDescription(memory.description ?? "");
    setEditing(false);
    setPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    supabase
      .from("memory_people")
      .select("person_id")
      .eq("memory_id", memory.id)
      .then(({ data }) => {
        const ids = new Set((data ?? []).map((r) => r.person_id as string));
        setTaggedIds(ids);
        setOriginalTaggedIds(ids);
      });
  }, [memory?.id]);

  if (!memory) return null;

  function toggleTag(personId: string) {
    setTaggedIds((prev) => {
      const next = new Set(prev);
      if (next.has(personId)) next.delete(personId);
      else next.add(personId);
      return next;
    });
  }

  function toggleAudio() {
    if (!memory?.storage_url) return;
    if (!audioRef.current) {
      audioRef.current = new Audio(memory.storage_url);
      audioRef.current.onended = () => setPlaying(false);
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
    if (!memory) return;
    setSaving(true);

    // Update title / description
    await supabase
      .from("memories")
      .update({ title, description: description || null })
      .eq("id", memory.id);

    // Sync memory_people: insert added, delete removed
    const added = [...taggedIds].filter((id) => !originalTaggedIds.has(id));
    const removed = [...originalTaggedIds].filter((id) => !taggedIds.has(id));

    if (added.length > 0) {
      await supabase.from("memory_people").insert(
        added.map((pid) => ({
          memory_id: memory.id,
          person_id: pid,
          family_id: memory.family_id,
        }))
      );
    }
    if (removed.length > 0) {
      await supabase
        .from("memory_people")
        .delete()
        .eq("memory_id", memory.id)
        .in("person_id", removed);
    }

    setOriginalTaggedIds(new Set(taggedIds));
    setSaving(false);
    setEditing(false);
    onChanged();
  }

  async function handleDelete() {
    if (!memory) return;
    if (!window.confirm("Delete this memory? This cannot be undone.")) return;
    await supabase.from("memories").delete().eq("id", memory.id);
    onChanged();
    onClose();
  }

  function handleCancelEdit() {
    if (!memory) return;
    setTitle(memory.title);
    setDescription(memory.description ?? "");
    setTaggedIds(new Set(originalTaggedIds));
    setEditing(false);
  }

  // People tagged (for view mode display)
  const taggedPeople = familyPeople.filter((p) => taggedIds.has(p.id));

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
              rows={3}
              placeholder="Add a caption or description..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          ) : memory.description ? (
            <p className="text-sm text-gray-600 leading-relaxed">{memory.description}</p>
          ) : (
            <p className="text-sm text-gray-400 italic">No description.</p>
          )}
        </div>

        {/* People tagging — pill picker in edit mode, compact list in view mode */}
        {editing ? (
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-gray-700 mb-2">
              <Users className="w-3.5 h-3.5" />
              People in this memory
            </label>
            {familyPeople.length === 0 ? (
              <p className="text-xs text-gray-400">No other family members in this tree yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {familyPeople.map((p) => {
                  const selected = taggedIds.has(p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => toggleTag(p.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${
                        selected
                          ? "bg-blue-600 border-blue-600 text-white"
                          : "border-gray-300 text-gray-600 hover:border-blue-400"
                      }`}
                    >
                      {selected && <Check className="w-3 h-3" />}
                      {p.first_name} {p.last_name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ) : taggedPeople.length > 0 ? (
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Users className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{taggedPeople.map((p) => p.first_name).join(", ")}</span>
          </div>
        ) : null}

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
