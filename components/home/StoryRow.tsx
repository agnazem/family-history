import Link from "next/link";
import { Mic, Image as ImageIcon, FileText, PenLine } from "lucide-react";

export interface StoryRowProps {
  id: string;
  title: string;
  type: "audio" | "photo" | "document" | "note";
  durationLabel: string;
  byName: string;
  era: string;
  when: string;
}

const KIND_LABELS = { audio: "Audio", photo: "Photo", document: "Doc", note: "Note" } as const;
const KIND_ICONS = { audio: Mic, photo: ImageIcon, document: FileText, note: PenLine };

function deterministicHeights(id: string, count: number): number[] {
  return Array.from({ length: count }, (_, i) => {
    const code = id.charCodeAt(i % id.length);
    return ((code * 13 + i * 7) % 75) + 15;
  });
}

export function StoryRow({ id, title, type, durationLabel, byName, era, when }: StoryRowProps) {
  const Icon = KIND_ICONS[type];
  const heights = type === "audio" ? deterministicHeights(id, 28) : [];

  return (
    <Link href={`/memory/${id}`}
      className="flex items-center gap-4 bg-[--surface] border border-[--rule] hover:border-[--gold] rounded-2xl px-5 py-3.5 transition-colors group min-h-[72px]">
      <div className="w-14 h-14 rounded-xl bg-[--accent-soft] flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5 text-[--accent]" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="eyebrow text-[--accent]">{KIND_LABELS[type]}</span>
          <span className="w-1 h-1 rounded-full bg-[--ink-mute] flex-shrink-0" />
          <span className="font-mono text-[11px] text-[--ink-mute] tracking-[0.06em] uppercase truncate">{durationLabel}</span>
        </div>
        <p className="text-[17px] font-medium text-[--ink] leading-tight truncate mb-0.5">{title}</p>
        <p className="text-[13px] text-[--ink-soft] truncate">
          <span className="italic-flourish">{byName}</span>
          <span className="text-[--ink-mute]"> · {era}</span>
        </p>
      </div>

      {type === "audio" && (
        <div className="hidden lg:flex items-end gap-px w-[120px] h-5 flex-shrink-0">
          {heights.map((h, i) => (
            <div key={i} className="flex-1 bg-[--rule] group-hover:bg-[--accent-soft] rounded-[1px] transition-colors" style={{ height: `${h}%` }} />
          ))}
        </div>
      )}

      <span className="font-mono text-[11px] text-[--ink-mute] tracking-[0.06em] uppercase flex-shrink-0">{when}</span>
    </Link>
  );
}
