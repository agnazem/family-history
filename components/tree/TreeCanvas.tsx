"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
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

// ── constants ────────────────────────────────────────────────────────────────
const NODE_WIDTH = 160;
const NODE_HEIGHT_APPROX = 110;
const JUNCTION_SIZE = 20;
const JUNCTION_Y_OFFSET = NODE_HEIGHT_APPROX / 2 - JUNCTION_SIZE / 2; // ~45

// ── CoupleJunctionNode ───────────────────────────────────────────────────────
function CoupleJunctionNode() {
  return (
    <>
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="!w-2 !h-2 !bg-purple-400 !border-purple-300"
      />
      <div className="w-5 h-5 bg-white border-2 border-purple-400 rounded-full flex items-center justify-center shadow-sm pointer-events-none select-none">
        <span className="text-purple-500 text-[8px] leading-none">♥</span>
      </div>
    </>
  );
}

const nodeTypes = { person: PersonNode, coupleJunction: CoupleJunctionNode };

// ── edge styles ──────────────────────────────────────────────────────────────
const EDGE_STYLES: Record<string, { stroke: string; strokeWidth: number; strokeDasharray?: string }> = {
  parent_child: { stroke: "#2563eb", strokeWidth: 2 },
  spouse:       { stroke: "#7c3aed", strokeWidth: 1.5, strokeDasharray: "5,3" },
  sibling:      { stroke: "#0891b2", strokeWidth: 1.5, strokeDasharray: "2,5" },
};

// ── graph helpers ────────────────────────────────────────────────────────────

type CoupleInfo = {
  a: string;
  b: string;
  relId: string;
  sharedChildren: string[];
};

function getCouples(relationships: Relationship[]): CoupleInfo[] {
  const childrenOf: Record<string, string[]> = {};
  const parentsOf: Record<string, string[]> = {};

  for (const rel of relationships) {
    if (rel.type === "parent_child") {
      if (!childrenOf[rel.person_a_id]) childrenOf[rel.person_a_id] = [];
      if (!parentsOf[rel.person_b_id]) parentsOf[rel.person_b_id] = [];
      childrenOf[rel.person_a_id].push(rel.person_b_id);
      parentsOf[rel.person_b_id].push(rel.person_a_id);
    }
  }

  return relationships
    .filter((r) => r.type === "spouse")
    .map((r) => {
      const shared = (childrenOf[r.person_a_id] ?? []).filter((cid) =>
        (parentsOf[cid] ?? []).includes(r.person_b_id)
      );
      return shared.length > 0
        ? { a: r.person_a_id, b: r.person_b_id, relId: r.id, sharedChildren: shared }
        : null;
    })
    .filter(Boolean) as CoupleInfo[];
}

function buildPersonNodes(
  people: Person[],
  onNodeClick: (id: string) => void,
  memoryTypes: Record<string, MemoryType[]>
): Node[] {
  return people.map((p) => ({
    id: p.id,
    type: "person",
    position: { x: p.canvas_x, y: p.canvas_y },
    data: {
      ...p,
      onClick: onNodeClick,
      memoryTypes: memoryTypes[p.id] ?? [],
    } as unknown as Record<string, unknown>,
  }));
}

function computeJunctionNodes(couples: CoupleInfo[], personNodes: Node[]): Node[] {
  const posMap = new Map(personNodes.map((n) => [n.id, n.position]));

  return couples
    .map(({ a, b, relId }) => {
      const posA = posMap.get(a);
      const posB = posMap.get(b);
      if (!posA || !posB) return null;

      const junctionX =
        (posA.x + NODE_WIDTH / 2 + posB.x + NODE_WIDTH / 2) / 2 - JUNCTION_SIZE / 2;
      const junctionY = posA.y + JUNCTION_Y_OFFSET;

      return {
        id: `couple-${relId}`,
        type: "coupleJunction",
        position: { x: junctionX, y: junctionY },
        data: {},
        draggable: false,
        selectable: false,
        focusable: false,
      } as Node;
    })
    .filter(Boolean) as Node[];
}

