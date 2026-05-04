import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { familyId, personIds = [] } = await req.json();
  if (!familyId) return NextResponse.json({ error: "familyId required" }, { status: 400 });

  const { data: memory, error } = await supabase
    .from("memories")
    .insert({
      family_id: familyId,
      type: "audio",
      title: "Untitled recording",
      recorded_by: user.id,
      transcript_status: "pending",
    })
    .select()
    .single();

  if (error || !memory) {
    return NextResponse.json({ error: error?.message ?? "Failed to create recording" }, { status: 500 });
  }

  if (personIds.length > 0) {
    await supabase.from("memory_people").insert(
      personIds.map((pid: string) => ({
        memory_id: memory.id,
        person_id: pid,
        family_id: familyId,
      }))
    );
  }

  return NextResponse.json({ recordingId: memory.id });
}
