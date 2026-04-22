import type { Person, Relationship } from "@/types";

const NODE_WIDTH = 160;
const MIN_H_GAP = 30;
const MIN_V_GAP = 180;   // minimum pixels between generations
const CANVAS_TOP = 80;
const TARGET_WIDTH = 1600; // target pixel span for the widest generation

export function computeLayout(
  people: Person[],
  relationships: Relationship[]
): Record<string, { x: number; y: number }> {
  if (people.length === 0) return {};

  // ── adjacency ────────────────────────────────────────────────────────
  const childrenOf: Record<string, string[]> = {};
  const parentsOf: Record<string, string[]> = {};
  const spousesOf: Record<string, string[]> = {};

  for (const p of people) {
    childrenOf[p.id] = [];
    parentsOf[p.id] = [];
    spousesOf[p.id] = [];
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

  // ── generation levels (BFS from roots) ───────────────────────────────
  const gen: Record<string, number> = {};
  const roots = people.filter((p) => parentsOf[p.id].length === 0).map((p) => p.id);
  const queue: Array<{ id: string; level: number }> = roots.map((id) => ({ id, level: 0 }));

  while (queue.length > 0) {
    const { id, level } = queue.shift()!;
    if (gen[id] !== undefined) continue;
    gen[id] = level;
    for (const childId of childrenOf[id]) queue.push({ id: childId, level: level + 1 });
  }

  // Spouses inherit their partner's level (for unassigned spouses)
  let changed = true;
  while (changed) {
    changed = false;
    for (const p of people) {
      if (gen[p.id] !== undefined) {
        for (const spouseId of spousesOf[p.id]) {
          if (gen[spouseId] === undefined) {
            gen[spouseId] = gen[p.id];
            changed = true;
          }
        }
      }
    }
  }
  for (const p of people) {
    if (gen[p.id] === undefined) gen[p.id] = 0;
  }

  // Reconcile spouse levels: if both are assigned but at different levels
  // (e.g. one spouse is a root with no parents listed), take the deeper level.
  changed = true;
  while (changed) {
    changed = false;
    for (const p of people) {
      for (const spouseId of spousesOf[p.id]) {
        const maxLvl = Math.max(gen[p.id], gen[spouseId]);
        if (gen[p.id] !== maxLvl) { gen[p.id] = maxLvl; changed = true; }
        if (gen[spouseId] !== maxLvl) { gen[spouseId] = maxLvl; changed = true; }
      }
    }
  }

  const maxLevel = Math.max(...Object.values(gen));

  // ── y-axis: one row per generation, spaced by birth year ─────────────
  // Collect median birth year per level
  const levelYears: Record<number, number[]> = {};
  for (const p of people) {
    if (!p.dob) continue;
    const [y] = p.dob.split("-").map(Number);
    const lv = gen[p.id];
    if (lv === undefined) continue;
    if (!levelYears[lv]) levelYears[lv] = [];
    levelYears[lv].push(y);
  }

  const levelMedian: Record<number, number> = {};
  for (const [lv, years] of Object.entries(levelYears)) {
    const sorted = [...years].sort((a, b) => a - b);
    levelMedian[Number(lv)] = sorted[Math.floor(sorted.length / 2)];
  }

  // Build y per level: scale birth years to pixel rows
  const rawLevelY: Record<number, number> = {};

  const knownLevels = Object.keys(levelMedian).map(Number).sort((a, b) => a - b);
  if (knownLevels.length >= 2) {
    const minYear = Math.min(...Object.values(levelMedian));
    const maxYear = Math.max(...Object.values(levelMedian));
    const yearSpan = maxYear - minYear || 1;
    const totalH = Math.max(maxLevel * MIN_V_GAP, (yearSpan / 25) * MIN_V_GAP);

    for (const lv of knownLevels) {
      rawLevelY[lv] = CANVAS_TOP + ((levelMedian[lv] - minYear) / yearSpan) * totalH;
    }
  }

  // Enforce strict top-down order: each level must be at least MIN_V_GAP
  // below the previous regardless of birth year data.
  const levelY: Record<number, number> = {};
  for (let lv = 0; lv <= maxLevel; lv++) {
    const fromBirthYear = rawLevelY[lv];
    const minAllowed = lv === 0 ? CANVAS_TOP : levelY[lv - 1] + MIN_V_GAP;
    if (fromBirthYear === undefined) {
      levelY[lv] = minAllowed;
    } else {
      levelY[lv] = Math.max(fromBirthYear, minAllowed);
    }

    if (lv > 0 && levelY[lv] < levelY[lv - 1] + MIN_V_GAP) {
      levelY[lv] = levelY[lv - 1] + MIN_V_GAP;
    }
  }

  // ── couple slots ──────────────────────────────────────────────────────
  interface Slot { members: string[]; level: number; children: string[] }

  const slots: Slot[] = [];
  const slotOf: Record<string, number> = {};

  const bfsOrdered: string[] = [];
  const bfsVisited = new Set<string>();
  const bfsQ = [...roots];
  while (bfsQ.length > 0) {
    const id = bfsQ.shift()!;
    if (bfsVisited.has(id)) continue;
    bfsVisited.add(id);
    bfsOrdered.push(id);
    for (const childId of childrenOf[id]) bfsQ.push(childId);
  }
  for (const p of people) {
    if (!bfsVisited.has(p.id)) bfsOrdered.push(p.id);
  }

  for (const personId of bfsOrdered) {
    if (slotOf[personId] !== undefined) continue;
    const members = [personId];
    for (const spouseId of spousesOf[personId]) {
      if (gen[spouseId] === gen[personId] && slotOf[spouseId] === undefined) {
        members.push(spouseId);
      }
    }
    const childSet = new Set<string>();
    for (const m of members) {
      for (const childId of childrenOf[m]) childSet.add(childId);
    }
    const idx = slots.length;
    slots.push({ members, level: gen[personId], children: Array.from(childSet) });
    for (const m of members) slotOf[m] = idx;
  }

  // ── UNIT width: calibrated to widest generation ───────────────────────
  const genPersonCount: Record<number, number> = {};
  for (const p of people) {
    const lv = gen[p.id] ?? 0;
    genPersonCount[lv] = (genPersonCount[lv] ?? 0) + 1;
  }
  const widestGenCount = Math.max(...Object.values(genPersonCount), 1);
  const UNIT = Math.max(
    NODE_WIDTH + MIN_H_GAP,
    Math.min(280, Math.floor(TARGET_WIDTH / widestGenCount))
  );

  // ── subtree widths (bottom-up) ────────────────────────────────────────
  const widthCache: Record<number, number> = {};

  function slotWidth(idx: number): number {
    if (widthCache[idx] !== undefined) return widthCache[idx];
    const slot = slots[idx];
    const ownWidth = slot.members.length * UNIT;
    const childSlotsSeen = new Set<number>();
    for (const childId of slot.children) {
      if (slotOf[childId] !== undefined) childSlotsSeen.add(slotOf[childId]);
    }
    const childrenWidth = Array.from(childSlotsSeen).reduce(
      (sum, ci) => sum + slotWidth(ci), 0
    );
    widthCache[idx] = Math.max(ownWidth, childrenWidth);
    return widthCache[idx];
  }

  // ── top-down position assignment ──────────────────────────────────────
  const positions: Record<string, { x: number; y: number }> = {};

  function assignSlot(idx: number, startX: number) {
    const slot = slots[idx];
    const width = slotWidth(idx);
    const centerX = startX + width / 2;
    const y = levelY[slot.level] ?? slot.level * MIN_V_GAP + CANVAS_TOP;

    const coupleW = slot.members.length * UNIT;
    const coupleStart = centerX - coupleW / 2;
    slot.members.forEach((memberId, i) => {
      positions[memberId] = {
        x: Math.round(coupleStart + i * UNIT + (UNIT - NODE_WIDTH) / 2),
        y,
      };
    });

    const childSlotsSeen: number[] = [];
    const seen = new Set<number>();
    for (const childId of slot.children) {
      const ci = slotOf[childId];
      if (ci !== undefined && !seen.has(ci)) {
        seen.add(ci);
        childSlotsSeen.push(ci);
      }
    }
    let cx = startX;
    for (const ci of childSlotsSeen) {
      assignSlot(ci, cx);
      cx += slotWidth(ci);
    }
  }

  let x = 0;
  for (const [idx, slot] of slots.entries()) {
    if (slot.level === 0) {
      assignSlot(idx, x);
      x += slotWidth(idx);
    }
  }

  return positions;
}
