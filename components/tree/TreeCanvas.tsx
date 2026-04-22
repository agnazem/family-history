"use client";

import { useCallback, useMemo, useState } from "react";
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
import { RelationshipModal } from "./RelationshipModal";
import type { Person, Relationship, MemoryType } from "@/types";
import { createClient } from "@/lib/supabase/client";
import { debounce } from "@/lib/utils";

const nodeTypes = { person: PersonNode };

interface TreeCanvasProps {
  people: Person[];
  relationships: Relationship[];
  onNodeClick: (personId: string) => void;
  memoryTypes?: Record<string, MemoryType[]>;
}

function buildNodes(
  people: Person[],
  onNodeClick: (id: string) => void,
  memoryTypes: Record<string, MemoryType[]> = {}
): Node[] {
  return people.map((p) => ({
    id: p.id,
    type: "person",
    position: { x: p.canvas_x, y: p.canvas_y },
    data: { ...p, onClick: onNodeClick, memoryTypes: memoryTypes[p.id] ?? [] } as unknown as Record<string, unknown>,
  }));
}

const EDGE_STYLES: Record<string, { stroke: string; strokeWidth: number; strokeDasharray?: string }> = {
  parent_child: { stroke: "#2563eb", strokeWidth: 2 },
  spouse:       { stroke: "#7c3aed", strokeWidth: 1.5, strokeDasharray: "5,3" },
  sibling:      { stroke: "#0891b2", strokeWidth: 1.5, strokeDasharray: "2,5" },
};

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
      style: EDGE_STYLES[r.type] ?? EDGE_STYLES.parent_child,
      markerEnd:
        r.type === "parent_child"
          ? { type: MarkerType.ArrowClosed, color: "#2563eb" }
          : undefined,
      label:
        r.type === "spouse" ? "♥" : undefined,
    };
  });
}

export function TreeCanvas({ people, relationships, onNodeClick, memoryTypes = {} }: TreeCanvasProps) {
  const supabase = createClient();
  const [selectedRelationship, setSelectedRelationship] = useState<Relationship | null>(null);

  const initialNodes = useMemo(
    () => buildNodes(people, onNodeClick, memoryTypes),
    [people, onNodeClick, memoryTypes]
  );
  const initialEdges = useMemo(() => buildEdges(relationships), [relationships]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Keep nodes and edges in sync when props change
  useMemo(() => {
    setNodes(buildNodes(people, onNodeClick, memoryTypes));
  }, [people, onNodeClick, memoryTypes, setNodes]);

  useMemo(() => {
    setEdges(buildEdges(relationships));
  }, [relationships, setEdges]);

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

  const handleEdgeClick = useCallback(
    (_: React.MouseEvent, edge: Edge) => {
      const rel = relationships.find((r) => r.id === edge.id) ?? null;
      setSelectedRelationship(rel);
    },
    [relationships]
  );

  return (
    <div className="w-full h-full">
      <RelationshipModal
        relationship={selectedRelationship}
        people={people}
        onClose={() => setSelectedRelationship(null)}
        onChanged={() => setSelectedRelationship(null)}
      />
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onEdgeClick={handleEdgeClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={2}
        deleteKeyCode={null}
      >
        <Background color="#bfdbfe" gap={24} size={1} />
        <Controls />
        <MiniMap
          nodeColor={(n) => {
            const d = n.data as unknown as PersonNodeData;
            return d.dod ? "#d1d5db" : "#bfdbfe";
          }}
          maskColor="rgba(0,0,0,0.05)"
        />
      </ReactFlow>
    </div>
  );
}
