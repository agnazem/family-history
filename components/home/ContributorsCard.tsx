import Image from "next/image";

export interface ContributorAvatar {
  initials: string;
  imageUrl?: string | null;
  name: string;
}

interface Props {
  total: number;
  avatars: ContributorAvatar[];
  topName: string | null;
  topCount: number;
  secondName: string | null;
  secondCount: number;
}

const MAX_SHOWN = 8;

export function ContributorsCard({ total, avatars, topName, topCount, secondName, secondCount }: Props) {
  const visible = avatars.slice(0, MAX_SHOWN);
  const overflow = Math.max(0, avatars.length - MAX_SHOWN);

  return (
    <div className="bg-[--surface] border border-[--rule] rounded-2xl p-6 mb-5">
      <p className="eyebrow mb-4">Family · {total} contributor{total !== 1 ? "s" : ""}</p>

      <div className="flex flex-wrap gap-2 mb-5">
        {visible.map((a, i) => (
          a.imageUrl ? (
            <div key={i} className="w-10 h-10 rounded-full overflow-hidden border border-[--rule] flex-shrink-0">
              <Image src={a.imageUrl} alt={a.name} width={40} height={40} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div key={i}
              className="w-10 h-10 rounded-full bg-[--accent-soft] text-[--accent] font-display font-normal text-sm flex items-center justify-center border border-[--rule] flex-shrink-0">
              {a.initials}
            </div>
          )
        ))}
        {overflow > 0 && (
          <div className="w-10 h-10 rounded-full bg-[--surface-alt] text-[--ink-mute] font-mono text-[11px] flex items-center justify-center border border-[--rule] flex-shrink-0">
            +{overflow}
          </div>
        )}
      </div>

      {topName ? (
        <p className="text-[14px] text-[--ink-soft] leading-relaxed">
          <span className="italic-flourish text-[--ink]">{topName}</span>{" "}
          contributed {topCount} {topCount === 1 ? "memory" : "memories"}.
          {secondName && (
            <>{" "}<span className="italic-flourish text-[--ink]">{secondName}</span>{" "}
            uploaded {secondCount} {secondCount === 1 ? "photo" : "photos"} last month.</>
          )}
        </p>
      ) : (
        <p className="text-[14px] text-[--ink-mute] italic">No contributions in the last 30 days.</p>
      )}
    </div>
  );
}
