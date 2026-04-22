"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Person, Relationship } from "@/types";

export function usePeople(familyId: string | null) {
  const [people, setPeople] = useState<Person[]>([]);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchAll = useCallback(async () => {
    if (!familyId) return;
    const [{ data: p }, { data: r }] = await Promise.all([
      supabase.from("people").select("*").eq("family_id", familyId),
      supabase.from("relationships").select("*").eq("family_id", familyId),
    ]);
    setPeople(p ?? []);
    setRelationships(r ?? []);
    setLoading(false);
  }, [familyId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    if (!familyId) return;

    const channel = supabase
      .channel(`family-${familyId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "people", filter: `family_id=eq.${familyId}` },
        fetchAll
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "relationships", filter: `family_id=eq.${familyId}` },
        fetchAll
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [familyId, fetchAll]);

  return { people, relationships, loading, refetch: fetchAll };
}
