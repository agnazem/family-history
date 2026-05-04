import Link from "next/link";
import { Mic, Image as ImageIcon } from "lucide-react";

export interface GreetingCta {
  id: "record" | "photo" | "ask" | "first-person";
  label: string;
  href: string;
}

export interface GreetingHeroProps {
  eyebrow: string;
  salutation: string;
  subject: string | null;
  subjectMode: "silent" | "active-family" | "empty" | "none";
  daysSilent: number | null;
  weekMemCount?: number;
  ctas: GreetingCta[];
}

export function GreetingHero({ eyebrow, salutation, subject, subjectMode, daysSilent, weekMemCount, ctas }: GreetingHeroProps) {
  return (
    <div className="mb-10">
      <p className="eyebrow mb-3">{eyebrow}</p>
      <h1 className="font-display font-normal leading-[1.04] tracking-[-0.025em] text-[clamp(36px,4.5vw,56px)] text-[--ink]">
        {salutation}{" "}

        {subjectMode === "silent" && subject && daysSilent !== null && (
          <>
            <span className="italic-flourish text-[--accent]">{subject}</span>
            <br className="hidden sm:block" />
            {" hasn’t been heard from in "}
            <span className="italic-flourish">{daysSilent} {daysSilent === 1 ? "day" : "days"}</span>.
          </>
        )}

        {subjectMode === "active-family" && weekMemCount !== undefined && (
          <>
            {" The "}
            <span className="italic-flourish">family</span>
            {` ${weekMemCount === 1 ? "has" : "have"} `}
            <span className="italic-flourish">{weekMemCount} new {weekMemCount === 1 ? "story" : "stories"}</span>
            {" this week."}
          </>
        )}

        {subjectMode === "empty" && (
          <> Let&rsquo;s start with one story.</>
        )}

        {subjectMode === "none" && (
          <> Anything to add today?</>
        )}
      </h1>

      <div className="mt-6 flex flex-wrap gap-3 items-center">
        {ctas.map((cta) => {
          if (cta.id === "record" || cta.id === "first-person") {
            return (
              <Link key={cta.id} href={cta.href}
                className="inline-flex items-center gap-2 bg-[--accent] hover:bg-[--accent-hover] text-white px-5 py-2.5 rounded-xl text-[15px] font-medium transition-colors">
                <Mic className="w-4 h-4" />
                {cta.label}
              </Link>
            );
          }
          if (cta.id === "photo") {
            return (
              <Link key={cta.id} href={cta.href}
                className="inline-flex items-center gap-2 border border-[--rule] hover:border-[--gold] text-[--ink-soft] hover:text-[--ink] bg-[--surface] px-5 py-2.5 rounded-xl text-[15px] font-medium transition-colors">
                <ImageIcon className="w-4 h-4" />
                {cta.label}
              </Link>
            );
          }
          return (
            <Link key={cta.id} href={cta.href}
              className="text-[15px] text-[--ink-soft] hover:text-[--ink] transition-colors py-2.5">
              {cta.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
