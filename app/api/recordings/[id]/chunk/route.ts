import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI();

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: memoryId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
    await supabase.rpc("append_transcript_chunk", {
      p_memory_id: memoryId,
      p_text: text,
    });
  }

  return NextResponse.json({ text });
}
