"use client";

import { useCallback, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFamily } from "@/lib/hooks/useFamily";
import { usePeople } from "@/lib/hooks/usePeople";
import { TreeCanvas } from "@/components/tree/TreeCanvas";
import { AddPersonPanel } from "@/components/tree/AddPersonPanel";
import { AddRelationshipPanel } from "@/components/tree/AddRelationshipPanel";
import { BookOpen, UserPlus, GitMerge, Settings, LogOut, LayoutDashboard, Search } from "lucide-react";
import { SearchModal } from "@/components/search/SearchModal";
import { createClient } from "@/lib/supabase/client";
import { computeLayout } from "@/lib/layout";
import type { MemoryType } from "@/types";

export default function TreePage() {
  const router = useRouter();
  const { family, member, loading: familyLoading } = useFamily();
  const { people, relationships, loading: peopleLoading, refetch } = usePeople(family?.id ?? null);

  const [showAddPerson, setShowAddPerson] = useState(false);
  const [showAddRelationship, setShowAddRelationship] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [layouting, setLayouting] = useState(false);
  const [memoryTypes, setMemoryTypes] = useState<Record<string, MemoryType[]>>({});

  const supabase = createClient();

  useEffect(() => {
    if (!family?.id) return;
    supabase
      .from("memory_people")
      .select("person_id, memories!inner(type)")
      .eq("family_id", family.id)
      .then(({ data }) => {
        if (!data) return;
        const map: Record<string, MemoryType[]> = {};
        for (const row of data as unknown as { person_id: string; memories: { type: string } | { type: string }[] }[]) {
          const pid = row.person_id;
          const mem = Array.isArray(row.memories) ? row.memories[0] : row.memories;
          if (!mem) continue;
          const t = mem.type as MemoryType;
          if (!map[pid]) map[pid] = [];
          if (!map[pid].includes(t)) map[pid].push(t);
        }
        setMemoryTypes(map);
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
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-blue-600">Loading your family tree...</p>
      </div>
    );
  }

  if (!family) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <BookOpen className="w-12 h-12 text-blue-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            No family found
          </h2>
          <p className="text-gray-600 mb-6">
            You haven&apos;t joined or created a family history yet.
          </p>
          <button
            onClick={() => router.push("/family/new")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium"
          >
            Create a Family History
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      {/* Toolbar */}
      <header className="flex items-center justify-between px-4 py-3 bg-white border-b border-blue-100 shadow-sm z-10">
        <div className="flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-blue-600" />
          <span className="font-semibold text-gray-900">{family.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSearch(true)}
            className="flex items-center gap-1.5 border border-gray-300 text-gray-600 hover:bg-gray-50 text-sm px-3 py-1.5 rounded-lg transition-colors"
            title="Search (⌘K)"
          >
            <Search className="w-4 h-4" />
            Search
          </button>
          <button
            onClick={() => setShowAddPerson(true)}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-1.5 rounded-lg transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Add Person
          </button>
          <button
            onClick={() => setShowAddRelationship(true)}
            disabled={people.length < 2}
            className="flex items-center gap-1.5 border border-blue-600 text-blue-600 hover:bg-blue-50 text-sm px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40"
          >
            <GitMerge className="w-4 h-4" />
            Add Relationship
          </button>
          <button
            onClick={handleAutoLayout}
            disabled={layouting || people.length === 0}
            className="flex items-center gap-1.5 border border-blue-600 text-blue-600 hover:bg-blue-50 text-sm px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40"
          >
            <LayoutDashboard className="w-4 h-4" />
            {layouting ? "Laying out..." : "Auto Layout"}
          </button>
          {member?.role === "admin" && (
            <button
              onClick={() => router.push("/settings")}
              className="p-1.5 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={handleSignOut}
            className="p-1.5 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
            title="Sign out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

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
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium"
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
