"use client";

import { useCallback, useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type NodeChange,
  type EdgeChange,
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { PersonNode, type PersonNodeData } from "./PersonNode";
import type { Person, Relationship } from "@/types";
import { createClient } from "@/lib/supabase/client";
import { debounce } from "@/lib/utils";

const nodeTypes = { person: PersonNode };

interface TreeCanvasProps {
  people: Person[];
  relationships: Relationship[];
  onNodeClick: (personId: string) => void;
}

function buildNodes(people: Person[], onNodeClick: (id: string) => void): Node[] {
  return people.map((p) => ({
    id: p.id,
    type: "person",
    position: { x: p.canvas_x, y: p.canvas_y },
    data: { ...p, onClick: onNodeClick } as unknown as Record<string, unknown>,
  }));
}

function buildEdges(relationships: Relationship[]): Edge[] {
  return relationships.map((r) => {
    const isSpouse = r.type === "spouse";
    return {
      id: r.id,
      source: r.person_a_id,
      target: r.person_b_id,
      sourceHandle: isSpouse ? "right" : undefined,
      targetHandle: isSpouse ? "left" : undefined,
      type: "smoothstep",
      style: {
        stroke: isSpouse ? "#93c5fd" : "#d97706",
        strokeWidth: isSpouse ? 1.5 : 2,
        strokeDasharray: isSpouse ? "5,3" : undefined,
      },
      markerEnd:
        r.type === "parent_child"
          ? { type: MarkerType.ArrowClosed, color: "#d97706" }
          : undefined,
      label:
        r.type === "sibling"
          ? "sibling"
          : r.type === "spouse"
          ? "♥"
          : undefined,
    };
  });
}

export function TreeCanvas({ people, relationships, onNodeClick }: TreeCanvasProps) {
  const supabase = createClient();

  const initialNodes = useMemo(
    () => buildNodes(people, onNodeClick),
    [people, onNodeClick]
  );
  const initialEdges = useMemo(() => buildEdges(relationships), [relationships]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  // Keep nodes in sync when people prop changes (real-time)
  useMemo(() => {
    setNodes(buildNodes(people, onNodeClick));
  }, [people, onNodeClick, setNodes]);

  const savePosition = useCallback(
    debounce(async (id: string, x: number, y: number) => {
      await supabase
        .from("people")
        .update({ canvas_x: Math.round(x), canvas_y: Math.round(y) })
        .eq("id", id);
    }, 600),
    []
  );

  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      onNodesChange(changes);
      for (const change of changes) {
        if (change.type === "position" && change.position && !change.dragging) {
          savePosition(change.id, change.position.x, change.position.y);
        }
      }
    },
    [onNodesChange, savePosition]
  );

  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      onEdgesChange(changes);
    },
    [onEdgesChange]
  );

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={2}
        deleteKeyCode={null}
      >
        <Background color="#fde68a" gap={24} size={1} />
        <Controls />
        <MiniMap
          nodeColor={(n) => {
            const d = n.data as unknown as PersonNodeData;
            return d.dod ? "#d1d5db" : "#fde68a";
          }}
          maskColor="rgba(0,0,0,0.05)"
        />
      </ReactFlow>
    </div>
  );
}
