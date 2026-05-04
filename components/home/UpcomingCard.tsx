export interface UpcomingItem {
  when: string;
  what: string;
  sub: string;
}

interface Props {
  items: UpcomingItem[];
}

export function UpcomingCard({ items }: Props) {
  if (items.length === 0) return null;

  return (
    <div className="bg-[--surface] border border-[--rule] rounded-2xl p-6 mb-5">
      <p className="eyebrow mb-4">Coming up</p>
      <div className="flex flex-col gap-4">
        {items.map((item, i) => (
          <div key={i} className="flex gap-3.5 items-start">
            <div className="font-mono text-[11px] text-[--accent] tracking-[0.06em] uppercase w-[76px] flex-shrink-0 pt-0.5 leading-tight">
              {item.when}
            </div>
            <div className="flex-1">
              <p className="text-[15px] font-medium text-[--ink] leading-tight mb-0.5">{item.what}</p>
              <p className="text-[13px] text-[--ink-soft]">{item.sub}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
