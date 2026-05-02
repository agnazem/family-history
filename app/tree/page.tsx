"use client";

import { useCallback, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useFamily } from "@/lib/hooks/useFamily";
import { usePeople } from "@/lib/hooks/usePeople";
import { TreeCanvas } from "@/components/tree/TreeCanvas";
import { AddPersonPanel } from "@/components/tree/AddPersonPanel";
import { AddRelationshipPanel } from "@/components/tree/AddRelationshipPanel";
import { BookOpen, UserPlus, GitMerge, Settings, LogOut, LayoutDashboard, Search, Clock, X, Users, Activity, MousePointer2 } from "lucide-react";
import { SearchModal } from "@/components/search/SearchModal";
import { Spinner } from "@/components/ui/Spinner";
import { createClient } from "@/lib/supabase/client";
import { computeLayout } from "@/lib/layout";
import type { MemoryType } from "@/types";

export default function TreePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { family, member, loading: familyLoading } = useFamily();
  const { people, relationships, loading: peopleLoading, refetch } = usePeople(family?.id ?? null);

  const [showAddPerson, setShowAddPerson] = useState(false);
  const [showAddRelationship, setShowAddRelationship] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [layouting, setLayouting] = useState(false);
  const [memoryTypes, setMemoryTypes] = useState<Record<string, MemoryType[]>>({});
  const [memoryCounts, setMemoryCounts] = useState<Record<string, number>>({});
  const [showWelcomeBanner, setShowWelcomeBanner] = useState(() => searchParams.get("welcome") === "1");
  const [selectMode, setSelectMode] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    if (!family?.id) return;
    supabase
      .from("memory_people")
      .select("person_id, memories!inner(type)")
      .eq("family_id", family.id)
      .then(({ data }) => {
        if (!data) return;
        const typeMap: Record<string, MemoryType[]> = {};
        const countMap: Record<string, number> = {};
        for (const row of data as unknown as { person_id: string; memories: { type: string } | { type: string }[] }[]) {
          const pid = row.person_id;
          const mem = Array.isArray(row.memories) ? row.memories[0] : row.memories;
          if (!mem) continue;
          const t = mem.type as MemoryType;
          if (!typeMap[pid]) typeMap[pid] = [];
          if (!typeMap[pid].includes(t)) typeMap[pid].push(t);
          countMap[pid] = (countMap[pid] ?? 0) + 1;
        }
        setMemoryTypes(typeMap);
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
      router.push(`/person/${personId}`);
    },
    [router]
  );

  async function handleAutoLayout() {
    if (people.length === 0) return;
    setLayouting(true);
    const positions = computeLayout(people, relationships);
    await Promise.all(
      Object.entries(positions).map(([id, { x, y }]) =>
        supabase.from("people").update({ canvas_x: x, canvas_y: y }).eq("id", id)
      )
    );
    await refetch();
    setLayouting(false);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
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
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            No family found
          </h2>
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

  return (
    <div className="h-screen flex flex-col bg-canvas">
      {/* Toolbar */}
      <header className="flex items-center justify-between px-3 py-2 bg-white border-b border-accent-border shadow-sm z-10 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <BookOpen className="w-5 h-5 text-accent flex-shrink-0" />
          <span className="font-display font-normal text-stone-900 truncate text-sm sm:text-base">{family.name}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => router.push("/timeline")}
            className="flex items-center gap-1.5 border border-gray-300 text-gray-600 hover:bg-gray-50 text-sm p-2 sm:px-3 sm:py-1.5 rounded-lg transition-colors"
            title="Timeline"
          >
            <Clock className="w-4 h-4 flex-shrink-0" />
            <span className="hidden sm:inline">Timeline</span>
          </button>
          <button
            onClick={() => setSelectMode((s) => !s)}
            className={`flex items-center gap-1.5 border text-sm p-2 sm:px-3 sm:py-1.5 rounded-lg transition-colors ${
              selectMode
                ? "bg-accent-pale border-accent-mid text-accent"
                : "border-gray-300 text-gray-600 hover:bg-gray-50"
            }`}
            title={selectMode ? "Switch to pan mode" : "Switch to select mode (drag to select, Shift+click to add)"}
          >
            <MousePointer2 className="w-4 h-4 flex-shrink-0" />
            <span className="hidden sm:inline">{selectMode ? "Selecting" : "Select"}</span>
          </button>
          <button
            onClick={() => router.push("/activity")}
            className="hidden sm:flex items-center gap-1.5 border border-gray-300 text-gray-600 hover:bg-gray-50 text-sm px-3 py-1.5 rounded-lg transition-colors"
            title="Activity"
          >
            <Activity className="w-4 h-4" />
            Activity
          </button>
          <button
            onClick={() => setShowSearch(true)}
            className="flex items-center gap-1.5 border border-gray-300 text-gray-600 hover:bg-gray-50 text-sm p-2 sm:px-3 sm:py-1.5 rounded-lg transition-colors"
            title="Search (⌘K)"
          >
            <Search className="w-4 h-4 flex-shrink-0" />
            <span className="hidden sm:inline">Search</span>
          </button>
          <button
            onClick={() => setShowAddPerson(true)}
            className="flex items-center gap-1.5 bg-accent hover:bg-accent-hover text-white text-sm p-2 sm:px-3 sm:py-1.5 rounded-lg transition-colors"
            title="Add Person"
          >
            <UserPlus className="w-4 h-4 flex-shrink-0" />
            <span className="hidden sm:inline">Add Person</span>
          </button>
          <button
            onClick={() => setShowAddRelationship(true)}
            disabled={people.length < 2}
            className="hidden sm:flex items-center gap-1.5 border border-accent text-accent hover:bg-accent-pale text-sm px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40"
            title="Add Relationship"
          >
            <GitMerge className="w-4 h-4" />
            Add Relationship
          </button>
          <button
            onClick={handleAutoLayout}
            disabled={layouting || people.length === 0}
            className="hidden sm:flex items-center gap-1.5 border border-accent text-accent hover:bg-accent-pale text-sm px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40"
            title={layouting ? "Laying out…" : "Auto Layout"}
          >
            <LayoutDashboard className="w-4 h-4" />
            {layouting ? "Laying out…" : "Auto Layout"}
          </button>
          {member?.role === "admin" && (
            <button
              onClick={() => router.push("/settings")}
              className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={handleSignOut}
            className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
            title="Sign out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

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
            memoryTypes={memoryTypes}
            memoryCounts={memoryCounts}
            selectMode={selectMode}
          />
        )}
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
    </div>
  );
}
