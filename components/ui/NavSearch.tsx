"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, Mic, Image as ImageIcon, FileText, PenLine } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useFamily } from "@/lib/hooks/useFamily";
import { personDisplayName } from "@/lib/utils";
import type { Person } from "@/types";

interface MemoryResult {
  id: string;
  title: string;
  type: "audio" | "photo" | "document" | "note";
  description: string | null;
}

const MEMORY_ICONS = {
  audio: Mic,
  photo: ImageIcon,
  document: FileText,
  note: PenLine,
};

function normalize(s: string) {
  return s.toLowerCase().trim();
}

function matchesPerson(p: Person, q: string) {
  const aka = (p.also_known_as ?? []).join(" ");
  const n = normalize(`${p.first_name} ${p.last_name} ${p.nickname ?? ""} ${aka} ${p.bio ?? ""}`);
  return q.split(/\s+/).every((word) => n.includes(word));
}

function matchesMemory(m: MemoryResult, q: string) {
  const n = normalize(`${m.title} ${m.description ?? ""}`);
  return q.split(/\s+/).every((word) => n.includes(word));
}

export function NavSearch() {
  const [query, setQuery] = useState("");
  const [allPeople, setAllPeople] = useState<Person[]>([]);
  const [allMemories, setAllMemories] = useState<MemoryResult[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [focused, setFocused] = useState(false);
  const { family } = useFamily();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();
  const router = useRouter();

  async function ensureLoaded() {
    if (loaded || !family?.id) return;
    const [{ data: people }, { data: memories }] = await Promise.all([
      supabase.from("people").select("*").eq("family_id", family.id),
      supabase
        .from("memories")
        .select("id, title, type, description")
        .eq("family_id", family.id)
        .is("deleted_at", null),
    ]);
    setAllPeople((people ?? []) as Person[]);
    setAllMemories((memories ?? []) as MemoryResult[]);
    setLoaded(true);
  }

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setFocused(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const q = normalize(query);
  const hasQuery = q.length > 0;
  const matchedPeople = hasQuery ? allPeople.filter((p) => matchesPerson(p, q)).slice(0, 5) : [];
  const matchedMemories = hasQuery ? allMemories.filter((m) => matchesMemory(m, q)).slice(0, 4) : [];
  const hasResults = matchedPeople.length > 0 || matchedMemories.length > 0;
  const showDropdown = focused && hasQuery;

  function navigate(href: string) {
    setQuery("");
    setFocused(false);
    router.push(href);
  }

  return (
    <div ref={containerRef} className="relative hidden sm:block">
      {/* Input bar */}
      <div className="flex items-center gap-1.5 border border-[--rule] rounded-lg px-2 h-8 w-36 focus-within:w-52 transition-all duration-200 bg-[--surface]">
        <Search className="w-3.5 h-3.5 text-[--ink-mute] flex-shrink-0" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { setFocused(true); ensureLoaded(); }}
          onKeyDown={(e) => {
            if (e.key === "Escape") { setQuery(""); setFocused(false); inputRef.current?.blur(); }
          }}
          placeholder="Search…"
          className="flex-1 text-[13px] text-[--ink] bg-transparent outline-none placeholder:text-[--ink-mute] min-w-0"
        />
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute top-[calc(100%+6px)] right-0 w-72 bg-[--surface] border border-[--rule] rounded-xl shadow-xl overflow-hidden z-50">
          {!hasResults && (
            <div className="px-4 py-5 text-center text-sm text-[--ink-mute]">
              No results for &ldquo;{query}&rdquo;
            </div>
          )}

          {matchedPeople.length > 0 && (
            <div>
              <p className="px-3 pt-3 pb-1 text-[10px] font-semibold text-[--ink-mute] uppercase tracking-widest">
                People
              </p>
              {matchedPeople.map((p) => (
                <button
                  key={p.id}
                  onMouseDown={(e) => { e.preventDefault(); navigate(`/person/${p.id}`); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-[--canvas] transition-colors text-left"
                >
                  <div className="w-6 h-6 rounded-full bg-[--accent-soft] text-[--accent] text-[10px] font-display flex items-center justify-center flex-shrink-0">
                    {(p.nickname ?? p.first_name)[0]?.toUpperCase()}
                  </div>
                  <span className="text-sm text-[--ink] truncate">{personDisplayName(p)}</span>
                </button>
              ))}
            </div>
          )}

          {matchedMemories.length > 0 && (
            <div className={matchedPeople.length > 0 ? "border-t border-[--rule]" : ""}>
              <p className="px-3 pt-3 pb-1 text-[10px] font-semibold text-[--ink-mute] uppercase tracking-widest">
                Memories
              </p>
              {matchedMemories.map((m) => {
                const Icon = MEMORY_ICONS[m.type] ?? FileText;
                return (
                  <button
                    key={m.id}
                    onMouseDown={(e) => { e.preventDefault(); navigate(`/memory/${m.id}`); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-[--canvas] transition-colors text-left"
                  >
                    <div className="w-6 h-6 rounded-lg bg-[--canvas] flex items-center justify-center flex-shrink-0">
                      <Icon className="w-3.5 h-3.5 text-[--ink-mute]" />
                    </div>
                    <span className="text-sm text-[--ink] truncate">{m.title}</span>
                  </button>
                );
              })}
            </div>
          )}

          <div className="h-1" />
        </div>
      )}
    </div>
  );
}
