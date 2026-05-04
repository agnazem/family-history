import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import type { PermissionKey } from "@/types";

// POST /api/permission-requests — member requests a permission
export async function POST(request: Request) {
  const { familyId, permission } = await request.json() as { familyId: string; permission: PermissionKey };
  if (!familyId || !permission) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Verify they're a member of this family
  const { data: membership } = await supabase
    .from("family_members")
    .select("role, can_edit_tree, can_edit_memories")
    .eq("family_id", familyId)
    .eq("user_id", user.id)
    .single();

  if (!membership) return NextResponse.json({ error: "Not a member" }, { status: 403 });
  if (membership.role === "admin") return NextResponse.json({ error: "Admins have all permissions" }, { status: 400 });

  // Check they don't already have the permission
  if (membership[permission]) return NextResponse.json({ error: "You already have this permission" }, { status: 400 });

  const adminSupabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Check for existing pending request
  const { data: existing } = await adminSupabase
    .from("permission_requests")
    .select("id")
    .eq("family_id", familyId)
    .eq("user_id", user.id)
    .eq("permission", permission)
    .eq("status", "pending")
    .maybeSingle();

  if (existing) return NextResponse.json({ alreadyRequested: true });

  const { error } = await adminSupabase.from("permission_requests").insert({
    family_id: familyId,
    user_id: user.id,
    permission,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

// GET /api/permission-requests?familyId=X — admin lists pending requests
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const familyId = searchParams.get("familyId");
  if (!familyId) return NextResponse.json({ error: "Missing familyId" }, { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: membership } = await supabase
    .from("family_members")
    .select("role")
    .eq("family_id", familyId)
    .eq("user_id", user.id)
    .single();

  if (!membership || membership.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const adminSupabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: requests } = await adminSupabase
    .from("permission_requests")
    .select("*")
    .eq("family_id", familyId)
    .eq("status", "pending")
    .order("created_at");

  // Enrich with user info
  const enriched = await Promise.all(
    (requests ?? []).map(async (req) => {
      // Try display_name from family_members first
      const { data: member } = await adminSupabase
        .from("family_members")
        .select("display_name")
        .eq("family_id", familyId)
        .eq("user_id", req.user_id)
        .single();

      const { data: authUser } = await adminSupabase.auth.admin.getUserById(req.user_id);
      return {
        ...req,
        display_name: member?.display_name ?? (authUser.user?.user_metadata?.full_name as string | undefined) ?? null,
        email: authUser.user?.email ?? "Unknown",
      };
    })
  );

  return NextResponse.json({ requests: enriched });
}

// PATCH /api/permission-requests — admin approves or denies
export async function PATCH(request: Request) {
  const { requestId, action, familyId } = await request.json() as {
    requestId: string;
    action: "approve" | "deny";
    familyId: string;
  };
  if (!requestId || !action || !familyId) {
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

  if (!membership || membership.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const adminSupabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: permRequest } = await adminSupabase
    .from("permission_requests")
    .select("*")
    .eq("id", requestId)
    .eq("family_id", familyId)
    .single();

  if (!permRequest) return NextResponse.json({ error: "Request not found" }, { status: 404 });

  // Update the request status
  await adminSupabase
    .from("permission_requests")
    .update({ status: action === "approve" ? "approved" : "denied" })
    .eq("id", requestId);

  // If approving, grant the permission
  if (action === "approve") {
    await adminSupabase
      .from("family_members")
      .update({ [permRequest.permission]: true })
      .eq("family_id", familyId)
      .eq("user_id", permRequest.user_id);
  }

  return NextResponse.json({ success: true });
}
