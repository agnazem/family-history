import { createClient } from "@/lib/supabase/server";
import { requireFamilyMember } from "@/lib/supabase/authz";
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI();

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: memoryId } = await params;
  const supabase = await createClient();

  const { data: memory } = await supabase
    .from("memories")
    .select("family_id")
    .eq("id", memoryId)
    .single();
  if (!memory) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { error: authError } = await requireFamilyMember(supabase, memory.family_id);
  if (authError) return authError;

  const formData = await req.formData();
  const chunk = formData.get("chunk") as Blob | null;

  if (!chunk || chunk.size < 100) {
    return NextResponse.json({ text: "" });
  }

  // Mark streaming on first chunk (no-op if already streaming)
  await supabase
    .from("memories")
    .update({ transcript_status: "streaming" })
    .eq("id", memoryId)
    .eq("transcript_status", "pending");

  const mimeType = chunk.type || "audio/webm";
  const ext = mimeType.includes("mp4") ? "mp4" : mimeType.includes("ogg") ? "ogg" : "webm";
  const file = new File([chunk], `chunk.${ext}`, { type: mimeType });

  let text = "";
  try {
    const result = await openai.audio.transcriptions.create({
      file,
      model: "whisper-1",
      response_format: "text",
    });
    text = (typeof result === "string" ? result : "").trim();
  } catch (err) {
    console.error("[chunk] transcription error:", err);
    return NextResponse.json({ text: "" });
  }

  if (text) {
    // Replace (not append) — we send the full accumulated audio each time,
    // so this is always the complete transcript so far.
    await supabase
      .from("memories")
      .update({ transcript: text })
      .eq("id", memoryId);
  }

  return NextResponse.json({ text });
}
