"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Mic, Square, Play, Pause, Trash2, Loader2 } from "lucide-react";

interface AudioRecorderProps {
  onRecorded: (blob: Blob) => void;
  onClear: () => void;
  recorded: Blob | null;
  // Streaming mode: if provided, chunks are POSTed live during recording
  recordingId?: string;
  liveTranscript?: string;
  transcriptStatus?: string;
}

export function AudioRecorder({
  onRecorded,
  onClear,
  recorded,
  recordingId,
  liveTranscript,
  transcriptStatus,
}: AudioRecorderProps) {
  const [recording, setRecording] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [micError, setMicError] = useState<string | null>(null);
  const [chunkSeq, setChunkSeq] = useState(0);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const allChunks = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const seqRef = useRef(0);
  const recordingIdRef = useRef(recordingId);
  useEffect(() => { recordingIdRef.current = recordingId; }, [recordingId]);

  const postChunk = useCallback(async (chunk: Blob, seq: number) => {
    const rid = recordingIdRef.current;
    if (!rid || chunk.size < 100) return;
    const fd = new FormData();
    fd.append("chunk", chunk);
    fd.append("sequence", String(seq));
    await fetch(`/api/recordings/${rid}/chunk`, { method: "POST", body: fd }).catch(() => {});
  }, []);

  async function startRecording() {
    setMicError(null);
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setMicError("Microphone access was denied. Please allow microphone access in your browser settings.");
      return;
    }

    const mimeType = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/ogg;codecs=opus",
      "audio/mp4",
    ].find((t) => MediaRecorder.isTypeSupported(t)) ?? "";

    const mr = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    mediaRecorder.current = mr;
    allChunks.current = [];
    seqRef.current = 0;

    // Fire every 4 seconds for streaming transcription
    mr.ondataavailable = (e) => {
      if (!e.data || e.data.size === 0) return;
      allChunks.current.push(e.data);
      const seq = seqRef.current++;
      setChunkSeq(seq);
      // Send full accumulated blob — later chunks are stream fragments without
      // container headers, so Whisper can't decode them standalone.
      const fullBlob = new Blob(allChunks.current, { type: mimeType || "audio/webm" });
      postChunk(fullBlob, seq);
    };

    mr.onstop = () => {
      const blob = new Blob(allChunks.current, { type: mr.mimeType || mimeType || "audio/webm" });
      onRecorded(blob);
      stream.getTracks().forEach((t) => t.stop());
    };

    mr.start(recordingId ? 4000 : undefined);
    setRecording(true);
    setDuration(0);
    timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
  }

  function stopRecording() {
    mediaRecorder.current?.stop();
    setRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  }

  function togglePlay() {
    if (!recorded) return;
    if (!audioRef.current) {
      audioRef.current = new Audio(URL.createObjectURL(recorded));
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

  function handleClear() {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    setPlaying(false);
    setDuration(0);
    seqRef.current = 0;
    allChunks.current = [];
    onClear();
  }

  function fmtTime(s: number) {
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  }

  if (recorded) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-3 bg-[--accent-soft] border border-[--rule] rounded-xl px-4 py-3">
          <button
            type="button"
            onClick={togglePlay}
            className="w-10 h-10 rounded-full bg-[--accent] text-white flex items-center justify-center hover:bg-[--accent-hover] transition-colors"
          >
            {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <div className="flex-1">
            <p className="text-sm font-medium text-[--ink]">Recording ready · {fmtTime(duration)}</p>
            {transcriptStatus === "finalizing" && (
              <p className="text-xs text-[--ink-mute] flex items-center gap-1 mt-0.5">
                <Loader2 className="w-3 h-3 animate-spin" />
                Improving transcript accuracy…
              </p>
            )}
          </div>
          <button type="button" onClick={handleClear} className="text-[--ink-mute] hover:text-red-500 transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Live transcript preview */}
        {liveTranscript && (
          <div className="bg-[--surface] border border-[--rule] rounded-xl px-4 py-3">
            <p className="eyebrow mb-1.5">
              {transcriptStatus === "finalizing" ? "Transcript (finalizing…)" : "Transcript"}
            </p>
            <p className="text-[15px] leading-[1.55] text-[--ink]">{liveTranscript}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {micError && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{micError}</p>
      )}
      <div className="flex items-center gap-3 bg-[--surface-alt] border border-[--rule] rounded-xl px-4 py-3">
        {recording ? (
          <>
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <div className="flex-1">
              <span className="text-sm text-[--ink]">Recording… {fmtTime(duration)}</span>
              {liveTranscript && (
                <p className="text-xs text-[--ink-mute] mt-0.5 line-clamp-1">{liveTranscript}</p>
              )}
            </div>
            <button
              type="button"
              onClick={stopRecording}
              className="w-10 h-10 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
            >
              <Square className="w-4 h-4" />
            </button>
          </>
        ) : (
          <>
            <Mic className="w-5 h-5 text-[--ink-mute]" />
            <span className="flex-1 text-sm text-[--ink-soft]">Click to record a voice memory</span>
            <button
              type="button"
              onClick={startRecording}
              className="w-10 h-10 rounded-full bg-[--accent] text-white flex items-center justify-center hover:bg-[--accent-hover] transition-colors"
            >
              <Mic className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
