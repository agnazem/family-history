"use client";

import { useState, useEffect } from "react";
import { Mic, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";

const PROMPTS: { question: string; flourishWord: string; helper: string }[] = [
  {
    question: "What's a smell that takes you straight back to your childhood kitchen?",
    flourishWord: "childhood kitchen",
    helper: "Take us there with one sense.",
  },
  {
    question: "What's the bravest thing someone in your family has ever done?",
    flourishWord: "bravest",
    helper: "Courage comes in many forms.",
  },
  {
    question: "Describe a family meal that you'd give anything to have one more time.",
    flourishWord: "one more time",
    helper: "Food is memory.",
  },
  {
    question: "What's a phrase or saying your grandparents used that no one else does?",
    flourishWord: "grandparents",
    helper: "Words outlive us.",
  },
  {
    question: "Where did your family come from, and what made them leave?",
    flourishWord: "come from",
    helper: "Every family has a migration story.",
  },
  {
    question: "What's the oldest photograph in your family and what's the story behind it?",
    flourishWord: "oldest photograph",
    helper: "A picture with a story.",
  },
  {
    question: "What did your childhood home sound like?",
    flourishWord: "sound like",
    helper: "Close your eyes and listen.",
  },
  {
    question: "What job or trade ran through your family for generations?",
    flourishWord: "generations",
    helper: "Work shapes who we become.",
  },
  {
    question: "Tell me about a summer that changed everything for your family.",
    flourishWord: "changed everything",
    helper: "Seasons carry whole eras.",
  },
  {
    question: "What's the most treasured object that's been passed down in your family?",
    flourishWord: "passed down",
    helper: "Objects hold memory too.",
  },
  {
    question: "Who in your family was the best storyteller, and what made them so good?",
    flourishWord: "best storyteller",
    helper: "Every family has one.",
  },
  {
    question: "Describe the neighborhood or town where you grew up.",
    flourishWord: "grew up",
    helper: "Place shapes people.",
  },
  {
    question: "What's something your parents sacrificed that you didn't appreciate until later?",
    flourishWord: "didn't appreciate until later",
    helper: "Gratitude often comes late.",
  },
  {
    question: "What's a holiday tradition in your family that exists nowhere else?",
    flourishWord: "nowhere else",
    helper: "Rituals make us who we are.",
  },
  {
    question: "What's a secret your family kept for years that you can now share?",
    flourishWord: "secret",
    helper: "Some stories need time.",
  },
];

const LS_INDEX = "fh_prompt_index";
const LS_STARTED_AT = "fh_prompt_started_at";
const ANSWERED_WINDOW_MS = 90 * 60 * 1000; // 90 min — if they started a recording within this window, auto-advance

export function SundayPromptCard() {
  const router = useRouter();
  const [idx, setIdx] = useState(0);
  const [mounted, setMounted] = useState(false);

  // Hydrate from localStorage on mount; auto-advance if they recently answered
  useEffect(() => {
    const stored = parseInt(localStorage.getItem(LS_INDEX) ?? "0", 10);
    const safeIdx = isNaN(stored) ? 0 : stored % PROMPTS.length;

    const startedAt = parseInt(localStorage.getItem(LS_STARTED_AT) ?? "0", 10);
    const elapsed = Date.now() - startedAt;

    if (startedAt > 0 && elapsed < ANSWERED_WINDOW_MS) {
      // They came back after starting a recording — advance to next prompt
      const next = (safeIdx + 1) % PROMPTS.length;
      setIdx(next);
      localStorage.setItem(LS_INDEX, String(next));
      localStorage.removeItem(LS_STARTED_AT);
    } else {
      setIdx(safeIdx);
    }

    setMounted(true);
  }, []);

  function advance() {
    const next = (idx + 1) % PROMPTS.length;
    setIdx(next);
    localStorage.setItem(LS_INDEX, String(next));
  }

  function handleBegin() {
    // Mark that the user started answering this prompt
    localStorage.setItem(LS_STARTED_AT, String(Date.now()));
    router.push(`/record?prompt=${encodeURIComponent(PROMPTS[idx].question)}`);
  }

  const { question, flourishWord, helper } = PROMPTS[idx];

  // Split question around flourish word for italic rendering
  const parts = question.split(new RegExp(`(${flourishWord.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "i"));

  // Avoid hydration mismatch — render nothing until localStorage is read
  if (!mounted) return null;

  return (
    <div
      className="mb-8 rounded-2xl border border-[--rule] overflow-hidden"
      style={{ background: "linear-gradient(180deg, var(--accent-soft) 0%, var(--surface) 100%)" }}
    >
      <div className="p-7 flex gap-6 items-start">
        <div className="flex-1 min-w-0">
          <p className="eyebrow text-[--accent] mb-2.5">Prompt for today</p>
          <p className="font-display font-normal text-[28px] leading-[1.2] tracking-[-0.01em] text-[--ink] mb-3">
            &ldquo;
            {parts.map((part, i) =>
              part.toLowerCase() === flourishWord.toLowerCase()
                ? <span key={i} className="italic-flourish">{part}</span>
                : part
            )}
            &rdquo;
          </p>
          <p className="text-[14px] text-[--ink-soft] leading-snug">{helper}</p>
        </div>

        <div className="flex flex-col gap-2 flex-shrink-0">
          <button
            onClick={handleBegin}
            className="inline-flex items-center gap-2 bg-[--accent] hover:bg-[--accent-hover] text-white px-5 py-2.5 rounded-xl text-[15px] font-medium transition-colors"
          >
            <Mic className="w-4 h-4" />
            Begin
          </button>
          <button
            onClick={advance}
            className="inline-flex items-center justify-center gap-1.5 border border-[--rule] text-[--ink-soft] hover:text-[--ink] hover:bg-[--surface-alt] px-4 py-2 rounded-xl text-[13px] transition-colors"
            title="Skip to next prompt"
          >
            Next
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
