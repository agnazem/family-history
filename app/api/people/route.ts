import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// DELETE /api/people — remove a person and all their relationships/memories (admin only)
export async function DELETE(request: Request) {
  const { personId, familyId } = await request.json();
  if (!personId || !familyId) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: member } = await supabase
    .from("family_members")
    .select("role")
    .eq("family_id", familyId)
    .eq("user_id", user.id)
    .single();

  if (!member || member.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error } = await supabase
    .from("people")
    .delete()
    .eq("id", personId)
    .eq("family_id", familyId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
