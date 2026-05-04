"use client";

import type { NodeProps } from "@xyflow/react";

export type GenerationHeaderData = {
  label: string;
  decade: string | null;
};

export function GenerationHeaderNode({ data }: NodeProps) {
  const { label, decade } = data as unknown as GenerationHeaderData;
  return (
    <div className="pointer-events-none select-none" style={{ width: 152 }}>
      <div className="text-center">
        <span className="font-mono text-[10px] tracking-[0.1em] uppercase text-[--ink-mute]">
          {label}
        </span>
        {decade && (
          <span className="font-mono text-[10px] text-[--ink-mute] opacity-60 ml-1">
            · {decade}
          </span>
        )}
      </div>
      <div className="mt-1 h-px bg-[--rule] opacity-50" />
    </div>
  );
}
