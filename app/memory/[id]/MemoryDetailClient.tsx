"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AudioPlayer } from "@/components/folio/AudioPlayer";
import { Avatar } from "@/components/ui/Avatar";
import { formatDate } from "@/lib/utils";
import { ArrowLeft, Pencil, Check, X, Send, Trash2, Loader2 } from "lucide-react";
import type { Memory, MemoryComment, Person } from "@/types";
import { debounce } from "@/lib/utils";

interface Props {
  memory: Memory;
  taggedPeople: (Person & { role: string })[];
  comments: MemoryComment[];
  memberNames: Record<string, string>;
  recorderName: string;
  canEdit: boolean;
  currentUserId: string;
  familyId: string;
}

function fmtDuration(sec: number | null): string {
  if (!sec) return "";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

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

const TYPE_LABELS: Record<string, string> = {
  audio: "VOICE MEMORY",
  photo: "PHOTO",
  document: "DOCUMENT",
  note: "WRITTEN NOTE",
};

export function MemoryDetailClient({
  memory: initialMemory,
  taggedPeople,
  comments: initialComments,
  memberNames,
  recorderName,
  canEdit,
  currentUserId,
  familyId,
}: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [memory, setMemory] = useState(initialMemory);
  const [comments, setComments] = useState(initialComments);

  // Editable title
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(initialMemory.title);

  // Editable transcript
  const [transcriptDraft, setTranscriptDraft] = useState(initialMemory.transcript ?? "");
  const [transcriptSaving, setTranscriptSaving] = useState(false);

  // Comments
  const [commentText, setCommentText] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [submittingComment, setSubmittingComment] = useState(false);

  // Playback speed
  const [playbackRate, setPlaybackRate] = useState(1);

  // Subscribe to realtime transcript updates during live recording
  useEffect(() => {
    if (!["pending", "streaming", "finalizing"].includes(memory.transcript_status)) return;

    const channel = supabase
      .channel(`memory-${memory.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "memories", filter: `id=eq.${memory.id}` },
        (payload) => {
          setMemory((prev) => ({ ...prev, ...(payload.new as Partial<Memory>) }));
          if (payload.new.transcript) {
            setTranscriptDraft(payload.new.transcript as string);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [memory.id, memory.transcript_status]);

  // Autosave transcript draft after 2s idle
  const saveTranscript = useCallback(
    debounce(async (text: string) => {
      setTranscriptSaving(true);
      await supabase
        .from("memories")
        .update({ transcript_draft: text })
        .eq("id", memory.id);
      setTranscriptSaving(false);
    }, 2000),
    [memory.id]
  );

  function handleTranscriptChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setTranscriptDraft(e.target.value);
    saveTranscript(e.target.value);
  }

  async function commitTranscript() {
    await supabase
      .from("memories")
      .update({ transcript: transcriptDraft, transcript_draft: null })
      .eq("id", memory.id);
    setMemory((prev) => ({ ...prev, transcript: transcriptDraft, transcript_draft: null }));
  }

  async function saveTitle() {
    if (!titleDraft.trim()) return;
    await supabase
      .from("memories")
      .update({ title: titleDraft.trim() })
      .eq("id", memory.id);
    setMemory((prev) => ({ ...prev, title: titleDraft.trim() }));
    setEditingTitle(false);
  }

  async function handleDelete() {
    if (!window.confirm("Delete this memory? This cannot be undone.")) return;
    await supabase.from("memories").delete().eq("id", memory.id);
    router.back();
  }

  async function submitComment() {
    if (!commentText.trim()) return;
    setSubmittingComment(true);
    const { data } = await supabase
      .from("comments")
      .insert({
        memory_id: memory.id,
        family_id: familyId,
        user_id: currentUserId,
        text: commentText.trim(),
        parent_id: replyTo ?? null,
      })
      .select()
      .single();
    if (data) {
      setComments((prev) => [...prev, data as MemoryComment]);
    }
    setCommentText("");
    setReplyTo(null);
    setSubmittingComment(false);
  }

  const eyebrowDate = memory.date_of_memory
    ? formatDate(memory.date_of_memory)
    : formatDate(memory.created_at);

  const topLevelComments = comments.filter((c) => !c.parent_id);
  const replies = (parentId: string) => comments.filter((c) => c.parent_id === parentId);

  const showLiveIndicator = ["pending", "streaming", "finalizing"].includes(memory.transcript_status);

  return (
    <div className="min-h-screen bg-[--canvas]">
      {/* Back nav */}
      <header className="sticky top-0 z-10 bg-[--surface] border-b border-[--rule]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-12 flex items-center">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm text-[--ink-soft] hover:text-[--ink] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        {/* Eyebrow */}
        <p className="eyebrow mb-3">
          {TYPE_LABELS[memory.type] ?? "MEMORY"} · RECORDED BY {recorderName.toUpperCase()} · {eyebrowDate.toUpperCase()}
        </p>

        {/* Title */}
        <div className="flex items-start gap-3 mb-6">
          {editingTitle ? (
            <div className="flex-1 flex items-center gap-2">
              <input
                autoFocus
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") saveTitle(); if (e.key === "Escape") setEditingTitle(false); }}
                className="flex-1 font-display text-[clamp(28px,5vw,56px)] leading-[1.05] tracking-[-0.02em] bg-transparent border-b-2 border-[--gold] outline-none text-[--ink]"
              />
              <button onClick={saveTitle} className="p-2 text-[--gold] hover:text-[--ink] transition-colors">
                <Check className="w-5 h-5" />
              </button>
              <button onClick={() => { setTitleDraft(memory.title); setEditingTitle(false); }} className="p-2 text-[--ink-mute] hover:text-[--ink] transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="flex-1 flex items-start gap-3 group">
              <h1 className="font-display text-[clamp(28px,5vw,56px)] leading-[1.05] tracking-[-0.02em] font-normal text-[--ink]">
                {memory.title}
              </h1>
              {canEdit && (
                <button
                  onClick={() => setEditingTitle(true)}
                  className="mt-2 p-1.5 opacity-0 group-hover:opacity-100 text-[--ink-mute] hover:text-[--ink] transition-all rounded"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Audio player band */}
        {memory.type === "audio" && memory.storage_url && (
          <div className="bg-[--accent-soft] border border-[--rule] rounded-2xl px-6 py-5 mb-8">
            <div className="flex items-center justify-between mb-3">
              <span className="eyebrow">Audio</span>
              <div className="flex items-center gap-1">
                {([1, 1.5, 2] as const).map((rate) => (
                  <button
                    key={rate}
                    onClick={() => setPlaybackRate(rate)}
                    className={`text-xs font-mono px-2 py-1 rounded transition-colors ${
                      playbackRate === rate
                        ? "bg-[--accent] text-white"
                        : "text-[--ink-soft] hover:text-[--ink]"
                    }`}
                  >
                    {rate}×
                  </button>
                ))}
              </div>
            </div>
            <AudioPlayer
              src={memory.storage_url}
              playbackRate={playbackRate}
              className="text-[--accent]"
            />
            {memory.duration_sec && (
              <p className="font-mono text-[11px] text-[--ink-mute] mt-2">
                {fmtDuration(memory.duration_sec)}
              </p>
            )}
          </div>
        )}

        {/* People chips */}
        {taggedPeople.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {taggedPeople.map((person) => (
              <button
                key={person.id}
                onClick={() => router.push(`/person/${person.id}?from=memory/${memory.id}`)}
                className="flex items-center gap-2 bg-[--surface] border border-[--rule] hover:border-[--gold] rounded-full pl-1 pr-3 py-1 transition-colors"
              >
                <Avatar src={person.profile_photo_url} name={`${person.first_name} ${person.last_name}`} size="xs" />
                <span className="text-sm text-[--ink]">{person.first_name} {person.last_name}</span>
              </button>
            ))}
          </div>
        )}

        {/* Two-column layout */}
        <div className="flex gap-10 items-start">
          {/* Transcript — left, 60ch */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-4">
              <p className="eyebrow">Transcript</p>
              {showLiveIndicator && (
                <span className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-[0.06em] text-[--gold]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[--gold] animate-pulse" />
                  {memory.transcript_status === "finalizing" ? "Improving accuracy…" : "Live"}
                </span>
              )}
              {memory.transcript_status === "ready" && transcriptSaving && (
                <Loader2 className="w-3.5 h-3.5 text-[--ink-mute] animate-spin" />
              )}
            </div>

            {memory.transcript_status === "ready" || memory.transcript_status === "none" ? (
              canEdit ? (
                <textarea
                  value={transcriptDraft}
                  onChange={handleTranscriptChange}
                  onBlur={commitTranscript}
                  placeholder={memory.transcript_status === "none" ? "No transcript yet. You can type one here." : ""}
                  rows={Math.max(6, transcriptDraft.split("\n").length + 2)}
                  className="w-full text-[17px] leading-[1.55] text-[--ink] bg-transparent resize-none outline-none placeholder:text-[--ink-mute] max-w-[60ch]"
                />
              ) : (
                <p className="text-[17px] leading-[1.55] text-[--ink] max-w-[60ch] whitespace-pre-wrap">
                  {memory.transcript || <span className="text-[--ink-mute] italic">No transcript yet.</span>}
                </p>
              )
            ) : (
              <p className="text-[17px] leading-[1.55] text-[--ink] max-w-[60ch] whitespace-pre-wrap">
                {memory.transcript || <span className="text-[--ink-mute] italic">Transcribing…</span>}
              </p>
            )}

            {memory.transcript_status === "failed" && (
              <div className="mt-4 bg-[--accent-soft] border border-[--rule] rounded-xl px-4 py-3 text-sm text-[--ink-soft]">
                Transcription failed. {canEdit && "You can type the transcript above."}
              </div>
            )}
          </div>

          {/* Sidebar — right, 280px, sticky */}
          <aside className="hidden lg:block w-[280px] flex-shrink-0 sticky top-20">
            {/* About this recording */}
            <div className="bg-[--surface] border border-[--rule] rounded-xl p-5 mb-4">
              <p className="eyebrow mb-3">About this recording</p>
              <dl className="space-y-2 text-sm">
                {(memory.recorded_at || memory.date_of_memory) && (
                  <div>
                    <dt className="text-[--ink-mute] text-[12px] font-mono uppercase tracking-[0.04em]">Date</dt>
                    <dd className="text-[--ink] mt-0.5">
                      {memory.recorded_at_note || formatDate(memory.recorded_at || memory.date_of_memory)}
                    </dd>
                  </div>
                )}
                {memory.duration_sec && (
                  <div>
                    <dt className="text-[--ink-mute] text-[12px] font-mono uppercase tracking-[0.04em]">Duration</dt>
                    <dd className="text-[--ink] mt-0.5">{fmtDuration(memory.duration_sec)}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-[--ink-mute] text-[12px] font-mono uppercase tracking-[0.04em]">Recorded by</dt>
                  <dd className="text-[--ink] mt-0.5">{recorderName}</dd>
                </div>
              </dl>
            </div>

            {/* Comments */}
            <div className="bg-[--surface] border border-[--rule] rounded-xl p-5">
              <p className="eyebrow mb-3">
                Comments{comments.length > 0 ? ` · ${comments.length}` : ""}
              </p>

              {topLevelComments.length > 0 && (
                <div className="space-y-4 mb-4">
                  {topLevelComments.map((c) => (
                    <div key={c.id}>
                      <div className="flex items-baseline gap-2">
                        <span className="text-xs font-medium text-[--ink]">{memberNames[c.user_id] ?? "Family member"}</span>
                        <span className="text-[11px] text-[--ink-mute]">{relativeTime(c.created_at)}</span>
                      </div>
                      <p className="text-sm text-[--ink-soft] mt-0.5 leading-relaxed">{c.text}</p>
                      {replies(c.id).map((r) => (
                        <div key={r.id} className="ml-4 mt-2 pl-3 border-l border-[--rule]">
                          <div className="flex items-baseline gap-2">
                            <span className="text-xs font-medium text-[--ink]">{memberNames[r.user_id] ?? "Family member"}</span>
                            <span className="text-[11px] text-[--ink-mute]">{relativeTime(r.created_at)}</span>
                          </div>
                          <p className="text-sm text-[--ink-soft] mt-0.5 leading-relaxed">{r.text}</p>
                        </div>
                      ))}
                      <button
                        onClick={() => setReplyTo(replyTo === c.id ? null : c.id)}
                        className="text-[11px] text-[--ink-mute] hover:text-[--ink] mt-1 transition-colors"
                      >
                        {replyTo === c.id ? "Cancel reply" : "Reply"}
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {replyTo && (
                <p className="text-[11px] text-[--ink-mute] mb-1.5">
                  Replying to {memberNames[comments.find((c) => c.id === replyTo)?.user_id ?? ""] ?? "comment"}
                  {" "}
                  <button onClick={() => setReplyTo(null)} className="underline">cancel</button>
                </p>
              )}

              <div className="space-y-1.5">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submitComment(); }}
                  maxLength={1000}
                  rows={2}
                  placeholder="Add a comment…"
                  className="w-full border border-[--rule] bg-[--surface] rounded-lg px-3 py-2 text-sm text-[--ink] placeholder:text-[--ink-mute] focus:outline-none focus:border-[--gold] resize-none"
                />
                <div className="flex items-center justify-between">
                  <span className={`text-[11px] ${commentText.length > 900 ? "text-orange-500" : "text-[--ink-mute]"}`}>
                    {commentText.length}/1000
                  </span>
                  <button
                    onClick={submitComment}
                    disabled={submittingComment || !commentText.trim()}
                    className="flex items-center gap-1.5 text-sm bg-[--accent] text-white px-3 py-1.5 rounded-lg hover:bg-[--accent-hover] disabled:opacity-40 transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {submittingComment ? "Posting…" : "Post"}
                  </button>
                </div>
              </div>
            </div>

            {/* Danger zone */}
            {canEdit && (
              <button
                onClick={handleDelete}
                className="mt-4 flex items-center gap-1.5 text-sm text-red-600 hover:text-red-700 transition-colors w-full justify-center py-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete memory
              </button>
            )}
          </aside>
        </div>

        {/* Mobile: comments below transcript */}
        <div className="lg:hidden mt-10">
          <div className="bg-[--surface] border border-[--rule] rounded-xl p-5 mb-4">
            <p className="eyebrow mb-3">About this recording</p>
            <dl className="space-y-2 text-sm">
              {(memory.recorded_at || memory.date_of_memory) && (
                <div>
                  <dt className="text-[--ink-mute] text-[12px] font-mono uppercase tracking-[0.04em]">Date</dt>
                  <dd className="text-[--ink] mt-0.5">{memory.recorded_at_note || formatDate(memory.recorded_at || memory.date_of_memory)}</dd>
                </div>
              )}
              {memory.duration_sec && (
                <div>
                  <dt className="text-[--ink-mute] text-[12px] font-mono uppercase tracking-[0.04em]">Duration</dt>
                  <dd className="text-[--ink] mt-0.5">{fmtDuration(memory.duration_sec)}</dd>
                </div>
              )}
            </dl>
          </div>

          <div className="bg-[--surface] border border-[--rule] rounded-xl p-5">
            <p className="eyebrow mb-3">Comments{comments.length > 0 ? ` · ${comments.length}` : ""}</p>
            {topLevelComments.length > 0 && (
              <div className="space-y-4 mb-4">
                {topLevelComments.map((c) => (
                  <div key={c.id}>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs font-medium text-[--ink]">{memberNames[c.user_id] ?? "Family member"}</span>
                      <span className="text-[11px] text-[--ink-mute]">{relativeTime(c.created_at)}</span>
                    </div>
                    <p className="text-sm text-[--ink-soft] mt-0.5 leading-relaxed">{c.text}</p>
                  </div>
                ))}
              </div>
            )}
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              maxLength={1000}
              rows={2}
              placeholder="Add a comment…"
              className="w-full border border-[--rule] bg-[--surface] rounded-lg px-3 py-2 text-sm text-[--ink] placeholder:text-[--ink-mute] focus:outline-none focus:border-[--gold] resize-none"
            />
            <div className="flex justify-end mt-1.5">
              <button
                onClick={submitComment}
                disabled={submittingComment || !commentText.trim()}
                className="flex items-center gap-1.5 text-sm bg-[--accent] text-white px-3 py-1.5 rounded-lg hover:bg-[--accent-hover] disabled:opacity-40 transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                Post
              </button>
            </div>
          </div>

          {canEdit && (
            <button
              onClick={handleDelete}
              className="mt-4 flex items-center gap-1.5 text-sm text-red-600 hover:text-red-700 transition-colors w-full justify-center py-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete memory
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
