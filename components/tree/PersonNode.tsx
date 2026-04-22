"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Avatar } from "@/components/ui/Avatar";
import type { Person } from "@/types";

export type PersonNodeData = Person & { onClick: (id: string) => void };

export function PersonNode({ data }: NodeProps) {
  const person = data as unknown as PersonNodeData;
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

  return (
    <>
      <Handle type="target" position={Position.Top} className="!bg-amber-400" />
      <div
        onClick={() => person.onClick(person.id)}
        className={`w-40 bg-white rounded-xl shadow-md border-2 p-3 cursor-pointer hover:shadow-lg hover:border-amber-400 transition-all select-none ${
          isDeceased ? "border-gray-300" : "border-amber-200"
        }`}
      >
        <div className="flex flex-col items-center gap-2">
          <Avatar src={person.profile_photo_url} name={fullName} size="lg" />
          <div className="text-center">
            <p className={`text-sm font-semibold leading-tight ${isDeceased ? "text-gray-500" : "text-gray-900"}`}>
              {fullName}
            </p>
            {dates && (
              <p className="text-xs text-gray-400 mt-0.5">{dates}</p>
            )}
          </div>
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-amber-400"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="!bg-blue-300"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="!bg-blue-300"
      />
    </>
  );
}
