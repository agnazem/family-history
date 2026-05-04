import type { Person, Relationship, GenColumn } from "@/types";

// ── constants ─────────────────────────────────────────────────────────────────
export const NODE_WIDTH = 152;
const GEN_SPACING = 260;   // horizontal distance between generation columns
const ROW_SLOT = 88;       // vertical space per person slot (node height + gap)
const CANVAS_LEFT = 60;
const CANVAS_TOP = 100;    // top padding for generation headers

export interface LayoutPosition {
  x: number;
  y: number;
  normGen: number;
}

export interface LayoutResult {
  positions: Record<string, LayoutPosition>;
  genColumns: GenColumn[];
}

// ── generation label ──────────────────────────────────────────────────────────
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

  // ── adjacency ────────────────────────────────────────────────────────────────
  const childrenOf: Record<string, string[]> = {};
  const parentsOf: Record<string, string[]> = {};
  const spousesOf: Record<string, string[]> = {};
  for (const id of ids) { childrenOf[id] = []; parentsOf[id] = []; spousesOf[id] = []; }
  for (const rel of relationships) {
    const { person_a_id: a, person_b_id: b } = rel;
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

  // ── Phase 1: Unified BFS for generation assignment ───────────────────────────
  // This single pass correctly handles ancestors, descendants, AND collateral
  // relatives (aunts/uncles, cousins) all in one traversal.
  //
  // Key insight: whenever we discover an ancestor P at generation G, we also
  // immediately assign generation G to all siblings of P (other children of
  // P's parents). This ensures aunts/uncles land at the same gen as the parent
  // they are siblings of — not at the root's generation via fallback.
  const relGen: Record<string, number> = {};
  {
    relGen[root] = 0;
    const queue: string[] = [root];
    const seen = new Set<string>([root]);

    while (queue.length) {
      const id = queue.shift()!;
      const g = relGen[id];

      // Walk upward to parents
      for (const pid of parentsOf[id]) {
        if (!seen.has(pid)) {
          seen.add(pid);
          relGen[pid] = g - 1;
          queue.push(pid);

          // All children of this parent are the same generation as `id`
          // (they are siblings of `id`, or half-siblings)
          for (const sib of childrenOf[pid]) {
            if (!seen.has(sib)) {
              seen.add(sib);
              relGen[sib] = g; // same gen as the person we came from
              queue.push(sib);
            }
          }
          // Parent's spouses are also at g-1
          for (const sp of spousesOf[pid]) {
            if (!seen.has(sp)) {
              seen.add(sp);
              relGen[sp] = g - 1;
              queue.push(sp);
            }
          }
        }
      }

      // Walk downward to children
      for (const cid of childrenOf[id]) {
        if (!seen.has(cid)) {
          seen.add(cid);
          relGen[cid] = g + 1;
          queue.push(cid);
          // Child's spouses at same gen
          for (const sp of spousesOf[cid]) {
            if (!seen.has(sp)) {
              seen.add(sp);
              relGen[sp] = g + 1;
              queue.push(sp);
            }
          }
        }
      }
    }
  }

  // Fallback for any completely disconnected nodes
  for (const id of ids) if (relGen[id] === undefined) relGen[id] = 0;

  // Spouse unification: both get max(their relGens), then re-propagate children
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
  changed = true;
  while (changed) {
    changed = false;
    for (const id of ids) {
      for (const cid of childrenOf[id]) {
        if (relGen[cid] < relGen[id] + 1) { relGen[cid] = relGen[id] + 1; changed = true; }
      }
    }
  }

  // ── Normalize ────────────────────────────────────────────────────────────────
  const minRelGen = Math.min(...Object.values(relGen));
  const maxRelGen = Math.max(...Object.values(relGen));
  const normGen: Record<string, number> = {};
  for (const id of ids) normGen[id] = relGen[id] - minRelGen;
  const normRoot = -minRelGen;
  const maxNormGen = maxRelGen - minRelGen;

  // ── Phase 2: Y positions — sort-by-parent-Y, couplify ────────────────────────
  // Process generations from oldest (normGen=0) to newest.
  // Within each generation, people are ordered by the average Y of their parents
  // in the previous generation. This groups siblings together and separates
  // unrelated families naturally.
  const yPos: Record<string, number> = {};
  const sortKey: Record<string, number> = {}; // float sort position, used by next gen

  for (let g = 0; g <= maxNormGen; g++) {
    const atGen = ids.filter((id) => normGen[id] === g);
    if (atGen.length === 0) continue;

    // Sort this generation by the average sortKey of their parents in the prev gen
    const getParentSortKey = (id: string): number => {
      const pars = parentsOf[id].filter((p) => normGen[p] === g - 1 && sortKey[p] !== undefined);
      if (pars.length === 0) return Infinity; // no known parents → append at end
      return pars.reduce((s, p) => s + sortKey[p], 0) / pars.length;
    };

    let ordered = [...atGen].sort((a, b) => {
      if (g === 0) return 0; // keep insertion order for oldest gen; DFS below handles it
      return getParentSortKey(a) - getParentSortKey(b);
    });

    // For the oldest generation, use DFS order from root for paternal-first separation
    if (g === 0) {
      ordered = dfsAncestorOrder(atGen, root, parentsOf, childrenOf, spousesOf, normGen, g);
    }

    // Couplify: ensure spouses within this generation are adjacent
    ordered = couplify(ordered, spousesOf, normGen, g);

    // Assign Y and sortKey
    ordered.forEach((id, i) => {
      yPos[id] = CANVAS_TOP + i * ROW_SLOT + ROW_SLOT / 2;
      sortKey[id] = i;
    });
  }

  // ── Phase 3: X positions ─────────────────────────────────────────────────────
  const xPos: Record<string, number> = {};
  for (const id of ids) xPos[id] = CANVAS_LEFT + normGen[id] * GEN_SPACING;

  // ── Assemble positions ────────────────────────────────────────────────────────
  const positions: Record<string, LayoutPosition> = {};
  for (const id of ids) {
    positions[id] = {
      x: Math.round(xPos[id]),
      y: Math.round(yPos[id] ?? CANVAS_TOP),
      normGen: normGen[id],
    };
  }

  // ── Gen columns ───────────────────────────────────────────────────────────────
  const birthYearsByRelGen: Record<number, number[]> = {};
  for (const p of people) {
    if (!p.dob) continue;
    const yr = new Date(p.dob).getFullYear();
    if (isNaN(yr)) continue;
    const rg = relGen[p.id] ?? 0;
    if (!birthYearsByRelGen[rg]) birthYearsByRelGen[rg] = [];
    birthYearsByRelGen[rg].push(yr);
  }

  const uniqueRelGens = [...new Set(Object.values(relGen))].sort((a, b) => a - b);
  const genColumns: GenColumn[] = uniqueRelGens.map((rg) => {
    const ng = rg - minRelGen;
    const years = birthYearsByRelGen[rg] ?? [];
    const decade = years.length >= 1
      ? `${Math.floor(years.reduce((a, b) => a + b, 0) / years.length / 10) * 10}s`
      : null;
    return { normGen: ng, relGen: rg, x: CANVAS_LEFT + ng * GEN_SPACING, label: genLabel(rg), decade };
  });

  return { positions, genColumns };
}

