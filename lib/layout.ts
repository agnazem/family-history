import type { Person, Relationship } from "@/types";

const NODE_WIDTH = 160;
const H_GAP = 40;
const V_GAP = 360;
const CANVAS_TOP = 80;
const FAMILY_GAP = 120;

export function computeLayout(
  people: Person[],
  relationships: Relationship[]
): Record<string, { x: number; y: number }> {
  if (people.length === 0) return {};

  const ids = people.map((p) => p.id);

  // ── adjacency ────────────────────────────────────────────────────────
  const childrenOf: Record<string, string[]> = {};
  const parentsOf: Record<string, string[]> = {};
  const spousesOf: Record<string, string[]> = {};
  for (const id of ids) {
    childrenOf[id] = [];
    parentsOf[id] = [];
    spousesOf[id] = [];
  }
  for (const rel of relationships) {
    if (rel.type === "parent_child") {
      childrenOf[rel.person_a_id].push(rel.person_b_id);
      parentsOf[rel.person_b_id].push(rel.person_a_id);
    } else if (rel.type === "spouse") {
      spousesOf[rel.person_a_id].push(rel.person_b_id);
      spousesOf[rel.person_b_id].push(rel.person_a_id);
    }
  }

  // ── generation levels: Kahn's topo sort, gen[child] = max(parents)+1 ─
  // Each child is only enqueued once all its parents are processed, so
  // gen[child] accumulates the maximum parent level before it is finalised.
  const inDeg: Record<string, number> = {};
  for (const id of ids) inDeg[id] = parentsOf[id].length;

  const gen: Record<string, number> = {};
  const visited = new Set<string>();
  const q: string[] = ids.filter((id) => inDeg[id] === 0);
  for (const id of q) gen[id] = 0;

  while (q.length > 0) {
    const id = q.shift()!;
    if (visited.has(id)) continue;
    visited.add(id);
    for (const child of childrenOf[id]) {
      const nl = (gen[id] ?? 0) + 1;
      if (gen[child] === undefined || gen[child] < nl) gen[child] = nl;
      inDeg[child]--;
      if (inDeg[child] <= 0 && !visited.has(child)) q.push(child);
    }
  }
  for (const id of ids) if (gen[id] === undefined) gen[id] = 0;

  // ── spouse level unification: both partners take max(their levels) ────
  let changed = true;
  while (changed) {
    changed = false;
    for (const id of ids) {
      for (const sp of spousesOf[id]) {
        const mx = Math.max(gen[id], gen[sp]);
        if (gen[id] !== mx) { gen[id] = mx; changed = true; }
        if (gen[sp] !== mx) { gen[sp] = mx; changed = true; }
      }
    }
  }

  // ── re-propagate after spouse unification ─────────────────────────────
  // Spouse unification can raise a parent's level; children must stay below.
  changed = true;
  while (changed) {
    changed = false;
    for (const id of ids) {
      for (const child of childrenOf[id]) {
        const required = gen[id] + 1;
        if (gen[child] < required) { gen[child] = required; changed = true; }
      }
    }
  }

  const maxLevel = Math.max(...Object.values(gen), 0);
  const UNIT = NODE_WIDTH + H_GAP;

  // ── Y positions: one pixel row per generation ─────────────────────────
  const levelY: Record<number, number> = {};
  for (let lv = 0; lv <= maxLevel; lv++) {
    levelY[lv] = CANVAS_TOP + lv * V_GAP;
  }

  // ── build couple slots in BFS order ───────────────────────────────────
  interface Slot { members: string[]; level: number; children: string[] }
  const slots: Slot[] = [];
  const slotOf: Record<string, number> = {};

  const bfsOrdered: string[] = [];
  const bfsVis = new Set<string>();
  const roots = ids.filter((id) => parentsOf[id].length === 0);
  const bfsQ = [...roots];
  while (bfsQ.length > 0) {
    const id = bfsQ.shift()!;
    if (bfsVis.has(id)) continue;
    bfsVis.add(id);
    bfsOrdered.push(id);
    for (const c of childrenOf[id]) bfsQ.push(c);
  }
  for (const id of ids) if (!bfsVis.has(id)) bfsOrdered.push(id);

  for (const pid of bfsOrdered) {
    if (slotOf[pid] !== undefined) continue;
    const members = [pid];
    for (const sp of spousesOf[pid]) {
      if (gen[sp] === gen[pid] && slotOf[sp] === undefined) members.push(sp);
    }
    const childSet = new Set<string>();
    for (const m of members) for (const c of childrenOf[m]) childSet.add(c);
    const idx = slots.length;
    slots.push({ members, level: gen[pid], children: [...childSet] });
    for (const m of members) slotOf[m] = idx;
  }

  // ── primary parent: each child slot owned by the first parent slot ────
  // When a child has two parents in different slots (e.g. from separate
  // families), the first parent slot encountered in BFS order "owns" the
  // child slot for subtree-width and position purposes.
  const primaryParentOf: Record<number, number> = {};
  for (const [idx, slot] of slots.entries()) {
    for (const child of slot.children) {
      const ci = slotOf[child];
      if (ci !== undefined && primaryParentOf[ci] === undefined) {
        primaryParentOf[ci] = idx;
      }
    }
  }

  // Root slots: not claimed by any parent slot
  const rootSlots = slots.map((_, i) => i).filter((i) => primaryParentOf[i] === undefined);

  // ── subtree widths (bottom-up, owned children only) ───────────────────
  const widthCache: Record<number, number> = {};
  function slotWidth(idx: number): number {
    if (widthCache[idx] !== undefined) return widthCache[idx];
    const slot = slots[idx];
    const ownW = slot.members.length * UNIT;
    const ownedChildSlots = [
      ...new Set(
        slot.children
          .map((c) => slotOf[c])
          .filter((ci): ci is number => ci !== undefined && primaryParentOf[ci] === idx)
      ),
    ];
    const childW = ownedChildSlots.reduce((s, ci) => s + slotWidth(ci), 0);
    widthCache[idx] = Math.max(ownW, childW);
    return widthCache[idx];
  }

  // ── top-down position assignment ──────────────────────────────────────
  const positions: Record<string, { x: number; y: number }> = {};

  function assignSlot(idx: number, startX: number) {
    const slot = slots[idx];
    const width = slotWidth(idx);
    const centerX = startX + width / 2;
    const y = levelY[slot.level] ?? slot.level * V_GAP + CANVAS_TOP;

    const coupleW = slot.members.length * UNIT;
    const coupleStart = centerX - coupleW / 2;
    slot.members.forEach((memberId, i) => {
      positions[memberId] = {
        x: Math.round(coupleStart + i * UNIT + (UNIT - NODE_WIDTH) / 2),
        y,
      };
    });

    const ownedChildren: number[] = [];
    const seenCi = new Set<number>();
    for (const child of slot.children) {
      const ci = slotOf[child];
      if (ci !== undefined && !seenCi.has(ci) && primaryParentOf[ci] === idx) {
        seenCi.add(ci);
        ownedChildren.push(ci);
      }
    }
    let cx = startX;
    for (const ci of ownedChildren) {
      assignSlot(ci, cx);
      cx += slotWidth(ci);
    }
  }

  let x = 0;
  for (const idx of rootSlots) {
    assignSlot(idx, x);
    x += slotWidth(idx) + FAMILY_GAP;
  }

  // Fallback: any unpositioned nodes (cycles or orphaned data)
  for (const id of ids) {
    if (positions[id] === undefined) {
      positions[id] = { x: Math.round(x), y: CANVAS_TOP };
      x += UNIT + FAMILY_GAP;
    }
  }

  return positions;
}
