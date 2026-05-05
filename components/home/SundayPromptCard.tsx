import Link from "next/link";
import { Mic } from "lucide-react";

interface Props {
  question: string;
  flourishWord?: string;
  helper: string;
  beginHref?: string;
}

export function SundayPromptCard({ question, flourishWord, helper, beginHref = "/tree" }: Props) {
  const parts = flourishWord
    ? question.split(new RegExp(`(${flourishWord})`, "i"))
    : [question];

  return (
    <div className="mb-8 rounded-2xl border border-[--rule] overflow-hidden"
      style={{ background: "linear-gradient(180deg, var(--accent-soft) 0%, var(--surface) 100%)" }}>
      <div className="p-7 flex gap-6 items-center">
        <div className="flex-1 min-w-0">
          <p className="eyebrow text-[--accent] mb-2.5">Prompt for today</p>
          <p className="font-display font-normal text-[28px] leading-[1.2] tracking-[-0.01em] text-[--ink] mb-3">
            &ldquo;
            {parts.map((part, i) =>
              part.toLowerCase() === flourishWord?.toLowerCase()
                ? <span key={i} className="italic-flourish">{part}</span>
                : part
            )}
            &rdquo;
          </p>
          <p className="text-[14px] text-[--ink-soft] leading-snug">{helper}</p>
        </div>
        <Link href={beginHref}
          className="flex-shrink-0 inline-flex items-center gap-2 bg-[--accent] hover:bg-[--accent-hover] text-white px-5 py-2.5 rounded-xl text-[15px] font-medium transition-colors">
          <Mic className="w-4 h-4" />
          Begin
        </Link>
      </div>
    </div>
  );
}
