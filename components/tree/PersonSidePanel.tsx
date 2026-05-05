"use client";

import { useEffect } from "react";
import type React from "react";
import { X, ArrowRight } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { preferredFirst } from "@/lib/utils";
import type { Person } from "@/types";

interface PersonSidePanelProps {
  person: Person;
  memoryCount: number;
  onClose: () => void;
  onOpenProfile: (id: string) => void;
  onSetAsRoot?: () => void;
}

function formatYear(dateStr: string | null) {
  if (!dateStr) return null;
  return new Date(dateStr).getFullYear();
}

function LegendRow({ dot, label }: { dot: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2.5 text-[13px] text-[--ink-soft]">
      <div className="w-5 flex items-center justify-center flex-shrink-0">{dot}</div>
      {label}
    </div>
  );
}

export function PersonSidePanel({ person, memoryCount, onClose, onOpenProfile, onSetAsRoot }: PersonSidePanelProps) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const birthYear = formatYear(person.dob);
  const deathYear = formatYear(person.dod);
  const dates =
    birthYear && deathYear
      ? `${birthYear} — ${deathYear}`
      : birthYear
      ? `b. ${birthYear}`
      : null;

  const fullName = `${person.first_name} ${person.last_name}`;
  const preferredName = preferredFirst(person);
  const blurb = person.ai_summary ?? person.bio ?? null;

  return (
    <div
      className="absolute top-0 right-0 h-full w-[300px] bg-[--surface] border-l border-[--rule] flex flex-col z-10"
      style={{ boxShadow: "-8px 0 24px rgba(31,26,20,0.06)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-[--rule]">
        <span className="eyebrow">Selected</span>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-[--ink-mute] hover:text-[--ink] hover:bg-[--surface-alt] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-5">
        {/* Identity */}
        <div className="flex items-start gap-3">
          <Avatar src={person.profile_photo_url} name={fullName} size="md" />
          <div className="min-w-0 flex-1 pt-0.5">
            <div className="font-display text-[26px] font-normal leading-none text-[--ink] tracking-[-0.02em]">
              {preferredName}
            </div>
            <div className="font-display italic text-[18px] text-[--ink-soft] leading-tight mt-0.5">
              {person.last_name}
            </div>
            {dates && (
              <div className="font-mono text-[10px] tracking-[0.06em] text-[--ink-mute] mt-2 uppercase">
                {dates}
              </div>
            )}
          </div>
        </div>

        {/* Memory count */}
        <div
          className={`rounded-xl px-4 py-3 ${
            memoryCount > 0 ? "bg-[--accent-soft]" : "bg-[--surface-alt]"
          }`}
        >
          <span className="font-display italic text-[13px] text-[--ink-soft]">
            {memoryCount > 0
              ? `${memoryCount} ${memoryCount === 1 ? "memory" : "memories"} recorded`
              : "No memories yet"}
          </span>
        </div>

        {/* Bio / summary */}
        {blurb && (
          <p className="text-[13px] leading-[1.6] text-[--ink-soft] line-clamp-5">
            {blurb}
          </p>
        )}
      </div>

      {/* Legend */}
      <div className="px-5 pb-4 border-t border-[--rule] pt-4">
        <p className="eyebrow mb-3">Legend</p>
        <div className="space-y-2">
          <LegendRow dot={<div className="w-4 h-4 rounded-full bg-[--accent]" />} label="Living" />
          <LegendRow dot={<div className="w-4 h-4 rounded-full bg-[--surface-alt] border border-[--rule]" />} label="Deceased" />
          <LegendRow dot={<div className="w-4 h-4 rounded-full border-2 border-[--accent]" />} label="Focused" />
          <LegendRow dot={<div className="w-4 border-t border-dashed border-[--ink-mute]" />} label="Partnership" />
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-[--rule] space-y-2">
        <button
          onClick={() => onOpenProfile(person.id)}
          className="w-full flex items-center justify-center gap-2 bg-[--accent] hover:bg-[--accent-hover] text-white py-2.5 rounded-xl text-sm font-medium transition-colors"
        >
          Open profile
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
        {onSetAsRoot && (
          <button
            onClick={onSetAsRoot}
            className="w-full flex items-center justify-center gap-2 border border-[--rule] text-[--ink-soft] hover:text-[--ink] hover:bg-[--surface-alt] py-2 rounded-xl text-sm transition-colors"
          >
            Set as tree root
          </button>
        )}
      </div>
    </div>
  );
}
