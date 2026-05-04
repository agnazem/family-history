"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Avatar } from "@/components/ui/Avatar";
import type { Person } from "@/types";

export type PersonNodeData = Person & {
  onClick: (id: string) => void;
  memoryCount?: number;
  isFocused?: boolean;
};

export function PersonNode({ data }: NodeProps) {
  const person = data as unknown as PersonNodeData;
  const displayName = person.nickname
    ? `${person.first_name} "${person.nickname}" ${person.last_name}`
    : `${person.first_name} ${person.last_name}`;
  const fullName = `${person.first_name} ${person.last_name}`;
  const isDeceased = !!person.dod;
  const isFocused = !!person.isFocused;

  function formatYear(dateStr: string | null) {
    if (!dateStr) return null;
    return new Date(dateStr).getFullYear();
  }

  const birthYear = formatYear(person.dob);
  const deathYear = formatYear(person.dod);
  const dates =
    birthYear && deathYear
      ? `${birthYear} – ${deathYear}`
      : birthYear
      ? `b. ${birthYear}`
      : null;

  const memoryCount = person.memoryCount ?? 0;

  return (
    <>
      <Handle type="target" position={Position.Top} id="top" className="!bg-[--rule] !border-[--rule]" />
      <Handle type="target" position={Position.Left} id="left" className="!bg-[--rule] !border-[--rule]" />
      <div
        onClick={() => person.onClick(person.id)}
        className={`relative w-[152px] h-[64px] rounded-xl border cursor-pointer transition-colors select-none flex items-center hover:border-[--gold] ${
          isFocused
            ? "bg-[--accent-soft] border-[--accent]"
            : isDeceased
            ? "bg-[--surface] border-[--rule] opacity-70"
            : "bg-[--surface] border-[--rule]"
        }`}
        style={{ padding: "0 12px" }}
      >
        {memoryCount > 0 && (
          <span className="absolute top-[7px] right-[7px] w-2 h-2 rounded-full bg-[--gold] ring-2 ring-[--surface]" />
        )}
        <div className="flex items-center gap-2 w-full min-w-0">
          <Avatar src={person.profile_photo_url} name={fullName} size="sm" />
          <div className="min-w-0 flex-1">
            <p
              className={`font-display text-[12px] font-normal leading-snug line-clamp-2 ${
                isFocused ? "text-[--accent]" : isDeceased ? "text-[--ink-mute]" : "text-[--ink]"
              }`}
            >
              {displayName}
            </p>
            {dates && (
              <p className="font-mono text-[10px] tracking-[0.02em] text-[--gold] h-[13px] truncate">
                {dates}
              </p>
            )}
          </div>
        </div>
      </div>
      <Handle type="source" position={Position.Right} id="right" className="!bg-[--rule] !border-[--rule]" />
      <Handle type="source" position={Position.Bottom} id="bottom" className="!bg-[--rule] !border-[--rule]" />
    </>
  );
}
