"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Modal } from "@/components/ui/Modal";

interface AddPersonPanelProps {
  open: boolean;
  onClose: () => void;
  familyId: string;
  onAdded: () => void;
  defaultPosition?: { x: number; y: number };
}

export function AddPersonPanel({
  open,
  onClose,
  familyId,
  onAdded,
  defaultPosition,
}: AddPersonPanelProps) {
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    dob: "",
    dod: "",
    bio: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  function set(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("people").insert({
      family_id: familyId,
      first_name: form.first_name,
      last_name: form.last_name,
      dob: form.dob || null,
      dod: form.dod || null,
      bio: form.bio || null,
      canvas_x: defaultPosition?.x ?? Math.random() * 400 + 100,
      canvas_y: defaultPosition?.y ?? Math.random() * 300 + 100,
      created_by: user.id,
    });

    if (error) {
      setError(error.message);
    } else {
      setForm({ first_name: "", last_name: "", dob: "", dod: "", bio: "" });
      onAdded();
      onClose();
    }
    setLoading(false);
  }

  return (
    <Modal open={open} onClose={onClose} title="Add Family Member">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">First Name *</label>
            <input
              required
              value={form.first_name}
              onChange={(e) => set("first_name", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Last Name *</label>
            <input
              required
              value={form.last_name}
              onChange={(e) => set("last_name", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Date of Birth</label>
            <input
              type="date"
              value={form.dob}
              onChange={(e) => set("dob", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Date of Death</label>
            <input
              type="date"
              value={form.dod}
              onChange={(e) => set("dod", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Short Bio</label>
          <textarea
            value={form.bio}
            onChange={(e) => set("bio", e.target.value)}
            rows={2}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
          />
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
            {loading ? "Adding..." : "Add Person"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
