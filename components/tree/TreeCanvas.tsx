"use client";

import { useCallback, useMemo, useEffect, useState } from "react";
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
import { GenerationHeaderNode } from "./GenerationHeaderNode";
import { RelationshipModal } from "./RelationshipModal";
import { computeLayout, NODE_WIDTH } from "@/lib/layout";
import type { Person, Relationship, GenColumn } from "@/types";
import { createClient } from "@/lib/supabase/client";
import { debounce } from "@/lib/utils";

const nodeTypes = {
  person: PersonNode,
  generationHeader: GenerationHeaderNode,
};

const EDGE_STYLES = {
  parent_child: { stroke: "#E0D2BB", strokeWidth: 1 },
  spouse: { stroke: "#C2874F", strokeWidth: 1, strokeDasharray: "4 3" },
};

const HEADER_Y_OFFSET = 44; // px above the topmost node in a column

// ── edge builder ─────────────────────────────────────────────────────────────
function buildEdges(relationships: Relationship[]): Edge[] {
  const edges: Edge[] = [];
  for (const rel of relationships) {
    if (rel.type === "spouse") {
      edges.push({
        id: rel.id,
        source: rel.person_a_id,
        target: rel.person_b_id,
        type: "straight",
        style: EDGE_STYLES.spouse,
      });
    } else if (rel.type === "parent_child") {
      edges.push({
        id: rel.id,
        source: rel.person_a_id,
        target: rel.person_b_id,
        sourceHandle: "right",
        targetHandle: "left",
        type: "default",
        style: EDGE_STYLES.parent_child,
        markerEnd: { type: MarkerType.ArrowClosed, color: "#E0D2BB" },
      });
    }
  }
  return edges;
}

// ── component ─────────────────────────────────────────────────────────────────
interface TreeCanvasProps {
  people: Person[];
  relationships: Relationship[];
  onNodeClick: (personId: string) => void;
  memoryCounts?: Record<string, number>;
  selectMode?: boolean;
  selectedPersonId?: string | null;
  rootPersonId?: string | null;
  onGenColumns?: (cols: GenColumn[]) => void;
}

export function TreeCanvas({
  people,
  relationships,
  onNodeClick,
  memoryCounts = {},
  selectMode = false,
  selectedPersonId,
  rootPersonId,
  onGenColumns,
}: TreeCanvasProps) {
  const supabase = createClient();
  const [selectedRelationship, setSelectedRelationship] = useState<Relationship | null>(null);

  // Compute layout from relationship graph
  const { positions, genColumns } = useMemo(
    () => computeLayout(people, relationships, rootPersonId),
    [people, relationships, rootPersonId]
  );

  // Notify parent of genColumns for header display
  useEffect(() => {
    onGenColumns?.(genColumns);
  }, [genColumns, onGenColumns]);

  // Build person nodes
  const personNodes: Node[] = useMemo(() =>
    people.map((p) => ({
      id: p.id,
      type: "person",
      position: { x: positions[p.id]?.x ?? p.canvas_x, y: positions[p.id]?.y ?? p.canvas_y },
      data: {
        ...p,
        onClick: onNodeClick,
        memoryCount: memoryCounts[p.id] ?? 0,
        isFocused: p.id === selectedPersonId,
      } as unknown as Record<string, unknown>,
    })),
    [people, positions, onNodeClick, memoryCounts, selectedPersonId]
  );

  // Build generation header nodes
  const headerNodes: Node[] = useMemo(() => {
    // Find the minimum Y for each normGen column
    const minYByNormGen: Record<number, number> = {};
    for (const p of people) {
      const ng = positions[p.id]?.normGen;
      if (ng === undefined) continue;
      const y = positions[p.id]?.y ?? 0;
      if (minYByNormGen[ng] === undefined || y < minYByNormGen[ng]) {
        minYByNormGen[ng] = y;
      }
    }

    return genColumns.map((col) => ({
      id: `gen-header-${col.normGen}`,
      type: "generationHeader",
      position: {
        x: col.x,
        y: (minYByNormGen[col.normGen] ?? HEADER_Y_OFFSET + 20) - HEADER_Y_OFFSET,
      },
      data: { label: col.label, decade: col.decade },
      draggable: false,
      selectable: false,
      focusable: false,
    }));
  }, [genColumns, people, positions]);

  const allNodes = useMemo(() => [...personNodes, ...headerNodes], [personNodes, headerNodes]);
  const allEdges = useMemo(() => buildEdges(relationships), [relationships]);

  const [nodes, setNodes, onNodesChange] = useNodesState(allNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(allEdges);

  // Sync when data changes
  useMemo(() => setNodes(allNodes), [allNodes, setNodes]);
  useMemo(() => setEdges(allEdges), [allEdges, setEdges]);

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
          !change.dragging &&
          !change.id.startsWith("gen-header-")
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
        fitViewOptions={{ padding: 0.15 }}
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
          pannable
          nodeColor={(n) => {
            if (n.type === "generationHeader") return "transparent";
            const d = n.data as unknown as PersonNodeData;
            return d.dod ? "#8A7E69" : "#C2874F";
          }}
          maskColor="rgba(31,26,20,0.04)"
        />
      </ReactFlow>
    </div>
  );
}
