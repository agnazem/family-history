"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useFamily } from "@/lib/hooks/useFamily";
import { AppNav } from "@/components/ui/AppNav";
import { Mic, Image as ImageIcon, FileText, PenLine } from "lucide-react";
import type { MemoryType } from "@/types";

const TYPE_LABELS: Record<MemoryType, string> = {
  audio: "Voice memory",
  photo: "Photo",
  document: "Document",
  note: "Note",
};

const TYPE_ICONS: Record<MemoryType, React.ElementType> = {
  audio: Mic,
  photo: ImageIcon,
  document: FileText,
  note: PenLine,
};

const TYPE_COLORS: Record<MemoryType, string> = {
  audio: "bg-[--accent-soft] text-[--accent]",
  photo: "bg-[--accent-soft] text-[--accent]",
  document: "bg-[--surface-alt] text-[--ink-soft]",
  note: "bg-[--surface-alt] text-[--ink-soft]",
};

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function formatSubject(names: string[]): string {
  if (names.length === 0) return "";
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} & ${names[1]}`;
  return `${names[0]}, ${names[1]} & ${names.length - 2} more`;
}

type FeedItem = {
  id: string;
  type: MemoryType;
  title: string;
  created_at: string;
  recorded_by: string;
  recorderName: string;
  taggedNames: string[];
};

export default function ActivityPage() {
  const { family, loading: familyLoading } = useFamily();
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (!family?.id) return;

    async function load() {
      const { data: memories } = await supabase
        .from("memories")
        .select("id, type, title, created_at, recorded_by, family_id")
        .eq("family_id", family!.id)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(50);

      if (!memories || memories.length === 0) {
        setFeed([]);
        setLoading(false);
        return;
      }

      const memoryIds = memories.map((m) => m.id);
      const recorderIds = [...new Set(memories.map((m) => m.recorded_by).filter(Boolean))];

      const [{ data: tags }, { data: members }] = await Promise.all([
        supabase
          .from("memory_people")
          .select("memory_id, people(first_name)")
          .in("memory_id", memoryIds),
        supabase
          .from("family_members")
          .select("user_id, display_name, email")
          .eq("family_id", family!.id)
          .in("user_id", recorderIds),
      ]);

      const memberMap = new Map<string, string>(
        (members ?? []).map((m) => {
          const name = m.display_name ?? (m.email ? m.email.split("@")[0] : null) ?? "Someone";
          return [m.user_id, name];
        })
      );

      const tagMap = new Map<string, string[]>();
      for (const t of (tags ?? []) as unknown as Array<{ memory_id: string; people: { first_name: string } | null }>) {
        if (!t.people) continue;
        if (!tagMap.has(t.memory_id)) tagMap.set(t.memory_id, []);
        tagMap.get(t.memory_id)!.push(t.people.first_name);
      }

      const items: FeedItem[] = memories.map((m) => ({
        id: m.id,
        type: m.type as MemoryType,
        title: m.title,
        created_at: m.created_at,
        recorded_by: m.recorded_by,
        recorderName: memberMap.get(m.recorded_by) ?? "A family member",
        taggedNames: tagMap.get(m.id) ?? [],
      }));

      setFeed(items);
      setLoading(false);
    }

    load();
  }, [family?.id]);

  if (familyLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[--canvas]">
        <p className="text-[--ink-soft]">Loading activity…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas">
      <AppNav />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="font-display text-[clamp(28px,4vw,40px)] font-normal text-[--ink] leading-[1.1] tracking-[-0.02em]">Activity</h1>
          <p className="text-sm text-[--ink-mute] mt-1">{family?.name} · last 50 memories</p>
        </div>

        {feed.length === 0 ? (
          <div className="text-center py-16 text-[--ink-mute]">
            <p className="mb-1">No activity yet.</p>
            <p className="text-sm">Visit a family member&apos;s page to add the first memory.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {feed.map((item) => {
              const Icon = TYPE_ICONS[item.type];
              const colorCls = TYPE_COLORS[item.type];
              const subject = formatSubject(item.taggedNames);
              return (
                <Link
                  key={item.id}
                  href={`/memory/${item.id}`}
                  className="flex items-start gap-3 bg-[--surface] rounded-xl border border-[--rule] px-4 py-3.5 hover:border-[--gold] transition-colors block"
                >
                  <div className={`mt-1 w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${colorCls}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        {subject ? (
                          <>
                            <p className="font-semibold text-[15px] text-[--ink] leading-snug truncate">
                              {subject}
                            </p>
                            <p className="font-display text-[14px] text-[--ink-soft] mt-0.5 truncate">
                              {item.title}
                            </p>
                          </>
                        ) : (
                          <p className="font-display text-[15px] text-[--ink] leading-snug truncate">
                            {item.title}
                          </p>
                        )}
                        <p className="text-xs text-[--ink-mute] mt-1.5">
                          {TYPE_LABELS[item.type]} · by{" "}
                          <span className="text-[--ink-soft]">{item.recorderName}</span>
                        </p>
                      </div>
                      <span className="text-xs text-[--ink-mute] flex-shrink-0 mt-0.5">
                        {relativeTime(item.created_at)}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
