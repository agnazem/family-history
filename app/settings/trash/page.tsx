"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useFamily } from "@/lib/hooks/useFamily";
import { ArrowLeft, Trash2, RotateCcw, AlertTriangle } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { Memory, MemoryType } from "@/types";

const TYPE_LABELS: Record<MemoryType, string> = {
  audio: "Voice memory",
  photo: "Photo",
  document: "Document",
  note: "Written note",
};

export default function TrashPage() {
  const router = useRouter();
  const { family, member, loading: familyLoading } = useFamily();
  const [deleted, setDeleted] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [confirmPermanent, setConfirmPermanent] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    if (!family?.id || member?.role !== "admin") return;

    supabase
      .from("memories")
      .select("*")
      .eq("family_id", family.id)
      .not("deleted_at", "is", null)
      .order("deleted_at", { ascending: false })
      .then(({ data }) => {
        setDeleted((data ?? []) as Memory[]);
        setLoading(false);
      });
  }, [family?.id, member?.role]);

  if (familyLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[--canvas]">
        <p className="text-[--ink-soft]">Loading…</p>
      </div>
    );
  }

  if (member?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[--canvas]">
        <p className="text-[--ink-mute]">Admin access required.</p>
      </div>
    );
  }

  async function handleRestore(memoryId: string) {
    setActionId(memoryId);
    await supabase
      .from("memories")
      .update({ deleted_at: null })
      .eq("id", memoryId);
    setDeleted((prev) => prev.filter((m) => m.id !== memoryId));
    setActionId(null);
  }

  async function handlePermanentDelete(memoryId: string) {
    if (confirmPermanent !== memoryId) {
      setConfirmPermanent(memoryId);
      return;
    }
    setActionId(memoryId);
    await supabase.from("memories").delete().eq("id", memoryId);
    setDeleted((prev) => prev.filter((m) => m.id !== memoryId));
    setActionId(null);
    setConfirmPermanent(null);
  }

  return (
    <div className="min-h-screen bg-[--canvas]">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <button
          onClick={() => router.push("/settings")}
          className="flex items-center gap-1.5 text-sm text-[--ink-soft] hover:text-[--ink] transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to settings
        </button>

        <div className="mb-8">
          <h1 className="font-display text-[clamp(28px,5vw,40px)] font-normal text-[--ink] leading-[1.1] tracking-[-0.02em]">
            Deleted memories
          </h1>
          <p className="text-sm text-[--ink-mute] mt-1">
            Restore memories or permanently delete them. Only visible to admins.
          </p>
        </div>

        {deleted.length === 0 ? (
          <div className="text-center py-16 bg-[--surface] border border-[--rule] rounded-2xl">
            <Trash2 className="w-8 h-8 text-[--ink-mute] mx-auto mb-3" />
            <p className="text-[--ink-mute]">No deleted memories.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {deleted.map((memory) => (
              <div
                key={memory.id}
                className="bg-[--surface] border border-[--rule] rounded-xl p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className="eyebrow">{TYPE_LABELS[memory.type]}</span>
                    <p className="font-display text-[18px] font-normal text-[--ink] mt-0.5 truncate">
                      {memory.title}
                    </p>
                    <p className="text-xs text-[--ink-mute] mt-1">
                      Deleted {formatDate(memory.deleted_at!)} · Added {formatDate(memory.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleRestore(memory.id)}
                      disabled={actionId === memory.id}
                      className="flex items-center gap-1.5 text-xs border border-[--rule] text-[--ink-soft] hover:text-[--ink] hover:border-[--gold] px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Restore
                    </button>
                    <button
                      onClick={() => handlePermanentDelete(memory.id)}
                      disabled={actionId === memory.id}
                      className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50 ${
                        confirmPermanent === memory.id
                          ? "bg-red-600 text-white border border-red-600 hover:bg-red-700"
                          : "border border-red-200 text-red-500 hover:bg-red-50 hover:border-red-400"
                      }`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      {confirmPermanent === memory.id ? "Confirm" : "Delete forever"}
                    </button>
                    {confirmPermanent === memory.id && (
                      <button
                        onClick={() => setConfirmPermanent(null)}
                        className="text-xs text-[--ink-mute] hover:text-[--ink] px-1"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
                {confirmPermanent === memory.id && (
                  <div className="flex items-start gap-2 mt-3 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-red-700">
                      This will permanently delete the memory and all associated data. This cannot be undone.
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
