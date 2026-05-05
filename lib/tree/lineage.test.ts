import { computeLineage } from "./lineage";

function assert(condition: boolean, msg: string) {
  if (!condition) throw new Error(`FAIL: ${msg}`);
  console.log(`PASS: ${msg}`);
}

// Simple 3-gen: grandparent → parent → child (subject)
const nodes = [
  { id: "gp", parents: [] },
  { id: "gp2", parents: [] },
  { id: "p1", parents: ["gp", "gp2"] },
  { id: "p2", parents: [], spouseOf: "p1" },
  { id: "child", parents: ["p1", "p2"] },
  { id: "sibling", parents: ["p1", "p2"] },
  { id: "cousin", parents: [] },
];

const lineage = computeLineage("child", nodes);

assert(lineage.has("child"), "subject is in lineage");
assert(lineage.has("p1"), "parent is in lineage");
assert(lineage.has("gp"), "grandparent is in lineage");
assert(lineage.has("gp2"), "second grandparent is in lineage");
assert(lineage.has("sibling"), "sibling is in lineage");
assert(lineage.has("p2"), "spouse of parent is in lineage");
assert(!lineage.has("cousin"), "unrelated cousin is not in lineage");

// Subject with no parents
const loneNode = computeLineage("lone", [{ id: "lone", parents: [] }]);
assert(loneNode.has("lone"), "lone node is in its own lineage");
assert(loneNode.size === 1, "lone node lineage has size 1");

console.log("\nAll tests passed.");
