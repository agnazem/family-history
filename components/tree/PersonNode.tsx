"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Mic, Image as ImageIcon, FileText, PenLine } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import type { Person, MemoryType } from "@/types";

export type PersonNodeData = Person & { onClick: (id: string) => void; memoryTypes?: MemoryType[] };

const MEMORY_ICONS: Record<MemoryType, { Icon: React.ElementType; className: string }> = {
  audio:    { Icon: Mic,       className: "text-purple-500" },
  photo:    { Icon: ImageIcon, className: "text-blue-500" },
  document: { Icon: FileText,  className: "text-green-600" },
  note:     { Icon: PenLine,   className: "text-slate-500" },
};

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

  const memoryTypes = person.memoryTypes ?? [];

  return (
    <>
      <Handle type="target" position={Position.Top} className="!bg-blue-400" />
      <div
        onClick={() => person.onClick(person.id)}
        className={`w-40 bg-white rounded-xl shadow-md border-2 p-3 cursor-pointer hover:shadow-lg hover:border-blue-400 transition-all select-none ${
          isDeceased ? "border-gray-300" : "border-blue-200"
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
          {memoryTypes.length > 0 && (
            <div className="flex items-center gap-1.5 pt-0.5 border-t border-gray-100 w-full justify-center">
              {memoryTypes.map((type) => {
                const { Icon, className } = MEMORY_ICONS[type];
                return <Icon key={type} className={`w-3 h-3 ${className}`} />;
              })}
            </div>
          )}
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-blue-400"
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
