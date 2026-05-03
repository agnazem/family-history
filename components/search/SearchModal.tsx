"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Search, X, User, Mic, Image as ImageIcon, FileText, PenLine } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import Image from "next/image";
import type { Memory, Person } from "@/types";

interface SearchModalProps {
  open: boolean;
  onClose: () => void;
  familyId: string;
  people: Person[];
  onPersonClick: (personId: string) => void;
}

const MEMORY_ICONS = {
  audio: Mic,
  photo: ImageIcon,
  document: FileText,
  note: PenLine,
};

const MEMORY_TYPE_LABELS = {
  audio: "Voice Memory",
  photo: "Photo",
  document: "Document",
  note: "Written Note",
};

function normalize(s: string) {
  return s.toLowerCase().trim();
}

function matchesPerson(p: Person, q: string) {
  const n = normalize(`${p.first_name} ${p.last_name} ${p.bio ?? ""}`);
  return q.split(/\s+/).every((word) => n.includes(word));
}

function matchesMemory(m: Memory, q: string) {
  const n = normalize(`${m.title} ${m.description ?? ""}`);
  return q.split(/\s+/).every((word) => n.includes(word));
}

export function SearchModal({
  open,
  onClose,
  familyId,
  people,
  onPersonClick,
}: SearchModalProps) {
  const [query, setQuery] = useState("");
  const [allMemories, setAllMemories] = useState<Memory[]>([]);
  const [memoryPersonMap, setMemoryPersonMap] = useState<Record<string, string>>({});
  const [loadingMemories, setLoadingMemories] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  // Fetch all family memories + person tags once when modal opens
  useEffect(() => {
    if (!open || !familyId) return;
    setLoadingMemories(true);
    Promise.all([
      supabase.from("memories").select("*").eq("family_id", familyId).order("created_at", { ascending: false }),
      supabase.from("memory_people").select("memory_id, person_id").eq("family_id", familyId),
    ]).then(([{ data: memories }, { data: tags }]) => {
      setAllMemories(memories ?? []);
      const map: Record<string, string> = {};
      for (const t of tags ?? []) {
        if (!map[t.memory_id]) map[t.memory_id] = t.person_id;
      }
      setMemoryPersonMap(map);
      setLoadingMemories(false);
    });
  }, [open, familyId]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Escape to close
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const q = normalize(query);
  const hasQuery = q.length > 0;

  const matchedPeople = hasQuery
    ? people.filter((p) => matchesPerson(p, q))
    : [];

  const matchedMemories = hasQuery
    ? allMemories.filter((m) => matchesMemory(m, q))
    : [];

  const hasResults = matchedPeople.length > 0 || matchedMemories.length > 0;

  function getPersonForMemory(m: Memory) {
    const personId = memoryPersonMap[m.id];
    return personId ? people.find((p) => p.id === personId) : undefined;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full max-w-xl bg-white rounded-xl shadow-2xl overflow-hidden">
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
          <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search people, photos, memories..."
            className="flex-1 text-base text-gray-900 placeholder-gray-400 outline-none bg-transparent"
          />
          {query && (
            <button onClick={() => setQuery("")} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="text-xs text-gray-400 hover:text-gray-600 border border-gray-200 rounded px-1.5 py-0.5 ml-1"
          >
            esc
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto">
          {!hasQuery && (
            <div className="px-4 py-8 text-center text-sm text-gray-400">
              Start typing to search family members and memories
            </div>
          )}

          {hasQuery && !hasResults && !loadingMemories && (
            <div className="px-4 py-8 text-center text-sm text-gray-400">
              No results for &ldquo;{query}&rdquo;
            </div>
          )}

          {/* People results */}
          {matchedPeople.length > 0 && (
            <div>
              <p className="px-4 pt-3 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                People
              </p>
              {matchedPeople.map((p) => (
                <button
                  key={p.id}
                  onClick={() => { onPersonClick(p.id); onClose(); }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-canvas transition-colors text-left"
                >
                  <Avatar
                    src={p.profile_photo_url}
                    name={`${p.first_name} ${p.last_name}`}
                    size="sm"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {p.first_name} {p.last_name}
                    </p>
                    {p.bio && (
                      <p className="text-xs text-gray-500 truncate">{p.bio}</p>
                    )}
                  </div>
                  <User className="w-4 h-4 text-gray-300 flex-shrink-0" />
                </button>
              ))}
            </div>
          )}

          {/* Memory results */}
          {matchedMemories.length > 0 && (
            <div>
              <p className="px-4 pt-3 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                Memories
              </p>
              {matchedMemories.map((m) => {
                const person = getPersonForMemory(m);
                const Icon = MEMORY_ICONS[m.type];
                return (
                  <button
                    key={m.id}
                    onClick={() => {
                      if (person) onPersonClick(person.id);
                      onClose();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-canvas transition-colors text-left"
                  >
                    {/* Thumbnail for photos, icon for everything else */}
                    {m.type === "photo" && m.storage_url ? (
                      <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                        <Image
                          src={m.storage_url}
                          alt={m.title}
                          width={40}
                          height={40}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-4 h-4 text-gray-500" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{m.title}</p>
                      <p className="text-xs text-gray-500">
                        {MEMORY_TYPE_LABELS[m.type]}
                        {person && ` · ${person.first_name} ${person.last_name}`}
                      </p>
                      {m.description && (
                        <p className="text-xs text-gray-400 truncate mt-0.5">{m.description}</p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {loadingMemories && hasQuery && (
            <div className="px-4 py-4 text-center text-xs text-gray-400">
              Loading memories...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
