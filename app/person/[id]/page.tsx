"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useMemories } from "@/lib/hooks/useMemories";
import { Avatar } from "@/components/ui/Avatar";
import { MemoryCard } from "@/components/folio/MemoryCard";
import { AddMemoryModal } from "@/components/folio/AddMemoryModal";
import { PersonSummary } from "@/components/folio/PersonSummary";
import { TellMeModal } from "@/components/folio/TellMeModal";
import { RelationshipModal } from "@/components/tree/RelationshipModal";
import { AddRelationshipPanel } from "@/components/tree/AddRelationshipPanel";
import { AddRelatedPersonModal, type RelationIntent } from "@/components/folio/AddRelatedPersonModal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { RequestAccessModal } from "@/components/ui/RequestAccessModal";
import type { PermissionKey } from "@/types";
import { Spinner } from "@/components/ui/Spinner";
import { Pencil, Plus, GitMerge, UserPlus, Camera, Trash2, Mic, TreePine, ChevronLeft, ChevronRight } from "lucide-react";
import { AppNav } from "@/components/ui/AppNav";
import { useFamily } from "@/lib/hooks/useFamily";
import { preferredFirst, personDisplayName } from "@/lib/utils";
import type { Person, Relationship } from "@/types";

type TabId = "memories" | "timeline" | "photos" | "letters" | "relationships";

const TABS: Array<{ id: TabId; label: string }> = [
  { id: "memories", label: "Memories" },
  { id: "timeline", label: "Timeline" },
  { id: "photos", label: "Photos" },
  { id: "letters", label: "Letters & docs" },
  { id: "relationships", label: "Relationships" },
];

