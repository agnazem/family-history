import { NextResponse } from "next/server";
import type { createClient } from "@/lib/supabase/server";

type ServerClient = Awaited<ReturnType<typeof createClient>>;
type AuthzResult =
  | { user: { id: string }; error: null }
  | { user: null; error: NextResponse };

/**
 * Verify the caller is authenticated AND a member of `familyId`.
 *
 * These are defense-in-depth checks that make authorization explicit in the
 * route rather than delegating it silently to RLS. RLS remains the backstop:
 * even without this check a cross-family write affects 0 rows, but the explicit
 * check keeps routes consistent and fails loudly if a policy ever changes.
 */
export async function requireFamilyMember(
  supabase: ServerClient,
  familyId: string
): Promise<AuthzResult> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { user: null, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };

  const { data: member } = await supabase
    .from("family_members")
    .select("id")
    .eq("family_id", familyId)
    .eq("user_id", user.id)
    .single();

  if (!member) return { user: null, error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };

  return { user, error: null };
}

/** Verify the caller is authenticated AND an admin of `familyId`. */
export async function requireFamilyAdmin(
  supabase: ServerClient,
  familyId: string
): Promise<AuthzResult> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { user: null, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };

  const { data: member } = await supabase
    .from("family_members")
    .select("role")
    .eq("family_id", familyId)
    .eq("user_id", user.id)
    .single();

  if (!member || member.role !== "admin") {
    return { user: null, error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { user, error: null };
}
