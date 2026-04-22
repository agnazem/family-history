"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Family, FamilyMember } from "@/types";

export function useFamily() {
  const [family, setFamily] = useState<Family | null>(null);
  const [member, setMember] = useState<FamilyMember | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: memberRow } = await supabase
        .from("family_members")
        .select("*, families(*)")
        .eq("user_id", user.id)
        .limit(1)
        .single();

      if (memberRow) {
        setMember(memberRow as FamilyMember);
        setFamily((memberRow as { families: Family }).families);
      }
      setLoading(false);
    }
    load();
  }, []);

  return { family, member, loading };
}
