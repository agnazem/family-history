"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Avatar } from "@/components/ui/Avatar";
import type { Person, MemoryType } from "@/types";

export type PersonNodeData = Person & { onClick: (id: string) => void; memoryTypes?: MemoryType[]; memoryCount?: number };

export function PersonNode({ data }: NodeProps) {
  const person = data as unknown as PersonNodeData;
  const displayName = person.nickname
    ? `${person.first_name} "${person.nickname}" ${person.last_name}`
    : `${person.first_name} ${person.last_name}`;
  const fullName = `${person.first_name} ${person.last_name}`;
  const isDeceased = !!person.dod;

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

  const memoryTypes = person.memoryTypes ?? [];
  const memoryCount = person.memoryCount ?? 0;

  return (
    <>
      <Handle type="target" position={Position.Top} className="!bg-accent-mid" />
      <div
        onClick={() => person.onClick(person.id)}
        className={`relative w-[192px] h-[64px] bg-white rounded-xl shadow-sm border cursor-pointer transition-all select-none hover:shadow-md hover:border-accent-mid flex items-center ${
          isDeceased ? "border-gray-200" : "border-accent-border"
        }`}
        style={{ padding: "0 13px" }}
      >
        {memoryCount > 0 && (
          <span className="absolute top-[7px] right-[7px] w-2 h-2 rounded-full bg-accent-mid ring-2 ring-white" />
        )}
        <div className="flex items-center gap-2.5 w-full min-w-0">
          <Avatar src={person.profile_photo_url} name={fullName} size="sm" />
          <div className="min-w-0 flex-1">
            <p className={`font-display text-[12.5px] font-normal leading-snug line-clamp-2 ${isDeceased ? "text-stone-400" : "text-stone-800"}`}>
              {displayName}
            </p>
            <p className="text-[10px] text-stone-400 h-[13px] truncate">
              {dates ?? ""}
            </p>
          </div>
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-accent-mid"
      />
      <Handle type="source" position={Position.Right} id="right" className="!bg-accent-mid" />
      <Handle type="target" position={Position.Right} id="right-in" className="!bg-accent-mid" />
      <Handle type="source" position={Position.Left} id="left-out" className="!bg-accent-mid" />
      <Handle type="target" position={Position.Left} id="left" className="!bg-accent-mid" />
    </>
  );
}
