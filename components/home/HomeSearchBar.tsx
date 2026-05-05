"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { SearchModal } from "@/components/search/SearchModal";
import type { Person } from "@/types";

interface HomeSearchBarProps {
  familyId: string;
  people: Person[];
}

export function HomeSearchBar({ familyId, people }: HomeSearchBarProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-2.5 py-2.5 text-left group"
        aria-label="Search people and memories"
      >
        <Search className="w-3.5 h-3.5 text-[--ink-mute] flex-shrink-0 group-hover:text-[--ink-soft] transition-colors" />
        <span className="text-sm text-[--ink-mute] group-hover:text-[--ink-soft] transition-colors">
          Search people and memories…
        </span>
      </button>

      <SearchModal
        open={open}
        onClose={() => setOpen(false)}
        familyId={familyId}
        people={people}
        onPersonClick={(personId) => router.push(`/person/${personId}`)}
      />
    </>
  );
}
