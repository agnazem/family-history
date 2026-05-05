"use client";

import { useState, useEffect, useRef, Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Check, Loader2, Sparkles } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useFamily } from "@/lib/hooks/useFamily";
import { AudioRecorder } from "@/components/folio/AudioRecorder";
import { debounce } from "@/lib/utils";
import type { Person } from "@/types";

type Phase = "record" | "details" | "saving";

interface Entity {
  name: string;
  type: "person" | "place" | "time";
  text: string;
  confirmed: boolean;
}

function RecordPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prompt = searchParams.get("prompt");

  const { family, loading: familyLoading } = useFamily();
  const supabase = createClient();

  const [phase, setPhase] = useState<Phase>("record");
  const [people, setPeople] = useState<Person[]>([]);
  const [recordingId, setRecordingId] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [transcriptStatus, setTranscriptStatus] = useState("none");
  const [title, setTitle] = useState("");
  const [taggedIds, setTaggedIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  // Live AI context
  const [entities, setEntities] = useState<Entity[]>([]);
  const [nextPrompts, setNextPrompts] = useState<string[]>([]);
  const [aiLoading, setAiLoading] = useState(false);

  const startedRef = useRef(false);

  useEffect(() => {
    if (!family?.id) return;
    supabase
      .from("people")
      .select("id, first_name, last_name, dob, dod")
      .eq("family_id", family.id)
      .order("first_name")
      .then(({ data }) => setPeople((data ?? []) as Person[]));
  }, [family?.id]);

  useEffect(() => {
    if (!family?.id || startedRef.current) return;
    startedRef.current = true;
    fetch("/api/recordings/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ familyId: family.id, personIds: [] }),
    })
      .then((r) => r.json())
      .then(({ recordingId: id }) => setRecordingId(id))
      .catch(() => {});
  }, [family?.id]);

  useEffect(() => {
    if (!recordingId) return;
    const channel = supabase
      .channel(`record-page-${recordingId}`)
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

  // Debounced AI context extraction
  const fetchAiContext = useCallback(
    debounce(async (text: string) => {
      if (text.trim().split(/\s+/).length < 20) return;
      setAiLoading(true);
      try {
        const [entitiesRes, promptsRes] = await Promise.all([
          fetch("/api/ai/extract-entities", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ transcript: text }),
          }).then((r) => r.json()),
          fetch("/api/ai/next-prompts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ transcript: text, originalPrompt: prompt }),
          }).then((r) => r.json()),
        ]);
        setEntities(entitiesRes.entities ?? []);
        setNextPrompts(promptsRes.prompts ?? []);
      } catch {
        // silently ignore AI errors
      } finally {
        setAiLoading(false);
      }
    }, 4000),
    [prompt]
  );

  useEffect(() => {
    if (liveTranscript) fetchAiContext(liveTranscript);
  }, [liveTranscript, fetchAiContext]);

  function handleRecorded(blob: Blob) {
    setAudioBlob(blob);
    setPhase("details");
  }

  function handleReRecord() {
    setAudioBlob(null);
    setPhase("record");
  }

  function toggleTag(pid: string) {
    setTaggedIds((prev) => {
      const next = new Set(prev);
      if (next.has(pid)) next.delete(pid);
      else next.add(pid);
      return next;
    });
  }

  async function handleSave() {
    if (!recordingId || !audioBlob || !family?.id) return;
    setPhase("saving");
    setError(null);

    const mime = (audioBlob.type || "audio/webm").split(";")[0].trim();
    const ext = mime === "audio/mp4" ? "mp4" : mime === "audio/ogg" ? "ogg" : "webm";
    const path = `${family.id}/untagged/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("audio")
      .upload(path, audioBlob, { contentType: mime });
    if (uploadError) {
      setError(uploadError.message);
      setPhase("details");
      return;
    }

    const { data: urlData } = supabase.storage.from("audio").getPublicUrl(path);
    const storageUrl = urlData.publicUrl;

    const personIdList = Array.from(taggedIds);
    if (personIdList.length > 0) {
      await supabase.from("memory_people").insert(
        personIdList.map((pid) => ({
          memory_id: recordingId,
          person_id: pid,
          family_id: family.id,
        }))
      );
    }

    const fd = new FormData();
    fd.append("title", title.trim() || "Voice memory");
    fd.append("storageUrl", storageUrl);
    fd.append("audio", audioBlob, `recording.${ext}`);

    const res = await fetch(`/api/recordings/${recordingId}/finalize`, { method: "POST", body: fd });
    if (!res.ok) {
      setError("Failed to save. Please try again.");
      setPhase("details");
      return;
    }

    router.push(`/memory/${recordingId}`);
  }

  if (familyLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[--canvas]">
        <p className="text-[--ink-soft]">Loading…</p>
      </div>
    );
  }

  const taggedPeople = people.filter((p) => taggedIds.has(p.id));
  const personEntities = entities.filter((e) => e.type === "person");
  const placeEntities = entities.filter((e) => e.type === "place");

  return (
    <div className="min-h-screen bg-[--canvas]">
      <header className="sticky top-0 z-20 bg-[--surface] border-b border-[--rule]">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link
            href="/home"
            className="p-1.5 -ml-1.5 text-[--ink-mute] hover:text-[--ink] transition-colors rounded-lg hover:bg-[--surface-alt]"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <span className="font-display italic text-[17px] text-[--ink] truncate">
            {family?.name ?? "Folio"}
          </span>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-10 lg:grid lg:grid-cols-[1fr_360px] lg:gap-14">
        {/* Left: recording phases */}
        <div>
          {phase === "record" && (
            <div className="space-y-8">
              <div>
                <p className="eyebrow mb-3">New voice memory</p>
                {prompt ? (
                  <p className="font-display font-normal text-[28px] leading-[1.2] tracking-[-0.02em] text-[--ink]">
                    &ldquo;{prompt}&rdquo;
                  </p>
                ) : (
                  <p className="font-display font-normal text-[28px] leading-[1.2] tracking-[-0.02em] text-[--ink]">
                    What story do you want to tell?
                  </p>
                )}
                <p className="text-[14px] text-[--ink-soft] mt-3 leading-snug">
                  Hit record and start talking. You&apos;ll add a title and tag people after.
                </p>
              </div>

              {recordingId ? (
                <AudioRecorder
                  recorded={audioBlob}
                  onRecorded={handleRecorded}
                  onClear={() => setAudioBlob(null)}
                  recordingId={recordingId}
                  liveTranscript={liveTranscript || undefined}
                  transcriptStatus={transcriptStatus}
                />
              ) : (
                <div className="flex items-center gap-3 bg-[--surface-alt] border border-[--rule] rounded-xl px-4 py-3">
                  <Loader2 className="w-4 h-4 text-[--ink-mute] animate-spin" />
                  <span className="text-sm text-[--ink-soft]">Setting up recording…</span>
                </div>
              )}
            </div>
          )}

          {(phase === "details" || phase === "saving") && (
            <div className="space-y-6">
              <div>
                <p className="eyebrow mb-1">Almost done</p>
                <h1 className="font-display text-[30px] font-normal text-[--ink] leading-[1.1] tracking-[-0.02em]">
                  Add a few details
                </h1>
              </div>

              {liveTranscript && (
                <div className="bg-[--surface] border border-[--rule] rounded-xl px-4 py-3">
                  <p className="eyebrow mb-1.5">Transcript preview</p>
                  <p className="text-[14px] leading-[1.55] text-[--ink-soft] line-clamp-4">
                    {liveTranscript}
                  </p>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-[--ink-soft] mb-1.5">
                  Title <span className="text-red-400">*</span>
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full border border-[--rule] bg-[--surface] rounded-lg px-3 py-2.5 text-sm text-[--ink] placeholder:text-[--ink-mute] focus:outline-none focus:border-[--gold]"
                  placeholder="e.g. Grandma's childhood story"
                  autoFocus
                />
              </div>

              {people.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-[--ink-soft] mb-2">
                    Who is this about?{" "}
                    <span className="text-[--ink-mute] font-normal">optional</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {people.map((p) => {
                      const selected = taggedIds.has(p.id);
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => toggleTag(p.id)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium transition-colors ${
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

              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleReRecord}
                  disabled={phase === "saving"}
                  className="flex-1 border border-[--rule] text-[--ink-soft] py-2.5 rounded-xl text-sm hover:bg-[--canvas] transition-colors disabled:opacity-40"
                >
                  Re-record
                </button>
                <button
                  onClick={handleSave}
                  disabled={!title.trim() || phase === "saving"}
                  className="flex-1 bg-[--accent] hover:bg-[--accent-hover] text-white py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {phase === "saving" ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving…
                    </>
                  ) : (
                    "Save memory"
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right: context rail — desktop only, record phase */}
        {phase === "record" && (
          <aside className="hidden lg:flex flex-col gap-4 sticky top-16 self-start pt-[1px]">
            {/* Who's telling this */}
            <div className="bg-[--surface] border border-[--rule] rounded-xl p-5">
              <p className="eyebrow mb-3">Who&apos;s telling this</p>
              {taggedPeople.length > 0 ? (
                <div className="space-y-2">
                  {taggedPeople.map((p) => (
                    <div key={p.id} className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-[--accent-soft] flex items-center justify-center flex-shrink-0">
                        <span className="font-mono text-[10px] text-[--accent] font-semibold">
                          {p.first_name[0]}
                        </span>
                      </div>
                      <span className="text-[14px] text-[--ink]">{p.first_name} {p.last_name}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[13px] text-[--ink-mute] italic">
                  Tag people after you finish recording.
                </p>
              )}
            </div>

            {/* Mentioned so far */}
            <div className="bg-[--surface] border border-[--rule] rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <p className="eyebrow">Mentioned so far</p>
                {aiLoading && <Loader2 className="w-3 h-3 text-[--ink-mute] animate-spin" />}
              </div>
              {entities.length > 0 ? (
                <div className="space-y-3">
                  {personEntities.length > 0 && (
                    <div>
                      <p className="font-mono text-[10px] tracking-[0.06em] uppercase text-[--ink-mute] mb-1.5">People</p>
                      <div className="flex flex-wrap gap-1.5">
                        {personEntities.map((e, i) => (
                          <span key={i} className="px-2.5 py-1 bg-[--accent-soft] text-[--accent] text-[12px] font-medium rounded-full">
                            {e.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {placeEntities.length > 0 && (
                    <div>
                      <p className="font-mono text-[10px] tracking-[0.06em] uppercase text-[--ink-mute] mb-1.5">Places</p>
                      <div className="flex flex-wrap gap-1.5">
                        {placeEntities.map((e, i) => (
                          <span key={i} className="px-2.5 py-1 bg-[--surface-alt] text-[--ink-soft] text-[12px] font-medium rounded-full">
                            {e.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-[13px] text-[--ink-mute] italic">
                  {liveTranscript
                    ? "Listening for names and places…"
                    : "Start recording to see who comes up."}
                </p>
              )}
            </div>

            {/* Gentle next prompts */}
            <div className="bg-[--surface] border border-[--rule] rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <p className="eyebrow">Gentle next prompts</p>
                <Sparkles className="w-3 h-3 text-[--gold]" />
              </div>
              {nextPrompts.length > 0 ? (
                <ol className="space-y-2.5">
                  {nextPrompts.map((p, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="font-mono text-[10px] text-[--ink-mute] mt-1 w-3 flex-shrink-0">{i + 1}</span>
                      <p className="text-[13px] text-[--ink-soft] leading-snug italic">{p}</p>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-[13px] text-[--ink-mute] italic">
                  {liveTranscript
                    ? "Thinking of follow-up questions…"
                    : "Questions to keep the story going will appear here."}
                </p>
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}

export default function RecordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[--canvas]">
          <p className="text-[--ink-soft]">Loading…</p>
        </div>
      }
    >
      <RecordPageInner />
    </Suspense>
  );
}
