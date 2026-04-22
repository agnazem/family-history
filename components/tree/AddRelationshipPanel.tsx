"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Modal } from "@/components/ui/Modal";
import type { Person, RelationshipType } from "@/types";

interface AddRelationshipPanelProps {
  open: boolean;
  onClose: () => void;
  familyId: string;
  people: Person[];
  onAdded: () => void;
}

const RELATIONSHIP_LABELS: Record<RelationshipType, string> = {
  parent_child: "Parent → Child",
  spouse: "Spouse / Partner",
  sibling: "Siblings",
};

export function AddRelationshipPanel({
  open,
  onClose,
  familyId,
  people,
  onAdded,
}: AddRelationshipPanelProps) {
  const [personAId, setPersonAId] = useState("");
  const [personBId, setPersonBId] = useState("");
  const [type, setType] = useState<RelationshipType>("parent_child");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (personAId === personBId) {
      setError("Please select two different people.");
      return;
    }
    setLoading(true);
    setError(null);

    const { error } = await supabase.from("relationships").insert({
      family_id: familyId,
      person_a_id: personAId,
      person_b_id: personBId,
      type,
    });

    if (error) {
      setError(error.message);
    } else {
      setPersonAId("");
      setPersonBId("");
      setType("parent_child");
      onAdded();
      onClose();
    }
    setLoading(false);
  }

  const sortedPeople = [...people].sort((a, b) =>
    `${a.last_name} ${a.first_name}`.localeCompare(`${b.last_name} ${b.first_name}`)
  );

  return (
    <Modal open={open} onClose={onClose} title="Add Relationship">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Relationship Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as RelationshipType)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            {Object.entries(RELATIONSHIP_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            {type === "parent_child" ? "Parent" : "Person A"}
          </label>
          <select
            required
            value={personAId}
            onChange={(e) => setPersonAId(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="">Select person...</option>
            {sortedPeople.map((p) => (
              <option key={p.id} value={p.id}>
                {p.first_name} {p.last_name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            {type === "parent_child" ? "Child" : "Person B"}
          </label>
          <select
            required
            value={personBId}
            onChange={(e) => setPersonBId(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="">Select person...</option>
            {sortedPeople
              .filter((p) => p.id !== personAId)
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.first_name} {p.last_name}
                </option>
              ))}
          </select>
        </div>
        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
        )}
        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-amber-700 text-white py-2 rounded-lg text-sm hover:bg-amber-800 disabled:opacity-50"
          >
            {loading ? "Saving..." : "Add Relationship"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
