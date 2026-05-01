"use client";

import { useState, useEffect } from "react";
import { Trash2, Download, Pencil, Check, X, Users, MessageCircle, Send } from "lucide-react";
import { AudioPlayer } from "@/components/folio/AudioPlayer";
import { Modal } from "@/components/ui/Modal";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils";
import Image from "next/image";
import type { Memory, Person } from "@/types";

interface Comment {
  id: string;
  memory_id: string;
  family_id: string;
  user_id: string;
  text: string;
  created_at: string;
}

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

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export function MemoryModal({ memory, familyPeople, onClose, onChanged }: MemoryModalProps) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dateOfMemory, setDateOfMemory] = useState("");
  const [saving, setSaving] = useState(false);

  const [taggedIds, setTaggedIds] = useState<Set<string>>(new Set());
  const [originalTaggedIds, setOriginalTaggedIds] = useState<Set<string>>(new Set());

  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [memberNames, setMemberNames] = useState<Record<string, string>>({});

  const supabase = createClient();

  useEffect(() => {
    if (!memory) return;
    setTitle(memory.title);
    setDescription(memory.description ?? "");
    setDateOfMemory(memory.date_of_memory ?? "");
    setEditing(false);
    setCommentText("");

    supabase
      .from("memory_people")
      .select("person_id")
      .eq("memory_id", memory.id)
      .then(({ data }) => {
        const ids = new Set((data ?? []).map((r) => r.person_id as string));
        setTaggedIds(ids);
        setOriginalTaggedIds(ids);
      });

    Promise.all([
      supabase
        .from("comments")
        .select("*")
        .eq("memory_id", memory.id)
        .order("created_at", { ascending: true }),
      supabase
        .from("family_members")
        .select("user_id, display_name")
        .eq("family_id", memory.family_id),
    ]).then(([{ data: commentsData }, { data: membersData }]) => {
      setComments((commentsData ?? []) as Comment[]);
      const names: Record<string, string> = {};
      for (const m of membersData ?? []) {
        names[m.user_id] = m.display_name ?? "Family member";
      }
      setMemberNames(names);
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

  async function handleSave() {
    if (!memory) return;
    setSaving(true);

    await supabase
      .from("memories")
      .update({
        title,
        description: description || null,
        date_of_memory: dateOfMemory || null,
      })
      .eq("id", memory.id);

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
    setDateOfMemory(memory.date_of_memory ?? "");
    setTaggedIds(new Set(originalTaggedIds));
    setEditing(false);
  }

  async function handleAddComment() {
    if (!memory || !commentText.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setSubmittingComment(true);
    await supabase.from("comments").insert({
      memory_id: memory.id,
      family_id: memory.family_id,
      user_id: user.id,
      text: commentText.trim(),
    });
    setCommentText("");
    const { data } = await supabase
      .from("comments")
      .select("*")
      .eq("memory_id", memory.id)
      .order("created_at", { ascending: true });
    setComments((data ?? []) as Comment[]);
    setSubmittingComment(false);
  }

  const taggedPeople = familyPeople.filter((p) => taggedIds.has(p.id));

  return (
    <Modal open={!!memory} onClose={onClose} title={TYPE_LABELS[memory.type] ?? "Memory"} size="lg">
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
          <p className="text-xs text-gray-400 mt-0.5">Added {formatDate(memory.created_at)}</p>
        </div>

        {/* Media */}
        {memory.type === "audio" && memory.storage_url && (
          <div className="w-full bg-blue-50 border border-blue-200 rounded-xl px-4 py-2 text-blue-700">
            <AudioPlayer src={memory.storage_url} />
          </div>
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

        {/* Date of memory */}
        {editing ? (
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Date of memory</label>
            <input
              type="date"
              value={dateOfMemory}
              onChange={(e) => setDateOfMemory(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        ) : memory.date_of_memory ? (
          <p className="text-xs text-gray-500">Memory from {formatDate(memory.date_of_memory)}</p>
        ) : null}

        {/* People tagging */}
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

        {/* Comments */}
        <div className="border-t border-gray-100 pt-4">
          <div className="flex items-center gap-1.5 mb-3">
            <MessageCircle className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Comments{comments.length > 0 ? ` · ${comments.length}` : ""}
            </span>
          </div>

          {comments.length > 0 && (
            <div className="space-y-3 mb-4">
              {comments.map((c) => (
                <div key={c.id}>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-medium text-gray-700">
                      {memberNames[c.user_id] ?? "Family member"}
                    </span>
                    <span className="text-xs text-gray-400">{relativeTime(c.created_at)}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-0.5 leading-relaxed">{c.text}</p>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-1.5">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              maxLength={1000}
              rows={2}
              placeholder="Add a comment..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <div className="flex items-center justify-between">
              <span className={`text-xs ${commentText.length > 900 ? "text-orange-500" : "text-gray-400"}`}>
                {commentText.length}/1000
              </span>
              <button
                onClick={handleAddComment}
                disabled={submittingComment || !commentText.trim()}
                className="flex items-center gap-1.5 text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                {submittingComment ? "Posting..." : "Post"}
              </button>
            </div>
          </div>
        </div>

      </div>
    </Modal>
  );
}
