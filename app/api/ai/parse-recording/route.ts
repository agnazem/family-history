import { anthropic } from "@/lib/anthropic";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "AI not configured" }, { status: 503 });
  }

  const { transcript, personName, existingPeople } = await request.json() as {
    transcript: string;
    personName: string;
    existingPeople: Array<{ id: string; first_name: string; last_name: string }>;
  };

  if (!transcript?.trim()) {
    return NextResponse.json({ error: "No transcript provided" }, { status: 400 });
  }

  const peopleList =
    existingPeople.length > 0
      ? existingPeople
          .map((p) => `- "${p.first_name} ${p.last_name}" (id: ${p.id})`)
          .join("\n")
      : "None recorded yet.";

  const prompt = `You are processing a voice memo recorded about a family member named "${personName}" for a family history application.

Transcript of the recording:
"""
${transcript}
"""

People already in this family tree (do not suggest creating these):
${peopleList}

Analyze the transcript and extract the following in JSON format:

1. memories: Each distinct story, memory, or factual detail worth preserving as a separate record. Be generous — if the speaker describes multiple scenes or moments, split them. Each gets a clear title and a description written in the third person about ${personName}.

2. new_people: People mentioned by name who are NOT in the existing family tree list above. Infer their relationship to ${personName} from context. "role" means their role relative to ${personName}: "parent" (they are ${personName}'s parent), "child" (they are ${personName}'s child), or "other" (spouse, sibling, cousin, friend, etc.).

3. relationships_to_existing: Any relationship explicitly stated between ${personName} and someone already in the family tree. Match names carefully to the list above and use their id. "role" follows the same convention as above.

4. summary_contribution: 1–2 sentences capturing the essence of what was shared, suitable for adding to ${personName}'s biography.

Return ONLY valid JSON with no other text, matching this exact shape:
{
  "memories": [
    {
      "title": "string",
      "description": "string",
      "date_of_memory": "YYYY-MM-DD or brief descriptive string like 'Summer 1972' or null"
    }
  ],
  "new_people": [
    {
      "first_name": "string",
      "last_name": "string",
      "relationship": "parent_child" | "spouse" | "sibling",
      "role": "parent" | "child" | "other",
      "notes": "string or null"
    }
  ],
  "relationships_to_existing": [
    {
      "person_id": "string",
      "person_name": "string",
      "relationship": "parent_child" | "spouse" | "sibling",
      "role": "parent" | "child" | "other"
    }
  ],
  "summary_contribution": "string"
}`;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    messages: [{ role: "user", content: prompt }],
  });

  const text = (message.content[0] as { type: string; text: string }).text;

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return NextResponse.json({ error: "Could not parse AI response" }, { status: 500 });
  }

  const result = JSON.parse(jsonMatch[0]);
  return NextResponse.json(result);
}
