"use client";

import { useState, useRef } from "react";
import { Mic, Square, Play, Pause, Upload, Trash2 } from "lucide-react";

interface AudioRecorderProps {
  onRecorded: (blob: Blob) => void;
  onClear: () => void;
  recorded: Blob | null;
}

export function AudioRecorder({ onRecorded, onClear, recorded }: AudioRecorderProps) {
  const [recording, setRecording] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function startRecording() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mimeType = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/ogg;codecs=opus",
      "audio/mp4",
    ].find((t) => MediaRecorder.isTypeSupported(t)) ?? "";

    const mr = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    mediaRecorder.current = mr;
    chunks.current = [];

    mr.ondataavailable = (e) => chunks.current.push(e.data);
    mr.onstop = () => {
      const blob = new Blob(chunks.current, { type: mr.mimeType || mimeType || "audio/webm" });
      onRecorded(blob);
      stream.getTracks().forEach((t) => t.stop());
    };

    mr.start();
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
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setPlaying(false);
    setDuration(0);
    onClear();
  }

  function fmtTime(s: number) {
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  }

  if (recorded) {
    return (
      <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
        <button
          type="button"
          onClick={togglePlay}
          className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center hover:bg-green-700"
        >
          {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>
        <div className="flex-1">
          <p className="text-sm font-medium text-green-800">Recording ready</p>
          <p className="text-xs text-green-600">{fmtTime(duration)} recorded</p>
        </div>
        <Upload className="w-4 h-4 text-green-600" />
        <button
          type="button"
          onClick={handleClear}
          className="text-gray-400 hover:text-red-500 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
      {recording ? (
        <>
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="flex-1 text-sm text-gray-700">
            Recording... {fmtTime(duration)}
          </span>
          <button
            type="button"
            onClick={stopRecording}
            className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600"
          >
            <Square className="w-4 h-4" />
          </button>
        </>
      ) : (
        <>
          <Mic className="w-5 h-5 text-gray-400" />
          <span className="flex-1 text-sm text-gray-500">
            Click to record a voice memory
          </span>
          <button
            type="button"
            onClick={startRecording}
            className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700"
          >
            <Mic className="w-4 h-4" />
          </button>
        </>
      )}
    </div>
  );
}
