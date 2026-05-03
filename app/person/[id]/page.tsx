"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useMemories } from "@/lib/hooks/useMemories";
import { Avatar } from "@/components/ui/Avatar";
import { MemoryCard } from "@/components/folio/MemoryCard";
import { MemoryModal } from "@/components/folio/MemoryModal";
import { AddMemoryModal } from "@/components/folio/AddMemoryModal";
import { PersonSummary } from "@/components/folio/PersonSummary";
import { TellMeModal } from "@/components/folio/TellMeModal";
import { RelationshipModal } from "@/components/tree/RelationshipModal";
import { AddRelationshipPanel } from "@/components/tree/AddRelationshipPanel";
import { AddRelatedPersonModal, type RelationIntent } from "@/components/folio/AddRelatedPersonModal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Spinner } from "@/components/ui/Spinner";
import { ArrowLeft, Pencil, Plus, GitMerge, UserPlus, Camera, Trash2, Mic } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useFamily } from "@/lib/hooks/useFamily";
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
  const { member: currentMember } = useFamily();
  const [person, setPerson] = useState<Person | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [familyPeople, setFamilyPeople] = useState<Person[]>([]);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddMemory, setShowAddMemory] = useState(false);
  const [showAddRelationship, setShowAddRelationship] = useState(false);
  const [pendingIntent, setPendingIntent] = useState<RelationIntent | null>(null);
  const [selectedRelationship, setSelectedRelationship] = useState<Relationship | null>(null);
  const [selectedMemory, setSelectedMemory] = useState<import("@/types").Memory | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showTellMe, setShowTellMe] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const { memories, tagMap, loading: memoriesLoading, refetch: refetchMemories } = useMemories(id, person?.family_id ?? null);

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !person) return;
    setUploadingPhoto(true);
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `profiles/${person.family_id}/${id}/${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from("photos").upload(path, file, { upsert: true });
    if (!uploadError) {
      const { data } = supabase.storage.from("photos").getPublicUrl(path);
      await supabase.from("people").update({ profile_photo_url: data.publicUrl }).eq("id", id);
      setPerson((prev) => prev ? { ...prev, profile_photo_url: data.publicUrl } : prev);
    }
    setUploadingPhoto(false);
    if (photoInputRef.current) photoInputRef.current.value = "";
  }

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
        setAiSummary(data.ai_summary ?? null);
        await loadRelationships(data.family_id);
      }
      setLoading(false);
    }
    load();
  }, [id]);

  async function handleDelete() {
    if (!person) return;
    setDeleting(true);
    setDeleteError(null);
    const res = await fetch("/api/people", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ personId: id, familyId: person.family_id }),
    });
    const data = await res.json();
    if (data.error) {
      setDeleteError(data.error);
      setDeleting(false);
    } else {
      router.push("/tree");
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas">
        <Spinner />
      </div>
    );
  }

  if (!person) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas">
        <p className="text-gray-500">Person not found.</p>
      </div>
    );
  }

  const fullName = [person.first_name, person.middle_name, person.last_name].filter(Boolean).join(" ");

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
    <div className="min-h-screen bg-canvas">
      {/* Header */}
      <div className="bg-white border-b border-accent-border shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <button
            onClick={() => router.push("/tree")}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to tree
          </button>

          <div className="flex items-start gap-4">
            <div className="relative group flex-shrink-0">
              <Avatar src={person.profile_photo_url} name={fullName} size="xl" />
              <label
                className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                title="Change photo"
              >
                {uploadingPhoto ? (
                  <span className="text-white text-xs">...</span>
                ) : (
                  <Camera className="w-6 h-6 text-white" />
                )}
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoUpload}
                  disabled={uploadingPhoto}
                />
              </label>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h1 className="font-display text-3xl font-light text-stone-900 tracking-tight">{fullName}</h1>
                  {person.nickname && (
                    <p className="text-sm text-stone-500 mt-0.5">Known as &ldquo;{person.nickname}&rdquo;</p>
                  )}
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => setShowTellMe(true)}
                    className="flex items-center gap-1.5 text-sm text-accent hover:text-accent-hover border border-accent-border hover:border-accent-mid bg-accent-pale px-3 py-1.5 rounded-lg transition-colors"
                    title="Tell me about this person"
                  >
                    <Mic className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Tell me about</span>
                  </button>
                  <button
                    onClick={() => router.push(`/person/${id}/edit`)}
                    className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-accent border border-gray-300 hover:border-accent-mid px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Edit
                  </button>
                  {currentMember?.role === "admin" && (
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      disabled={deleting}
                      title="Delete person"
                      className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700 border border-red-200 hover:border-red-400 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{deleting ? "Deleting…" : "Delete"}</span>
                    </button>
                  )}
                </div>
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
        {/* AI Summary */}
        <PersonSummary
          personId={id}
          personName={fullName}
          firstName={person.first_name}
          dob={person.dob}
          dod={person.dod}
          bio={person.bio}
          initialSummary={aiSummary}
          memories={memories}
          onSummaryChange={setAiSummary}
        />

        {/* Relationships */}
        <section>
          <div className="mb-3">
            <h2 className="font-display text-xl font-normal text-stone-900 mb-2">Relationships</h2>
            <div className="flex flex-wrap gap-2">
              {(["add_parent", "add_child", "add_sibling", "add_spouse"] as RelationIntent[]).map((intent) => (
                <button
                  key={intent}
                  onClick={() => setPendingIntent(intent)}
                  className="flex items-center gap-1.5 border border-accent-border text-accent hover:bg-accent-pale text-xs px-2.5 py-1.5 rounded-lg transition-colors"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  {intent === "add_parent" ? "Add Parent" :
                   intent === "add_child" ? "Add Child" :
                   intent === "add_sibling" ? "Add Sibling" : "Add Spouse"}
                </button>
              ))}
              <button
                onClick={() => setShowAddRelationship(true)}
                className="flex items-center gap-1.5 border border-gray-300 text-gray-500 hover:bg-gray-50 text-xs px-2.5 py-1.5 rounded-lg transition-colors"
                title="Link to an existing family member"
              >
                <GitMerge className="w-3.5 h-3.5" />
                Link Existing
              </button>
            </div>
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
                            className="flex items-center gap-2 bg-white border border-gray-200 hover:border-accent-mid rounded-xl px-3 py-2 text-sm text-gray-700 hover:text-gray-900 transition-all shadow-sm"
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
            <h2 className="font-display text-xl font-normal text-stone-900">Memories</h2>
            <button
              onClick={() => setShowAddMemory(true)}
              className="flex items-center gap-1.5 bg-accent hover:bg-accent-hover text-white text-sm px-3 py-1.5 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Memory
            </button>
          </div>

          {memoriesLoading ? (
            <p className="text-gray-400 text-sm">Loading memories…</p>
          ) : memories.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="mb-2">No memories yet for {person.first_name}.</p>
              <p className="text-sm">Be the first to record a story, upload a photo, or share a note.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {memories.map((m) => {
                const otherTagged = (tagMap[m.id] ?? [])
                  .filter((pid) => pid !== id)
                  .map((pid) => familyPeople.find((p) => p.id === pid))
                  .filter(Boolean) as Person[];
                return (
                  <MemoryCard
                    key={m.id}
                    memory={m}
                    taggedPeople={otherTagged}
                    onClick={() => setSelectedMemory(m)}
                  />
                );
              })}
            </div>
          )}
        </section>
      </main>

      <AddMemoryModal
        open={showAddMemory}
        onClose={() => setShowAddMemory(false)}
        personId={id}
        familyId={person.family_id}
        familyPeople={familyPeople}
        onAdded={refetchMemories}
      />

      <MemoryModal
        memory={selectedMemory}
        familyPeople={familyPeople}
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

      {pendingIntent && (
        <AddRelatedPersonModal
          open={!!pendingIntent}
          onClose={() => setPendingIntent(null)}
          intent={pendingIntent}
          currentPersonId={id}
          currentPersonName={fullName}
          familyId={person.family_id}
          familyPeople={familyPeople}
          defaultOtherParentId={
            pendingIntent === "add_child" && grouped.spouses.length === 1
              ? getOtherPersonId(grouped.spouses[0])
              : ""
          }
          onAdded={() => {
            setPendingIntent(null);
            loadRelationships(person.family_id);
          }}
        />
      )}

      <TellMeModal
        open={showTellMe}
        onClose={() => setShowTellMe(false)}
        person={person}
        familyPeople={familyPeople}
        onComplete={() => {
          refetchMemories();
          loadRelationships(person.family_id);
        }}
      />

      <ConfirmModal
        open={showDeleteConfirm}
        onClose={() => { setShowDeleteConfirm(false); setDeleteError(null); }}
        onConfirm={handleDelete}
        title="Delete person"
        description={`Permanently delete ${fullName}? This will also remove all their relationships and memories. This cannot be undone.`}
        confirmLabel="Delete"
        loading={deleting}
        error={deleteError}
        variant="danger"
      />
    </div>
  );
}
