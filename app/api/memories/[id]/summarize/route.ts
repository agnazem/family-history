import { createClient } from "@/lib/supabase/server";
import { anthropic } from "@/lib/anthropic";
import { NextRequest, NextResponse } from "next/server";

const SUMMARY_WORD_THRESHOLD = 300;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: memoryId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({})) as { force?: boolean };
  const force = !!body.force;

  const { data: memory } = await supabase
    .from("memories")
    .select("transcript, transcript_summary, family_id, title, recorded_by")
    .eq("id", memoryId)
    .single();

  if (!memory?.transcript) {
    return NextResponse.json({ error: "No transcript to summarize" }, { status: 400 });
  }

  // Return cached summary unless caller is forcing a regeneration
  if (memory.transcript_summary && !force) {
    return NextResponse.json({ summary: memory.transcript_summary });
  }

  const wordCount = memory.transcript.trim().split(/\s+/).length;
  if (wordCount < SUMMARY_WORD_THRESHOLD) {
    return NextResponse.json({ error: "Transcript too short to summarize" }, { status: 400 });
  }

  // Verify family membership and write permission (recorder or admin)
  const { data: membership } = await supabase
    .from("family_members")
    .select("id, role")
    .eq("family_id", memory.family_id)
    .eq("user_id", user.id)
    .single();
  if (!membership) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const isRecorder = memory.recorded_by === user.id;
  const isAdmin = membership.role === "admin";
  if (force && !isRecorder && !isAdmin) {
    return NextResponse.json({ error: "Only the recorder or an admin can regenerate the summary" }, { status: 403 });
  }

  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 200,
    messages: [
      {
        role: "user",
        content: `You're helping a family preserve its history. Read this voice recording transcript and write a 2–3 sentence summary in warm, specific prose. Name the specific people, places, and stories mentioned. Don't use generic phrases like "the speaker discusses" or "this recording covers." Write it the way a family member would tell another family member what the recording is about.

Title: ${memory.title}

Transcript:
${memory.transcript}

Return only the summary text, no preamble or explanation.`,
      },
    ],
  });

  const summary = (message.content[0] as { type: string; text: string }).text.trim();

  await supabase
    .from("memories")
    .update({ transcript_summary: summary })
    .eq("id", memoryId);

  return NextResponse.json({ summary });
}
