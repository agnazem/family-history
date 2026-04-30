"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Memory } from "@/types";

export function useMemories(personId: string | null) {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchMemories = useCallback(async () => {
    if (!personId) return;

    const { data: tags } = await supabase
      .from("memory_people")
      .select("memory_id")
      .eq("person_id", personId);

    const ids = tags?.map((t) => t.memory_id) ?? [];
    if (ids.length === 0) {
      setMemories([]);
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("memories")
      .select("*")
      .in("id", ids)
      .order("created_at", { ascending: false });

    setMemories(data ?? []);
    setLoading(false);
  }, [personId]);

  useEffect(() => {
    fetchMemories();
  }, [fetchMemories]);

  return { memories, loading, refetch: fetchMemories };
}