// ── DFS order for oldest ancestor generation ──────────────────────────────────
// Visits paternal ancestors before maternal by following parentsOf[root] in order.
// Returns the people at normGen `g` in the correct top-to-bottom sequence.
function dfsAncestorOrder(
  atGen: string[],
  root: string,
  parentsOf: Record<string, string[]>,
  childrenOf: Record<string, string[]>,
  spousesOf: Record<string, string[]>,
  normGen: Record<string, number>,
  g: number
): string[] {
  const result: string[] = [];
  const visited = new Set<string>();
  const targetSet = new Set(atGen);

  function dfs(id: string) {
    if (normGen[id] !== g || visited.has(id)) return;
    // Only process if this person is at gen g
    // First recurse into their parents (going to deeper ancestry)
    for (const pid of parentsOf[id]) {
      if (normGen[pid] > g) continue; // parent is at a younger gen (shouldn't happen)
      dfs(pid); // recurse into older gens first... but we only collect gen g people
    }
    if (targetSet.has(id) && !visited.has(id)) {
      visited.add(id);
      result.push(id);
      // Immediately add spouse so couple is adjacent
      for (const sp of spousesOf[id]) {
        if (targetSet.has(sp) && !visited.has(sp)) {
          visited.add(sp);
          result.push(sp);
        }
      }
    }
  }

  // Walk from root upward; DFS visits paternal (first parent) first
  function walkUp(id: string) {
    for (const pid of parentsOf[id]) {
      walkUp(pid);
      dfs(pid);
      for (const sp of spousesOf[pid]) dfs(sp);
    }
    dfs(id);
  }
  walkUp(root);

  // Catch any remaining (disconnected from root's ancestry)
  for (const id of atGen) {
    if (!visited.has(id)) {
      visited.add(id);
      result.push(id);
    }
  }

  return result;
}

// ── Couplify: keep spouses adjacent within a generation ───────────────────────
function couplify(
  ordered: string[],
  spousesOf: Record<string, string[]>,
  normGen: Record<string, number>,
  g: number
): string[] {
  const result: string[] = [];
  const placed = new Set<string>();
  for (const id of ordered) {
    if (placed.has(id)) continue;
    placed.add(id);
    result.push(id);
    // Place this person's spouse(s) at same gen immediately after
    for (const sp of spousesOf[id]) {
      if (normGen[sp] === g && !placed.has(sp)) {
        placed.add(sp);
        result.push(sp);
      }
    }
  }
  return result;
}
