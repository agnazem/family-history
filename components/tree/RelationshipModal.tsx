"use client";

import { useState, useEffect } from "react";
import { Trash2, ExternalLink, AlertTriangle } from "lucide-react";
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
  canEdit?: boolean;
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
  canEdit = false,
}: RelationshipModalProps) {
  const [type, setType] = useState<RelationshipType>(
    relationship?.type ?? "parent_child"
  );
  const [loading, setLoading] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    if (relationship) {
      setType(relationship.type);
      setConfirmingDelete(false);
    }
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
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }
    setLoading(true);
    await fetch("/api/relationships", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ relationshipId: relationship.id, familyId: relationship.family_id }),
    });
    setLoading(false);
    onChanged();
    onClose();
  }

  return (
    <Modal open={!!relationship} onClose={onClose} title="Relationship" size="sm">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3 bg-canvas rounded-xl px-4 py-3">
          <div className="text-center flex-1">
            <p className="text-xs text-gray-500 mb-0.5">Person A</p>
            <p className="font-medium text-gray-900 text-sm">
              {personA ? `${personA.first_name} ${personA.last_name}` : "Unknown"}
            </p>
          </div>
          <div className="text-accent-mid text-lg">↔</div>
          <div className="text-center flex-1">
            <p className="text-xs text-gray-500 mb-0.5">Person B</p>
            <p className="font-medium text-gray-900 text-sm">
              {personB ? `${personB.first_name} ${personB.last_name}` : "Unknown"}
            </p>
          </div>
        </div>

        {canEdit && (
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Relationship Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as RelationshipType)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-mid"
            >
              {Object.entries(RELATIONSHIP_LABELS).map(([val, label]) => (
                <option key={val} value={val}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        )}

        {!canEdit && (
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">Relationship Type</p>
            <p className="text-sm text-gray-700">{RELATIONSHIP_LABELS[relationship.type]}</p>
          </div>
        )}

        {otherPerson && (
          <button
            onClick={() => onViewPerson!(otherPerson.id)}
            className="w-full flex items-center justify-center gap-1.5 border border-accent-border text-accent hover:bg-accent-pale py-2 rounded-lg text-sm transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            View {otherPerson.first_name}&apos;s Profile
          </button>
        )}

        {confirmingDelete && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
            <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-700">
              This will permanently remove the relationship between these two people. Are you sure?
            </p>
          </div>
        )}

        <div className="flex gap-2 pt-1">
          {canEdit && (
            <button
              onClick={handleDelete}
              disabled={loading}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-colors disabled:opacity-50 ${
                confirmingDelete
                  ? "bg-red-600 text-white hover:bg-red-700 border border-red-600"
                  : "border border-red-300 text-red-600 hover:bg-red-50"
              }`}
            >
              <Trash2 className="w-4 h-4" />
              {confirmingDelete ? "Confirm delete" : "Delete"}
            </button>
          )}
          <button
            onClick={() => {
              setConfirmingDelete(false);
              onClose();
            }}
            className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50"
          >
            Cancel
          </button>
          {canEdit && (
            <button
              onClick={handleSave}
              disabled={loading || type === relationship.type}
              className="flex-1 bg-accent text-white py-2 rounded-lg text-sm hover:bg-accent-hover disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save"}
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
