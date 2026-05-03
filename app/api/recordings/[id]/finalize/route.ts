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
  const audioBlob = formData.get("audio") as Blob | null;
  const title = (formData.get("title") as string | null)?.trim() || "Voice memory";
  const durationSec = Number(formData.get("durationSec") ?? 0) || null;
  const recordedAt = (formData.get("recordedAt") as string | null) || null;
  const recordedAtNote = (formData.get("recordedAtNote") as string | null) || null;
  const storageUrl = (formData.get("storageUrl") as string | null) || null;

  // Update metadata immediately so the page is usable while transcription runs
  await supabase
    .from("memories")
    .update({
      title,
      duration_sec: durationSec,
      recorded_at: recordedAt || null,
      recorded_at_note: recordedAtNote || null,
      storage_url: storageUrl,
      transcript_status: "finalizing",
    })
    .eq("id", memoryId);

  // Run batch whisper-1 on the full audio for a clean final transcript
  if (audioBlob && audioBlob.size > 100) {
    const mimeType = audioBlob.type || "audio/webm";
    const ext = mimeType.includes("mp4") ? "mp4" : mimeType.includes("ogg") ? "ogg" : "webm";
    const file = new File([audioBlob], `recording.${ext}`, { type: mimeType });

    try {
      const result = await openai.audio.transcriptions.create({
        file,
        model: "whisper-1",
        response_format: "text",
      });
      const finalTranscript = (typeof result === "string" ? result : "").trim();

      await supabase
        .from("memories")
        .update({
          transcript: finalTranscript || null,
          transcript_status: finalTranscript ? "ready" : "failed",
        })
        .eq("id", memoryId);
    } catch (err) {
      console.error("[finalize] transcription error:", err);
      await supabase
        .from("memories")
        .update({ transcript_status: "failed" })
        .eq("id", memoryId);
    }
  } else {
    // No audio blob — mark ready if we have a streaming transcript, else failed
    const { data: mem } = await supabase
      .from("memories")
      .select("transcript")
      .eq("id", memoryId)
      .single();
    await supabase
      .from("memories")
      .update({ transcript_status: mem?.transcript ? "ready" : "none" })
      .eq("id", memoryId);
  }

  return NextResponse.json({ memoryId });
}
