"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useMemories } from "@/lib/hooks/useMemories";
import { Avatar } from "@/components/ui/Avatar";
import { MemoryCard } from "@/components/folio/MemoryCard";
import { AddMemoryModal } from "@/components/folio/AddMemoryModal";
import { ArrowLeft, Pencil, Plus } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { Person } from "@/types";

export default function PersonPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [person, setPerson] = useState<Person | null>(null);
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddMemory, setShowAddMemory] = useState(false);
  const supabase = createClient();

  const { memories, loading: memoriesLoading, refetch } = useMemories(id);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("people")
        .select("*")
        .eq("id", id)
        .single();
      if (data) {
        setPerson(data);
        setFamilyId(data.family_id);
      }
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-amber-50">
        <p className="text-amber-700">Loading...</p>
      </div>
    );
  }

  if (!person) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-amber-50">
        <p className="text-gray-500">Person not found.</p>
      </div>
    );
  }

  const fullName = `${person.first_name} ${person.last_name}`;

  return (
    <div className="min-h-screen bg-amber-50">
      {/* Header */}
      <div className="bg-white border-b border-amber-100 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to tree
          </button>

          <div className="flex items-start gap-4">
            <Avatar src={person.profile_photo_url} name={fullName} size="xl" />
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h1 className="text-2xl font-bold text-gray-900">{fullName}</h1>
                <button
                  onClick={() => router.push(`/person/${id}/edit`)}
                  className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-amber-700 border border-gray-300 hover:border-amber-400 px-3 py-1.5 rounded-lg transition-colors flex-shrink-0"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Edit
                </button>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-gray-500">
                {person.dob && <span>Born {formatDate(person.dob)}</span>}
                {person.dod && <span>Died {formatDate(person.dod)}</span>}
              </div>
              {person.bio && (
                <p className="text-gray-600 mt-2 leading-relaxed">{person.bio}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Memories */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Memories</h2>
          <button
            onClick={() => setShowAddMemory(true)}
            className="flex items-center gap-1.5 bg-amber-700 hover:bg-amber-800 text-white text-sm px-3 py-1.5 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Memory
          </button>
        </div>

        {memoriesLoading ? (
          <p className="text-gray-400 text-sm">Loading memories...</p>
        ) : memories.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="mb-2">No memories yet for {person.first_name}.</p>
            <p className="text-sm">
              Be the first to record a story, upload a photo, or share a note.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {memories.map((m) => (
              <MemoryCard key={m.id} memory={m} />
            ))}
          </div>
        )}
      </main>

      {familyId && (
        <AddMemoryModal
          open={showAddMemory}
          onClose={() => setShowAddMemory(false)}
          personId={id}
          familyId={familyId}
          onAdded={refetch}
        />
      )}
    </div>
  );
}