const RELATION_LABELS: Record<string, string> = {
  parents: "Parent",
  children: "Child",
  spouses: "Spouse / Partner",
  siblings: "Sibling",
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
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showTellMe, setShowTellMe] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [requestingPermission, setRequestingPermission] = useState<PermissionKey | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("memories");
  const photoInputRef = useRef<HTMLInputElement>(null);
  const familyScrollRef = useRef<HTMLDivElement>(null);
  function scrollFamily(dir: -1 | 1) {
    familyScrollRef.current?.scrollBy({ left: dir * 220, behavior: "smooth" });
  }

  const isAdmin = currentMember?.role === "admin";
  const canEditTree = isAdmin || currentMember?.can_edit_tree === true;
  const canEditMemories = isAdmin || currentMember?.can_edit_memories === true;
  const supabase = createClient();

  const { memories, tagMap, loading: memoriesLoading, refetch: refetchMemories } = useMemories(id, person?.family_id ?? null);

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !person) return;
    setUploadingPhoto(true);
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${person.family_id}/${id}/${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from("profile-photos").upload(path, file, { upsert: true });
    if (!uploadError) {
      const { data } = supabase.storage.from("profile-photos").getPublicUrl(path);
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
      <div className="min-h-screen flex items-center justify-center bg-[--canvas]">
        <Spinner />
      </div>
    );
  }

  if (!person) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[--canvas]">
        <p className="text-[--ink-mute]">Person not found.</p>
      </div>
    );
  }

  const fullName = [person.first_name, person.middle_name, person.last_name].filter(Boolean).join(" ");

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

  // Year labels for display
  const birthYear = person.dob ? new Date(person.dob + "T00:00:00Z").getUTCFullYear() : null;
  const deathYear = person.dod ? new Date(person.dod + "T00:00:00Z").getUTCFullYear() : null;

  // Age calculation accounts for whether the birthday has passed yet this year
  function calcAge(dob: string, asOf: Date): number {
    const birth = new Date(dob + "T00:00:00Z");
    let years = asOf.getUTCFullYear() - birth.getUTCFullYear();
    const hadBirthday =
      asOf.getUTCMonth() > birth.getUTCMonth() ||
      (asOf.getUTCMonth() === birth.getUTCMonth() && asOf.getUTCDate() >= birth.getUTCDate());
    if (!hadBirthday) years--;
    return years;
  }
  const age = person.dob
    ? person.dod
      ? calcAge(person.dob, new Date(person.dod + "T00:00:00Z"))
      : calcAge(person.dob, new Date())
    : null;

  // Flat list of all related people for Family section
  const allRelations = [
    ...grouped.parents.map((r) => ({ rel: r, group: "parents" })),
    ...grouped.spouses.map((r) => ({ rel: r, group: "spouses" })),
    ...grouped.children.map((r) => ({ rel: r, group: "children" })),
    ...grouped.siblings.map((r) => ({ rel: r, group: "siblings" })),
  ];

  const hasRelationships = Object.values(grouped).some((g) => g.length > 0);

  const tabCounts: Partial<Record<TabId, number>> = {
    memories: memories.length,
    relationships: relationships.length,
  };

  return (
    <div className="min-h-screen bg-[--canvas]">
      <AppNav />

      {/* Breadcrumb */}
      <div className="border-b border-[--rule] bg-[--surface]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-2 font-mono text-[11px] tracking-[0.06em] uppercase text-[--ink-mute]">
          <button onClick={() => router.push("/tree")} className="hover:text-[--ink] transition-colors">People</button>
          <span>›</span>
          <span className="text-[--ink]">{preferredFirst(person)}</span>
          <div className="flex-1" />
          {canEditTree && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => canEditMemories ? setShowTellMe(true) : setRequestingPermission("can_edit_memories")}
                className="flex items-center gap-1 px-2.5 py-1 border border-[--rule] rounded-lg text-[--ink-mute] hover:text-[--ink] hover:border-[--gold] transition-colors normal-case text-[11px]"
              >
                <Mic className="w-3 h-3" />
                Record
              </button>
              <button
                onClick={() => router.push(`/person/${id}/edit`)}
                className="flex items-center gap-1 px-2.5 py-1 border border-[--rule] rounded-lg text-[--ink-mute] hover:text-[--ink] hover:border-[--gold] transition-colors normal-case text-[11px]"
              >
                <Pencil className="w-3 h-3" />
                Edit
              </button>
              {(isAdmin || (canEditTree && person.created_by === currentMember?.user_id && Date.now() - new Date(person.created_at).getTime() < 3600000)) && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={deleting}
                  className="flex items-center gap-1 px-2.5 py-1 border border-red-200 rounded-lg text-red-500 hover:text-red-700 hover:border-red-400 transition-colors normal-case text-[11px] disabled:opacity-40"
                >
                  <Trash2 className="w-3 h-3" />
                  {deleting ? "Deleting…" : "Delete"}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Hero — 2-col */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid gap-12 sm:grid-cols-[320px_1fr] items-start">
          {/* Portrait */}
          <div>
            <div className="relative group w-full" style={{ aspectRatio: "320/400" }}>
              {person.profile_photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={person.profile_photo_url}
                  alt={fullName}
                  className="w-full h-full object-cover rounded-[--radius-lg]"
                  style={{ border: "1px solid var(--rule)" }}
                />
              ) : (
                <div
                  className="w-full h-full rounded-[--radius-lg] bg-[--accent-soft] flex items-center justify-center"
                  style={{ border: "1px solid var(--rule)" }}
                >
                  <span className="font-display text-[80px] font-normal text-[--accent] leading-none">
                    {preferredFirst(person)[0]}
                  </span>
                </div>
              )}
              {canEditTree && (
                <label
                  className="absolute inset-0 flex items-center justify-center rounded-[--radius-lg] bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  title="Change photo"
                >
                  {uploadingPhoto ? (
                    <span className="text-white text-sm">Uploading…</span>
                  ) : (
                    <Camera className="w-8 h-8 text-white" />
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
              )}
            </div>
            {(birthYear || person.bio) && (
              <p className="font-mono text-[11px] text-[--ink-mute] tracking-[0.06em] uppercase mt-2">
                {birthYear && deathYear
                  ? `${birthYear} — ${deathYear}`
                  : birthYear
                  ? `b. ${birthYear}`
                  : null}
              </p>
            )}
          </div>

          {/* Name + facts + bio + CTAs */}
          <div>
            <p className="eyebrow mb-3">
              {person.nickname
                ? `${person.first_name} ${person.last_name}`
                : grouped.parents.length > 0 ? "Known from family tree" : "Family member"}
            </p>
            <h1 className="font-display text-[clamp(48px,8vw,80px)] font-normal leading-[0.98] tracking-[-0.02em] text-[--ink]">
              {preferredFirst(person)}
            </h1>
            <div className="font-display italic text-[clamp(32px,5vw,56px)] font-normal leading-[1] tracking-[-0.02em] text-[--ink-soft] mb-6">
              {person.last_name}
            </div>

            {/* Fact row */}
            <div className="flex gap-8 mb-6 flex-wrap">
              {birthYear && (
                <FactItem label="Born" value={String(birthYear)} />
              )}
              {person.maiden_name && (
                <FactItem label="Née" value={person.maiden_name} italic />
              )}
              {age !== null && (
                <FactItem label={deathYear ? "Age at death" : "Age"} value={String(age)} />
              )}
              {grouped.children.length > 0 && (
                <FactItem
                  label="Children"
                  value={String(grouped.children.length)}
                  sub={grouped.children
                    .slice(0, 3)
                    .map((r) => { const p = getOtherPerson(r); return p ? preferredFirst(p) : undefined; })
                    .filter(Boolean)
                    .join(", ")}
                />
              )}
            </div>

            {/* Bio */}
            {person.bio && (
              <p className="font-display text-[22px] font-light leading-[1.5] text-[--ink-soft] max-w-[52ch] mb-8">
                {person.bio}
              </p>
            )}

            {/* CTAs */}
            <div className="flex gap-2.5 flex-wrap">
              <button
                onClick={() => canEditMemories ? setShowTellMe(true) : setRequestingPermission("can_edit_memories")}
                className="flex items-center gap-2 bg-[--accent] hover:bg-[--accent-hover] text-white px-5 py-2.5 rounded-xl text-[15px] font-medium transition-colors"
              >
                <Mic className="w-4 h-4" />
                Record a story
              </button>
              <button
                onClick={() => router.push("/tree")}
                className="flex items-center gap-2 border border-[--rule] hover:border-[--gold] text-[--ink-soft] hover:text-[--ink] px-5 py-2.5 rounded-xl text-[15px] transition-colors"
              >
                <TreePine className="w-4 h-4" />
                View in tree
              </button>
              <button
                onClick={() => canEditTree ? router.push(`/person/${id}/edit`) : setRequestingPermission("can_edit_tree")}
                className="flex items-center gap-2 text-[--ink-soft] hover:text-[--ink] px-5 py-2.5 rounded-xl text-[15px] transition-colors"
              >
                Edit details
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* AI Summary */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 mb-6">
        <PersonSummary
          personId={id}
          personName={fullName}
          firstName={preferredFirst(person)}
          dob={person.dob}
          dod={person.dod}
          bio={person.bio}
          initialSummary={aiSummary}
          memories={memories}
          onSummaryChange={setAiSummary}
        />
      </div>

      {/* Tabs */}
      <div className="border-b border-[--rule] bg-[--canvas]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex gap-7">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3.5 flex items-baseline gap-1.5 text-[15px] border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-[--accent] text-[--ink] font-medium"
                  : "border-transparent text-[--ink-soft] hover:text-[--ink]"
              }`}
            >
              {tab.label}
              {tabCounts[tab.id] != null && (
                <span className="font-mono text-[11px] text-[--ink-mute]">{tabCounts[tab.id]}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Family strip — always visible across all tabs */}
      {allRelations.length > 0 && (
        <div className="border-b border-[--rule] bg-[--canvas]">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5">
            <div className="flex items-center gap-3 mb-4">
              <h3 className="font-display italic text-[18px] font-normal text-[--ink] shrink-0">Family</h3>
              <div className="flex-1 h-px bg-[--rule]" />
              {allRelations.length > 3 && (
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => scrollFamily(-1)}
                    className="p-1.5 rounded-lg border border-[--rule] text-[--ink-mute] hover:text-[--ink] hover:border-[--gold] transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => scrollFamily(1)}
                    className="p-1.5 rounded-lg border border-[--rule] text-[--ink-mute] hover:text-[--ink] hover:border-[--gold] transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
            <div
              ref={familyScrollRef}
              className="flex gap-5 overflow-x-auto pb-1"
              style={{ scrollbarWidth: "none" }}
            >
              {allRelations.map(({ rel, group }) => {
                const other = getOtherPerson(rel);
                if (!other) return null;
                const otherBirth = other.dob ? new Date(other.dob).getFullYear() : null;
                const otherDeath = other.dod ? new Date(other.dod).getFullYear() : null;
                const years = otherBirth
                  ? otherDeath
                    ? `${otherBirth} — ${otherDeath}`
                    : `${otherBirth} —`
                  : null;
                return (
                  <button
                    key={rel.id}
                    onClick={() => router.push(`/person/${getOtherPersonId(rel)}`)}
                    className="flex items-center gap-3 text-left hover:opacity-80 transition-opacity shrink-0"
                  >
                    <Avatar src={other.profile_photo_url} name={personDisplayName(other)} size="md" />
                    <div className="min-w-0 w-[140px]">
                      <p className="eyebrow mb-0.5">{RELATION_LABELS[group]}</p>
                      <p className="text-[15px] font-medium text-[--ink] truncate">{personDisplayName(other)}</p>
                      {years && <p className="font-mono text-[11px] text-[--ink-mute]">{years}</p>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {activeTab === "memories" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display italic text-[22px] font-normal text-[--ink]">Memories</h2>
              <button
                onClick={() => canEditMemories ? setShowAddMemory(true) : setRequestingPermission("can_edit_memories")}
                className="flex items-center gap-1.5 bg-[--accent] hover:bg-[--accent-hover] text-white text-sm px-3 py-1.5 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Memory
              </button>
            </div>

            {memoriesLoading ? (
              <p className="text-[--ink-mute] text-sm">Loading memories…</p>
            ) : memories.length === 0 ? (
              <div className="text-center py-16 text-[--ink-mute]">
                <p className="text-[17px] mb-2">No memories yet for {preferredFirst(person)}.</p>
                <p className="text-[14px]">Be the first to record a story, upload a photo, or share a note.</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {memories.map((m) => {
                  const otherTagged = (tagMap[m.id] ?? [])
                    .filter((pid) => pid !== id)
                    .map((pid) => familyPeople.find((p) => p.id === pid))
                    .filter(Boolean) as Person[];
                  return (
                    <MemoryCard key={m.id} memory={m} taggedPeople={otherTagged} />
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === "relationships" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display italic text-[22px] font-normal text-[--ink]">Relationships</h2>
              <div className="flex gap-2 flex-wrap">
                {(["add_parent", "add_child", "add_sibling", "add_spouse"] as RelationIntent[]).map((intent) => (
                  <button
                    key={intent}
                    onClick={() => canEditTree ? setPendingIntent(intent) : setRequestingPermission("can_edit_tree")}
                    className="flex items-center gap-1.5 border border-[--rule] text-[--ink-mute] hover:border-[--gold] hover:text-[--ink] text-xs px-2.5 py-1.5 rounded-lg transition-colors"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    {intent === "add_parent" ? "Parent" :
                     intent === "add_child" ? "Child" :
                     intent === "add_sibling" ? "Sibling" : "Spouse"}
                  </button>
                ))}
                <button
                  onClick={() => canEditTree ? setShowAddRelationship(true) : setRequestingPermission("can_edit_tree")}
                  className="flex items-center gap-1.5 border border-[--rule] text-[--ink-mute] hover:bg-[--surface-alt] hover:border-[--gold] text-xs px-2.5 py-1.5 rounded-lg transition-colors"
                >
                  <GitMerge className="w-3.5 h-3.5" />
                  Link existing
                </button>
              </div>
            </div>

            {!hasRelationships ? (
              <p className="text-[--ink-mute] text-[15px]">No relationships recorded yet.</p>
            ) : (
              <div className="space-y-6">
                {(Object.entries(grouped) as [string, Relationship[]][])
                  .filter(([, rels]) => rels.length > 0)
                  .map(([group, rels]) => (
                    <div key={group}>
                      <p className="eyebrow mb-3">{RELATION_LABELS[group] ?? group}</p>
                      <div className="flex flex-wrap gap-2">
                        {rels.map((rel) => {
                          const other = getOtherPerson(rel);
                          if (!other) return null;
                          return (
                            <button
                              key={rel.id}
                              onClick={() => setSelectedRelationship(rel)}
                              className="flex items-center gap-2 bg-[--surface] border border-[--rule] hover:border-[--gold] rounded-xl px-3 py-2 transition-colors"
                            >
                              <Avatar src={other.profile_photo_url} name={personDisplayName(other)} size="sm" />
                              <p className="text-[15px] font-medium text-[--ink]">{personDisplayName(other)}</p>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {(activeTab === "timeline" || activeTab === "photos" || activeTab === "letters") && (
          <div className="text-center py-16 text-[--ink-mute]">
            <p className="text-[17px] mb-1 capitalize">{activeTab} coming soon</p>
            <p className="text-[14px]">This section will be available in a future update.</p>
          </div>
        )}
      </div>

      <AddMemoryModal
        open={showAddMemory}
        onClose={() => setShowAddMemory(false)}
        personId={id}
        familyId={person.family_id}
        familyPeople={familyPeople}
        onAdded={refetchMemories}
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
        canEdit={canEditTree}
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

      {requestingPermission && person && (
        <RequestAccessModal
          open={!!requestingPermission}
          onClose={() => setRequestingPermission(null)}
          permission={requestingPermission}
          familyId={person.family_id}
        />
      )}
    </div>
  );
}

function FactItem({
  label,
  value,
  sub,
  italic,
}: {
  label: string;
  value: string;
  sub?: string;
  italic?: boolean;
}) {
  return (
    <div>
      <p className="eyebrow mb-1">{label}</p>
      <p className={`font-display text-[32px] font-normal leading-none tracking-[-0.02em] text-[--ink] ${italic ? "italic" : ""}`}>
        {value}
      </p>
      {sub && <p className="text-[13px] text-[--ink-soft] mt-1">{sub}</p>}
    </div>
  );
}
