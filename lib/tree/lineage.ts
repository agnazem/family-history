export interface LineageNode {
  id: string;
  parents: string[];
  spouseOf?: string;
}

export function computeLineage(subjectId: string, nodes: LineageNode[]): Set<string> {
  const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));
  const direct = new Set<string>([subjectId]);

  function climb(id: string) {
    const n = byId[id];
    if (!n) return;
    for (const p of n.parents) {
      if (!direct.has(p)) { direct.add(p); climb(p); }
    }
  }
  climb(subjectId);

  function descend(id: string) {
    for (const n of nodes) {
      if (!direct.has(n.id) && n.parents.includes(id)) {
        direct.add(n.id);
        descend(n.id);
      }
    }
  }
  descend(subjectId);

  const subj = byId[subjectId];
  if (subj?.parents.length) {
    for (const n of nodes) {
      if (n.id !== subjectId && n.parents.some((p) => subj.parents.includes(p))) {
        direct.add(n.id);
      }
    }
  }

  const withSpouses = new Set(direct);
  for (const id of direct) {
    const sp = byId[id]?.spouseOf;
    if (sp) withSpouses.add(sp);
  }

  return withSpouses;
}
