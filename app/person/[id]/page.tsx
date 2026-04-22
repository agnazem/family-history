"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useMemories } from "@/lib/hooks/useMemories";
import { Avatar } from "@/components/ui/Avatar";
import { MemoryCard } from "@/components/folio/MemoryCard";
import { MemoryModal } from "@/components/folio/MemoryModal";
import { AddMemoryModal } from "@/components/folio/AddMemoryModal";
import { RelationshipModal } from "@/components/tree/RelationshipModal";
import { AddRelationshipPanel } from "@/components/tree/AddRelationshipPanel";
import { ArrowLeft, Pencil, Plus, GitMerge } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { Person, Relationship } from "@/types";

const RELATIONSHIP_SECTION_LABELS: Record<string, string> = {
  parents: "Parents",
  children: "Children",
  spouses: "Spouses / Partners",
  siblings: "Siblings",
};

export default function PersonPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [person, setPerson] = useState<Person | null>(null);
  const [familyPeople, setFamilyPeople] = useState<Person[]>([]);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddMemory, setShowAddMemory] = useState(false);
  const [showAddRelationship, setShowAddRelationship] = useState(false);
  const [selectedRelationship, setSelectedRelationship] = useState<Relationship | null>(null);
  const [selectedMemory, setSelectedMemory] = useState<import("@/types").Memory | null>(null);
  const supabase = createClient();

  const { memories, loading: memoriesLoading, refetch: refetchMemories } = useMemories(id);

  const loadRelationships = useCallback(async (familyId: string) => {
    const [{ data: rels }, { data: people }] = await Promise.all([
      supabase
        .from("relationships")
        .select("*")
        .or(`person_a_id.eq.${id},person_b_id.eq.${id}`),
      supabase.from("people").select("*").eq("family_id", familyId),
    ]);
    setRelationships(rels ?? []);
    setFamilyPeople(people ?? []);
  }, [id]);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from("people").select("*").eq("id", id).single();
      if (data) {
        setPerson(data);
        await loadRelationships(data.family_id);
      }
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-blue-600">Loading...</p>
      </div>
    );
  }

  if (!person) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-gray-500">Person not found.</p>
      </div>
    );
  }

  const fullName = `${person.first_name} ${person.last_name}`;

  // Group relationships by type relative to this person
  const grouped = {
    parents: relationships.filter((r) => r.type === "parent_child" && r.person_b_id === id),
    children: relationships.filter((r) => r.type === "parent_child" && r.person_a_id === id),
    spouses: relationships.filter((r) => r.type === "spouse"),
    siblings: relationships.filter((r) => r.type === "sibling"),
  };

  function getOtherPersonId(rel: Relationship) {
    return rel.person_a_id === id ? rel.person_b_id : rel.person_a_id;
  }

  function getOtherPerson(rel: Relationship) {
    return familyPeople.find((p) => p.id === getOtherPersonId(rel));
  }

  const hasRelationships = Object.values(grouped).some((g) => g.length > 0);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-blue-100 shadow-sm">
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
                  className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 border border-gray-300 hover:border-blue-400 px-3 py-1.5 rounded-lg transition-colors flex-shrink-0"
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

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-8">
        {/* Relationships */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">Relationships</h2>
            <button
              onClick={() => setShowAddRelationship(true)}
              className="flex items-center gap-1.5 border border-blue-600 text-blue-600 hover:bg-blue-50 text-sm px-3 py-1.5 rounded-lg transition-colors"
            >
              <GitMerge className="w-4 h-4" />
              Add
            </button>
          </div>

          {!hasRelationships ? (
            <p className="text-sm text-gray-400">No relationships recorded yet.</p>
          ) : (
            <div className="space-y-4">
              {(Object.entries(grouped) as [string, Relationship[]][])
                .filter(([, rels]) => rels.length > 0)
                .map(([group, rels]) => (
                  <div key={group}>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                      {RELATIONSHIP_SECTION_LABELS[group]}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {rels.map((rel) => {
                        const other = getOtherPerson(rel);
                        if (!other) return null;
                        return (
                          <button
                            key={rel.id}
                            onClick={() => setSelectedRelationship(rel)}
                            className="flex items-center gap-2 bg-white border border-gray-200 hover:border-blue-400 rounded-xl px-3 py-2 text-sm text-gray-700 hover:text-gray-900 transition-all shadow-sm"
                          >
                            <Avatar src={other.profile_photo_url} name={`${other.first_name} ${other.last_name}`} size="sm" />
                            <span className="font-medium">{other.first_name} {other.last_name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </section>

        {/* Memories */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Memories</h2>
            <button
              onClick={() => setShowAddMemory(true)}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-1.5 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Memory
            </button>
          </div>

          {memoriesLoading ? (
            <p className="text-gray-400 text-sm">Loading memories...</p>
          ) : memories.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="mb-2">No memories yet for {person.first_name}.</p>
              <p className="text-sm">Be the first to record a story, upload a photo, or share a note.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {memories.map((m) => (
                <MemoryCard key={m.id} memory={m} onClick={() => setSelectedMemory(m)} />
              ))}
            </div>
          )}
        </section>
      </main>

      <AddMemoryModal
        open={showAddMemory}
        onClose={() => setShowAddMemory(false)}
        personId={id}
        familyId={person.family_id}
        onAdded={refetchMemories}
      />

      <MemoryModal
        memory={selectedMemory}
        onClose={() => setSelectedMemory(null)}
        onChanged={() => { setSelectedMemory(null); refetchMemories(); }}
      />

      <AddRelationshipPanel
        open={showAddRelationship}
        onClose={() => setShowAddRelationship(false)}
        familyId={person.family_id}
        people={familyPeople}
        onAdded={() => loadRelationships(person.family_id)}
      />

      <RelationshipModal
        relationship={selectedRelationship}
        people={familyPeople}
        currentPersonId={id}
        onViewPerson={(personId) => router.push(`/person/${personId}`)}
        onClose={() => setSelectedRelationship(null)}
        onChanged={() => {
          setSelectedRelationship(null);
          loadRelationships(person.family_id);
        }}
      />
    </div>
  );
}
