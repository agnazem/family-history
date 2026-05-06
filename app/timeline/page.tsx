"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useFamily } from "@/lib/hooks/useFamily";
import { AppNav } from "@/components/ui/AppNav";
import { SignedAudio } from "@/components/ui/SignedAudio";
import { SignedImage } from "@/components/ui/SignedImage";
import { SignedDownloadLink } from "@/components/ui/SignedDownloadLink";
import {
  Mic, Image as ImageIcon, FileText, PenLine, Users,
} from "lucide-react";
import { formatDate, personDisplayName } from "@/lib/utils";
import type { Memory, Person } from "@/types";
import Link from "next/link";

const TYPE_ICONS = {
  audio: Mic,
  photo: ImageIcon,
  document: FileText,
  note: PenLine,
};

const TYPE_LABELS: Record<string, string> = {
  audio: "Voice memory",
  photo: "Photo",
  document: "Document",
  note: "Written note",
};

type TimelineEntry = Memory & { taggedPeople: Person[] };

function groupByYear(entries: TimelineEntry[]): [string, TimelineEntry[]][] {
  const map = new Map<string, TimelineEntry[]>();
  for (const e of entries) {
    const year = e.date_of_memory
      ? new Date(e.date_of_memory).getFullYear().toString()
      : "unknown";
    if (!map.has(year)) map.set(year, []);
    map.get(year)!.push(e);
  }
  const sorted = Array.from(map.entries())
    .filter(([year]) => year !== "unknown")
    .sort((a, b) => Number(b[0]) - Number(a[0]));
  if (map.has("unknown")) sorted.push(["unknown", map.get("unknown")!]);
  return sorted;
}

export default function TimelinePage() {
  const router = useRouter();
  const { family, loading: familyLoading } = useFamily();
  const [entries, setEntries] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (!family?.id) return;

    async function load() {
      const [{ data: memories }, { data: tags }, { data: people }] = await Promise.all([
        supabase
          .from("memories")
          .select("*")
          .eq("family_id", family!.id)
          .is("deleted_at", null)
          .order("created_at", { ascending: false }),
        supabase
          .from("memory_people")
          .select("memory_id, person_id")
          .eq("family_id", family!.id),
        supabase.from("people").select("*").eq("family_id", family!.id),
      ]);

      const peopleMap = new Map<string, Person>((people ?? []).map((p) => [p.id, p]));
      const tagMap = new Map<string, string[]>();
      for (const t of tags ?? []) {
        if (!tagMap.has(t.memory_id)) tagMap.set(t.memory_id, []);
        tagMap.get(t.memory_id)!.push(t.person_id);
      }

      const enriched: TimelineEntry[] = (memories ?? []).map((m) => ({
        ...m,
        taggedPeople: (tagMap.get(m.id) ?? [])
          .map((pid) => peopleMap.get(pid))
          .filter(Boolean) as Person[],
      }));

      enriched.sort((a, b) => {
        const ka = a.date_of_memory ?? `9999-${a.created_at}`;
        const kb = b.date_of_memory ?? `9999-${b.created_at}`;
        return kb.localeCompare(ka);
      });

      setEntries(enriched);
      setLoading(false);
    }

    load();
  }, [family?.id]);

  if (familyLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[--canvas]">
        <p className="text-[--ink-soft]">Loading timeline…</p>
      </div>
    );
  }

  const grouped = groupByYear(entries);

  return (
    <div className="min-h-screen bg-[--canvas]">
      <AppNav />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-10">
          <h1 className="font-display text-[clamp(32px,5vw,48px)] font-normal text-[--ink] leading-[1.1] tracking-[-0.02em]">
            Timeline
          </h1>
          <p className="text-sm text-[--ink-mute] mt-1">{family?.name}</p>
        </div>

        {entries.length === 0 ? (
          <div className="text-center py-16 text-[--ink-mute]">
            <p className="mb-1">No memories recorded yet.</p>
            <p className="text-sm">Visit a family member's page to add the first memory.</p>
          </div>
        ) : (
          <div className="space-y-10">
            {grouped.map(([year, items]) => (
              <section key={year}>
                <div className="flex items-center gap-3 mb-5">
                  <span className={`font-display text-2xl font-normal ${year === "unknown" ? "text-[--ink-mute] italic" : "text-[--ink]"}`}>
                    {year === "unknown" ? "Date unknown" : year}
                  </span>
                  <div className="flex-1 h-px bg-[--rule]" />
                  <span className="text-xs text-[--ink-mute] font-mono">
                    {items.length} {items.length === 1 ? "memory" : "memories"}
                  </span>
                </div>
                <div className="space-y-3">
                  {items.map((entry) => {
                    const Icon = TYPE_ICONS[entry.type];
                    return (
                      <div
                        key={entry.id}
                        className="bg-[--surface] border border-[--rule] rounded-xl p-5 hover:border-[--gold] transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <Icon className="w-4 h-4 mt-1 flex-shrink-0 text-[--ink-mute]" />
                          <div className="flex-1 min-w-0">
                            <span className="eyebrow">{TYPE_LABELS[entry.type]}</span>
                            <Link
                              href={`/memory/${entry.id}`}
                              className="block font-display text-[22px] leading-[1.2] font-normal text-[--ink] mt-0.5 hover:text-[--accent] transition-colors"
                            >
                              {entry.title}
                            </Link>
                            <p className="body-sm mt-1">
                              {formatDate(entry.date_of_memory ?? entry.created_at)}
                            </p>

                            {entry.type === "audio" && entry.storage_url && (
                              <SignedAudio storagePath={entry.storage_url} className="mt-3" />
                            )}

                            {entry.type === "photo" && entry.storage_url && (
                              <div className="mt-3 rounded-lg overflow-hidden">
                                <SignedImage
                                  storagePath={entry.storage_url}
                                  alt={entry.title}
                                  width={400}
                                  height={300}
                                  className="w-full h-48 object-cover rounded-lg"
                                />
                              </div>
                            )}

                            {entry.type === "document" && entry.storage_url && (
                              <SignedDownloadLink
                                storagePath={entry.storage_url}
                                className="inline-flex items-center gap-1.5 mt-3 text-sm text-[--ink-soft] hover:text-[--ink] transition-colors"
                              />
                            )}

                            {entry.transcript && (
                              <p className="text-[14px] leading-[1.5] text-[--ink-soft] mt-2 line-clamp-3">
                                {entry.transcript}
                              </p>
                            )}

                            {!entry.transcript && entry.description && (
                              <p className="text-[14px] leading-[1.5] text-[--ink-soft] mt-2">
                                {entry.description}
                              </p>
                            )}

                            {entry.taggedPeople.length > 0 && (
                              <p className="flex items-center gap-1.5 mt-2 text-[13px] text-[--ink-mute]">
                                <Users className="w-3 h-3 flex-shrink-0" />
                                {entry.taggedPeople.map((p, i) => (
                                  <span key={p.id}>
                                    {i > 0 && ", "}
                                    <button
                                      onClick={() => router.push(`/person/${p.id}`)}
                                      className="hover:text-[--ink] hover:underline transition-colors"
                                    >
                                      {personDisplayName(p)}
                                    </button>
                                  </span>
                                ))}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
