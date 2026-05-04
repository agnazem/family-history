import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI();

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: memoryId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: memory } = await supabase
    .from("memories")
    .select("storage_url, transcript_status, family_id")
    .eq("id", memoryId)
    .single();

  if (!memory?.storage_url) {
    return NextResponse.json({ error: "No audio file found" }, { status: 400 });
  }

  // Verify the user is a member of this family
  const { data: membership } = await supabase
    .from("family_members")
    .select("id")
    .eq("family_id", memory.family_id)
    .eq("user_id", user.id)
    .single();
  if (!membership) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  // Signal the UI immediately so the Realtime subscription shows a spinner
  await supabase
    .from("memories")
    .update({ transcript_status: "finalizing" })
    .eq("id", memoryId);

  // Download the audio from storage
  const audioRes = await fetch(memory.storage_url);
  if (!audioRes.ok) {
    await supabase.from("memories").update({ transcript_status: "failed" }).eq("id", memoryId);
    return NextResponse.json({ error: "Failed to fetch audio" }, { status: 502 });
  }

  const audioBuffer = await audioRes.arrayBuffer();
  const url = new URL(memory.storage_url);
  const filename = url.pathname.split("/").pop() ?? "recording.webm";
  const ext = filename.split(".").pop() ?? "webm";
  const mimeMap: Record<string, string> = { mp4: "audio/mp4", ogg: "audio/ogg", mp3: "audio/mpeg", m4a: "audio/mp4" };
  const mimeType = mimeMap[ext] ?? "audio/webm";
  const file = new File([audioBuffer], filename, { type: mimeType });

  try {
    const result = await openai.audio.transcriptions.create({
      file,
      model: "whisper-1",
      response_format: "text",
    });
    const transcript = (typeof result === "string" ? result : "").trim();

    await supabase
      .from("memories")
      .update({
        transcript: transcript || null,
        transcript_status: transcript ? "ready" : "failed",
      })
      .eq("id", memoryId);
  } catch (err) {
    console.error("[retranscribe] error:", err);
    await supabase.from("memories").update({ transcript_status: "failed" }).eq("id", memoryId);
    return NextResponse.json({ error: "Transcription failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
