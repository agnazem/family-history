"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AudioPlayer, type AudioPlayerRef } from "@/components/folio/AudioPlayer";
import { Avatar } from "@/components/ui/Avatar";
import { formatDate } from "@/lib/utils";
import { Pencil, Check, X, Send, Trash2, Loader2, Users, Search, RefreshCw } from "lucide-react";
import { AppNav } from "@/components/ui/AppNav";
import type { Memory, MemoryComment, Person } from "@/types";
import { debounce } from "@/lib/utils";

interface Props {
  memory: Memory;
  taggedPeople: (Person & { role: string })[];
  allPeople: Person[];
  familyMembers: { user_id: string; display_name: string | null }[];
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

function fmtTime(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

interface TranscriptParagraph {
  text: string;
  startTime: number;
}

function buildParagraphs(transcript: string, durationSec: number | null): TranscriptParagraph[] {
  if (!transcript.trim()) return [];
  const dur = durationSec ?? 0;
  const total = transcript.length;
  // Prefer double-newline splits; fall back to single newlines (Whisper rarely adds double breaks)
  const parts = /\n\n/.test(transcript)
    ? transcript.split(/\n\n+/)
    : transcript.split(/\n/);
  let searchFrom = 0;
  const result: TranscriptParagraph[] = [];
  for (const part of parts) {
    const text = part.trim();
    if (!text) { searchFrom += part.length + 1; continue; }
    const idx = transcript.indexOf(text, searchFrom);
    const startTime = dur > 0 && total > 0 ? (idx / total) * dur : 0;
    result.push({ text, startTime });
    searchFrom = idx + text.length;
  }
  return result;
}

export function MemoryDetailClient({
  memory: initialMemory,
  taggedPeople: initialTaggedPeople,
  allPeople,
  familyMembers,
  comments: initialComments,
  memberNames,
  recorderName: initialRecorderName,
  canEdit,
  currentUserId,
  familyId,
}: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [memory, setMemory] = useState(initialMemory);
  const [comments, setComments] = useState(initialComments);

  // Recorder display name (local, can be updated)
  const [recorderDisplayName, setRecorderDisplayName] = useState(initialRecorderName);
  const [editingRecorder, setEditingRecorder] = useState(false);

  // Editable title
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(initialMemory.title);

  // Editable description
  const [editingDescription, setEditingDescription] = useState(false);
  const [descriptionDraft, setDescriptionDraft] = useState(initialMemory.description ?? "");

  // Editable date of memory
  const [editingDate, setEditingDate] = useState(false);
  const [dateDraft, setDateDraft] = useState(initialMemory.date_of_memory ?? "");

  // Editable tagged people
  const [taggedPeople, setTaggedPeople] = useState(initialTaggedPeople);
  const [editingTags, setEditingTags] = useState(false);
  const [taggedIds, setTaggedIds] = useState<Set<string>>(
    new Set(initialTaggedPeople.map((p) => p.id))
  );

  // Editable transcript
  const [transcriptDraft, setTranscriptDraft] = useState(initialMemory.transcript ?? "");
  const [transcriptSaving, setTranscriptSaving] = useState(false);
  const [transcriptSaved, setTranscriptSaved] = useState(false);
  const transcriptSavedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Tag search filter
  const [tagSearch, setTagSearch] = useState("");

  // Retranscription
  const [retranscribing, setRetranscribing] = useState(false);
  const [confirmingRetranscribe, setConfirmingRetranscribe] = useState(false);
  const [previousTranscript, setPreviousTranscript] = useState<string | null>(null);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Summary
  const [summarizing, setSummarizing] = useState(false);
  const [summaryExpanded, setSummaryExpanded] = useState(false);

  // Delete confirmation
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  // Comments
  const [commentText, setCommentText] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [submittingComment, setSubmittingComment] = useState(false);

  // Playback speed
  const [playbackRate, setPlaybackRate] = useState(1);

  // Audio time tracking + transcript edit mode
  const [currentAudioTime, setCurrentAudioTime] = useState(0);
  // Seed from stored value; AudioPlayer will update once the element resolves duration
  // (old recordings often have duration_sec = null)
  const [resolvedDuration, setResolvedDuration] = useState<number | null>(memory.duration_sec ?? null);
  const [transcriptEditMode, setTranscriptEditMode] = useState(false);
  const audioPlayerRef = useRef<AudioPlayerRef>(null);
  const transcriptContainerRef = useRef<HTMLDivElement>(null);

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

  // Auto-generate summary for long transcripts (lazy, cached)
  useEffect(() => {
    if (
      memory.transcript_status !== "ready" ||
      memory.transcript_summary ||
      !memory.transcript ||
      memory.transcript.trim().split(/\s+/).length < 300
    ) return;

    setSummarizing(true);
    fetch(`/api/memories/${memory.id}/summarize`, { method: "POST" })
      .then((r) => r.json())
      .then(({ summary }) => {
        if (summary) setMemory((prev) => ({ ...prev, transcript_summary: summary }));
      })
      .catch(() => {})
      .finally(() => setSummarizing(false));
  }, [memory.id, memory.transcript_status, memory.transcript_summary, memory.transcript]);

  // Autosave transcript draft after 2s idle
  const saveTranscript = useCallback(
    debounce(async (text: string) => {
      setTranscriptSaving(true);
      await supabase
        .from("memories")
        .update({ transcript_draft: text })
        .eq("id", memory.id);
      setTranscriptSaving(false);
      setTranscriptSaved(true);
      if (transcriptSavedTimer.current) clearTimeout(transcriptSavedTimer.current);
      transcriptSavedTimer.current = setTimeout(() => setTranscriptSaved(false), 1500);
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

  async function saveDescription() {
    await supabase.from("memories").update({ description: descriptionDraft || null }).eq("id", memory.id);
    setMemory((prev) => ({ ...prev, description: descriptionDraft || null }));
    setEditingDescription(false);
  }

  async function saveDate() {
    await supabase.from("memories").update({ date_of_memory: dateDraft || null }).eq("id", memory.id);
    setMemory((prev) => ({ ...prev, date_of_memory: dateDraft || null }));
    setEditingDate(false);
  }

  async function saveTags() {
    const originalIds = new Set(initialTaggedPeople.map((p) => p.id));
    const added = [...taggedIds].filter((id) => !originalIds.has(id));
    const removed = [...originalIds].filter((id) => !taggedIds.has(id));

    if (added.length > 0) {
      await supabase.from("memory_people").insert(
        added.map((pid) => ({ memory_id: memory.id, person_id: pid, family_id: familyId }))
      );
    }
    if (removed.length > 0) {
      await supabase.from("memory_people").delete().eq("memory_id", memory.id).in("person_id", removed);
    }

    const newTagged = allPeople
      .filter((p) => taggedIds.has(p.id))
      .map((p) => ({ ...p, role: "subject" }));
    setTaggedPeople(newTagged);
    setTagSearch("");
    setEditingTags(false);
  }

  async function saveRecorder(userId: string) {
    const member = familyMembers.find((m) => m.user_id === userId);
    await supabase.from("memories").update({ recorded_by: userId }).eq("id", memory.id);
    setMemory((prev) => ({ ...prev, recorded_by: userId }));
    setRecorderDisplayName(member?.display_name ?? "Family member");
    setEditingRecorder(false);
  }

  async function handleRetranscribe() {
    const savedTranscript = transcriptDraft;
    setConfirmingRetranscribe(false);
    setRetranscribing(true);
    setMemory((prev) => ({ ...prev, transcript_status: "pending" }));
    const res = await fetch(`/api/recordings/${memory.id}/retranscribe`, { method: "POST" }).catch(() => null);
    if (res?.ok) {
      const { data } = await supabase
        .from("memories")
        .select("transcript, transcript_status, transcript_draft, transcript_summary")
        .eq("id", memory.id)
        .single();
      if (data) {
        setMemory((prev) => ({ ...prev, ...data }));
        if (data.transcript) setTranscriptDraft(data.transcript);
      }
      // Offer undo for 30 seconds in case the user wants to restore manual edits
      if (savedTranscript) {
        setPreviousTranscript(savedTranscript);
        if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
        undoTimerRef.current = setTimeout(() => setPreviousTranscript(null), 30000);
      }
    } else {
      setMemory((prev) => ({ ...prev, transcript_status: "failed" }));
    }
    setRetranscribing(false);
  }

  async function handleUndoRetranscribe() {
    if (!previousTranscript) return;
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    const restored = previousTranscript;
    setPreviousTranscript(null);
    setTranscriptDraft(restored);
    setMemory((prev) => ({ ...prev, transcript: restored, transcript_status: "ready" }));
    await supabase
      .from("memories")
      .update({ transcript: restored, transcript_draft: null, transcript_status: "ready" })
      .eq("id", memory.id);
  }

  async function handleDelete() {
    if (!confirmingDelete) { setConfirmingDelete(true); return; }
    await fetch(`/api/memories/${memory.id}`, { method: "DELETE" });
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

  // Paragraph-level seeking: split transcript and estimate timestamps by char position
  const paragraphs = useMemo(
    () => buildParagraphs(memory.transcript ?? "", resolvedDuration),
    [memory.transcript, resolvedDuration]
  );

  // Which paragraph is currently active based on playback position
  const canSeek = memory.type === "audio" && !!memory.storage_url && !!resolvedDuration;
  const activeParagraphIndex = canSeek && paragraphs.length > 0
    ? paragraphs.reduce<number>((best, para, i) => para.startTime <= currentAudioTime ? i : best, 0)
    : -1;

  // Scroll the active paragraph into view while audio plays (no-op if already visible)
  useEffect(() => {
    if (transcriptEditMode || activeParagraphIndex < 0 || !transcriptContainerRef.current) return;
    const el = transcriptContainerRef.current.querySelector<HTMLElement>(`[data-para="${activeParagraphIndex}"]`);
    el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [activeParagraphIndex, transcriptEditMode]);

  const filteredPeople = tagSearch.trim()
    ? allPeople.filter((p) =>
        `${p.first_name} ${p.last_name}`.toLowerCase().includes(tagSearch.toLowerCase())
      )
    : allPeople;

  const eyebrowDate = memory.date_of_memory
    ? formatDate(memory.date_of_memory)
    : formatDate(memory.created_at);

  const topLevelComments = comments.filter((c) => !c.parent_id);
  const replies = (parentId: string) => comments.filter((c) => c.parent_id === parentId);

  const showLiveIndicator = ["pending", "streaming", "finalizing"].includes(memory.transcript_status);

  return (
    <div className="min-h-screen bg-[--canvas]">
      <AppNav />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        {/* Eyebrow */}
        <p className="eyebrow mb-3">
          {TYPE_LABELS[memory.type] ?? "MEMORY"} · RECORDED BY {recorderDisplayName.toUpperCase()} · {eyebrowDate.toUpperCase()}
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
              ref={audioPlayerRef}
              src={memory.storage_url}
              playbackRate={playbackRate}
              onTimeUpdate={setCurrentAudioTime}
              onDurationChange={setResolvedDuration}
              className="text-[--accent]"
            />
            {memory.duration_sec && (
              <p className="font-mono text-[11px] text-[--ink-mute] mt-2">
                {fmtDuration(memory.duration_sec)}
              </p>
            )}
          </div>
        )}

        {/* Retranscribe prompt — audio with no transcript */}
        {memory.type === "audio" && memory.storage_url && canEdit &&
          (memory.transcript_status === "none" || memory.transcript_status === "failed") && (
          <div className="bg-[--surface] border border-[--rule] rounded-xl px-5 py-4 mb-8 flex items-center justify-between gap-4">
            <p className="text-sm text-[--ink-soft]">
              {memory.transcript_status === "failed"
                ? "Transcription failed. You can try again."
                : "No transcript yet for this recording."}
            </p>
            <button
              onClick={handleRetranscribe}
              disabled={retranscribing}
              className="flex-shrink-0 flex items-center gap-1.5 text-sm bg-[--accent] text-white px-4 py-2 rounded-lg hover:bg-[--accent-hover] disabled:opacity-50 transition-colors"
            >
              {retranscribing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {retranscribing ? "Transcribing…" : "Generate Transcript"}
            </button>
          </div>
        )}

        {/* People chips + tag editor */}
        <div className="mb-8">
          {!editingTags ? (
            <div className="flex flex-wrap items-center gap-2">
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
              {canEdit && (
                <button
                  onClick={() => setEditingTags(true)}
                  className="flex items-center gap-1 text-xs text-[--ink-mute] hover:text-[--ink] border border-dashed border-[--rule] rounded-full px-3 py-1 transition-colors"
                >
                  <Users className="w-3 h-3" />
                  Edit people
                </button>
              )}
            </div>
          ) : (
            <div className="bg-[--surface] border border-[--rule] rounded-xl p-4">
              <p className="eyebrow mb-3">People in this memory</p>
              <div className="relative mb-3">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[--ink-mute]" />
                <input
                  type="text"
                  value={tagSearch}
                  onChange={(e) => setTagSearch(e.target.value)}
                  placeholder="Search people…"
                  className="w-full pl-8 pr-3 py-1.5 border border-[--rule] bg-[--canvas] rounded-lg text-sm text-[--ink] placeholder:text-[--ink-mute] focus:outline-none focus:border-[--gold]"
                />
              </div>
              <div className="flex flex-wrap gap-2 mb-4 max-h-48 overflow-y-auto">
                {filteredPeople.map((p) => {
                  const selected = taggedIds.has(p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setTaggedIds((prev) => {
                        const next = new Set(prev);
                        if (next.has(p.id)) next.delete(p.id); else next.add(p.id);
                        return next;
                      })}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${
                        selected
                          ? "bg-[--accent] border-[--accent] text-white"
                          : "border-[--rule] text-[--ink-soft] hover:border-[--gold]"
                      }`}
                    >
                      {selected && <Check className="w-3 h-3" />}
                      {p.first_name} {p.last_name}
                    </button>
                  );
                })}
                {filteredPeople.length === 0 && (
                  <p className="text-sm text-[--ink-mute] italic">No people match "{tagSearch}"</p>
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setTaggedIds(new Set(taggedPeople.map((p) => p.id))); setTagSearch(""); setEditingTags(false); }} className="flex-1 border border-[--rule] text-[--ink-soft] py-1.5 rounded-lg text-sm hover:bg-[--canvas]">
                  Cancel
                </button>
                <button onClick={saveTags} className="flex-1 bg-[--accent] text-white py-1.5 rounded-lg text-sm hover:bg-[--accent-hover]">
                  Save
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Two-column layout */}
        <div className="flex gap-10 items-start">
          {/* Transcript — left, 60ch */}
          <div className="flex-1 min-w-0">
            {(() => {
              const wordCount = memory.transcript ? memory.transcript.trim().split(/\s+/).length : 0;
              const isLong = memory.transcript_status === "ready" && wordCount >= 300;
              const hasSummary = !!memory.transcript_summary;
              // Show clickable paragraphs when: audio with duration, transcript ready, not editing
              const showClickable = canSeek && memory.transcript_status === "ready" && paragraphs.length > 0 && !transcriptEditMode;
              // Show textarea when: canEdit and (editing mode OR no transcript yet)
              const showTextarea = canEdit && (transcriptEditMode || memory.transcript_status === "none");

              return (
                <>
                  <div className="flex items-center gap-2 mb-4">
                    <p className="eyebrow">Transcript</p>
                    {/* Edit/done toggle for canEdit users when transcript is ready */}
                    {canEdit && memory.transcript_status === "ready" && !transcriptEditMode && !showLiveIndicator && (
                      <button
                        onClick={() => setTranscriptEditMode(true)}
                        className="p-1 text-[--ink-mute] hover:text-[--ink] transition-colors rounded"
                        title="Edit transcript"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                    )}
                    {canEdit && transcriptEditMode && (
                      <button
                        onClick={() => { commitTranscript(); setTranscriptEditMode(false); }}
                        className="flex items-center gap-1 text-[10px] font-mono text-[--gold] hover:text-[--ink] transition-colors"
                      >
                        <Check className="w-3 h-3" />
                        Done
                      </button>
                    )}
                    {/* Re-transcribe: opens inline confirmation before overwriting */}
                    {canEdit && memory.transcript_status === "ready" && memory.storage_url && !transcriptEditMode && !showLiveIndicator && !confirmingRetranscribe && (
                      <button
                        onClick={() => setConfirmingRetranscribe(true)}
                        disabled={retranscribing}
                        className="p-1 text-[--ink-mute] hover:text-[--ink] disabled:opacity-40 transition-colors rounded"
                        title="Re-run transcription"
                      >
                        <RefreshCw className={`w-3 h-3 ${retranscribing ? "animate-spin" : ""}`} />
                      </button>
                    )}
                    {showLiveIndicator && (
                      <span className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-[0.06em] text-[--gold]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[--gold] animate-pulse" />
                        {memory.transcript_status === "finalizing" ? "Improving accuracy…" : "Live"}
                      </span>
                    )}
                    {memory.transcript_status === "ready" && transcriptSaving && (
                      <Loader2 className="w-3.5 h-3.5 text-[--ink-mute] animate-spin" />
                    )}
                    {memory.transcript_status === "ready" && transcriptSaved && !transcriptSaving && (
                      <span className="flex items-center gap-1 text-[10px] font-mono text-green-600">
                        <Check className="w-3 h-3" />
                        Saved
                      </span>
                    )}
                  </div>

                  {/* Retranscribe confirmation */}
                  {confirmingRetranscribe && (
                    <div className="flex items-center justify-between gap-3 mb-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                      <p className="text-[13px] text-amber-800 leading-snug">
                        Re-transcribing will replace this transcript and remove any manual edits.
                      </p>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => setConfirmingRetranscribe(false)}
                          className="text-[13px] text-[--ink-mute] hover:text-[--ink] transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleRetranscribe}
                          className="text-[13px] bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-lg transition-colors"
                        >
                          Re-transcribe
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Undo banner — visible for 30s after a successful re-transcription */}
                  {previousTranscript !== null && (
                    <div className="flex items-center justify-between gap-3 mb-4 bg-[--accent-soft] border border-[--rule] rounded-xl px-4 py-3">
                      <p className="text-[13px] text-[--ink-soft]">Transcript updated from audio.</p>
                      <button
                        onClick={handleUndoRetranscribe}
                        className="text-[13px] font-medium text-[--accent] hover:text-[--accent-hover] transition-colors flex-shrink-0"
                      >
                        Undo
                      </button>
                    </div>
                  )}

                  {/* Summary section for long transcripts */}
                  {isLong && (summarizing || hasSummary) && (
                    <div className="mb-6">
                      {summarizing && !hasSummary ? (
                        <div className="space-y-2 animate-pulse">
                          <div className="h-4 bg-[--rule] rounded w-3/4" />
                          <div className="h-4 bg-[--rule] rounded w-full" />
                          <div className="h-4 bg-[--rule] rounded w-2/3" />
                        </div>
                      ) : (
                        <p className="text-[17px] leading-[1.6] text-[--ink] max-w-[60ch]">
                          {memory.transcript_summary}
                        </p>
                      )}
                      <button
                        onClick={() => setSummaryExpanded((v) => !v)}
                        className="mt-3 flex items-center gap-1.5 text-[13px] font-mono text-[--ink-mute] hover:text-[--ink] transition-colors"
                      >
                        <span className={`transition-transform ${summaryExpanded ? "rotate-180" : ""}`}>▼</span>
                        {summaryExpanded ? "Hide" : "Read full transcript"} ({wordCount.toLocaleString()} words)
                      </button>
                    </div>
                  )}

                  {/* Full transcript — always visible if short, collapsible if long */}
                  {(!isLong || !hasSummary || summaryExpanded) && (
                    <>
                      {/* Live / streaming: plain text only */}
                      {showLiveIndicator && (
                        <p className="text-[17px] leading-[1.55] text-[--ink] max-w-[60ch] whitespace-pre-wrap">
                          {memory.transcript || <span className="text-[--ink-mute] italic">Transcribing…</span>}
                        </p>
                      )}

                      {/* Clickable paragraph view — audio memories with a ready transcript */}
                      {!showLiveIndicator && showClickable && (
                        <div ref={transcriptContainerRef} className="space-y-1 -mx-3">
                          {paragraphs.map((para, i) => {
                            const isActive = i === activeParagraphIndex;
                            return (
                              <div
                                key={i}
                                data-para={i}
                                onClick={() => audioPlayerRef.current?.seekTo(para.startTime)}
                                className={`group relative rounded-lg px-3 py-2 cursor-pointer transition-colors ${
                                  isActive
                                    ? "bg-[--accent-soft]"
                                    : "hover:bg-[--surface-alt]"
                                }`}
                              >
                                <span
                                  className={`block font-mono text-[10px] tracking-[0.04em] mb-1 transition-opacity ${
                                    isActive
                                      ? "text-[--accent] opacity-100"
                                      : "text-[--gold] opacity-0 group-hover:opacity-100"
                                  }`}
                                >
                                  {fmtTime(para.startTime)}
                                </span>
                                <p className="text-[17px] leading-[1.55] text-[--ink] max-w-[60ch] whitespace-pre-wrap">
                                  {para.text}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Editable textarea */}
                      {!showLiveIndicator && showTextarea && (
                        <textarea
                          value={transcriptDraft}
                          onChange={handleTranscriptChange}
                          onBlur={commitTranscript}
                          placeholder={memory.transcript_status === "none" ? "No transcript yet. You can type one here." : ""}
                          rows={Math.max(12, transcriptDraft.split("\n").length + 2)}
                          className="w-full min-h-[20rem] text-[17px] leading-[1.55] text-[--ink] bg-transparent resize-y outline-none placeholder:text-[--ink-mute] max-w-[60ch] border border-transparent hover:border-[--rule] focus:border-[--gold] rounded-lg px-2 -mx-2 py-1 transition-colors"
                        />
                      )}

                      {/* Plain text — non-audio memories or when audio has no duration yet */}
                      {!showLiveIndicator && !showClickable && !showTextarea && (
                        <p className="text-[17px] leading-[1.55] text-[--ink] max-w-[60ch] whitespace-pre-wrap">
                          {memory.transcript || (
                            <span className="text-[--ink-mute] italic">
                              {memory.transcript_status === "none" ? "No transcript yet." : "Transcribing…"}
                            </span>
                          )}
                        </p>
                      )}
                    </>
                  )}

                  {memory.transcript_status === "failed" && (
                    <div className="mt-4 bg-[--accent-soft] border border-[--rule] rounded-xl px-4 py-3 text-sm text-[--ink-soft]">
                      Transcription failed. {canEdit && "You can type the transcript above."}
                    </div>
                  )}
                </>
              );
            })()}
          </div>

          {/* Sidebar — right, 280px, sticky */}
          <aside className="hidden lg:block w-[280px] flex-shrink-0 sticky top-16">
            {/* About this recording */}
            <div className="bg-[--surface] border border-[--rule] rounded-xl p-5 mb-4">
              <p className="eyebrow mb-3">About this recording</p>
              <dl className="space-y-3 text-sm">
                {/* Date of memory — editable */}
                <div>
                  <dt className="text-[--ink-mute] text-[12px] font-mono uppercase tracking-[0.04em] mb-0.5">Date</dt>
                  {editingDate ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="date"
                        value={dateDraft}
                        onChange={(e) => setDateDraft(e.target.value)}
                        className="flex-1 border border-[--rule] bg-[--canvas] rounded px-2 py-1 text-sm text-[--ink] focus:outline-none focus:border-[--gold]"
                      />
                      <button onClick={saveDate} className="p-1 text-[--gold]"><Check className="w-4 h-4" /></button>
                      <button onClick={() => { setDateDraft(memory.date_of_memory ?? ""); setEditingDate(false); }} className="p-1 text-[--ink-mute]"><X className="w-4 h-4" /></button>
                    </div>
                  ) : (
                    <dd className="text-[--ink] flex items-center gap-1.5 group">
                      <span>
                        {memory.recorded_at_note || (memory.recorded_at || memory.date_of_memory)
                          ? formatDate((memory.recorded_at || memory.date_of_memory)!)
                          : <span className="text-[--ink-mute] italic">Not set</span>}
                      </span>
                      {canEdit && (
                        <button onClick={() => setEditingDate(true)} className="opacity-0 group-hover:opacity-100 text-[--ink-mute] hover:text-[--ink] transition-all">
                          <Pencil className="w-3 h-3" />
                        </button>
                      )}
                    </dd>
                  )}
                </div>

                {memory.duration_sec && (
                  <div>
                    <dt className="text-[--ink-mute] text-[12px] font-mono uppercase tracking-[0.04em]">Duration</dt>
                    <dd className="text-[--ink] mt-0.5">{fmtDuration(memory.duration_sec)}</dd>
                  </div>
                )}

                {/* Recorded by — editable */}
                <div>
                  <dt className="text-[--ink-mute] text-[12px] font-mono uppercase tracking-[0.04em] mb-0.5">Recorded by</dt>
                  {editingRecorder ? (
                    <div className="flex items-center gap-1.5">
                      <select
                        value={memory.recorded_by}
                        onChange={(e) => saveRecorder(e.target.value)}
                        className="flex-1 border border-[--rule] bg-[--canvas] rounded px-2 py-1 text-sm text-[--ink] focus:outline-none focus:border-[--gold]"
                      >
                        {familyMembers.map((m) => (
                          <option key={m.user_id} value={m.user_id}>
                            {m.display_name ?? "Family member"}
                          </option>
                        ))}
                      </select>
                      <button onClick={() => setEditingRecorder(false)} className="p-1 text-[--ink-mute]"><X className="w-4 h-4" /></button>
                    </div>
                  ) : (
                    <dd className="text-[--ink] flex items-center gap-1.5 group">
                      <span>{recorderDisplayName}</span>
                      {canEdit && (
                        <button onClick={() => setEditingRecorder(true)} className="opacity-0 group-hover:opacity-100 text-[--ink-mute] hover:text-[--ink] transition-all">
                          <Pencil className="w-3 h-3" />
                        </button>
                      )}
                    </dd>
                  )}
                </div>

                <div>
                  <dt className="text-[--ink-mute] text-[12px] font-mono uppercase tracking-[0.04em]">Date added</dt>
                  <dd className="text-[--ink] mt-0.5">{formatDate(memory.created_at)}</dd>
                </div>

                {/* Description — editable */}
                <div>
                  <dt className="text-[--ink-mute] text-[12px] font-mono uppercase tracking-[0.04em] mb-0.5">Description</dt>
                  {editingDescription ? (
                    <div className="space-y-1.5">
                      <textarea
                        value={descriptionDraft}
                        onChange={(e) => setDescriptionDraft(e.target.value)}
                        rows={3}
                        placeholder="Add a caption or note…"
                        className="w-full border border-[--rule] bg-[--canvas] rounded-lg px-2 py-1.5 text-sm text-[--ink] placeholder:text-[--ink-mute] focus:outline-none focus:border-[--gold] resize-none"
                      />
                      <div className="flex gap-1.5">
                        <button onClick={() => { setDescriptionDraft(memory.description ?? ""); setEditingDescription(false); }} className="flex-1 border border-[--rule] text-[--ink-soft] py-1 rounded text-xs hover:bg-[--canvas]">Cancel</button>
                        <button onClick={saveDescription} className="flex-1 bg-[--accent] text-white py-1 rounded text-xs hover:bg-[--accent-hover]">Save</button>
                      </div>
                    </div>
                  ) : (
                    <dd className="text-[--ink] flex items-start gap-1.5 group">
                      <span className="flex-1 leading-relaxed">
                        {memory.description || <span className="text-[--ink-mute] italic">None</span>}
                      </span>
                      {canEdit && (
                        <button onClick={() => setEditingDescription(true)} className="flex-shrink-0 opacity-0 group-hover:opacity-100 text-[--ink-mute] hover:text-[--ink] transition-all mt-0.5">
                          <Pencil className="w-3 h-3" />
                        </button>
                      )}
                    </dd>
                  )}
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
              confirmingDelete ? (
                <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                  <p className="text-sm text-red-700 font-medium mb-3">Delete this memory permanently?</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setConfirmingDelete(false)}
                      className="flex-1 text-sm border border-[--rule] text-[--ink-soft] py-1.5 rounded-lg hover:bg-[--canvas] transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDelete}
                      className="flex-1 text-sm bg-red-600 text-white py-1.5 rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleDelete}
                  className="mt-4 flex items-center gap-1.5 text-sm text-red-600 hover:text-red-700 transition-colors w-full justify-center py-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete memory
                </button>
              )
            )}
          </aside>
        </div>

        {/* Mobile: comments below transcript */}
        <div className="lg:hidden mt-10">
          <div className="bg-[--surface] border border-[--rule] rounded-xl p-5 mb-4">
            <p className="eyebrow mb-3">About this recording</p>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-[--ink-mute] text-[12px] font-mono uppercase tracking-[0.04em] mb-0.5">Date</dt>
                {editingDate ? (
                  <div className="flex items-center gap-1.5">
                    <input type="date" value={dateDraft} onChange={(e) => setDateDraft(e.target.value)}
                      className="flex-1 border border-[--rule] bg-[--canvas] rounded px-2 py-1 text-sm text-[--ink] focus:outline-none focus:border-[--gold]" />
                    <button onClick={saveDate} className="p-1 text-[--gold]"><Check className="w-4 h-4" /></button>
                    <button onClick={() => { setDateDraft(memory.date_of_memory ?? ""); setEditingDate(false); }} className="p-1 text-[--ink-mute]"><X className="w-4 h-4" /></button>
                  </div>
                ) : (
                  <dd className="text-[--ink] flex items-center gap-1.5 group">
                    <span>{(memory.recorded_at || memory.date_of_memory) ? formatDate((memory.recorded_at || memory.date_of_memory)!) : <span className="text-[--ink-mute] italic">Not set</span>}</span>
                    {canEdit && <button onClick={() => setEditingDate(true)} className="opacity-0 group-hover:opacity-100 text-[--ink-mute] hover:text-[--ink] transition-all"><Pencil className="w-3 h-3" /></button>}
                  </dd>
                )}
              </div>
              {memory.duration_sec && (
                <div>
                  <dt className="text-[--ink-mute] text-[12px] font-mono uppercase tracking-[0.04em]">Duration</dt>
                  <dd className="text-[--ink] mt-0.5">{fmtDuration(memory.duration_sec)}</dd>
                </div>
              )}
              <div>
                <dt className="text-[--ink-mute] text-[12px] font-mono uppercase tracking-[0.04em] mb-0.5">Recorded by</dt>
                {editingRecorder ? (
                  <div className="flex items-center gap-1.5">
                    <select
                      value={memory.recorded_by}
                      onChange={(e) => saveRecorder(e.target.value)}
                      className="flex-1 border border-[--rule] bg-[--canvas] rounded px-2 py-1 text-sm text-[--ink] focus:outline-none focus:border-[--gold]"
                    >
                      {familyMembers.map((m) => (
                        <option key={m.user_id} value={m.user_id}>
                          {m.display_name ?? "Family member"}
                        </option>
                      ))}
                    </select>
                    <button onClick={() => setEditingRecorder(false)} className="p-1 text-[--ink-mute]"><X className="w-4 h-4" /></button>
                  </div>
                ) : (
                  <dd className="text-[--ink] flex items-center gap-1.5 group">
                    <span>{recorderDisplayName}</span>
                    {canEdit && (
                      <button onClick={() => setEditingRecorder(true)} className="opacity-0 group-hover:opacity-100 text-[--ink-mute] hover:text-[--ink] transition-all">
                        <Pencil className="w-3 h-3" />
                      </button>
                    )}
                  </dd>
                )}
              </div>
              <div>
                <dt className="text-[--ink-mute] text-[12px] font-mono uppercase tracking-[0.04em]">Date added</dt>
                <dd className="text-[--ink] mt-0.5">{formatDate(memory.created_at)}</dd>
              </div>
              <div>
                <dt className="text-[--ink-mute] text-[12px] font-mono uppercase tracking-[0.04em] mb-0.5">Description</dt>
                {editingDescription ? (
                  <div className="space-y-1.5">
                    <textarea value={descriptionDraft} onChange={(e) => setDescriptionDraft(e.target.value)} rows={3} placeholder="Add a caption or note…"
                      className="w-full border border-[--rule] bg-[--canvas] rounded-lg px-2 py-1.5 text-sm text-[--ink] placeholder:text-[--ink-mute] focus:outline-none focus:border-[--gold] resize-none" />
                    <div className="flex gap-1.5">
                      <button onClick={() => { setDescriptionDraft(memory.description ?? ""); setEditingDescription(false); }} className="flex-1 border border-[--rule] text-[--ink-soft] py-1 rounded text-xs">Cancel</button>
                      <button onClick={saveDescription} className="flex-1 bg-[--accent] text-white py-1 rounded text-xs">Save</button>
                    </div>
                  </div>
                ) : (
                  <dd className="text-[--ink] flex items-start gap-1.5 group">
                    <span className="flex-1 leading-relaxed">{memory.description || <span className="text-[--ink-mute] italic">None</span>}</span>
                    {canEdit && <button onClick={() => setEditingDescription(true)} className="flex-shrink-0 opacity-0 group-hover:opacity-100 text-[--ink-mute] hover:text-[--ink] transition-all mt-0.5"><Pencil className="w-3 h-3" /></button>}
                  </dd>
                )}
              </div>
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
            confirmingDelete ? (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                <p className="text-sm text-red-700 font-medium mb-3">Delete this memory permanently?</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setConfirmingDelete(false)}
                    className="flex-1 text-sm border border-[--rule] text-[--ink-soft] py-1.5 rounded-lg hover:bg-[--canvas] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    className="flex-1 text-sm bg-red-600 text-white py-1.5 rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={handleDelete}
                className="mt-4 flex items-center gap-1.5 text-sm text-red-600 hover:text-red-700 transition-colors w-full justify-center py-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete memory
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}
