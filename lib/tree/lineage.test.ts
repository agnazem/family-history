import { describe, it, expect } from "vitest";
import { computeLineage, type LineageNode } from "./lineage";

describe("computeLineage", () => {
  // grandparents → parents (p1 married to p2) → child + sibling; cousin is unrelated
  const family: LineageNode[] = [
    { id: "gp", parents: [] },
    { id: "gp2", parents: [] },
    { id: "p1", parents: ["gp", "gp2"] },
    { id: "p2", parents: [], spouseOf: "p1" },
    { id: "child", parents: ["p1", "p2"] },
    { id: "sibling", parents: ["p1", "p2"] },
    { id: "cousin", parents: [] },
  ];

  it("includes the subject", () => {
    expect(computeLineage("child", family).has("child")).toBe(true);
  });

  it("climbs to parents and grandparents", () => {
    const lineage = computeLineage("child", family);
    expect(lineage.has("p1")).toBe(true);
    expect(lineage.has("p2")).toBe(true);
    expect(lineage.has("gp")).toBe(true);
    expect(lineage.has("gp2")).toBe(true);
  });

  it("includes siblings (shared parent)", () => {
    expect(computeLineage("child", family).has("sibling")).toBe(true);
  });

  it("includes a spouse of someone in the lineage", () => {
    // p2 is spouseOf p1; both must be present.
    const lineage = computeLineage("child", family);
    expect(lineage.has("p1")).toBe(true);
    expect(lineage.has("p2")).toBe(true);
  });

  it("excludes unrelated people", () => {
    expect(computeLineage("child", family).has("cousin")).toBe(false);
  });

  it("descends to children when the subject is an ancestor", () => {
    // From gp's perspective, p1 and child are descendants.
    const lineage = computeLineage("gp", family);
    expect(lineage.has("p1")).toBe(true);
    expect(lineage.has("child")).toBe(true);
  });

  it("returns just the subject for a lone node", () => {
    const lineage = computeLineage("lone", [{ id: "lone", parents: [] }]);
    expect(lineage.has("lone")).toBe(true);
    expect(lineage.size).toBe(1);
  });

  it("handles an unknown subject id without throwing", () => {
    const lineage = computeLineage("ghost", family);
    // The unknown id is still seeded into the set; it just resolves nothing else.
    expect(lineage.has("ghost")).toBe(true);
  });
});
