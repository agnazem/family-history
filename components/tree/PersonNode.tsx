"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Avatar } from "@/components/ui/Avatar";
import type { Person } from "@/types";

export type NodeTier = "subject" | "direct" | "collateral";

export type PersonNodeData = Person & {
  onClick: (id: string) => void;
  memoryCount?: number;
  isFocused?: boolean;
  tier?: NodeTier;
  lineageModeEnabled?: boolean;
};

export function PersonNode({ data }: NodeProps) {
  const person = data as unknown as PersonNodeData;
  const displayName = person.nickname
    ? `${person.first_name} "${person.nickname}" ${person.last_name}`
    : `${person.first_name} ${person.last_name}`;
  const fullName = `${person.first_name} ${person.last_name}`;
  const isDeceased = !!person.dod;
  const isFocused = !!person.isFocused;
  const tier = person.tier;
  const lineageModeEnabled = !!person.lineageModeEnabled;
  const isCollateral = lineageModeEnabled && tier === "collateral";
  const isSubject = tier === "subject";
  const isDirect = tier === "direct";

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
        className={`relative w-[152px] h-[64px] rounded-xl cursor-pointer transition-all select-none flex items-center hover:border-[--gold] ${
          isSubject
            ? "bg-[--accent-soft] border-2 border-[--accent]"
            : isDirect
            ? "bg-[--surface] border border-[--ink]"
            : isFocused
            ? "bg-[--accent-soft] border border-[--accent]"
            : isDeceased
            ? "bg-[--surface] border border-[--rule] opacity-70"
            : "bg-[--surface] border border-[--rule]"
        } ${isCollateral ? "opacity-35 border-dashed !border-[--rule]" : ""}`}
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
                isSubject ? "text-[--accent]" :
                isFocused ? "text-[--accent]" :
                isDeceased ? "text-[--ink-mute]" :
                "text-[--ink]"
              } ${isDirect ? "font-medium" : ""}`}
            >
              {displayName}
            </p>
            {dates && (
              <p className={`font-mono text-[10px] tracking-[0.02em] h-[13px] truncate ${isDirect || isSubject ? "text-[--ink-mute]" : "text-[--gold]"}`}>
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