function buildAllEdges(relationships: Relationship[], couples: CoupleInfo[]): Edge[] {
  // Parent→child rels for shared children are replaced by junction→child edges
  const handledRelIds = new Set<string>();
  for (const { a, b, sharedChildren } of couples) {
    for (const rel of relationships) {
      if (
        rel.type === "parent_child" &&
        sharedChildren.includes(rel.person_b_id) &&
        (rel.person_a_id === a || rel.person_a_id === b)
      ) {
        handledRelIds.add(rel.id);
      }
    }
  }

  const edges: Edge[] = [];

  for (const rel of relationships) {
    if (rel.type === "spouse") {
      edges.push({
        id: rel.id,
        source: rel.person_a_id,
        target: rel.person_b_id,
        sourceHandle: "right",
        targetHandle: "left",
        type: "smoothstep",
        style: EDGE_STYLES.spouse,
        label: "♥",
      });
    } else if (rel.type === "sibling") {
      edges.push({
        id: rel.id,
        source: rel.person_a_id,
        target: rel.person_b_id,
        type: "smoothstep",
        style: EDGE_STYLES.sibling,
      });
    } else if (rel.type === "parent_child" && !handledRelIds.has(rel.id)) {
      edges.push({
        id: rel.id,
        source: rel.person_a_id,
        target: rel.person_b_id,
        type: "smoothstep",
        style: EDGE_STYLES.parent_child,
        markerEnd: { type: MarkerType.ArrowClosed, color: "#2563eb" },
      });
    }
  }

  // One edge per shared child, all originating from the couple junction
  for (const { relId, sharedChildren } of couples) {
    const junctionId = `couple-${relId}`;
    for (const childId of sharedChildren) {
      edges.push({
        id: `${junctionId}-${childId}`,
        source: junctionId,
        sourceHandle: "bottom",
        target: childId,
        type: "smoothstep",
        style: EDGE_STYLES.parent_child,
        markerEnd: { type: MarkerType.ArrowClosed, color: "#2563eb" },
      });
    }
  }

  return edges;
}

function buildAllNodes(
  people: Person[],
  couples: CoupleInfo[],
  onNodeClick: (id: string) => void,
  memoryTypes: Record<string, MemoryType[]>
): Node[] {
  const personNodes = buildPersonNodes(people, onNodeClick, memoryTypes);
  const junctionNodes = computeJunctionNodes(couples, personNodes);
  return [...personNodes, ...junctionNodes];
}

// ── TreeCanvas ───────────────────────────────────────────────────────────────

interface TreeCanvasProps {
  people: Person[];
  relationships: Relationship[];
  onNodeClick: (personId: string) => void;
  memoryTypes?: Record<string, MemoryType[]>;
}

export function TreeCanvas({
  people,
  relationships,
  onNodeClick,
  memoryTypes = {},
}: TreeCanvasProps) {
  const supabase = createClient();
  const [selectedRelationship, setSelectedRelationship] = useState<Relationship | null>(null);

  const couples = useMemo(() => getCouples(relationships), [relationships]);

  // All nodes (person + junction) in a single state so React Flow can measure
  // all of them and route edges correctly.
  const [nodes, setNodes, onNodesChange] = useNodesState(
    buildAllNodes(people, couples, onNodeClick, memoryTypes)
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    buildAllEdges(relationships, couples)
  );

  // Keep a ref so handleNodesChange can read current positions without a stale closure
  const nodesRef = useRef(nodes);
  nodesRef.current = nodes;

  // Sync all nodes when people/relationships change (e.g. after add/edit/auto-layout)
  useMemo(() => {
    setNodes(buildAllNodes(people, couples, onNodeClick, memoryTypes));
  }, [people, onNodeClick, memoryTypes, couples, setNodes]);

  useMemo(() => {
    setEdges(buildAllEdges(relationships, couples));
  }, [relationships, couples, setEdges]);

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
      // Check for person-node position changes so we can update junction positions
      // in the same batch (junctions must follow their parents during drag)
      const personPositionChanges = changes.filter(
        (c) => c.type === "position" && "id" in c && !String(c.id).startsWith("couple-")
      );

      if (personPositionChanges.length > 0) {
        // Build a temporary updated position map
        const currentNodes = nodesRef.current;
        const posMap = new Map(currentNodes.map((n) => [n.id, n.position]));
        for (const c of personPositionChanges) {
          if (c.type === "position" && c.position) posMap.set(c.id, c.position);
        }

        // Recompute junction positions from updated person positions
        const personNodes = currentNodes.filter((n) => !n.id.startsWith("couple-"));
        const updatedPersonNodes = personNodes.map((n) => ({
          ...n,
          position: posMap.get(n.id) ?? n.position,
        }));
        const newJunctions = computeJunctionNodes(couples, updatedPersonNodes);

        // Inject junction position changes into the same batch
        const junctionChanges: NodeChange[] = newJunctions.map((j) => ({
          type: "position" as const,
          id: j.id,
          position: j.position,
          dragging: false,
        }));

        onNodesChange([...changes, ...junctionChanges]);
      } else {
        onNodesChange(changes);
      }

      // Persist person node positions to DB after drag ends
      for (const change of changes) {
        if (
          change.type === "position" &&
          "id" in change &&
          !String(change.id).startsWith("couple-") &&
          change.position &&
          !change.dragging
        ) {
          savePosition(change.id, change.position.x, change.position.y);
        }
      }
    },
    [onNodesChange, couples, savePosition]
  );

  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => { onEdgesChange(changes); },
    [onEdgesChange]
  );

  const handleEdgeClick = useCallback(
    (_: React.MouseEvent, edge: Edge) => {
      if (edge.id.startsWith("couple-")) return;
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
