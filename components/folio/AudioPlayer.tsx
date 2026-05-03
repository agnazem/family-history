"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Pause, SkipBack, SkipForward } from "lucide-react";

function fmt(secs: number): string {
  if (!isFinite(secs) || isNaN(secs) || secs < 0) return "--:--";
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

interface AudioPlayerProps {
  src: string;
  className?: string;
  playbackRate?: number;
}

export function AudioPlayer({ src, className = "", playbackRate = 1 }: AudioPlayerProps) {
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(NaN);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(src);
    audio.preload = "metadata";

    function resolveInfiniteDuration() {
      // Some servers (e.g. Supabase Storage) stream audio without Content-Length,
      // causing the browser to report duration=Infinity. Seeking past the end
      // forces a range request that reveals the true duration.
      if (audio.duration === Infinity || isNaN(audio.duration)) {
        audio.currentTime = 1e101;
      } else {
        setDuration(audio.duration);
      }
    }

    audio.playbackRate = playbackRate;
    audio.onloadedmetadata = resolveInfiniteDuration;
    audio.ondurationchange = () => {
      if (isFinite(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
        audio.currentTime = 0;
      }
    };
    audio.ontimeupdate = () => setCurrentTime(audio.currentTime);
    audio.onended = () => { setPlaying(false); setCurrentTime(0); };
    audio.onerror = () => setPlaying(false);
    audioRef.current = audio;
    return () => {
      audio.pause();
      audio.src = "";
      audioRef.current = null;
    };
  }, [src]);

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play().catch(() => setPlaying(false));
      setPlaying(true);
    }
  }

  function skip(delta: number) {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, Math.min(audio.duration || 0, audio.currentTime + delta));
  }

  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = playbackRate;
  }, [playbackRate]);

  const progress = isNaN(duration) || duration === 0 ? 0 : currentTime / duration;

  function handleSeek(e: React.ChangeEvent<HTMLInputElement>) {
    const audio = audioRef.current;
    if (!audio || isNaN(duration)) return;
    audio.currentTime = Number(e.target.value) * duration;
    setCurrentTime(audio.currentTime);
  }

  return (
    <div
      className={`flex flex-col gap-1.5 ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => skip(-15)}
          className="flex items-center gap-0.5 px-3 py-2 rounded-lg hover:bg-black/10 transition-colors text-xs font-medium"
          title="Back 15 seconds"
        >
          <SkipBack className="w-3.5 h-3.5" />
          15s
        </button>
        <button
          type="button"
          onClick={togglePlay}
          className="flex items-center justify-center w-11 h-11 rounded-full hover:bg-black/10 transition-colors"
          title={playing ? "Pause" : "Play"}
        >
          {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>
        <button
          type="button"
          onClick={() => skip(15)}
          className="flex items-center gap-0.5 px-3 py-2 rounded-lg hover:bg-black/10 transition-colors text-xs font-medium"
          title="Forward 15 seconds"
        >
          15s
          <SkipForward className="w-3.5 h-3.5" />
        </button>
        <span className="ml-1 text-xs font-mono opacity-60 tabular-nums">
          {isNaN(duration) ? "--:--" : `${fmt(currentTime)} / ${fmt(duration)}`}
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={1}
        step={0.001}
        value={progress}
        onChange={handleSeek}
        disabled={isNaN(duration)}
        aria-label="Seek"
        className="w-full h-1 accent-current cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
      />
    </div>
  );
}
