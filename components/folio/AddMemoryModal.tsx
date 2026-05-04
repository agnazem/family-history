"use client";

import { useState, useEffect, useRef } from "react";
import { Modal } from "@/components/ui/Modal";
import { AudioRecorder } from "./AudioRecorder";
import { createClient } from "@/lib/supabase/client";
import { Mic, Image as ImageIcon, FileText, PenLine, Check } from "lucide-react";
import type { MemoryType, Person } from "@/types";

interface AddMemoryModalProps {
  open: boolean;
  onClose: () => void;
  personId: string;
  familyId: string;
  familyPeople: Person[];
  onAdded: () => void;
}

const MEMORY_TYPES: { type: MemoryType; label: string; icon: React.ReactNode }[] = [
  { type: "audio", label: "Voice Memory", icon: <Mic className="w-4 h-4" /> },
  { type: "photo", label: "Photo", icon: <ImageIcon className="w-4 h-4" /> },
  { type: "document", label: "Artifact / Doc", icon: <FileText className="w-4 h-4" /> },
  { type: "note", label: "Written Note", icon: <PenLine className="w-4 h-4" /> },
];

export function AddMemoryModal({
  open,
  onClose,
  personId,
  familyId,
  familyPeople,
  onAdded,
}: AddMemoryModalProps) {
  const [memType, setMemType] = useState<MemoryType>("audio");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [taggedIds, setTaggedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Streaming recording state
  const [recordingId, setRecordingId] = useState<string | null>(null);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [transcriptStatus, setTranscriptStatus] = useState("none");
  const startedRef = useRef(false);

  const supabase = createClient();
  const otherPeople = familyPeople.filter((p) => p.id !== personId);

  // Start a draft recording when audio tab is first focused and modal is open
  useEffect(() => {
    if (!open || memType !== "audio" || startedRef.current) return;
    startedRef.current = true;
    fetch("/api/recordings/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ familyId, personIds: [personId] }),
    })
      .then((r) => r.json())
      .then(({ recordingId: id }) => setRecordingId(id))
      .catch(() => {});
  }, [open, memType, familyId, personId]);

  // Subscribe to live transcript updates via Supabase Realtime
  useEffect(() => {
    if (!recordingId) return;
    const channel = supabase
      .channel(`modal-recording-${recordingId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "memories", filter: `id=eq.${recordingId}` },
        (payload) => {
          if (payload.new.transcript) setLiveTranscript(payload.new.transcript as string);
          if (payload.new.transcript_status) setTranscriptStatus(payload.new.transcript_status as string);
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [recordingId]);

  function toggleTag(pid: string) {
    setTaggedIds((prev) => {
      const next = new Set(prev);
      if (next.has(pid)) next.delete(pid);
      else next.add(pid);
      return next;
    });
  }

  function reset() {
    setTitle("");
    setDescription("");
    setAudioBlob(null);
    setFile(null);
    setTaggedIds(new Set());
    setError(null);
    setMemType("audio");
    setRecordingId(null);
    setLiveTranscript("");
    setTranscriptStatus("none");
    startedRef.current = false;
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Audio: upload blob + finalize draft memory
    if (memType === "audio" && audioBlob && recordingId) {
      const mime = (audioBlob.type || "audio/webm").split(";")[0].trim();
      const ext = mime === "audio/mp4" ? "mp4" : mime === "audio/ogg" ? "ogg" : "webm";
      const path = `${familyId}/${personId}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("audio")
        .upload(path, audioBlob, { contentType: mime });
      if (uploadError) { setError(uploadError.message); setLoading(false); return; }

      const { data: urlData } = supabase.storage.from("audio").getPublicUrl(path);
      const storageUrl = urlData.publicUrl;

      // Tag additional people
      const extraIds = Array.from(taggedIds).filter((id) => id !== personId);
      if (extraIds.length > 0) {
        await supabase.from("memory_people").insert(
          extraIds.map((pid) => ({ memory_id: recordingId, person_id: pid, family_id: familyId }))
        );
      }

      const fd = new FormData();
      fd.append("title", title.trim() || "Voice memory");
      fd.append("storageUrl", storageUrl);
      fd.append("audio", audioBlob, `recording.${ext}`);
      const res = await fetch(`/api/recordings/${recordingId}/finalize`, { method: "POST", body: fd });
      if (!res.ok) { setError("Failed to save recording."); setLoading(false); return; }

      onAdded();
      handleClose();
      setLoading(false);
      return;
    }

    // Non-audio: existing create_memory_with_people flow
    let storageUrl: string | null = null;

    if ((memType === "photo" || memType === "document") && file) {
      const bucket = memType === "photo" ? "photos" : "artifacts";
      const path = `${familyId}/${personId}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from(bucket).upload(path, file);
      if (uploadError) { setError(uploadError.message); setLoading(false); return; }
      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      storageUrl = data.publicUrl;
    }

    const allTagged = [personId, ...Array.from(taggedIds)];
    const { error: insertError } = await supabase.rpc("create_memory_with_people", {
      p_family_id: familyId,
      p_type: memType,
      p_title: title || (memType === "audio" ? "Voice Recording" : "Memory"),
      p_description: description || null,
      p_storage_url: storageUrl,
      p_recorded_by: user.id,
      p_date_of_memory: null,
      p_person_ids: allTagged,
    });

    if (insertError) { setError(insertError.message); setLoading(false); return; }
    onAdded();
    handleClose();
    setLoading(false);
  }

  const needsFile = memType === "photo" || memType === "document";
  const isValid =
    title.trim() &&
    (memType === "note"
      || (memType === "audio" && audioBlob)
      || (needsFile && file));

  return (
    <Modal open={open} onClose={handleClose} title="Add Memory" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type selector */}
        <div className="flex gap-2">
          {MEMORY_TYPES.map(({ type, label, icon }) => (
            <button
              key={type}
              type="button"
              onClick={() => { setMemType(type); setAudioBlob(null); setFile(null); }}
              className={`flex-1 flex flex-col items-center gap-1 py-2 px-1 rounded-lg border text-xs font-medium transition-colors ${
                memType === type
                  ? "bg-[--canvas] border-[--gold] text-[--accent]"
                  : "border-[--rule] text-[--ink-soft] hover:border-[--gold]"
              }`}
            >
              {icon}
              {label}
            </button>
          ))}
        </div>

        <div>
          <label className="block text-xs font-medium text-[--ink-soft] mb-1">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full border border-[--rule] bg-[--surface] rounded-lg px-3 py-2 text-sm text-[--ink] placeholder:text-[--ink-mute] focus:outline-none focus:border-[--gold]"
            placeholder={
              memType === "audio" ? "e.g. Grandma's childhood story" :
              memType === "photo" ? "e.g. Summer 1965" :
              memType === "document" ? "e.g. Wedding certificate" :
              "e.g. What I remember most"
            }
          />
        </div>

        {memType === "audio" && (
          <AudioRecorder
            recorded={audioBlob}
            onRecorded={setAudioBlob}
            onClear={() => setAudioBlob(null)}
            recordingId={recordingId ?? undefined}
            liveTranscript={liveTranscript || undefined}
            transcriptStatus={transcriptStatus}
          />
        )}

        {needsFile && (
          <div>
            <label className="block text-xs font-medium text-[--ink-soft] mb-1">
              {memType === "photo" ? "Photo" : "File"}
            </label>
            <input
              type="file"
              required
              accept={memType === "photo" ? "image/*" : undefined}
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="w-full text-sm text-[--ink-soft] file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[--canvas] file:text-[--accent] hover:file:bg-[--accent-soft]"
            />
          </div>
        )}

        {(memType === "note" || memType === "photo" || memType === "document") && (
          <div>
            <label className="block text-xs font-medium text-[--ink-soft] mb-1">
              {memType === "note" ? "Your note *" : "Caption / Description"}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required={memType === "note"}
              rows={3}
              className="w-full border border-[--rule] bg-[--surface] rounded-lg px-3 py-2 text-sm text-[--ink] placeholder:text-[--ink-mute] focus:outline-none focus:border-[--gold] resize-none"
              placeholder={memType === "note" ? "Write your memory here..." : "Optional context or caption..."}
            />
          </div>
        )}

        {otherPeople.length > 0 && (
          <div>
            <label className="block text-xs font-medium text-[--ink-soft] mb-2">Also tag family members</label>
            <div className="flex flex-wrap gap-2">
              {otherPeople.map((p) => {
                const selected = taggedIds.has(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => toggleTag(p.id)}
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
            </div>
          </div>
        )}

        {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

        <div className="flex gap-2 pt-1">
          <button type="button" onClick={handleClose} className="flex-1 border border-[--rule] text-[--ink-soft] py-2 rounded-lg text-sm hover:bg-[--canvas]">
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !isValid}
            className="flex-1 bg-[--accent] text-white py-2 rounded-lg text-sm hover:bg-[--accent-hover] disabled:opacity-50 transition-colors"
          >
            {loading ? "Saving…" : "Save Memory"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
