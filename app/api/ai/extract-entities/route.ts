import { createClient } from "@/lib/supabase/server";
import { anthropic } from "@/lib/anthropic";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "AI not configured" }, { status: 503 });
  }

  const { transcript } = await request.json() as { transcript: string };
  if (!transcript?.trim()) {
    return NextResponse.json({ entities: [] });
  }

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 512,
    messages: [
      {
        role: "user",
        content: `Extract named entities from this family history transcript. Return ONLY a JSON object with an "entities" array.

Each entity should have:
- name: the full name or place name
- type: "person", "place", or "time"
- text: the exact text as it appears in the transcript
- confirmed: false

Transcript:
${transcript.slice(0, 3000)}

Respond ONLY with valid JSON. Example: {"entities":[{"name":"Eleanor","type":"person","text":"Eleanor","confirmed":false}]}`,
      },
    ],
  });

  try {
    const content = response.content[0];
    if (content.type !== "text") return NextResponse.json({ entities: [] });
    const parsed = JSON.parse(content.text);
    const entities = (parsed.entities ?? []).filter(
      (e: unknown) => typeof e === "object" && e !== null &&
        typeof (e as Record<string, unknown>).name === "string" &&
        typeof (e as Record<string, unknown>).type === "string"
    );
    return NextResponse.json({ entities });
  } catch {
    return NextResponse.json({ entities: [] });
  }
}
