import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const ONE_HOUR_MS = 60 * 60 * 1000;

// DELETE /api/people — remove a person and all their relationships/memories
// Admins: always allowed
// Members with can_edit_tree: only if they created the person within the last hour
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
    .select("role, can_edit_tree")
    .eq("family_id", familyId)
    .eq("user_id", user.id)
    .single();

  if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const isAdmin = member.role === "admin";

  if (!isAdmin) {
    if (!member.can_edit_tree) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Non-admins can only delete people they created within the last hour
    const { data: person } = await supabase
      .from("people")
      .select("created_by, created_at")
      .eq("id", personId)
      .eq("family_id", familyId)
      .single();

    if (!person) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (person.created_by !== user.id) {
      return NextResponse.json({ error: "You can only delete people you added" }, { status: 403 });
    }

    const age = Date.now() - new Date(person.created_at).getTime();
    if (age > ONE_HOUR_MS) {
      return NextResponse.json(
        { error: "People can only be deleted within 1 hour of being added. Contact an admin for help." },
        { status: 403 }
      );
    }
  }

  const { error } = await supabase
    .from("people")
    .delete()
    .eq("id", personId)
    .eq("family_id", familyId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
