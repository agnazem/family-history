"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useFamily } from "@/lib/hooks/useFamily";
import { ArrowLeft, Mic, Image as ImageIcon, FileText, PenLine } from "lucide-react";
import type { MemoryType } from "@/types";

const TYPE_LABELS: Record<MemoryType, string> = {
  audio: "a voice memory",
  photo: "a photo",
  document: "a document",
  note: "a note",
};

const TYPE_ICONS: Record<MemoryType, React.ElementType> = {
  audio: Mic,
  photo: ImageIcon,
  document: FileText,
  note: PenLine,
};

const TYPE_COLORS: Record<MemoryType, string> = {
  audio: "bg-purple-50 text-purple-600",
  photo: "bg-accent-pale text-accent",
  document: "bg-green-50 text-green-600",
  note: "bg-canvas text-slate-600",
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

function feedSentence(typeLabel: string, taggedNames: string[]): string {
  if (taggedNames.length === 0) return `added ${typeLabel}`;
  if (taggedNames.length === 1) return `added ${typeLabel} of ${taggedNames[0]}`;
  if (taggedNames.length === 2) return `added ${typeLabel} of ${taggedNames[0]} and ${taggedNames[1]}`;
  return `added ${typeLabel} of ${taggedNames[0]} and ${taggedNames.length - 1} others`;
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
  const router = useRouter();
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
      <div className="min-h-screen flex items-center justify-center bg-canvas">
        <p className="text-accent">Loading activity...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <button
          onClick={() => router.push("/tree")}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to tree
        </button>

        <div className="mb-8">
          <h1 className="font-display text-3xl font-light text-stone-900 tracking-tight">Activity</h1>
          <p className="text-sm text-gray-500 mt-0.5">{family?.name} · last 50 memories</p>
        </div>

        {feed.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="mb-1">No activity yet.</p>
            <p className="text-sm">Visit a family member&apos;s page to add the first memory.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {feed.map((item) => {
              const Icon = TYPE_ICONS[item.type];
              const colorCls = TYPE_COLORS[item.type];
              return (
                <div
                  key={item.id}
                  className="flex items-start gap-3 bg-white rounded-xl border border-gray-100 px-4 py-3 shadow-sm"
                >
                  <div className={`mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${colorCls}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800">
                      <span className="font-medium">{item.recorderName}</span>
                      {" "}
                      {feedSentence(TYPE_LABELS[item.type], item.taggedNames)}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">
                      {item.title} · {relativeTime(item.created_at)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
