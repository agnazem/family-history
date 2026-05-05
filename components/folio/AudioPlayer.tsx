"use client";

import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { Play, Pause, SkipBack, SkipForward } from "lucide-react";

function fmt(secs: number): string {
  if (!isFinite(secs) || isNaN(secs) || secs < 0) return "--:--";
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function deterministicWaveform(src: string, count: number): number[] {
  return Array.from({ length: count }, (_, i) => {
    const code = src.charCodeAt(i % Math.max(src.length, 1));
    return ((code * 13 + i * 7) % 75) + 15;
  });
}

export interface AudioPlayerRef {
  seekTo: (time: number) => void;
}

interface AudioPlayerProps {
  src: string;
  className?: string;
  playbackRate?: number;
  onTimeUpdate?: (time: number) => void;
  onDurationChange?: (duration: number) => void;
}

export const AudioPlayer = forwardRef<AudioPlayerRef, AudioPlayerProps>(
  function AudioPlayer({ src, className = "", playbackRate = 1, onTimeUpdate, onDurationChange }, ref) {
    const [playing, setPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(NaN);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const onTimeUpdateRef = useRef(onTimeUpdate);
    useEffect(() => { onTimeUpdateRef.current = onTimeUpdate; }, [onTimeUpdate]);
    const onDurationChangeRef = useRef(onDurationChange);
    useEffect(() => { onDurationChangeRef.current = onDurationChange; }, [onDurationChange]);

    const waveHeights = useMemo(() => deterministicWaveform(src, 64), [src]);

    useImperativeHandle(ref, () => ({
      seekTo(time: number) {
        const audio = audioRef.current;
        if (!audio) return;
        audio.currentTime = Math.max(0, time);
        setCurrentTime(audio.currentTime);
      },
    }));

    useEffect(() => {
      const audio = new Audio(src);
      audio.preload = "metadata";

      function resolveInfiniteDuration() {
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
          onDurationChangeRef.current?.(audio.duration);
          audio.currentTime = 0;
        }
      };
      audio.ontimeupdate = () => {
        setCurrentTime(audio.currentTime);
        onTimeUpdateRef.current?.(audio.currentTime);
      };
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
        className={`flex items-center gap-6 ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Circular play button */}
        <button
          type="button"
          onClick={togglePlay}
          className="w-20 h-20 rounded-full bg-[--accent] text-white flex items-center justify-center flex-shrink-0 hover:opacity-90 active:scale-95 transition-all"
          style={{ boxShadow: "0 8px 24px -8px rgba(139,94,60,0.6)" }}
          title={playing ? "Pause" : "Play"}
        >
          {playing ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 ml-0.5" />}
        </button>

        {/* Progress + waveform column */}
        <div className="flex-1 min-w-0">
          {/* Time + scrub bar */}
          <div className="flex items-center gap-3 mb-2.5 font-mono text-[12px] tracking-[0.06em]">
            <span className="text-[--accent] tabular-nums w-9 text-right">{fmt(currentTime)}</span>
            <div className="relative flex-1 h-1 bg-[--surface-alt] rounded-full">
              <div
                className="absolute inset-y-0 left-0 bg-[--accent] rounded-full"
                style={{ width: `${progress * 100}%` }}
              />
              <div
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-[--accent]"
                style={{ left: `${progress * 100}%` }}
              />
              <input
                type="range" min={0} max={1} step={0.001} value={progress}
                onChange={handleSeek}
                disabled={isNaN(duration)}
                aria-label="Seek"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
              />
            </div>
            <span className="text-[--ink-mute] tabular-nums">{isNaN(duration) ? "--:--" : fmt(duration)}</span>
          </div>

          {/* Waveform bars */}
          <div className="flex items-end gap-px h-9 w-full overflow-hidden">
            {waveHeights.map((h, i) => {
              const active = (i / waveHeights.length) <= progress;
              return (
                <div
                  key={i}
                  className={`flex-1 rounded-[1px] transition-colors ${active ? "bg-[--accent]" : "bg-[--rule]"}`}
                  style={{ height: `${h}%` }}
                />
              );
            })}
          </div>
        </div>

        {/* Skip controls */}
        <div className="flex gap-1.5 flex-shrink-0">
          <button
            type="button"
            onClick={() => skip(-15)}
            className="w-9 h-9 rounded-full border border-[--rule] text-[--ink-soft] hover:text-[--ink] hover:bg-[--surface-alt] flex items-center justify-center transition-colors"
            title="Back 15s"
          >
            <SkipBack className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => skip(15)}
            className="w-9 h-9 rounded-full border border-[--rule] text-[--ink-soft] hover:text-[--ink] hover:bg-[--surface-alt] flex items-center justify-center transition-colors"
            title="Forward 15s"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }
);
