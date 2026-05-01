"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Mic, Image as ImageIcon, FileText, PenLine } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import type { Person, MemoryType } from "@/types";

export type PersonNodeData = Person & { onClick: (id: string) => void; memoryTypes?: MemoryType[]; memoryCount?: number };

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
  const memoryCount = person.memoryCount ?? 0;

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
          <div className="text-center w-full">
            <p className={`text-sm font-semibold leading-tight line-clamp-2 h-9 overflow-hidden ${isDeceased ? "text-gray-500" : "text-gray-900"}`}>
              {fullName}
            </p>
            <p className="text-xs text-gray-400 mt-0.5 h-4 truncate">
              {dates ?? ""}
            </p>
          </div>
          <div className="flex items-center gap-1.5 pt-0.5 border-t border-gray-100 w-full justify-center h-5">
            {memoryTypes.map((type) => {
              const { Icon, className } = MEMORY_ICONS[type];
              return <Icon key={type} className={`w-3 h-3 ${className}`} />;
            })}
            {memoryCount > 0 && (
              <span className="ml-0.5 text-[10px] font-medium text-gray-400 bg-gray-100 rounded-full px-1.5 py-0.5 leading-none">
                {memoryCount}
              </span>
            )}
          </div>
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-blue-400"
      />
      <Handle type="source" position={Position.Right} id="right" className="!bg-blue-300" />
      <Handle type="target" position={Position.Right} id="right-in" className="!bg-blue-300" />
      <Handle type="source" position={Position.Left} id="left-out" className="!bg-blue-300" />
      <Handle type="target" position={Position.Left} id="left" className="!bg-blue-300" />
    </>
  );
}
