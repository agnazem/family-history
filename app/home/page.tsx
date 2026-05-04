import { redirect } from "next/navigation";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AppNav } from "@/components/ui/AppNav";
import { GreetingHero, type GreetingHeroProps } from "@/components/home/GreetingHero";
import { SundayPromptCard } from "@/components/home/SundayPromptCard";
import { StoryRow, type StoryRowProps } from "@/components/home/StoryRow";
import { ContributorsCard, type ContributorAvatar } from "@/components/home/ContributorsCard";
import { UpcomingCard, type UpcomingItem } from "@/components/home/UpcomingCard";
import { ArchiveStatsCard } from "@/components/home/ArchiveStatsCard";

export const dynamic = "force-dynamic";

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmtAudioDuration(totalSec: number): string {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  if (h === 0) return m < 1 ? "<1m" : `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

function relativeWhen(dateStr: string, now: Date): string {
  const d = new Date(dateStr);
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return d.toLocaleDateString("en-US", { weekday: "short" });
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function fmtDuration(sec: number | null): string {
  if (!sec) return "";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function initials(name: string): string {
  return name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
}

function nextBirthday(dob: string, today: Date): { date: Date; daysAway: number } | null {
  const d = new Date(dob + "T00:00:00Z");
  if (isNaN(d.getTime())) return null;
  const thisYear = new Date(Date.UTC(today.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const next = thisYear < today ? new Date(Date.UTC(today.getUTCFullYear() + 1, d.getUTCMonth(), d.getUTCDate())) : thisYear;
  const daysAway = Math.floor((next.getTime() - today.getTime()) / 86400000);
  return daysAway <= 90 ? { date: next, daysAway } : null;
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: memberRow } = await supabase
    .from("family_members")
    .select("*, families(*)")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  if (!memberRow?.families) redirect("/family/new");

  const family = (memberRow as { families: { id: string; name: string } }).families;
  const familyId = family.id;
  const displayName = (memberRow as { display_name: string | null }).display_name ?? user.email?.split("@")[0] ?? "Friend";
  const firstName = displayName.split(" ")[0];

  // Server-side time (UTC; user timezone can be added via cookie later)
  const now = new Date();
  const hour = now.getUTCHours();
  const days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const dayNum = now.getUTCDate().toString().padStart(2, "0");
  const h12 = hour % 12 || 12;
  const mm = now.getUTCMinutes().toString().padStart(2, "0");
  const ampm = hour < 12 ? "am" : "pm";
  const eyebrow = `${days[now.getUTCDay()]} · ${dayNum} ${months[now.getUTCMonth()]} ${now.getUTCFullYear()} · ${h12}:${mm} ${ampm}`;

  let salutation: string;
  if (hour >= 4 && hour < 6) salutation = `Up early, ${firstName}.`;
  else if (hour >= 6 && hour < 12) salutation = `Good morning, ${firstName}.`;
  else if (hour >= 12 && hour < 17) salutation = `Good afternoon, ${firstName}.`;
  else salutation = `Good evening, ${firstName}.`;

  // Parallel data fetch
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000).toISOString();
  const [
    { data: people },
    { data: recentRaw },
    { data: allMembers },
    { count: memCount },
    { count: peopleCount },
    { data: audioRows },
    { data: recentContributions },
  ] = await Promise.all([
    supabase.from("people").select("id, first_name, last_name, dob, dod, profile_photo_url").eq("family_id", familyId),
    supabase.from("memories").select("id, type, title, created_at, recorded_by, duration_sec, date_of_memory, description").eq("family_id", familyId).is("deleted_at", null).order("created_at", { ascending: false }).limit(6),
    supabase.from("family_members").select("user_id, display_name").eq("family_id", familyId),
    supabase.from("memories").select("id", { count: "exact", head: true }).eq("family_id", familyId).is("deleted_at", null),
    supabase.from("people").select("id", { count: "exact", head: true }).eq("family_id", familyId),
    supabase.from("memories").select("duration_sec").eq("family_id", familyId).eq("type", "audio").is("deleted_at", null).not("duration_sec", "is", null),
    supabase.from("memories").select("recorded_by").eq("family_id", familyId).is("deleted_at", null).gte("created_at", thirtyDaysAgo),
  ]);

  const memberNameMap = new Map<string, string>(
    (allMembers ?? []).map(m => [m.user_id, (m.display_name ?? "Family member")])
  );

  // ── Greeting subject computation ─────────────────────────────────────────

  let greeting: GreetingHeroProps;
  const today = now.toISOString().split("T")[0];
  const living = (people ?? []).filter(p => !p.dod || p.dod > today);

  if ((people ?? []).length === 0) {
    greeting = {
      eyebrow, salutation, subject: null, subjectMode: "empty", daysSilent: null,
      ctas: [{ id: "first-person", label: "Add your first person", href: "/tree?add=1" }],
    };
  } else {
    // Find last memory tagged with each living person
    const personIds = living.map(p => p.id);
    let lastMemoryMap = new Map<string, Date>();

    if (personIds.length > 0) {
      const { data: tagLinks } = await supabase.from("memory_people").select("person_id, memory_id").in("person_id", personIds);
      const linkedMemIds = [...new Set((tagLinks ?? []).map(t => t.memory_id))];
      if (linkedMemIds.length > 0) {
        const { data: memDates } = await supabase.from("memories").select("id, created_at").in("id", linkedMemIds).is("deleted_at", null);
        const memDateMap = new Map((memDates ?? []).map(m => [m.id, new Date(m.created_at)]));
        for (const link of tagLinks ?? []) {
          const d = memDateMap.get(link.memory_id);
          if (d) {
            const cur = lastMemoryMap.get(link.person_id);
            if (!cur || d > cur) lastMemoryMap.set(link.person_id, d);
          }
        }
      }
    }

    const scored = living
      .map(p => {
        const last = lastMemoryMap.get(p.id) ?? null;
        const daysSilent = last ? Math.floor((now.getTime() - last.getTime()) / 86400000) : null;
        return { person: p, daysSilent };
      })
      .sort((a, b) => {
        const aS = a.daysSilent ?? Infinity;
        const bS = b.daysSilent ?? Infinity;
        if (bS !== aS) return bS - aS;
        const dobA = a.person.dob ? new Date(a.person.dob).getTime() : Infinity;
        const dobB = b.person.dob ? new Date(b.person.dob).getTime() : Infinity;
        return dobA - dobB;
      });

    const top = scored[0];
    const subject = top?.person;
    const daysSilent = top?.daysSilent ?? null;

    if (!subject || daysSilent === 0) {
      // Everyone contributed today
      const { count: weekCount } = await supabase.from("memories").select("id", { count: "exact", head: true }).eq("family_id", familyId).gte("created_at", new Date(now.getTime() - 7 * 86400000).toISOString());
      greeting = {
        eyebrow, salutation, subject: null, subjectMode: "none", daysSilent: 0,
        weekMemCount: weekCount ?? 0,
        ctas: [
          { id: "record", label: "Record a story", href: "/record" },
          { id: "photo", label: "Add a photo", href: "/tree" },
        ],
      };
    } else if (daysSilent !== null && daysSilent < 7) {
      const { count: weekCount } = await supabase.from("memories").select("id", { count: "exact", head: true }).eq("family_id", familyId).gte("created_at", new Date(now.getTime() - 7 * 86400000).toISOString());
      greeting = {
        eyebrow, salutation, subject: null, subjectMode: "active-family", daysSilent,
        weekMemCount: weekCount ?? 0,
        ctas: [
          { id: "record", label: "Record a story", href: "/record" },
          { id: "photo", label: "Add a photo", href: "/tree" },
        ],
      };
    } else {
      const subjectName = subject.first_name;
      greeting = {
        eyebrow, salutation,
        subject: subjectName,
        subjectMode: "silent",
        daysSilent,
        ctas: [
          { id: "record", label: "Record a story", href: "/record" },
          { id: "photo", label: "Add a photo", href: "/tree" },
          { id: "ask", label: `Ask ${subjectName} a question →`, href: `/person/${subject.id}` },
        ],
      };
    }
  }

  // ── Recent memories ───────────────────────────────────────────────────────

  const storyRows: StoryRowProps[] = (recentRaw ?? []).map(m => ({
    id: m.id,
    title: m.title,
    type: m.type as StoryRowProps["type"],
    durationLabel: m.type === "audio" ? (fmtDuration(m.duration_sec) || "audio") : m.type === "photo" ? "photo" : m.type === "document" ? "doc" : "note",
    byName: memberNameMap.get(m.recorded_by) ?? "Family",
    era: m.date_of_memory ? new Date(m.date_of_memory + "T00:00:00Z").getUTCFullYear().toString() : new Date(m.created_at).getUTCFullYear().toString(),
    when: relativeWhen(m.created_at, now),
  }));

  // ── Contributors ──────────────────────────────────────────────────────────

  const contributionCount = new Map<string, number>();
  for (const m of recentContributions ?? []) {
    contributionCount.set(m.recorded_by, (contributionCount.get(m.recorded_by) ?? 0) + 1);
  }
  const topContributors = [...contributionCount.entries()].sort((a, b) => b[1] - a[1]);
  const topName = topContributors[0] ? memberNameMap.get(topContributors[0][0]) ?? null : null;
  const secondName = topContributors[1] ? memberNameMap.get(topContributors[1][0]) ?? null : null;

  const avatars: ContributorAvatar[] = (allMembers ?? []).map(m => ({
    name: m.display_name ?? "Member",
    initials: initials(m.display_name ?? "F"),
    imageUrl: null,
  }));

  // ── Upcoming birthdays ────────────────────────────────────────────────────

  const upcomingItems: UpcomingItem[] = (people ?? [])
    .filter(p => p.dob)
    .flatMap(p => {
      const bd = nextBirthday(p.dob!, now);
      if (!bd) return [];
      const isDeceased = !!p.dod;
      const fmtDate = bd.date.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
      const age = bd.date.getUTCFullYear() - new Date(p.dob! + "T00:00:00Z").getUTCFullYear();
      return [{
        when: fmtDate,
        what: `${p.first_name} ${p.last_name}${isDeceased ? "" : "'s birthday"}`,
        sub: isDeceased ? `Would have been ${age}` : `Turning ${age}`,
        daysAway: bd.daysAway,
      }];
    })
    .sort((a, b) => a.daysAway - b.daysAway)
    .slice(0, 3)
    .map(({ when, what, sub }) => ({ when, what, sub }));

  // ── Archive stats ─────────────────────────────────────────────────────────

  const totalAudioSec = (audioRows ?? []).reduce((sum, r) => sum + (r.duration_sec ?? 0), 0);
  const earliestDob = (people ?? [])
    .filter(p => p.dob)
    .map(p => new Date(p.dob! + "T00:00:00Z").getUTCFullYear())
    .sort((a, b) => a - b)[0] ?? null;

  return (
    <div className="min-h-screen bg-[--canvas]">
      <AppNav />

      {/* Main layout */}
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-10">
          {/* Left column */}
          <div>
            <GreetingHero {...greeting} />

            <SundayPromptCard
              question="What's a smell that takes you straight back to your childhood kitchen?"
              flourishWord="childhood kitchen"
              helper="One question, every Sunday. Three minutes of audio is plenty."
              beginHref="/record?prompt=What's+a+smell+that+takes+you+straight+back+to+your+childhood+kitchen?"
            />

            {/* Recently told */}
            <div className="flex items-baseline gap-4 mb-5">
              <h2 className="font-display italic font-normal text-[28px] tracking-[-0.01em] text-[--ink] flex-shrink-0">
                Recently told
              </h2>
              <div className="flex-1 h-px bg-[--rule]" />
              <span className="eyebrow flex-shrink-0">This week</span>
            </div>

            {storyRows.length > 0 ? (
              <>
                <div className="flex flex-col gap-3 mb-4">
                  {storyRows.map(row => <StoryRow key={row.id} {...row} />)}
                </div>
                {(memCount ?? 0) > 6 && (
                  <Link href="/activity" className="block text-center text-[14px] text-[--ink-mute] hover:text-[--ink] transition-colors py-2">
                    See all {memCount} memories →
                  </Link>
                )}
              </>
            ) : (
              <div className="text-center py-12 text-[--ink-mute]">
                <p className="mb-1">No memories yet.</p>
                <p className="text-[14px]">Visit a family member&rsquo;s page to add the first memory.</p>
              </div>
            )}
          </div>

          {/* Right column — hidden below lg */}
          <div className="hidden lg:block">
            <ContributorsCard
              total={allMembers?.length ?? 0}
              avatars={avatars}
              topName={topName}
              topCount={topContributors[0]?.[1] ?? 0}
              secondName={secondName}
              secondCount={topContributors[1]?.[1] ?? 0}
            />
            <UpcomingCard items={upcomingItems} />
            <ArchiveStatsCard
              memories={memCount ?? 0}
              people={peopleCount ?? 0}
              audioHumanized={totalAudioSec > 0 ? fmtAudioDuration(totalAudioSec) : "—"}
              earliestYear={earliestDob}
            />
          </div>
        </div>
      </div>

      {/* Mobile: sticky record button */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 pb-safe bg-gradient-to-t from-[--canvas] to-transparent pointer-events-none">
        <Link href="/tree"
          className="pointer-events-auto flex items-center justify-center gap-2 bg-[--accent] hover:bg-[--accent-hover] text-white h-14 rounded-2xl text-[15px] font-medium transition-colors shadow-lg w-full max-w-sm mx-auto">
          <BookOpen className="w-4 h-4" />
          Record a story
        </Link>
      </div>
    </div>
  );
}
