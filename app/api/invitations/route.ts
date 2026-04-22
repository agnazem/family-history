import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { email, familyId } = await request.json();

  if (!email || !familyId) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // Verify caller is admin of this family
  const { data: member } = await supabase
    .from("family_members")
    .select("role")
    .eq("family_id", familyId)
    .eq("user_id", user.id)
    .single();

  if (!member || member.role !== "admin") {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const adminSupabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Send Supabase magic invite
  const { error: inviteError } = await adminSupabase.auth.admin.inviteUserByEmail(
    email,
    { redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/tree` }
  );

  if (inviteError) {
    return NextResponse.json({ error: inviteError.message }, { status: 500 });
  }

  // Record the invitation
  await supabase.from("invitations").insert({
    family_id: familyId,
    email,
    token: crypto.randomUUID(),
    invited_by: user.id,
    status: "pending",
  });

  return NextResponse.json({ success: true });
}
