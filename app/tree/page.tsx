"use client";

import { useCallback, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useFamily } from "@/lib/hooks/useFamily";
import { usePeople } from "@/lib/hooks/usePeople";
import { TreeCanvas } from "@/components/tree/TreeCanvas";
import { PersonSidePanel } from "@/components/tree/PersonSidePanel";
import { AddPersonPanel } from "@/components/tree/AddPersonPanel";
import { AddRelationshipPanel } from "@/components/tree/AddRelationshipPanel";
import { BookOpen, UserPlus, GitMerge, LayoutDashboard, Search, X, Users, MousePointer2, Network } from "lucide-react";
import { AppNav } from "@/components/ui/AppNav";
import { SearchModal } from "@/components/search/SearchModal";
import { Spinner } from "@/components/ui/Spinner";
import { RequestAccessModal } from "@/components/ui/RequestAccessModal";
import { createClient } from "@/lib/supabase/client";
import type { PermissionKey, GenColumn } from "@/types";
import { computeLayout } from "@/lib/layout";

export default function TreePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { family, member, loading: familyLoading } = useFamily();
  const { people, relationships, loading: peopleLoading, refetch } = usePeople(family?.id ?? null);

  const [showAddPerson, setShowAddPerson] = useState(false);
  const [showAddRelationship, setShowAddRelationship] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [layouting, setLayouting] = useState(false);
  const [memoryCounts, setMemoryCounts] = useState<Record<string, number>>({});
  const [showWelcomeBanner, setShowWelcomeBanner] = useState(() => searchParams.get("welcome") === "1");
  const [selectMode, setSelectMode] = useState(false);
  const [requestingPermission, setRequestingPermission] = useState<PermissionKey | null>(null);
  // Local root person ID — optimistically updated on set-as-root
  const [localRootId, setLocalRootId] = useState<string | null>(null);
  // Lineage mode state — on by default
  const [lineageModeEnabled, setLineageModeEnabled] = useState(true);
  const [subjectPersonId, setSubjectPersonId] = useState<string | null>(null);

  const supabase = createClient();

  // Sync localRootId from family once loaded
  useEffect(() => {
    if (family?.root_person_id !== undefined) {
      setLocalRootId(family.root_person_id ?? null);
      setSubjectPersonId((prev) => prev ?? family.root_person_id ?? null);
    }
  }, [family?.root_person_id]);

  useEffect(() => {
    if (!family?.id) return;
    supabase
      .from("memory_people")
      .select("person_id")
      .eq("family_id", family.id)
      .then(({ data }) => {
        if (!data) return;
        const countMap: Record<string, number> = {};
        for (const row of data) {
          countMap[row.person_id] = (countMap[row.person_id] ?? 0) + 1;
        }
        setMemoryCounts(countMap);
      });
  }, [family?.id, people]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowSearch(true);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const handleNodeClick = useCallback(
    (personId: string) => {
      if (lineageModeEnabled) setSubjectPersonId(personId);
      setSelectedPersonId((prev) => (prev === personId ? null : personId));
    },
    [lineageModeEnabled]
  );

  async function handleAutoLayout() {
    if (people.length === 0) return;
    setLayouting(true);
    const { positions } = computeLayout(people, relationships, localRootId);
    await Promise.all(
      Object.entries(positions).map(([id, { x, y }]) =>
        supabase.from("people").update({ canvas_x: x, canvas_y: y }).eq("id", id)
      )
    );
    await refetch();
    setLayouting(false);
  }

  async function handleSetAsRoot(personId: string) {
    if (!family?.id) return;
    setLocalRootId(personId);
    setSelectedPersonId(null);
    await supabase
      .from("families")
      .update({ root_person_id: personId })
      .eq("id", family.id);
  }

  if (familyLoading || peopleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas">
        <Spinner />
      </div>
    );
  }

  if (!family) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas">
        <div className="text-center">
          <BookOpen className="w-12 h-12 text-accent mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No family found</h2>
          <p className="text-gray-600 mb-6">
            You haven&apos;t joined or created a family history yet.
          </p>
          <button
            onClick={() => router.push("/family/new")}
            className="bg-accent hover:bg-accent-hover text-white px-6 py-2 rounded-lg font-medium"
          >
            Create a Family History
          </button>
        </div>
      </div>
    );
  }

  const isAdmin = member?.role === "admin";
  const canEditTree = isAdmin || member?.can_edit_tree === true;

  const treeRightSlot = (
    <div className="flex items-center gap-1">
      <button
        onClick={() => setShowSearch(true)}
        className="flex items-center gap-1.5 px-2 py-1.5 sm:px-3 border border-[--rule] text-[--ink-soft] hover:text-[--ink] hover:bg-[--surface-alt] text-[13px] leading-5 rounded-lg transition-colors"
        title="Search (⌘K)"
      >
        <Search className="w-4 h-4 flex-shrink-0" />
        <span className="hidden sm:inline">Search</span>
      </button>

      {canEditTree && (
        <>
          <div className="w-px h-4 bg-[--rule] mx-0.5" />
          <button
            onClick={() => setSelectMode((s) => !s)}
            className={`flex items-center gap-1.5 px-2 py-1.5 sm:px-3 border text-[13px] leading-5 rounded-lg transition-colors ${
              selectMode
                ? "bg-[--accent-soft] border-[--accent] text-[--accent]"
                : "border-[--rule] text-[--ink-soft] hover:text-[--ink] hover:bg-[--surface-alt]"
            }`}
            title={selectMode ? "Switch to pan mode" : "Switch to select mode"}
          >
            <MousePointer2 className="w-4 h-4 flex-shrink-0" />
            <span className="hidden sm:inline">{selectMode ? "Selecting" : "Select"}</span>
          </button>
          <button
            onClick={handleAutoLayout}
            disabled={layouting || people.length === 0}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 border border-[--rule] text-[--ink-soft] hover:text-[--ink] hover:bg-[--surface-alt] text-[13px] leading-5 rounded-lg transition-colors disabled:opacity-40"
            title={layouting ? "Laying out…" : "Auto layout"}
          >
            <LayoutDashboard className="w-4 h-4 flex-shrink-0" />
            <span className="hidden lg:inline">{layouting ? "Laying out…" : "Layout"}</span>
          </button>
        </>
      )}

      <div className="w-px h-4 bg-[--rule] mx-0.5" />

      <button
        onClick={() => {
          setLineageModeEnabled((v) => {
            const next = !v;
            if (next && !subjectPersonId && localRootId) setSubjectPersonId(localRootId);
            return next;
          });
        }}
        className={`flex items-center gap-1.5 px-2 py-1.5 sm:px-3 border text-[13px] leading-5 whitespace-nowrap rounded-lg transition-colors ${
          lineageModeEnabled
            ? "bg-[--accent-soft] border-[--accent] text-[--accent]"
            : "border-[--rule] text-[--ink-soft] hover:text-[--ink] hover:bg-[--surface-alt]"
        }`}
        title="Highlight lineage"
      >
        <Network className="w-4 h-4 flex-shrink-0" />
        <span className="hidden sm:inline">{lineageModeEnabled ? "Lineage on" : "Lineage"}</span>
      </button>

      <div className="w-px h-4 bg-[--rule] mx-0.5" />

      <button
        onClick={() => canEditTree ? setShowAddPerson(true) : setRequestingPermission("can_edit_tree")}
        className="flex items-center gap-1.5 px-2 py-1.5 sm:px-3 bg-[--accent] hover:bg-[--accent-hover] text-white text-[13px] leading-5 whitespace-nowrap rounded-lg transition-colors"
        title="Add Person"
      >
        <UserPlus className="w-4 h-4 flex-shrink-0" />
        <span className="hidden sm:inline">Add Person</span>
      </button>
      {canEditTree && (
        <button
          onClick={() => setShowAddRelationship(true)}
          disabled={people.length < 2}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 border border-[--accent] text-[--accent] hover:bg-[--accent-soft] text-[13px] leading-5 rounded-lg transition-colors disabled:opacity-40"
          title="Add Relationship"
        >
          <GitMerge className="w-4 h-4 flex-shrink-0" />
          <span className="hidden md:inline">Relate</span>
        </button>
      )}
    </div>
  );

  return (
    <div className="h-screen flex flex-col bg-canvas">
      <AppNav rightSlot={treeRightSlot} />

      {/* Welcome / invite nudge */}
      {showWelcomeBanner && member?.role === "admin" && (
        <div className="flex items-center gap-3 px-4 py-2.5 bg-accent text-white text-sm">
          <Users className="w-4 h-4 flex-shrink-0" />
          <span className="flex-1">
            Welcome! Invite family members so they can add memories and help grow the tree.
          </span>
          <button
            onClick={() => router.push("/settings")}
            className="font-semibold underline underline-offset-2 hover:no-underline"
          >
            Invite Members
          </button>
          <button onClick={() => setShowWelcomeBanner(false)} className="ml-1 hover:opacity-70">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Canvas */}
      <main className="flex-1 relative">
        {people.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <p className="text-gray-500 mb-4">
                Your family tree is empty. Add your first family member to get started.
              </p>
              <button
                onClick={() => setShowAddPerson(true)}
                className="bg-accent hover:bg-accent-hover text-white px-6 py-2 rounded-lg font-medium"
              >
                Add First Person
              </button>
            </div>
          </div>
        ) : (
          <TreeCanvas
            people={people}
            relationships={relationships}
            onNodeClick={handleNodeClick}
            memoryCounts={memoryCounts}
            selectMode={selectMode}
            selectedPersonId={selectedPersonId}
            rootPersonId={localRootId}
            lineageModeEnabled={lineageModeEnabled}
            subjectPersonId={subjectPersonId}
            onClearSubject={() => setSubjectPersonId(localRootId ?? null)}
          />
        )}
        {selectedPersonId && (() => {
          const person = people.find((p) => p.id === selectedPersonId);
          if (!person) return null;
          return (
            <PersonSidePanel
              person={person}
              memoryCount={memoryCounts[selectedPersonId] ?? 0}
              onClose={() => setSelectedPersonId(null)}
              onOpenProfile={(id) => router.push(`/person/${id}`)}
              onSetAsRoot={canEditTree ? () => handleSetAsRoot(selectedPersonId) : undefined}
            />
          );
        })()}
      </main>

      <AddPersonPanel
        open={showAddPerson}
        onClose={() => setShowAddPerson(false)}
        familyId={family.id}
        onAdded={refetch}
      />
      <AddRelationshipPanel
        open={showAddRelationship}
        onClose={() => setShowAddRelationship(false)}
        familyId={family.id}
        people={people}
        onAdded={refetch}
      />
      <SearchModal
        open={showSearch}
        onClose={() => setShowSearch(false)}
        familyId={family.id}
        people={people}
        onPersonClick={(personId) => router.push(`/person/${personId}`)}
      />

      {requestingPermission && family && (
        <RequestAccessModal
          open={!!requestingPermission}
          onClose={() => setRequestingPermission(null)}
          permission={requestingPermission}
          familyId={family.id}
        />
      )}
    </div>
  );
}
