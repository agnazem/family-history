"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Memory } from "@/types";

export function useMemories(personId: string | null, familyId: string | null) {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [tagMap, setTagMap] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchMemories = useCallback(async () => {
    if (!personId) { setLoading(false); return; }

    const { data: tags } = await supabase
      .from("memory_people")
      .select("memory_id")
      .eq("person_id", personId);

    const ids = tags?.map((t) => t.memory_id) ?? [];
    if (ids.length === 0) {
      setMemories([]);
      setTagMap({});
      setLoading(false);
      return;
    }

    const [{ data: memoriesData }, { data: allTags }] = await Promise.all([
      supabase
        .from("memories")
        .select("*")
        .in("id", ids)
        .order("created_at", { ascending: false }),
      supabase
        .from("memory_people")
        .select("memory_id, person_id")
        .in("memory_id", ids),
    ]);

    const map: Record<string, string[]> = {};
    for (const row of allTags ?? []) {
      if (!map[row.memory_id]) map[row.memory_id] = [];
      map[row.memory_id].push(row.person_id);
    }

    setMemories(memoriesData ?? []);
    setTagMap(map);
    setLoading(false);
  }, [personId]);

  useEffect(() => {
    fetchMemories();
  }, [fetchMemories]);

  useEffect(() => {
    if (!familyId) return;

    const channel = supabase
      .channel(`family-memories-${familyId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "memories", filter: `family_id=eq.${familyId}` },
        fetchMemories
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "memory_people", filter: `family_id=eq.${familyId}` },
        fetchMemories
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [familyId, fetchMemories]);

  return { memories, tagMap, loading, refetch: fetchMemories };
}
