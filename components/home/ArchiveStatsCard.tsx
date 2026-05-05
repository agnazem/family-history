interface Props {
  memories: number;
  people: number;
  generations: number | null;
  earliestYear: number | null;
}

export function ArchiveStatsCard({ memories, people, generations, earliestYear }: Props) {
  return (
    <div className="bg-[--surface] border border-[--rule] rounded-2xl p-6">
      <p className="eyebrow mb-5">The archive · at a glance</p>
      <div className="grid grid-cols-2 gap-5">
        <Stat n={memories.toLocaleString()} label="memories" />
        <Stat n={people.toLocaleString()} label="people" />
        <Stat n={generations ? generations.toString() : "—"} label="generations" />
        <Stat n={earliestYear ? earliestYear.toString() : "—"} label="earliest year" />
      </div>
    </div>
  );
}

function Stat({ n, label }: { n: string; label: string }) {
  return (
    <div>
      <div className="font-display font-normal text-[32px] leading-none tracking-[-0.02em] text-[--ink]">{n}</div>
      <div className="font-mono text-[12px] text-[--ink-mute] tracking-[0.08em] uppercase mt-1.5">{label}</div>
    </div>
  );
}
