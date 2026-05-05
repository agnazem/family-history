import { anthropic } from "@/lib/anthropic";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "AI not configured" }, { status: 503 });
  }

  const { transcript, originalPrompt } = await request.json() as {
    transcript: string;
    originalPrompt?: string;
  };

  if (!transcript?.trim()) {
    return NextResponse.json({ prompts: [] });
  }

  const context = originalPrompt
    ? `The original question was: "${originalPrompt}"\n\n`
    : "";

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 256,
    messages: [
      {
        role: "user",
        content: `${context}Here is a partial family history recording transcript:

"${transcript.slice(0, 2000)}"

Generate exactly 3 short, gentle follow-up questions that would deepen this story. Questions should be specific to what was just shared — not generic. Each question should be 10 words or fewer. Respond ONLY with a JSON object like: {"prompts":["question 1","question 2","question 3"]}`,
      },
    ],
  });

  try {
    const content = response.content[0];
    if (content.type !== "text") return NextResponse.json({ prompts: [] });
    const parsed = JSON.parse(content.text);
    return NextResponse.json({ prompts: (parsed.prompts ?? []).slice(0, 3) });
  } catch {
    return NextResponse.json({ prompts: [] });
  }
}
