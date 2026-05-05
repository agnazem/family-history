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
import { computeLineage, type LineageNode } from "@/lib/tree/lineage";
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
  lineageModeEnabled?: boolean;
  subjectPersonId?: string | null;
  onClearSubject?: () => void;
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
  lineageModeEnabled = false,
  subjectPersonId,
  onClearSubject,
}: TreeCanvasProps) {
  const supabase = createClient();
  const [selectedRelationship, setSelectedRelationship] = useState<Relationship | null>(null);

  // Compute lineage set when lineage mode is active
  const directSet = useMemo<Set<string>>(() => {
    if (!lineageModeEnabled || !subjectPersonId) return new Set();
    const lineageNodes: LineageNode[] = people.map((p) => {
      const parents = relationships
        .filter((r) => r.type === "parent_child" && r.person_b_id === p.id)
        .map((r) => r.person_a_id);
      const spouseRel = relationships.find(
        (r) => r.type === "spouse" && (r.person_a_id === p.id || r.person_b_id === p.id)
      );
      const spouseOf = spouseRel
        ? (spouseRel.person_a_id === p.id ? spouseRel.person_b_id : spouseRel.person_a_id)
        : undefined;
      return { id: p.id, parents, spouseOf };
    });
    return computeLineage(subjectPersonId, lineageNodes);
  }, [lineageModeEnabled, subjectPersonId, people, relationships]);

  const subjectPerson = useMemo(
    () => subjectPersonId ? people.find((p) => p.id === subjectPersonId) : null,
    [subjectPersonId, people]
  );

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
    people.map((p) => {
      let tier: "subject" | "direct" | "collateral" | undefined;
      if (lineageModeEnabled && subjectPersonId) {
        if (p.id === subjectPersonId) tier = "subject";
        else if (directSet.has(p.id)) tier = "direct";
        else tier = "collateral";
      }
      return {
        id: p.id,
        type: "person",
        position: { x: positions[p.id]?.x ?? p.canvas_x, y: positions[p.id]?.y ?? p.canvas_y },
        data: {
          ...p,
          onClick: onNodeClick,
          memoryCount: memoryCounts[p.id] ?? 0,
          isFocused: p.id === selectedPersonId,
          tier,
          lineageModeEnabled,
        } as unknown as Record<string, unknown>,
      };
    }),
    [people, positions, onNodeClick, memoryCounts, selectedPersonId, lineageModeEnabled, subjectPersonId, directSet]
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
  const allEdges = useMemo(() => {
    const base = buildEdges(relationships);
    if (!lineageModeEnabled || directSet.size === 0) return base;
    return base.map((edge) => {
      const isSpine =
        edge.style?.strokeDasharray === undefined && // parent_child only
        directSet.has(edge.source) &&
        directSet.has(edge.target);
      if (isSpine) {
        return { ...edge, style: { ...edge.style, strokeWidth: 1.5, stroke: "#8A7E69" } };
      }
      return { ...edge, style: { ...edge.style, opacity: 0.2 } };
    });
  }, [relationships, lineageModeEnabled, directSet]);

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
    <div className="w-full h-full relative">
      {/* "Line of X" pill */}
      {lineageModeEnabled && subjectPerson && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 bg-[--surface] border border-[--rule] rounded-full px-4 py-1.5 shadow-sm">
          <span className="font-mono text-[10px] tracking-[0.1em] uppercase text-[--ink-mute]">Line of</span>
          <span className="font-display italic text-[15px] text-[--ink]">
            {subjectPerson.first_name} {subjectPerson.last_name}
          </span>
          {onClearSubject && (
            <button
              onClick={onClearSubject}
              className="font-mono text-[10px] tracking-[0.06em] text-[--accent] hover:text-[--ink] transition-colors ml-1"
            >
              ← back
            </button>
          )}
        </div>
      )}
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
