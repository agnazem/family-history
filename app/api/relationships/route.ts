import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// DELETE /api/relationships — delete a relationship (requires can_edit_tree or admin)
export async function DELETE(request: Request) {
  const { relationshipId, familyId } = await request.json();
  if (!relationshipId || !familyId) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: member } = await supabase
    .from("family_members")
    .select("role, can_edit_tree")
    .eq("family_id", familyId)
    .eq("user_id", user.id)
    .single();

  if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const canEdit = member.role === "admin" || member.can_edit_tree === true;
  if (!canEdit) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { error } = await supabase
    .from("relationships")
    .delete()
    .eq("id", relationshipId)
    .eq("family_id", familyId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
