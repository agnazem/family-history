import type { Person, Relationship, GenColumn } from "@/types";

// ── constants ─────────────────────────────────────────────────────────────────
const NODE_WIDTH = 152;
const GEN_SPACING = 280;   // horizontal distance between generation columns
const ROW_SLOT = 90;       // vertical space per person slot
const CANVAS_LEFT = 60;
const CANVAS_TOP = 120;    // top padding leaves room for generation headers

export interface LayoutPosition {
  x: number;
  y: number;
  normGen: number;
}

export interface LayoutResult {
  positions: Record<string, LayoutPosition>;
  genColumns: GenColumn[];
}

// ── generation label helper ───────────────────────────────────────────────────
function genLabel(relGen: number): string {
  if (relGen === 0) return "Root";
  if (relGen === -1) return "Parents";
  if (relGen === -2) return "Grandparents";
  if (relGen === -3) return "Great-grandparents";
  if (relGen < -3) return `${Math.abs(relGen) - 1}× Great-grandparents`;
  if (relGen === 1) return "Children";
  if (relGen === 2) return "Grandchildren";
  if (relGen === 3) return "Great-grandchildren";
  return `${relGen - 1}× Great-grandchildren`;
}

// ── main export ───────────────────────────────────────────────────────────────
export function computeLayout(
  people: Person[],
  relationships: Relationship[],
  rootPersonId?: string | null
): LayoutResult {
  if (people.length === 0) return { positions: {}, genColumns: [] };

  const ids = people.map((p) => p.id);
  const personById = new Map(people.map((p) => [p.id, p]));

  // ── adjacency ───────────────────────────────────────────────────────────────
  const childrenOf: Record<string, string[]> = {};
  const parentsOf: Record<string, string[]> = {};
  const spousesOf: Record<string, string[]> = {};
  for (const id of ids) {
    childrenOf[id] = [];
    parentsOf[id] = [];
    spousesOf[id] = [];
  }
  for (const rel of relationships) {
    const a = rel.person_a_id;
    const b = rel.person_b_id;
    if (!ids.includes(a) || !ids.includes(b)) continue;
    if (rel.type === "parent_child") {
      childrenOf[a].push(b);
      parentsOf[b].push(a);
    } else if (rel.type === "spouse") {
      if (!spousesOf[a].includes(b)) spousesOf[a].push(b);
      if (!spousesOf[b].includes(a)) spousesOf[b].push(a);
    }
  }

  // ── pick root ────────────────────────────────────────────────────────────────
  const root =
    rootPersonId && ids.includes(rootPersonId)
      ? rootPersonId
      : ids.find((id) => parentsOf[id].length === 0 && childrenOf[id].length > 0) ??
        ids.find((id) => parentsOf[id].length === 0) ??
        ids[0];

  // ── assign relative generation numbers ───────────────────────────────────────
  const relGen: Record<string, number> = {};

  // BFS upward (ancestors)
  relGen[root] = 0;
  {
    const q = [root];
    const seen = new Set([root]);
    while (q.length) {
      const id = q.shift()!;
      for (const pid of parentsOf[id]) {
        if (!seen.has(pid)) {
          seen.add(pid);
          relGen[pid] = relGen[id] - 1;
          q.push(pid);
          for (const sp of spousesOf[pid]) {
            if (!seen.has(sp)) {
              seen.add(sp);
              relGen[sp] = relGen[pid];
              q.push(sp);
            }
          }
        }
      }
    }
  }

  // Root's own spouses
  for (const sp of spousesOf[root]) {
    if (relGen[sp] === undefined) relGen[sp] = 0;
  }

  // BFS downward (descendants)
  {
    const startSet = [root, ...spousesOf[root]];
    const q = [...startSet];
    const seen = new Set(startSet);
    while (q.length) {
      const id = q.shift()!;
      for (const cid of childrenOf[id]) {
        if (!seen.has(cid)) {
          seen.add(cid);
          relGen[cid] = (relGen[id] ?? 0) + 1;
          q.push(cid);
          for (const sp of spousesOf[cid]) {
            if (!seen.has(sp)) {
              seen.add(sp);
              relGen[sp] = relGen[cid];
              q.push(sp);
            }
          }
        }
      }
    }
  }

  // Fallback for disconnected people
  for (const id of ids) {
    if (relGen[id] === undefined) relGen[id] = 0;
  }

  // Spouse unification: both get max(their relGens)
  let changed = true;
  while (changed) {
    changed = false;
    for (const id of ids) {
      for (const sp of spousesOf[id]) {
        const mx = Math.max(relGen[id], relGen[sp]);
        if (relGen[id] !== mx) { relGen[id] = mx; changed = true; }
        if (relGen[sp] !== mx) { relGen[sp] = mx; changed = true; }
      }
    }
  }

  // Re-propagate: children must be at least parent+1
  changed = true;
  while (changed) {
    changed = false;
    for (const id of ids) {
      for (const cid of childrenOf[id]) {
        const req = relGen[id] + 1;
        if (relGen[cid] < req) { relGen[cid] = req; changed = true; }
      }
    }
  }

  // ── normalize gens ──────────────────────────────────────────────────────────
  const minRelGen = Math.min(...Object.values(relGen));
  const maxRelGen = Math.max(...Object.values(relGen));
  const normRoot = -minRelGen;

  const normGen: Record<string, number> = {};
  for (const id of ids) normGen[id] = relGen[id] - minRelGen;

  // ── X positions ─────────────────────────────────────────────────────────────
  const xPos: Record<string, number> = {};
  for (const id of ids) xPos[id] = CANVAS_LEFT + normGen[id] * GEN_SPACING;

  // ── Y positions ─────────────────────────────────────────────────────────────
  const yPos: Record<string, number> = {};
  const ancestorSet = new Set(ids.filter((id) => normGen[id] < normRoot));
  const rootSet = new Set(ids.filter((id) => normGen[id] === normRoot));

  // ── Ancestor Y: DFS-order leaf assignment → center-up ─────────────────────
  if (ancestorSet.size > 0) {
    // DFS from root upward, paternal (first parent) before maternal (second)
    // Collect leaf ancestors in this traversal order
    const leafOrder: string[] = [];
    const dfsVisited = new Set<string>();

    function dfsUp(id: string) {
      if (dfsVisited.has(id) || !ancestorSet.has(id)) return;
      dfsVisited.add(id);

      const anPars = parentsOf[id].filter((p) => ancestorSet.has(p));
      if (anPars.length === 0) {
        // Leaf ancestor — add this person then their spouse(s)
        leafOrder.push(id);
        for (const sp of spousesOf[id]) {
          if (ancestorSet.has(sp) && !dfsVisited.has(sp)) {
            dfsVisited.add(sp);
            leafOrder.push(sp);
          }
        }
        return;
      }
      // Recurse into parents (paternal first = first in parentsOf array)
      for (const pid of anPars) {
        dfsUp(pid);
        // Also immediately visit spouse of this parent
        for (const sp of spousesOf[pid]) {
          if (ancestorSet.has(sp) && !dfsVisited.has(sp)) {
            dfsUp(sp);
          }
        }
      }
    }

    for (const pid of parentsOf[root].filter((p) => ancestorSet.has(p))) {
      dfsUp(pid);
    }
    // Catch any remaining ancestors not reached from root (disconnected branches)
    for (const id of ancestorSet) {
      if (!dfsVisited.has(id)) {
        dfsVisited.add(id);
        leafOrder.push(id);
      }
    }

    // Assign Y to leaf ancestors evenly
    for (let i = 0; i < leafOrder.length; i++) {
      yPos[leafOrder[i]] = CANVAS_TOP + i * ROW_SLOT + ROW_SLOT / 2;
    }

    // Center non-leaf ancestors between their children's Y positions
    // Process from oldest gen (0) toward root (normRoot - 1)
    for (let g = 1; g < normRoot; g++) {
      const atGen = ids.filter((id) => normGen[id] === g && ancestorSet.has(id));
      for (const id of atGen) {
        if (yPos[id] !== undefined) continue;
        // Average Y of this person's own children that point toward root
        const ownChildren = childrenOf[id].filter(
          (c) => normGen[c] === g + 1 && (ancestorSet.has(c) || rootSet.has(c))
        );
        const known = ownChildren.filter((c) => yPos[c] !== undefined);
        if (known.length > 0) {
          yPos[id] = known.reduce((s, c) => s + yPos[c]!, 0) / known.length;
        } else {
          // Fallback: average of parent Y values at g-1
          const pars = parentsOf[id].filter((p) => normGen[p] === g - 1 && yPos[p] !== undefined);
          if (pars.length > 0) {
            yPos[id] = pars.reduce((s, p) => s + yPos[p]!, 0) / pars.length;
          }
        }
      }
    }
  }

  // ── Root Y ──────────────────────────────────────────────────────────────────
  const rootParents = parentsOf[root].filter((p) => ancestorSet.has(p) && yPos[p] !== undefined);
  let rootY: number;
  if (rootParents.length > 0) {
    rootY = rootParents.reduce((s, p) => s + yPos[p]!, 0) / rootParents.length;
  } else if (ancestorSet.size > 0) {
    const ancestorYs = [...ancestorSet].map((id) => yPos[id] ?? 0).filter((y) => y > 0);
    rootY = ancestorYs.length > 0
      ? ancestorYs.reduce((a, b) => a + b, 0) / ancestorYs.length
      : CANVAS_TOP + 200;
  } else {
    rootY = CANVAS_TOP + 200;
  }

  // Place root and their spouses
  const rootSetArr = [...rootSet];
  if (rootSetArr.length === 1) {
    yPos[rootSetArr[0]] = rootY;
  } else {
    const totalH = (rootSetArr.length - 1) * ROW_SLOT;
    rootSetArr.forEach((id, i) => {
      yPos[id] = rootY - totalH / 2 + i * ROW_SLOT;
    });
  }

  // ── Descendant Y: subtree-height algorithm ──────────────────────────────────
  const descendantSet = new Set(ids.filter((id) => normGen[id] > normRoot));

  // Compute subtree heights (number of leaf slots needed)
  const subtreeH: Record<string, number> = {};
  function getSubtreeH(id: string): number {
    if (subtreeH[id] !== undefined) return subtreeH[id];
    // Collect this person's couple unit (them + spouses at same gen)
    const couple = [id, ...spousesOf[id].filter((sp) => normGen[sp] === normGen[id])];
    const allChildren = new Set<string>();
    for (const m of couple) for (const c of childrenOf[m]) allChildren.add(c);

    if (allChildren.size === 0) {
      subtreeH[id] = 1;
    } else {
      // Sum of children subtree heights (only owned children — first parent encountered)
      let childSum = 0;
      const counted = new Set<string>();
      for (const cid of allChildren) {
        if (!counted.has(cid)) {
          counted.add(cid);
          childSum += getSubtreeH(cid);
        }
      }
      subtreeH[id] = Math.max(1, childSum);
    }
    return subtreeH[id];
  }

  for (const id of descendantSet) getSubtreeH(id);

  // Assign Y to descendants top-down, starting just below root
  function assignDescY(id: string, yStart: number) {
    if (yPos[id] !== undefined) return;
    const couple = [id, ...spousesOf[id].filter(
      (sp) => normGen[sp] === normGen[id] && descendantSet.has(sp)
    )];
    const coupleH = couple.length * ROW_SLOT;

    // Own children
    const allChildren = new Set<string>();
    for (const m of couple) for (const c of childrenOf[m]) {
      if (descendantSet.has(c)) allChildren.add(c);
    }

    const totalChildH = [...allChildren].reduce((s, cid) => s + getSubtreeH(cid) * ROW_SLOT, 0);
    const allocH = Math.max(coupleH, totalChildH);
    const centerY = yStart + allocH / 2;

    // Place couple centered
    couple.forEach((m, i) => {
      if (yPos[m] === undefined) {
        yPos[m] = centerY - ((couple.length - 1) * ROW_SLOT) / 2 + i * ROW_SLOT;
      }
    });

    // Recursively place children
    let cy = yStart;
    for (const cid of allChildren) {
      const h = getSubtreeH(cid) * ROW_SLOT;
      assignDescY(cid, cy);
      cy += h;
    }
  }

  // Kick off descendant layout from root's children
  const rootChildren = new Set<string>();
  for (const rm of rootSet) for (const c of childrenOf[rm]) {
    if (descendantSet.has(c)) rootChildren.add(c);
  }

  if (rootChildren.size > 0) {
    const totalDescH = [...rootChildren].reduce((s, cid) => s + getSubtreeH(cid) * ROW_SLOT, 0);
    let descStart = rootY - totalDescH / 2;
    for (const cid of rootChildren) {
      const h = getSubtreeH(cid) * ROW_SLOT;
      assignDescY(cid, descStart);
      descStart += h;
    }
  }

  // Fallback for any still-unpositioned nodes
  let fallbackY = CANVAS_TOP + 50;
  for (const id of ids) {
    if (yPos[id] === undefined) {
      yPos[id] = fallbackY;
      fallbackY += ROW_SLOT;
    }
  }

  // ── Assemble positions ───────────────────────────────────────────────────────
  const positions: Record<string, LayoutPosition> = {};
  for (const id of ids) {
    positions[id] = {
      x: Math.round(xPos[id]),
      y: Math.round(yPos[id] ?? CANVAS_TOP),
      normGen: normGen[id],
    };
  }

  // ── Gen columns ──────────────────────────────────────────────────────────────
  const genBirthYears: Record<number, number[]> = {};
  for (const p of people) {
    const rg = relGen[p.id] ?? 0;
    if (p.dob) {
      const yr = new Date(p.dob).getFullYear();
      if (!isNaN(yr)) {
        if (!genBirthYears[rg]) genBirthYears[rg] = [];
        genBirthYears[rg].push(yr);
      }
    }
  }

  const uniqueRelGens = [...new Set(Object.values(relGen))].sort((a, b) => a - b);
  const genColumns: GenColumn[] = uniqueRelGens.map((rg) => {
    const ng = rg - minRelGen;
    const years = genBirthYears[rg] ?? [];
    let decade: string | null = null;
    if (years.length >= 1) {
      const avg = Math.round(years.reduce((a, b) => a + b, 0) / years.length);
      decade = `${Math.floor(avg / 10) * 10}s`;
    }
    return {
      normGen: ng,
      relGen: rg,
      x: CANVAS_LEFT + ng * GEN_SPACING,
      label: genLabel(rg),
      decade,
    };
  });

  return { positions, genColumns };
}

// Re-export NODE_WIDTH so canvas can use it for header positioning
export { NODE_WIDTH };
