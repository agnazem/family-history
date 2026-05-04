import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// DELETE /api/memories/[id] — soft-delete (sets deleted_at)
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: memory } = await supabase
    .from("memories")
    .select("family_id, recorded_by")
    .eq("id", id)
    .single();

  if (!memory) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: member } = await supabase
    .from("family_members")
    .select("role, can_edit_memories")
    .eq("family_id", memory.family_id)
    .eq("user_id", user.id)
    .single();

  if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const isAdmin = member.role === "admin";
  const canEditOwn = member.can_edit_memories === true && memory.recorded_by === user.id;

  if (!isAdmin && !canEditOwn) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error } = await supabase
    .from("memories")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
