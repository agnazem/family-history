"use client";

import { useCallback, useMemo, useRef } from "react";
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
import type { Person, Relationship } from "@/types";
import { createClient } from "@/lib/supabase/client";
import { debounce } from "@/lib/utils";
import { useState } from "react";

const nodeTypes = { person: PersonNode };

const EDGE_STYLES: Record<string, { stroke: string; strokeWidth: number; strokeDasharray?: string }> = {
  parent_child: { stroke: "#E0D2BB", strokeWidth: 1 },
  spouse:       { stroke: "#C2874F", strokeWidth: 1, strokeDasharray: "4 3" },
};

function buildNodes(
  people: Person[],
  onNodeClick: (id: string) => void,
  memoryCounts: Record<string, number>
): Node[] {
  return people.map((p) => ({
    id: p.id,
    type: "person",
    position: { x: p.canvas_x, y: p.canvas_y },
    data: {
      ...p,
      onClick: onNodeClick,
      memoryCount: memoryCounts[p.id] ?? 0,
    } as unknown as Record<string, unknown>,
  }));
}

function buildEdges(
  relationships: Relationship[],
  positions: Map<string, { x: number; y: number }>
): Edge[] {
  const edges: Edge[] = [];
  for (const rel of relationships) {
    if (rel.type === "spouse") {
      const posA = positions.get(rel.person_a_id);
      const posB = positions.get(rel.person_b_id);
      const aIsLeft = !posA || !posB || posA.x <= posB.x;
      edges.push({
        id: rel.id,
        source: rel.person_a_id,
        target: rel.person_b_id,
        sourceHandle: aIsLeft ? "right" : "left-out",
        targetHandle: aIsLeft ? "left" : "right-in",
        type: "smoothstep",
        style: EDGE_STYLES.spouse,
      });
    } else if (rel.type === "parent_child") {
      edges.push({
        id: rel.id,
        source: rel.person_a_id,
        target: rel.person_b_id,
        type: "smoothstep",
        style: EDGE_STYLES.parent_child,
        markerEnd: { type: MarkerType.ArrowClosed, color: "#E0D2BB" },
      });
    }
  }
  return edges;
}

interface TreeCanvasProps {
  people: Person[];
  relationships: Relationship[];
  onNodeClick: (personId: string) => void;
  memoryCounts?: Record<string, number>;
  selectMode?: boolean;
}

export function TreeCanvas({
  people,
  relationships,
  onNodeClick,
  memoryCounts = {},
  selectMode = false,
}: TreeCanvasProps) {
  const supabase = createClient();
  const [selectedRelationship, setSelectedRelationship] = useState<Relationship | null>(null);

  const positions = useMemo(
    () => new Map(people.map((p) => [p.id, { x: p.canvas_x, y: p.canvas_y }])),
    [people]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(
    buildNodes(people, onNodeClick, memoryCounts)
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    buildEdges(relationships, positions)
  );

  const nodesRef = useRef(nodes);
  nodesRef.current = nodes;

  useMemo(() => {
    setNodes(buildNodes(people, onNodeClick, memoryCounts));
  }, [people, onNodeClick, memoryCounts, setNodes]);

  useMemo(() => {
    setEdges(buildEdges(relationships, positions));
  }, [relationships, positions, setEdges]);

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
        if (
          change.type === "position" &&
          change.position &&
          !change.dragging
        ) {
          savePosition(change.id, change.position.x, change.position.y);
        }
      }
    },
    [onNodesChange, savePosition]
  );

  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => { onEdgesChange(changes); },
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
        selectionOnDrag={selectMode}
        panOnDrag={selectMode ? [1, 2] : true}
        multiSelectionKeyCode="Shift"
      >
        <Background color="#E0D2BB" gap={24} size={1} />
        <Controls />
        <MiniMap
          nodeColor={(n) => {
            const d = n.data as unknown as PersonNodeData;
            return d.dod ? "#8A7E69" : "#C2874F";
          }}
          maskColor="rgba(31,26,20,0.04)"
        />
      </ReactFlow>
    </div>
  );
}
