"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { createClient } from "@/lib/supabase/client";
import type { Person } from "@/types";

export type RelationIntent = "add_parent" | "add_child" | "add_sibling" | "add_spouse";

const TITLE: Record<RelationIntent, string> = {
  add_parent: "Add Parent",
  add_child: "Add Child",
  add_sibling: "Add Sibling",
  add_spouse: "Add Spouse / Partner",
};

const SUBTITLE: Record<RelationIntent, (name: string) => string> = {
  add_parent:  (n) => `New person will be linked as a parent of ${n}`,
  add_child:   (n) => `New person will be linked as a child of ${n}`,
  add_sibling: (n) => `New person will be linked as a sibling of ${n}`,
  add_spouse:  (n) => `New person will be linked as a spouse / partner of ${n}`,
};

interface Props {
  open: boolean;
  onClose: () => void;
  intent: RelationIntent;
  currentPersonId: string;
  currentPersonName: string;
  familyId: string;
  familyPeople?: Person[];
  defaultOtherParentId?: string;
  onAdded: () => void;
}

export function AddRelatedPersonModal({
  open,
  onClose,
  intent,
  currentPersonId,
  currentPersonName,
  familyId,
  familyPeople = [],
  defaultOtherParentId = "",
  onAdded,
}: Props) {
  const [form, setForm] = useState({ first_name: "", last_name: "", dob: "", dod: "", bio: "" });
  const [otherParentId, setOtherParentId] = useState(defaultOtherParentId);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  function field(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleClose() {
    setForm({ first_name: "", last_name: "", dob: "", dod: "", bio: "" });
    setOtherParentId(defaultOtherParentId);
    setError(null);
    onClose();
  }

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 1. Create the new person
    const { data: newPerson, error: personError } = await supabase
      .from("people")
      .insert({
        family_id: familyId,
        first_name: form.first_name,
        last_name: form.last_name,
        dob: form.dob || null,
        dod: form.dod || null,
        bio: form.bio || null,
        canvas_x: Math.random() * 400 + 200,
        canvas_y: Math.random() * 300 + 100,
        created_by: user.id,
      })
      .select("id")
      .single();

    if (personError || !newPerson) {
      setError(personError?.message ?? "Failed to create person.");
      setLoading(false);
      return;
    }

    const newId = newPerson.id;

    // 2. Primary relationship
    const relPayload = (() => {
      const base = { family_id: familyId };
      if (intent === "add_parent") return { ...base, person_a_id: newId, person_b_id: currentPersonId, type: "parent_child" };
      if (intent === "add_child")  return { ...base, person_a_id: currentPersonId, person_b_id: newId, type: "parent_child" };
      if (intent === "add_sibling") return { ...base, person_a_id: currentPersonId, person_b_id: newId, type: "sibling" };
      return { ...base, person_a_id: currentPersonId, person_b_id: newId, type: "spouse" };
    })();

    const { error: relError } = await supabase.from("relationships").insert(relPayload);
    if (relError) {
      setError(relError.message);
      setLoading(false);
      return;
    }

    // 3. Optional second parent relationship (add_child only)
    if (intent === "add_child" && otherParentId) {
      await supabase.from("relationships").insert({
        family_id: familyId,
        person_a_id: otherParentId,
        person_b_id: newId,
        type: "parent_child",
      });
    }

    onAdded();
    handleClose();
    setLoading(false);
  }

  const otherPeople = familyPeople.filter((p) => p.id !== currentPersonId);

  return (
    <Modal open={open} onClose={handleClose} title={TITLE[intent]}>
      <p className="text-xs text-gray-500 -mt-2 mb-4">{SUBTITLE[intent](currentPersonName)}</p>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">First Name *</label>
            <input
              required
              value={form.first_name}
              onChange={(e) => field("first_name", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Last Name *</label>
            <input
              required
              value={form.last_name}
              onChange={(e) => field("last_name", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {intent === "add_child" && otherPeople.length > 0 && (
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Other parent (optional)</label>
            <select
              value={otherParentId}
              onChange={(e) => setOtherParentId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">— none —</option>
              {otherPeople.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.first_name} {p.last_name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Date of Birth</label>
            <input
              type="date"
              value={form.dob}
              onChange={(e) => field("dob", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Date of Death</label>
            <input
              type="date"
              value={form.dod}
              onChange={(e) => field("dod", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Short Bio</label>
          <textarea
            value={form.bio}
            onChange={(e) => field("bio", e.target.value)}
            rows={2}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>
        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
        )}
        <div className="flex gap-2 pt-1">
          <button type="button" onClick={handleClose}
            className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50">
            Cancel
          </button>
          <button type="submit" disabled={loading}
            className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
            {loading ? "Creating..." : TITLE[intent]}
          </button>
        </div>
      </form>
    </Modal>
  );
}
