"use client";

import { useState, useEffect } from "react";
import { Trash2, ExternalLink } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { createClient } from "@/lib/supabase/client";
import type { Person, Relationship, RelationshipType } from "@/types";

interface RelationshipModalProps {
  relationship: Relationship | null;
  people: Person[];
  onClose: () => void;
  onChanged: () => void;
  currentPersonId?: string;
  onViewPerson?: (personId: string) => void;
}

const RELATIONSHIP_LABELS: Record<RelationshipType, string> = {
  parent_child: "Parent → Child",
  spouse: "Spouse / Partner",
  sibling: "Siblings",
};

export function RelationshipModal({
  relationship,
  people,
  onClose,
  onChanged,
  currentPersonId,
  onViewPerson,
}: RelationshipModalProps) {
  const [type, setType] = useState<RelationshipType>(
    relationship?.type ?? "parent_child"
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (relationship) setType(relationship.type);
  }, [relationship?.id]);
  const supabase = createClient();

  if (!relationship) return null;

  const personA = people.find((p) => p.id === relationship.person_a_id);
  const personB = people.find((p) => p.id === relationship.person_b_id);

  const otherPerson =
    onViewPerson && currentPersonId
      ? relationship.person_a_id === currentPersonId
        ? personB
        : personA
      : null;

  async function handleSave() {
    if (!relationship) return;
    setLoading(true);
    await supabase
      .from("relationships")
      .update({ type })
      .eq("id", relationship.id);
    setLoading(false);
    onChanged();
    onClose();
  }

  async function handleDelete() {
    if (!relationship) return;
    if (!window.confirm("Delete this relationship?")) return;
    setLoading(true);
    await supabase.from("relationships").delete().eq("id", relationship.id);
    setLoading(false);
    onChanged();
    onClose();
  }

  return (
    <Modal open={!!relationship} onClose={onClose} title="Relationship" size="sm">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3 bg-slate-50 rounded-xl px-4 py-3">
          <div className="text-center flex-1">
            <p className="text-xs text-gray-500 mb-0.5">Person A</p>
            <p className="font-medium text-gray-900 text-sm">
              {personA ? `${personA.first_name} ${personA.last_name}` : "Unknown"}
            </p>
          </div>
          <div className="text-blue-500 text-lg">↔</div>
          <div className="text-center flex-1">
            <p className="text-xs text-gray-500 mb-0.5">Person B</p>
            <p className="font-medium text-gray-900 text-sm">
              {personB ? `${personB.first_name} ${personB.last_name}` : "Unknown"}
            </p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Relationship Type
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as RelationshipType)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {Object.entries(RELATIONSHIP_LABELS).map(([val, label]) => (
              <option key={val} value={val}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {otherPerson && (
          <button
            onClick={() => onViewPerson!(otherPerson.id)}
            className="w-full flex items-center justify-center gap-1.5 border border-blue-200 text-blue-600 hover:bg-blue-50 py-2 rounded-lg text-sm transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            View {otherPerson.first_name}&apos;s Profile
          </button>
        )}

        <div className="flex gap-2 pt-1">
          <button
            onClick={handleDelete}
            disabled={loading}
            className="flex items-center gap-1.5 border border-red-300 text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
          <button
            onClick={onClose}
            className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading || type === relationship.type}
            className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
