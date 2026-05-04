"use client";

import { useState } from "react";
import { Sparkles, Pencil, RefreshCw, Check, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Memory } from "@/types";


interface PersonSummaryProps {
  personId: string;
  personName: string;
  firstName: string;
  dob: string | null;
  dod: string | null;
  bio: string | null;
  initialSummary: string | null;
  memories: Memory[];
  onSummaryChange?: (summary: string) => void;
}

export function PersonSummary({
  personId,
  personName,
  firstName,
  dob,
  dod,
  bio,
  initialSummary,
  memories,
  onSummaryChange,
}: PersonSummaryProps) {
  const [summary, setSummary] = useState(initialSummary ?? "");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  async function generate() {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personId,
          personName,
          dob,
          dod,
          bio,
          memories: memories.map((m) => ({
            type: m.type,
            title: m.title,
            description: m.description,
            date_of_memory: m.date_of_memory,
          })),
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      const newSummary: string = data.summary;
      setSummary(newSummary);
      onSummaryChange?.(newSummary);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to generate summary");
    }
    setGenerating(false);
  }

  async function saveEdit() {
    const trimmed = draft.trim();
    setSummary(trimmed);
    onSummaryChange?.(trimmed);
    await supabase.from("people").update({ ai_summary: trimmed || null }).eq("id", personId);
    setEditing(false);
  }

  function startEdit() {
    setDraft(summary);
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setDraft("");
  }

  return (
    <section className="bg-white rounded-xl border border-accent-border shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-accent-mid" />
          <h2 className="font-display text-base font-normal text-stone-800">
            About {firstName}
          </h2>
        </div>

        {!editing && summary && (
          <div className="flex items-center gap-0.5">
            <button
              onClick={startEdit}
              className="p-1.5 text-gray-300 hover:text-gray-500 rounded transition-colors"
              title="Edit summary"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={generate}
              disabled={generating}
              className="p-1.5 text-gray-300 hover:text-accent-mid rounded transition-colors disabled:opacity-40"
              title="Regenerate from memories"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${generating ? "animate-spin" : ""}`} />
            </button>
          </div>
        )}
      </div>

      {editing ? (
        <div className="space-y-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={4}
            autoFocus
            className="w-full text-sm text-gray-700 leading-relaxed border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-mid resize-none"
          />
          <div className="flex gap-2">
            <button
              onClick={saveEdit}
              className="flex items-center gap-1.5 text-xs bg-accent text-white px-3 py-1.5 rounded-lg hover:bg-accent-hover transition-colors"
            >
              <Check className="w-3 h-3" />
              Save
            </button>
            <button
              onClick={cancelEdit}
              className="flex items-center gap-1.5 text-xs border border-gray-200 text-gray-500 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <X className="w-3 h-3" />
              Cancel
            </button>
          </div>
        </div>
      ) : summary ? (
        <p className="text-sm text-gray-600 leading-relaxed">{summary}</p>
      ) : (
        <div className="text-center py-3">
          <p className="text-sm text-gray-400 mb-3">
            {memories.length > 0
              ? `Generate an AI summary from ${memories.length} recorded ${memories.length === 1 ? "memory" : "memories"}.`
              : `Record a voice memo or add memories to generate ${firstName}'s summary.`}
          </p>
          {memories.length > 0 && (
            <button
              onClick={generate}
              disabled={generating}
              className="inline-flex items-center gap-1.5 text-sm bg-accent-pale text-accent border border-accent-border px-4 py-2 rounded-lg hover:bg-accent-pale/70 transition-colors disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {generating ? "Generating…" : "Generate Summary"}
            </button>
          )}
        </div>
      )}

      {error && (
        <p className="text-xs text-red-500 mt-2 bg-red-50 rounded px-2 py-1">{error}</p>
      )}

      {summary && (
        <p className="text-[10px] text-gray-300 mt-3 select-none">
          AI-generated · editable
        </p>
      )}
    </section>
  );
}
