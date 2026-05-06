"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Square, Plus, X, Check, ChevronRight, Loader2, Users, FileText, Link2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Person, RelationshipType } from "@/types";

// ── Types ────────────────────────────────────────────────────────────────────

interface MemorySuggestion {
  localId: string;
  checked: boolean;
  title: string;
  description: string;
  date_of_memory: string | null;
}

interface PersonSuggestion {
  localId: string;
  checked: boolean;
  first_name: string;
  last_name: string;
  relationship: RelationshipType;
  role: "parent" | "child" | "other";
  notes: string | null;
}

interface RelSuggestion {
  localId: string;
  checked: boolean;
  person_id: string;
  person_name: string;
  relationship: RelationshipType;
  role: "parent" | "child" | "other";
}

type Step = "idle" | "recording" | "processing" | "suggestions";

interface TellMeModalProps {
  open: boolean;
  onClose: () => void;
  person: Person;
  familyPeople: Person[];
  onComplete: () => void;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function relationshipLabel(rel: RelationshipType, role: "parent" | "child" | "other", subjectName: string): string {
  if (rel === "spouse") return `Spouse / partner of ${subjectName}`;
  if (rel === "sibling") return `Sibling of ${subjectName}`;
  if (rel === "parent_child") {
    if (role === "parent") return `Parent of ${subjectName}`;
    if (role === "child") return `Child of ${subjectName}`;
  }
  return `Related to ${subjectName}`;
}

let localIdCounter = 0;
function nextId() {
  return String(++localIdCounter);
}

const GUIDED_PROMPTS = [
  "How did you know them?",
  "What's a memory that stands out most?",
  "Who else was important in their life?",
  "What were they known for?",
  "Any stories you'd hate to lose?",
];

// ── Component ────────────────────────────────────────────────────────────────

export function TellMeModal({ open, onClose, person, familyPeople, onComplete }: TellMeModalProps) {
  const fullName = [person.first_name, person.middle_name, person.last_name].filter(Boolean).join(" ");
  const firstName = person.first_name;

  // Recording state
  const [step, setStep] = useState<Step>("idle");
  const [transcript, setTranscript] = useState("");
  const [elapsedSecs, setElapsedSecs] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [saveAudio, setSaveAudio] = useState(true);
  const [hasSpeechAPI, setHasSpeechAPI] = useState(false);
  const [fallbackText, setFallbackText] = useState("");

  // Suggestions
  const [memorySuggestions, setMemorySuggestions] = useState<MemorySuggestion[]>([]);
  const [personSuggestions, setPersonSuggestions] = useState<PersonSuggestion[]>([]);
  const [relSuggestions, setRelSuggestions] = useState<RelSuggestion[]>([]);
  const [summaryContribution, setSummaryContribution] = useState("");

  // Saving
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [processError, setProcessError] = useState<string | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const supabase = createClient();

  // Detect speech recognition support on mount
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    setHasSpeechAPI(!!(w.SpeechRecognition || w.webkitSpeechRecognition));
  }, []);

  // Cleanup on unmount or close
  useEffect(() => {
    if (!open) {
      stopEverything();
      setStep("idle");
      setTranscript("");
      setFallbackText("");
      setAudioBlob(null);
      setElapsedSecs(0);
      setMemorySuggestions([]);
      setPersonSuggestions([]);
      setRelSuggestions([]);
      setSummaryContribution("");
      setProcessError(null);
      setSaveError(null);
    }
  }, [open]);

  function stopEverything() {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  }

  async function startRecording() {
    setTranscript("");
    setElapsedSecs(0);
    chunksRef.current = [];

    // Start MediaRecorder for audio blob
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mr = new MediaRecorder(stream);
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
      };
      mr.start(1000);
      mediaRecorderRef.current = mr;
    } catch {
      // Mic permission denied — we can still show the fallback textarea
    }

    // Start speech recognition for live transcript
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;

    if (SR) {
      const recognition = new SR();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      let finalText = "";
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        let interim = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalText += result[0].transcript + " ";
          } else {
            interim = result[0].transcript;
          }
        }
        setTranscript(finalText + interim);
      };

      recognition.onerror = () => recognition.stop();
      recognition.onend = () => {
        // Auto-restart if still in recording mode
        if (mediaRecorderRef.current?.state === "recording") {
          try { recognition.start(); } catch { /* ignore */ }
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
    }

    // Timer
    timerRef.current = setInterval(() => setElapsedSecs((s) => s + 1), 1000);

    setStep("recording");
  }

  async function stopRecording() {
    if (timerRef.current) clearInterval(timerRef.current);
    recognitionRef.current?.stop();
    mediaRecorderRef.current?.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    setStep("processing");

    // Give MediaRecorder a moment to fire onstop and set the blob
    await new Promise((r) => setTimeout(r, 300));
    await analyzeTranscript(transcript || fallbackText);
  }

  async function analyzeTranscript(text: string) {
    setProcessError(null);
    const trimmed = text.trim();
    if (!trimmed) {
      setProcessError("No speech was captured. Try again or type below.");
      setStep("idle");
      return;
    }

    try {
      const res = await fetch("/api/ai/parse-recording", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: trimmed,
          personName: fullName,
          familyId: person.family_id,
          existingPeople: familyPeople
            .filter((p) => p.id !== person.id)
            .map((p) => ({ id: p.id, first_name: p.first_name, last_name: p.last_name, nickname: p.nickname ?? null, also_known_as: p.also_known_as ?? [] })),
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setMemorySuggestions(
        (data.memories ?? []).map((m: { title: string; description: string; date_of_memory: string | null }) => ({
          localId: nextId(),
          checked: true,
          title: m.title,
          description: m.description,
          date_of_memory: m.date_of_memory ?? null,
        }))
      );
      setPersonSuggestions(
        (data.new_people ?? []).map((p: { first_name: string; last_name: string; relationship: RelationshipType; role: "parent" | "child" | "other"; notes: string | null }) => ({
          localId: nextId(),
          checked: true,
          first_name: p.first_name,
          last_name: p.last_name,
          relationship: p.relationship,
          role: p.role,
          notes: p.notes ?? null,
        }))
      );
      setRelSuggestions(
        (data.relationships_to_existing ?? []).map((r: { person_id: string; person_name: string; relationship: RelationshipType; role: "parent" | "child" | "other" }) => ({
          localId: nextId(),
          checked: true,
          person_id: r.person_id,
          person_name: r.person_name,
          relationship: r.relationship,
          role: r.role,
        }))
      );
      setSummaryContribution(data.summary_contribution ?? "");
      setStep("suggestions");
    } catch (e: unknown) {
      setProcessError(e instanceof Error ? e.message : "Failed to analyze recording");
      setStep("idle");
    }
  }

  async function handleSave() {
    setSaving(true);
    setSaveError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Save audio as a memory if requested
      if (saveAudio && audioBlob) {
        const path = `${person.family_id}/${person.id}/${Date.now()}.webm`;
        const { error: uploadErr } = await supabase.storage
          .from("audio")
          .upload(path, audioBlob, { upsert: true, contentType: "audio/webm" });
        if (!uploadErr) {
          const { data: mem } = await supabase
            .from("memories")
            .insert({
              family_id: person.family_id,
              type: "audio",
              title: `Voice memo about ${firstName}`,
              description: transcript.trim() || null,
              storage_url: `audio/${path}`,
              recorded_by: user.id,
              date_of_memory: null,
              duration_sec: elapsedSecs > 0 ? elapsedSecs : null,
            })
            .select()
            .single();
          if (mem) {
            await supabase
              .from("memory_people")
              .insert({ memory_id: mem.id, person_id: person.id, family_id: person.family_id });
          }
        }
      }

      // Create selected memory suggestions
      for (const s of memorySuggestions.filter((m) => m.checked)) {
        const { data: mem } = await supabase
          .from("memories")
          .insert({
            family_id: person.family_id,
            type: "note",
            title: s.title,
            description: s.description,
            storage_url: null,
            recorded_by: user.id,
            date_of_memory: s.date_of_memory || null,
          })
          .select()
          .single();
        if (mem) {
          await supabase
            .from("memory_people")
            .insert({ memory_id: mem.id, person_id: person.id, family_id: person.family_id });
        }
      }

      // Create selected new people + relationships
      for (const s of personSuggestions.filter((p) => p.checked)) {
        const { data: newPerson } = await supabase
          .from("people")
          .insert({
            family_id: person.family_id,
            first_name: s.first_name,
            last_name: s.last_name,
            middle_name: null,
            nickname: null,
            dob: null,
            dod: null,
            bio: s.notes || null,
            profile_photo_url: null,
            canvas_x: 0,
            canvas_y: 0,
            created_by: user.id,
          })
          .select()
          .single();
        if (newPerson) {
          // person_a = parent, person_b = child for parent_child
          const personAId =
            s.relationship === "parent_child" && s.role === "child"
              ? newPerson.id  // new person is child's parent = person_a
              : s.relationship === "parent_child" && s.role === "parent"
              ? person.id     // subject is parent = person_a
              : person.id;    // default: subject is person_a
          const personBId =
            s.relationship === "parent_child" && s.role === "child"
              ? person.id
              : s.relationship === "parent_child" && s.role === "parent"
              ? newPerson.id
              : newPerson.id;
          await supabase.from("relationships").insert({
            family_id: person.family_id,
            person_a_id: personAId,
            person_b_id: personBId,
            type: s.relationship,
          });
        }
      }

      // Create selected relationships to existing people
      for (const s of relSuggestions.filter((r) => r.checked)) {
        const personAId =
          s.relationship === "parent_child" && s.role === "child"
            ? s.person_id
            : s.relationship === "parent_child" && s.role === "parent"
            ? person.id
            : person.id;
        const personBId =
          s.relationship === "parent_child" && s.role === "child"
            ? person.id
            : s.relationship === "parent_child" && s.role === "parent"
            ? s.person_id
            : s.person_id;
        await supabase.from("relationships").insert({
          family_id: person.family_id,
          person_a_id: personAId,
          person_b_id: personBId,
          type: s.relationship,
        });
      }

      onComplete();
      onClose();
    } catch (e: unknown) {
      setSaveError(e instanceof Error ? e.message : "Failed to save");
      setSaving(false);
    }
  }

  const checkedCount =
    memorySuggestions.filter((m) => m.checked).length +
    personSuggestions.filter((p) => p.checked).length +
    relSuggestions.filter((r) => r.checked).length +
    (saveAudio && audioBlob ? 1 : 0);

  const hasSuggestions =
    memorySuggestions.length > 0 ||
    personSuggestions.length > 0 ||
    relSuggestions.length > 0;

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={step === "recording" ? undefined : onClose}
      />

      {/* Sheet */}
      <div className="relative w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">

        {/* ── IDLE ── */}
        {step === "idle" && (
          <>
            <div className="px-6 pt-6 pb-4 border-b border-gray-100">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-xl font-normal text-stone-900">
                    Tell me about {firstName}
                  </h2>
                  <p className="text-sm text-gray-400 mt-1">
                    Speak freely — we&apos;ll pull out the memories, people, and relationships automatically.
                  </p>
                </div>
                <button onClick={onClose} className="text-gray-300 hover:text-gray-500 transition-colors flex-shrink-0 mt-0.5">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="px-6 py-5 flex-1 overflow-y-auto">
              {/* Guided prompts */}
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">A few places to start</p>
              <div className="flex flex-wrap gap-2 mb-6">
                {GUIDED_PROMPTS.map((p) => (
                  <span
                    key={p}
                    className="text-xs text-gray-500 bg-canvas border border-gray-200 rounded-full px-3 py-1.5"
                  >
                    {p}
                  </span>
                ))}
              </div>

              {processError && (
                <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2 mb-4">{processError}</p>
              )}

              {hasSpeechAPI ? (
                <button
                  onClick={startRecording}
                  className="w-full flex flex-col items-center gap-3 py-8 bg-accent rounded-xl text-white hover:bg-accent-hover transition-colors"
                >
                  <Mic className="w-8 h-8" />
                  <span className="font-medium">Start Recording</span>
                </button>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-gray-400">Your browser doesn&apos;t support live transcription. Type what you&apos;d like to share and we&apos;ll analyze it.</p>
                  <textarea
                    value={fallbackText}
                    onChange={(e) => setFallbackText(e.target.value)}
                    rows={6}
                    placeholder={`Describe ${firstName} — who they were, stories you remember, people in their life…`}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-accent-mid resize-none"
                  />
                  <button
                    onClick={() => {
                      setStep("processing");
                      analyzeTranscript(fallbackText);
                    }}
                    disabled={!fallbackText.trim()}
                    className="w-full bg-accent text-white py-3 rounded-xl text-sm font-medium hover:bg-accent-hover transition-colors disabled:opacity-40"
                  >
                    <ChevronRight className="w-4 h-4 inline mr-1" />
                    Analyze
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {/* ── RECORDING ── */}
        {step === "recording" && (
          <>
            <div className="px-6 pt-6 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
                <span className="text-sm font-medium text-gray-700">
                  Listening… <span className="text-gray-400 font-normal tabular-nums">{formatTime(elapsedSecs)}</span>
                </span>
              </div>
            </div>

            <div className="px-6 py-5 flex-1 overflow-y-auto min-h-[200px]">
              {transcript ? (
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{transcript}</p>
              ) : (
                <p className="text-sm text-gray-300 italic">Start speaking…</p>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-100">
              <button
                onClick={stopRecording}
                className="w-full flex items-center justify-center gap-2 py-3 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 transition-colors"
              >
                <Square className="w-4 h-4 fill-current" />
                Stop & Analyze
              </button>
            </div>
          </>
        )}

        {/* ── PROCESSING ── */}
        {step === "processing" && (
          <div className="flex-1 flex flex-col items-center justify-center py-16 px-6">
            <Loader2 className="w-8 h-8 text-accent-mid animate-spin mb-4" />
            <p className="text-sm text-gray-500">Analyzing what you shared…</p>
            <p className="text-xs text-gray-300 mt-1">Extracting memories, people, and relationships</p>
          </div>
        )}

        {/* ── SUGGESTIONS ── */}
        {step === "suggestions" && (
          <>
            <div className="px-6 pt-5 pb-4 border-b border-gray-100">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-lg font-normal text-stone-900">Review suggestions</h2>
                  {summaryContribution && (
                    <p className="text-sm text-gray-400 mt-1 leading-relaxed">{summaryContribution}</p>
                  )}
                </div>
                <button onClick={onClose} className="text-gray-300 hover:text-gray-500 transition-colors flex-shrink-0 mt-0.5">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
              {!hasSuggestions && (
                <p className="text-sm text-gray-400 text-center py-6">
                  No specific memories or people were identified. Try recording again with more detail.
                </p>
              )}

              {/* Memory suggestions */}
              {memorySuggestions.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-3">
                    <FileText className="w-3.5 h-3.5 text-accent-mid" />
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Memories ({memorySuggestions.filter((m) => m.checked).length}/{memorySuggestions.length})
                    </p>
                  </div>
                  <div className="space-y-2">
                    {memorySuggestions.map((s, i) => (
                      <div
                        key={s.localId}
                        className={`rounded-xl border p-3 transition-colors ${s.checked ? "border-accent-border bg-accent-pale/30" : "border-gray-100 bg-gray-50"}`}
                      >
                        <div className="flex items-start gap-2.5">
                          <button
                            onClick={() => setMemorySuggestions((prev) => prev.map((m, j) => j === i ? { ...m, checked: !m.checked } : m))}
                            className={`mt-0.5 w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${s.checked ? "bg-accent border-accent" : "border-gray-300"}`}
                          >
                            {s.checked && <Check className="w-2.5 h-2.5 text-white" />}
                          </button>
                          <div className="flex-1 min-w-0">
                            <input
                              value={s.title}
                              onChange={(e) => setMemorySuggestions((prev) => prev.map((m, j) => j === i ? { ...m, title: e.target.value } : m))}
                              className="w-full text-sm font-medium text-stone-800 bg-transparent border-none outline-none mb-0.5"
                            />
                            <textarea
                              value={s.description}
                              onChange={(e) => setMemorySuggestions((prev) => prev.map((m, j) => j === i ? { ...m, description: e.target.value } : m))}
                              rows={2}
                              className="w-full text-xs text-gray-500 bg-transparent border-none outline-none resize-none leading-relaxed"
                            />
                            {s.date_of_memory && (
                              <span className="text-[10px] text-gray-400">{s.date_of_memory}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* New people suggestions */}
              {personSuggestions.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-3">
                    <Users className="w-3.5 h-3.5 text-accent-mid" />
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      New people ({personSuggestions.filter((p) => p.checked).length}/{personSuggestions.length})
                    </p>
                  </div>
                  <div className="space-y-2">
                    {personSuggestions.map((s, i) => (
                      <div
                        key={s.localId}
                        className={`rounded-xl border p-3 transition-colors ${s.checked ? "border-accent-border bg-accent-pale/30" : "border-gray-100 bg-gray-50"}`}
                      >
                        <div className="flex items-start gap-2.5">
                          <button
                            onClick={() => setPersonSuggestions((prev) => prev.map((p, j) => j === i ? { ...p, checked: !p.checked } : p))}
                            className={`mt-0.5 w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${s.checked ? "bg-accent border-accent" : "border-gray-300"}`}
                          >
                            {s.checked && <Check className="w-2.5 h-2.5 text-white" />}
                          </button>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <input
                                value={s.first_name}
                                onChange={(e) => setPersonSuggestions((prev) => prev.map((p, j) => j === i ? { ...p, first_name: e.target.value } : p))}
                                className="text-sm font-medium text-stone-800 bg-transparent border-none outline-none w-28"
                                placeholder="First"
                              />
                              <input
                                value={s.last_name}
                                onChange={(e) => setPersonSuggestions((prev) => prev.map((p, j) => j === i ? { ...p, last_name: e.target.value } : p))}
                                className="text-sm font-medium text-stone-800 bg-transparent border-none outline-none w-28"
                                placeholder="Last"
                              />
                            </div>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {relationshipLabel(s.relationship, s.role, firstName)}
                            </p>
                            {s.notes && (
                              <p className="text-xs text-gray-400 mt-0.5 italic">{s.notes}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Relationships to existing people */}
              {relSuggestions.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-3">
                    <Link2 className="w-3.5 h-3.5 text-accent-mid" />
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Relationships ({relSuggestions.filter((r) => r.checked).length}/{relSuggestions.length})
                    </p>
                  </div>
                  <div className="space-y-2">
                    {relSuggestions.map((s, i) => (
                      <div
                        key={s.localId}
                        className={`rounded-xl border p-3 transition-colors ${s.checked ? "border-accent-border bg-accent-pale/30" : "border-gray-100 bg-gray-50"}`}
                      >
                        <div className="flex items-center gap-2.5">
                          <button
                            onClick={() => setRelSuggestions((prev) => prev.map((r, j) => j === i ? { ...r, checked: !r.checked } : r))}
                            className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${s.checked ? "bg-accent border-accent" : "border-gray-300"}`}
                          >
                            {s.checked && <Check className="w-2.5 h-2.5 text-white" />}
                          </button>
                          <div>
                            <p className="text-sm font-medium text-stone-800">{s.person_name}</p>
                            <p className="text-xs text-gray-400">
                              {relationshipLabel(s.relationship, s.role, firstName)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Save audio toggle */}
              {audioBlob && (
                <div>
                  <div className="flex items-center gap-1.5 mb-3">
                    <MicOff className="w-3.5 h-3.5 text-gray-400" />
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Recording</p>
                  </div>
                  <label className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3 cursor-pointer">
                    <div
                      onClick={() => setSaveAudio((v) => !v)}
                      className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${saveAudio ? "bg-accent border-accent" : "border-gray-300"}`}
                    >
                      {saveAudio && <Check className="w-2.5 h-2.5 text-white" />}
                    </div>
                    <div>
                      <p className="text-sm text-stone-700">Save audio recording as memory</p>
                      <p className="text-xs text-gray-400">Stored as an audio memory tagged to {firstName}</p>
                    </div>
                  </label>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100 space-y-2">
              {saveError && (
                <p className="text-xs text-red-500 bg-red-50 rounded px-3 py-2">{saveError}</p>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => { setStep("idle"); setTranscript(""); }}
                  className="flex-1 border border-gray-200 text-gray-500 py-2.5 rounded-xl text-sm hover:bg-gray-50 transition-colors"
                >
                  Record Again
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || checkedCount === 0}
                  className="flex-2 flex items-center justify-center gap-2 bg-accent text-white py-2.5 px-5 rounded-xl text-sm font-medium hover:bg-accent-hover transition-colors disabled:opacity-50 flex-1"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  {saving ? "Saving…" : `Add ${checkedCount > 0 ? checkedCount : ""} selected`}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
