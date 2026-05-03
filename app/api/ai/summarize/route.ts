import { anthropic } from "@/lib/anthropic";
import { NextResponse } from "next/server";

interface MemoryInput {
  type: string;
  title: string;
  description: string | null;
  date_of_memory: string | null;
}

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "AI not configured" }, { status: 503 });
  }

  const { personName, dob, dod, bio, memories } = await request.json() as {
    personName: string;
    dob: string | null;
    dod: string | null;
    bio: string | null;
    memories: MemoryInput[];
  };

  if (!personName) {
    return NextResponse.json({ error: "Missing personName" }, { status: 400 });
  }

  const isDeceased = !!dod;
  const tense = isDeceased ? "past tense" : "present tense where appropriate";

  const memoryLines =
    memories.length === 0
      ? "No memories have been recorded yet."
      : memories
          .map(
            (m) =>
              `- [${m.type}] "${m.title}"${m.date_of_memory ? ` (${m.date_of_memory})` : ""}: ${m.description ?? "(no description)"}`
          )
          .join("\n");

  const prompt = `You are helping build a family history record. Write a warm, concise summary of this person based on the information provided.

Person: ${personName}${dob ? `, born ${dob}` : ""}${dod ? `, died ${dod}` : ""}
${bio ? `Bio: ${bio}\n` : ""}
Memories recorded about them:
${memoryLines}

Write 2–4 sentences in third person, ${tense}. Capture who they were as a human being — their character, relationships, and what they are remembered for. Do not invent details not present in the source material. If there are few or no memories yet, acknowledge that their story is still being gathered.

Return only the summary text, no preamble or explanation.`;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 300,
    messages: [{ role: "user", content: prompt }],
  });

  const summary = (message.content[0] as { type: string; text: string }).text.trim();
  return NextResponse.json({ summary });
}
