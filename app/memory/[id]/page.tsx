import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { MemoryDetailClient } from "./MemoryDetailClient";
import type { Memory, MemoryComment, Person } from "@/types";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("memories")
    .select("title, transcript")
    .eq("id", id)
    .single();

  if (!data) return { title: "Memory" };

  const description = data.transcript
    ? data.transcript.slice(0, 200) + (data.transcript.length > 200 ? "…" : "")
    : undefined;

  return {
    title: data.title,
    description,
    openGraph: {
      title: data.title,
      description,
      type: "article",
    },
  };
}

export default async function MemoryPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/?from=/memory/${id}`);
  }

  const { data: memory } = await supabase
    .from("memories")
    .select("*")
    .eq("id", id)
    .single();

  if (!memory) notFound();

  // Verify family membership
  const { data: membership } = await supabase
    .from("family_members")
    .select("role, display_name, can_edit_memories")
    .eq("family_id", memory.family_id)
    .eq("user_id", user.id)
    .single();

  if (!membership) notFound();

  // Non-admins cannot view deleted memories
  if (memory.deleted_at && membership.role !== "admin") notFound();

  // Fetch recorder's display name
  const { data: recorderMember } = await supabase
    .from("family_members")
    .select("display_name")
    .eq("family_id", memory.family_id)
    .eq("user_id", memory.recorded_by)
    .single();

  // Fetch people tagged in this memory
  const { data: memoryPeople } = await supabase
    .from("memory_people")
    .select("person_id, role, people(id, first_name, last_name, profile_photo_url)")
    .eq("memory_id", id);

  const taggedPeople: (Person & { role: string })[] = (memoryPeople ?? [])
    .map((mp: { person_id: string; role: string; people: unknown }) => {
      const person = mp.people as Person | null;
      if (!person) return null;
      return { ...person, role: mp.role };
    })
    .filter(Boolean) as (Person & { role: string })[];

  // Fetch all people in the family for the tag editor
  const { data: allPeople } = await supabase
    .from("people")
    .select("id, first_name, last_name, profile_photo_url")
    .eq("family_id", memory.family_id)
    .order("last_name", { ascending: true });

  // Fetch comments (flat list — client handles threading)
  const { data: comments } = await supabase
    .from("comments")
    .select("*")
    .eq("memory_id", id)
    .order("created_at", { ascending: true });

  // Fetch member names for comments
  const { data: members } = await supabase
    .from("family_members")
    .select("user_id, display_name")
    .eq("family_id", memory.family_id);

  const memberNames: Record<string, string> = {};
  for (const m of members ?? []) {
    memberNames[m.user_id] = m.display_name ?? "Family member";
  }

  const canEdit = membership.role === "admin" ||
    (membership.can_edit_memories === true && memory.recorded_by === user.id);

  return (
    <MemoryDetailClient
      memory={memory as Memory}
      taggedPeople={taggedPeople}
      allPeople={(allPeople ?? []) as Person[]}
      familyMembers={(members ?? []) as { user_id: string; display_name: string | null }[]}
      comments={(comments ?? []) as MemoryComment[]}
      memberNames={memberNames}
      recorderName={recorderMember?.display_name ?? "Family member"}
      canEdit={canEdit}
      currentUserId={user.id}
      familyId={memory.family_id}
    />
  );
}
