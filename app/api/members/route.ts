import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

async function requireAdmin(supabase: Awaited<ReturnType<typeof createClient>>, familyId: string) {
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

// GET /api/members?familyId=X — list members with email and display name
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const familyId = searchParams.get("familyId");
  if (!familyId) return NextResponse.json({ error: "Missing familyId" }, { status: 400 });

  const supabase = await createClient();
  const { error: authError } = await requireAdmin(supabase, familyId);
  if (authError) return authError;

  const { data: members } = await supabase
    .from("family_members")
    .select("*")
    .eq("family_id", familyId)
    .order("joined_at");

  if (!members?.length) return NextResponse.json({ members: [] });

  const adminSupabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const enriched = await Promise.all(
    members.map(async (m) => {
      const { data } = await adminSupabase.auth.admin.getUserById(m.user_id);
      return {
        ...m,
        email: data.user?.email ?? "Unknown",
        full_name: (data.user?.user_metadata?.full_name as string | undefined) ?? null,
      };
    })
  );

  return NextResponse.json({ members: enriched });
}

// POST /api/members — add an existing user (by email) directly to the family
export async function POST(request: Request) {
  const { familyId, email } = await request.json();
  if (!familyId || !email) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const supabase = await createClient();
  const { error: authError } = await requireAdmin(supabase, familyId);
  if (authError) return authError;

  const adminSupabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: { users } } = await adminSupabase.auth.admin.listUsers({ perPage: 1000 });
  const targetUser = users.find((u) => u.email?.toLowerCase() === email.toLowerCase());

  if (!targetUser) {
    return NextResponse.json(
      { error: "No account found with that email. Use 'Invite' if they haven't signed up yet." },
      { status: 404 }
    );
  }

  const { data: existing } = await supabase
    .from("family_members")
    .select("id")
    .eq("family_id", familyId)
    .eq("user_id", targetUser.id)
    .single();

  if (existing) {
    return NextResponse.json({ error: "That person is already a member of this family." }, { status: 409 });
  }

  const display_name = (targetUser.user_metadata?.full_name as string | undefined) ?? null;
  const { error } = await supabase
    .from("family_members")
    .insert({ family_id: familyId, user_id: targetUser.id, role: "member", display_name });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

// PATCH /api/members — change role/permissions (admin only) or display_name (self or admin)
export async function PATCH(request: Request) {
  const { familyId, userId, role, display_name, can_edit_tree, can_edit_memories } = await request.json();
  if (!familyId || !userId) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: membership } = await supabase
    .from("family_members")
    .select("role")
    .eq("family_id", familyId)
    .eq("user_id", user.id)
    .single();

  const isAdmin = membership?.role === "admin";
  const isSelf = user.id === userId;

  if (!isAdmin && !isSelf) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (role !== undefined && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Permission toggles are admin-only
  if ((can_edit_tree !== undefined || can_edit_memories !== undefined) && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const updates: Record<string, unknown> = {};
  if (role !== undefined) updates.role = role;
  if (display_name !== undefined) updates.display_name = display_name || null;
  if (can_edit_tree !== undefined) updates.can_edit_tree = Boolean(can_edit_tree);
  if (can_edit_memories !== undefined) updates.can_edit_memories = Boolean(can_edit_memories);

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const { error } = await supabase
    .from("family_members")
    .update(updates)
    .eq("family_id", familyId)
    .eq("user_id", userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

// DELETE /api/members — remove a member from the family
export async function DELETE(request: Request) {
  const { familyId, userId } = await request.json();
  if (!familyId || !userId) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const supabase = await createClient();
  const { user, error: authError } = await requireAdmin(supabase, familyId);
  if (authError) return authError;

  if (user!.id === userId) {
    return NextResponse.json({ error: "You cannot remove yourself." }, { status: 400 });
  }

  const { error } = await supabase
    .from("family_members")
    .delete()
    .eq("family_id", familyId)
    .eq("user_id", userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
